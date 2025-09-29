/* eslint-disable @typescript-eslint/no-explicit-any */
// DNA: Alchohalt v1 • Unified DB • Do not add network calls.
import { create } from 'zustand';
import { persist, StateStorage, PersistStorage } from 'zustand/middleware';
import { getPreferences } from "@/shared/capacitor";
import { nanoid } from 'nanoid';
import { computeStats, startOfDay, isSameDay } from '../lib/stats';
import { migrateDB } from '../lib/migrate';
import { resyncNotifications } from '../lib/notify';
import type { AdvancedGoal } from '../features/goals/types';
import type { DrinkPreset } from '../types/common';

export type UUID = string;
export type Language = 'en' | 'es';
export type Theme = 'light' | 'dark' | 'system';
export type Intention = 'celebrate'|'social'|'taste'|'bored'|'cope'|'other';
export type DrinkKind = 'beer'|'wine'|'spirits'|'custom';
export type HALT = { H:boolean; A:boolean; L:boolean; T:boolean };

export interface Settings {
  version: number;
  language: Language;
  theme: Theme;
  dailyGoalDrinks: number;
  weeklyGoalDrinks: number;
  monthlyBudget: number;
  reminders: { enabled: boolean; times: string[] };
  showBAC: boolean;
  profile?: { weightKg?: number; sex?: 'm'|'f'|'other' };
  notificationFallbackMessage?: string;
}

export interface Entry {
  id: UUID;
  ts: number;
  kind: DrinkKind;
  stdDrinks: number;
  cost?: number;
  intention: Intention;
  craving: number;
  halt: HALT;
  altAction?: string;
  notes?: string;
  editedAt?: number;
}

export interface Undo { action: 'delete'; payload: unknown; expiresAt: number; }
export interface DB {
  version: number;
  entries: Entry[];
  trash: { id: UUID; snapshot: Entry; deletedAt: number }[];
  settings: Settings;
  advancedGoals: AdvancedGoal[];
  presets: DrinkPreset[];
  meta: { lastUndo?: Undo; reminderSuppressedUntil?: number };
  _lastLogAt?: number; // derived
}

const CURRENT_DB_VERSION = 1;
const DB_KEY = 'alchohalt.db';

const preferencesStorage: StateStorage = {
  getItem: async (name) => (await (await getPreferences()).get({ key: name })).value ?? null,
  setItem: async (name, value) => { await (await getPreferences()).set({ key: name, value }); },
  removeItem: async (name) => { await (await getPreferences()).remove({ key: name }); },
};

function defaults(): DB {
  return {
    version: CURRENT_DB_VERSION,
    entries: [],
    trash: [],
    settings: {
      version: CURRENT_DB_VERSION,
      language: 'en', theme: 'system',
      dailyGoalDrinks: 0, weeklyGoalDrinks: 0, monthlyBudget: 0,
      reminders: { enabled: false, times: [] },
      showBAC: false
    },
    advancedGoals: [],
    presets: [
      { name: 'Beer (12oz)', volumeMl: 355, abvPct: 5.0 },
      { name: 'Wine (5oz)', volumeMl: 148, abvPct: 12.0 },
      { name: 'Shot (1.5oz)', volumeMl: 44, abvPct: 40.0 },
      { name: 'Light Beer (12oz)', volumeMl: 355, abvPct: 4.2 }
    ],
    meta: {},
    _lastLogAt: undefined
  };
}

type Store = {
  db: DB;
  todayTotal: number;
  weekTotal: number;
  stats: ReturnType<typeof computeStats>;
  addEntry(e: Omit<Entry,'id'>): void;
  editEntry(id: UUID, patch: Partial<Entry>): void;
  deleteEntry(id: UUID): void;
  undo(): void;
  setTheme(theme: Theme): void;
  setLanguage(lang: Language): void;
  setSettings(patch: Partial<Settings>): void;
  setReminderTimes(times: string[]): void;
  setRemindersEnabled(enabled: boolean): void;
  dismissReminderUntil(ts: number): void;
  wipeAll(confirm: boolean): void;
  // Advanced Goals CRUD
  addAdvancedGoal(goal: Omit<AdvancedGoal, 'id'>): void;
  editAdvancedGoal(id: string, patch: Partial<AdvancedGoal>): void;
  deleteAdvancedGoal(id: string): void;
  toggleAdvancedGoal(id: string): void;
  // Preset CRUD
  addPreset(preset: DrinkPreset): void;
  editPreset(name: string, preset: DrinkPreset): void;
  deletePreset(name: string): void;
  _recompute(): void;
};

function derive(db: DB) {
  const stats = computeStats(db.entries, db.settings);
  const today = startOfDay(Date.now());
  const todayTotal = db.entries.filter(e => isSameDay(e.ts, today)).reduce((a,b)=>a+b.stdDrinks,0);
  const weekTotal = stats.weekly?.[stats.weekly.length-1]?.stdDrinks ?? 0;
  const lastLog = db.entries.length ? Math.max(...db.entries.map(e=>e.ts)) : undefined;
  return { stats, todayTotal, weekTotal, lastLog };
}

function addEntry(set: any, get: any, e: Omit<Entry,'id'>) {
  const id = nanoid();
  const ts = e.ts ?? Date.now();
  const db = { ...get().db, entries: [...get().db.entries, { ...e, id, ts }], _lastLogAt: ts };
  set({ db }); get()._recompute();
}

function editEntry(set: any, get: any, id: UUID, patch: Partial<Entry>) {
  const db = {
    ...get().db,
    entries: get().db.entries.map(e => e.id === id ? { ...e, ...patch, editedAt: Date.now() } : e)
  };
  set({ db }); get()._recompute();
}

function deleteEntry(set: any, get: any, id: UUID) {
  const found = get().db.entries.find(e=>e.id===id);
  if (!found) return;
  const trash = { id, snapshot: found, deletedAt: Date.now() };
  const expiresAt = Date.now() + 10*60_000;
  const db = {
    ...get().db,
    entries: get().db.entries.filter(e=>e.id!==id),
    trash: [...get().db.trash, trash],
    meta: { ...get().db.meta, lastUndo: { action: 'delete' as const, payload: { id }, expiresAt } }
  };
  set({ db }); get()._recompute();
}

function undo(set: any, get: any) {
  const u = get().db.meta.lastUndo;
  if (!u) return;
  if (Date.now() > u.expiresAt) { set({ db: { ...get().db, meta: { ...get().db.meta, lastUndo: undefined } } }); return; }
  if (u.action === 'delete') {
    const tid = (u.payload as { id: string } | undefined)?.id;
    const item = get().db.trash.find(t=>t.id===tid);
    if (item) {
      const db = {
        ...get().db,
        entries: [...get().db.entries, item.snapshot],
        trash: get().db.trash.filter(t=>t.id!==tid),
        meta: { ...get().db.meta, lastUndo: undefined },
        _lastLogAt: Math.max(get().db._lastLogAt ?? 0, item.snapshot.ts)
      };
      set({ db }); get()._recompute();
    }
  }
}

function applyThemeToDocument(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light','dark'); 
  if (theme !== 'system') {
    root.classList.add(theme);
  }
}

function setThemeFn(set: any, get: any, theme: Theme) {
  const db = { ...get().db, settings: { ...get().db.settings, theme } };
  set({ db }); get()._recompute();
  if (typeof document !== 'undefined') {
    applyThemeToDocument(theme);
  }
}

function setLanguageFn(set: any, get: any, language: Language) {
  const db = { ...get().db, settings: { ...get().db.settings, language } };
  set({ db }); get()._recompute();
}

function setSettingsFn(set: any, get: any, patch: Partial<Settings>) {
  const db = { ...get().db, settings: { ...get().db.settings, ...patch } };
  set({ db }); get()._recompute();
  if ('reminders' in patch) resyncNotifications();
}

function setReminderTimesFn(set: any, get: any, times: string[]) {
  const db = { ...get().db, settings: { ...get().db.settings, reminders: { ...get().db.settings.reminders, times } } };
  set({ db }); get()._recompute(); resyncNotifications();
}

function setRemindersEnabledFn(set: any, get: any, enabled: boolean) {
  const db = { ...get().db, settings: { ...get().db.settings, reminders: { ...get().db.settings.reminders, enabled } } };
  set({ db }); get()._recompute(); resyncNotifications();
}

function dismissReminderUntilFn(set: any, get: any, ts: number) {
  const db = { ...get().db, meta: { ...get().db.meta, reminderSuppressedUntil: ts } };
  set({ db });
}

function wipeAllFn(set: any, get: any, confirmFlag: boolean) {
  if (!confirmFlag) return;
  const db = defaults();
  set({ db }); get()._recompute();
}

function recompute(set: any, get: any) {
  const d = derive(get().db);
  set({ stats: d.stats, todayTotal: d.todayTotal, weekTotal: d.weekTotal, db: { ...get().db, _lastLogAt: d.lastLog } });
}

// Advanced Goals CRUD operations
function addAdvancedGoal(set: any, get: any, goal: Omit<AdvancedGoal, 'id'>) {
  const newGoal: AdvancedGoal = { ...goal, id: nanoid() };
  const db = { ...get().db, advancedGoals: [...get().db.advancedGoals, newGoal] };
  set({ db }); get()._recompute();
}

function editAdvancedGoal(set: any, get: any, id: string, patch: Partial<AdvancedGoal>) {
  const db = {
    ...get().db,
    advancedGoals: get().db.advancedGoals.map(g => g.id === id ? { ...g, ...patch } : g)
  };
  set({ db }); get()._recompute();
}

function deleteAdvancedGoal(set: any, get: any, id: string) {
  const db = {
    ...get().db,
    advancedGoals: get().db.advancedGoals.filter(g => g.id !== id)
  };
  set({ db }); get()._recompute();
}

function toggleAdvancedGoal(set: any, get: any, id: string) {
  const db = {
    ...get().db,
    advancedGoals: get().db.advancedGoals.map(g => 
      g.id === id ? { ...g, isActive: !g.isActive } : g
    )
  };
  set({ db }); get()._recompute();
}

// Preset CRUD operations
function addPreset(set: any, get: any, preset: DrinkPreset) {
  // Check if preset with same name already exists
  const exists = get().db.presets.find(p => p.name === preset.name);
  if (exists) return; // Don't add duplicates
  
  const db = { ...get().db, presets: [...get().db.presets, preset] };
  set({ db }); get()._recompute();
}

function editPreset(set: any, get: any, name: string, preset: DrinkPreset) {
  const db = {
    ...get().db,
    presets: get().db.presets.map(p => p.name === name ? preset : p)
  };
  set({ db }); get()._recompute();
}

function deletePreset(set: any, get: any, name: string) {
  const db = {
    ...get().db,
    presets: get().db.presets.filter(p => p.name !== name)
  };
  set({ db }); get()._recompute();
}

function createStore(set: any, get: any) {
  const base = defaults();
  const d = derive(base);
  
  // Initialize theme on store creation
  if (typeof document !== 'undefined') {
    const theme = base.settings.theme;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.add('dark');
    } else {
      root.classList.add(theme);
    }
  }
  
  return {
    db: { ...base, _lastLogAt: d.lastLog },
    todayTotal: d.todayTotal,
    weekTotal: d.weekTotal,
    stats: d.stats,
    addEntry: (e: Omit<Entry,'id'>) => addEntry(set, get, e),
    editEntry: (id: UUID, patch: Partial<Entry>) => editEntry(set, get, id, patch),
    deleteEntry: (id: UUID) => deleteEntry(set, get, id),
    undo: () => undo(set, get),
    setTheme: (theme: Theme) => setThemeFn(set, get, theme),
    setLanguage: (lang: Language) => setLanguageFn(set, get, lang),
    setSettings: (p: Partial<Settings>) => setSettingsFn(set, get, p),
    setReminderTimes: (times: string[]) => setReminderTimesFn(set, get, times),
    setRemindersEnabled: (e: boolean) => setRemindersEnabledFn(set, get, e),
    dismissReminderUntil: (ts: number) => dismissReminderUntilFn(set, get, ts),
    wipeAll: (c: boolean) => wipeAllFn(set, get, c),
    // Advanced Goals CRUD
    addAdvancedGoal: (goal: Omit<AdvancedGoal, 'id'>) => addAdvancedGoal(set, get, goal),
    editAdvancedGoal: (id: string, patch: Partial<AdvancedGoal>) => editAdvancedGoal(set, get, id, patch),
    deleteAdvancedGoal: (id: string) => deleteAdvancedGoal(set, get, id),
    toggleAdvancedGoal: (id: string) => toggleAdvancedGoal(set, get, id),
    // Preset CRUD
    addPreset: (preset: DrinkPreset) => addPreset(set, get, preset),
    editPreset: (name: string, preset: DrinkPreset) => editPreset(set, get, name, preset),
    deletePreset: (name: string) => deletePreset(set, get, name),
    _recompute: () => recompute(set, get),
  } as Store;
}

export const useDB = create<Store>()(
  persist(
    (set, get) => createStore(set, get),
    {
      name: DB_KEY,
      version: CURRENT_DB_VERSION,
      storage: preferencesStorage as unknown as PersistStorage<unknown>,
      migrate: async (persisted: unknown, v: number) => {
        const migrated = migrateDB((persisted as { db: DB } | undefined)?.db, v, CURRENT_DB_VERSION);
        return migrated ? { db: migrated } : undefined;
      },
      partialize: (s: Store): { db: DB } => ({ db: s.db })
    }
  )
);
