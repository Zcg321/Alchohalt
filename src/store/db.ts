/* eslint-disable @typescript-eslint/no-explicit-any */
// DNA: Alchohalt v1 • Unified DB • Do not add network calls.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { getPreferences } from "@/shared/capacitor";
import { nanoid } from 'nanoid';
import { computeStats, startOfDay, isSameDay } from '../lib/stats';
import { migrateDB } from '../lib/migrate';
import { validateDB } from '../lib/dbValidate';
import { reportCorruption } from '../lib/dbRecovery';
/* [BUG-MADGE-CYCLE] Reminder resync is now driven by a Zustand
 * subscription installed from main.tsx (see lib/notify.ts:
 * installReminderSync). The previous direct import of
 * resyncNotifications from this file created a runtime cycle
 * (db ↔ notify) that worked because both calls deferred to
 * function-body refs but flipped on small refactors. */
import type { AdvancedGoal } from '../features/goals/types';
import type { DrinkPreset } from '../types/common';

export type UUID = string;
export type Language = 'en' | 'es' | 'fr' | 'de' | 'pl' | 'ru';
export type Theme = 'light' | 'dark' | 'system';
export type Intention = 'celebrate'|'social'|'taste'|'bored'|'cope'|'other';
export type DrinkKind = 'beer'|'wine'|'spirits'|'custom';
export type HALT = { H:boolean; A:boolean; L:boolean; T:boolean };

/**
 * [R9-2] Local-only onboarding diagnostics. Recorded on-device so the
 * owner / a self-experimenter can see *which* skip path they took
 * without us shipping any telemetry. `status: 'completed'` means the
 * user reached "Get started"; `status: 'skipped'` means the X / Esc /
 * backdrop / just-looking path. None of this is ever transmitted —
 * Settings → Diagnostics is the only surface that reads it.
 */
export interface OnboardingDiagnostics {
  status: 'not-started' | 'completed' | 'skipped';
  intent?: 'cut-back' | 'quit' | 'curious' | undefined;
  trackStyle?: 'day-by-day' | 'thirty-day' | 'custom' | undefined;
  completedAt?: number | undefined;
  skipPath?: 'x-button' | 'escape' | 'backdrop' | 'skip-explore' | 'just-looking' | undefined;
  /**
   * [R11-1] Step the user was on when they skipped (0=intro/intent,
   * 1=track-style, 2=ready). Combined with skipPath, this answers
   * "where in the funnel did the drop happen?" in the on-device
   * Diagnostics → Onboarding funnel view. Local-only; never
   * transmitted.
   */
  skipStep?: 0 | 1 | 2 | undefined;
}

export interface Settings {
  version: number;
  language: Language;
  theme: Theme;
  dailyGoalDrinks: number;
  weeklyGoalDrinks: number;
  monthlyBudget: number;
  reminders: { enabled: boolean; times: string[] };
  showBAC: boolean;
  /**
   * [R14-6] Jurisdiction for std-drink calculations.
   *   us — NIAAA 14g per std drink (default; pre-R14-6 behavior)
   *   uk — NHS 8g per unit (called "units" in display)
   *   au — NHMRC 10g per std drink
   *   eu — Common-EU 10g per std drink
   *   ca — Canada Low-Risk 13.6g per std drink
   *   ie — Ireland HSE 10g per std drink
   * See audit-walkthrough/round-14-researcher-judge.md for sources.
   * Optional for back-compat; missing → 'us'.
   */
  stdDrinkSystem?: import('../lib/calc').StdDrinkSystem;
  profile?: { weightKg?: number | undefined; sex?: 'm'|'f'|'other' | undefined } | undefined;
  notificationFallbackMessage?: string | undefined;
  hasCompletedOnboarding?: boolean | undefined;
  onboardingDiagnostics?: OnboardingDiagnostics | undefined;
  /**
   * [R10-C] Append-only log of past onboarding-diagnostics rows. Each
   * entry has a tagged `revisedAt` timestamp. The latest row drives
   * Diagnostics display via `onboardingDiagnostics`; older rows are
   * preserved here so a user can see how their intent evolved.
   *
   * Local-only — same privacy footprint as the active row. Never
   * transmitted.
   */
  onboardingDiagnosticsHistory?: Array<OnboardingDiagnostics & { revisedAt: number }> | undefined;
  /**
   * [R10-2] Last time we showed the retrospective prompt. Used to gate
   * "It's been a month since your last check-in" so we don't bug the
   * user every session.
   */
  retrospectivePromptLastShownTs?: number | undefined;
  /**
   * [R10-4] Timestamps of HardTimePanel opens. Used by the soft
   * counselor escalation prompt — if 3+ opens in 24h, surface a
   * gentle "Want to talk to a counselor in 5 min?" with provider
   * links. Local-only.
   */
  hardTimeOpenLog?: number[] | undefined;
  /**
   * [HARD-TIME-ROUND-4] Non-judgmental marker timestamp set by the
   * "stop tracking for tonight" action in the Hard-Time panel. Quieter
   * view rendered while `Date.now() < quietUntilTs`. Auto-clears at
   * next-day rollover.
   */
  quietUntilTs?: number | undefined;
  // Enhanced features
  healthPermissionsGranted?: boolean | undefined;
  voicePermissionsGranted?: boolean | undefined;
  privacySettings?: {
    shareWithFriends?: boolean | undefined;
    shareDetailedLogs?: boolean | undefined;
    syncJournalEntries?: boolean | undefined;
  } | undefined;
  /**
   * [R7-A4] User-facing opt-out for the AI-recommendations surface.
   * undefined = feature on per build default; true = opted out.
   */
  aiRecommendationsOptOut?: boolean | undefined;
  /**
   * [R12-4] Calm-defaults config for local notifications. Optional /
   * back-compat: undefined → use DEFAULT_CALM_CONFIG (max 2/day,
   * quiet 23:00-07:00, only dailyCheckin on). See
   * lib/notifications/calmConfig.ts for the full shape and rules.
   */
  calmNotifications?: {
    quietHours?: { startHour: number; endHour: number };
    dailyCap?: number;
    types?: {
      dailyCheckin?: boolean;
      goalMilestone?: boolean;
      retrospective?: boolean;
      backupVerification?: boolean;
      /** [R13-2] Weekly recap, opt-in. */
      weeklyRecap?: boolean;
    };
  } | undefined;
  /**
   * [R13-3] Timestamp when the user dismissed the streak-break
   * reflective prompt for the current break. Cleared back to
   * undefined when the active streak goes from 0 → ≥1 (i.e. the
   * user logs an AF day after the break). Local-only; never
   * transmitted.
   */
  streakBreakAcknowledgedAt?: number | undefined;
  /**
   * [R15-2] Goal-nudge opt-in. Default off (undefined === off). When
   * true, the in-app banner surfaces ONLY when the user is exceeding
   * their daily-cap goal across the trailing 7 days, and only once
   * per week (gated by goalNudgeDismissedAt). Calm-config compliant
   * — no system notifications, banner only.
   */
  goalNudgesEnabled?: boolean | undefined;
  /**
   * [R15-2] Last time the user dismissed the goal-nudge banner.
   * Suppresses re-showing for 7 days from this timestamp. Local-only.
   */
  goalNudgeDismissedAt?: number | undefined;
  /**
   * [R15-3] Result of the most-recent automatic backup verification
   * (run immediately after the user creates a backup). Surfaces in
   * DiagnosticsAudit and, when ok===false, raises a small ribbon at
   * the top of the app. Local-only.
   */
  lastBackupAutoVerification?: {
    ts: number;
    ok: boolean;
    error?: string;
    type: 'json' | 'encrypted';
  } | undefined;
  /**
   * [R15-3] When the user dismisses the failed-verification ribbon
   * we suppress re-showing it for the same verification run. Cleared
   * on the next auto-verification.
   */
  lastBackupRibbonDismissedTs?: number | undefined;
  /**
   * [R16-2] User-installable crisis line. The R13-A region packs
   * cover US/UK/AU/CA/IE; everyone else has to scroll the "other
   * regions" section. This lets a user from a smaller market paste a
   * local-language hotline that surfaces FIRST in CrisisResources,
   * above the auto-detected regional pack.
   *
   * No external lookup, no cloud, no validation beyond local format
   * checks. Stored verbatim in the user's settings, transmitted only
   * if they explicitly export their data.
   *
   * Phone is the only required field. The label is shown above the
   * number; description below. Users in regions we already cover are
   * welcome to add their own anyway — it just gets pinned at the top.
   */
  userCrisisLine?: {
    label: string;
    phone: string;
    description?: string;
  } | undefined;
  /**
   * [R19-4] Crash-report opt-in. Default off (undefined === off).
   *
   * When true, the global error reporter forwards anonymized stack
   * traces to a Sentry-compatible endpoint so the maintainers can
   * fix bugs the user encountered. Body sent: error message, file
   * + line, stack trace. EXCLUDED: user data, breadcrumbs, request
   * bodies, console history, IP address (Sentry strips per config),
   * cookies, localStorage, environment fingerprints beyond UA + OS.
   *
   * When false (default), the reporter logs to console only — no
   * network call. Same shim posture as pre-R19.
   *
   * Settings → Privacy → "Send crash reports to help fix bugs"
   * toggles this. The toggle copy is explicit about what's sent
   * and what's not.
   */
  crashReportsEnabled?: boolean | undefined;
}

export interface Entry {
  id: UUID;
  ts: number;
  kind: DrinkKind;
  stdDrinks: number;
  cost?: number | undefined;
  intention: Intention;
  craving: number;
  halt: HALT;
  altAction?: string | undefined;
  notes?: string | undefined;
  editedAt?: number | undefined;
  // Enhanced features
  journal?: string | undefined;
  mood?: 'happy' | 'sad' | 'anxious' | 'stressed' | 'calm' | 'excited' | 'neutral' | undefined;
  voiceTranscript?: string | undefined;
  /**
   * [R14-3] Free-form tags. Persisted alongside the entry so search
   * and tag-pattern insights work across reloads. Optional and may
   * be missing from older entries; consumers must treat absent and
   * `[]` identically.
   */
  tags?: string[] | undefined;
}

export interface HealthMetric {
  date: string; // YYYY-MM-DD format
  steps?: number | undefined;
  sleepHours?: number | undefined;
  heartRate?: number | undefined;
  source: 'manual' | 'apple-health' | 'google-fit';
}

export interface Undo { action: 'delete'; payload: unknown; expiresAt: number; }
export interface DB {
  version: number;
  entries: Entry[];
  trash: { id: UUID; snapshot: Entry; deletedAt: number }[];
  settings: Settings;
  advancedGoals: AdvancedGoal[];
  presets: DrinkPreset[];
  healthMetrics?: HealthMetric[] | undefined;  // Optional health data from integrations
  meta: { lastUndo?: Undo | undefined; reminderSuppressedUntil?: number | undefined };
  _lastLogAt?: number | undefined; // derived
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
    healthMetrics: [],
    meta: {},
    _lastLogAt: undefined
  };
}

export type Store = {
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
  // Health metrics
  addHealthMetric(metric: HealthMetric): void;
  getHealthMetricsForDateRange(startDate: string, endDate: string): HealthMetric[];
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
    entries: get().db.entries.map((e: Entry) => e.id === id ? { ...e, ...patch, editedAt: Date.now() } : e)
  };
  set({ db }); get()._recompute();
}

function deleteEntry(set: any, get: any, id: UUID) {
  const found = get().db.entries.find((e: Entry)=>e.id===id);
  if (!found) return;
  const trash = { id, snapshot: found, deletedAt: Date.now() };
  const expiresAt = Date.now() + 10*60_000;
  const db = {
    ...get().db,
    entries: get().db.entries.filter((e: Entry)=>e.id!==id),
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
    type Trashed = { id: UUID; snapshot: Entry; deletedAt: number };
    const item = get().db.trash.find((t: Trashed)=>t.id===tid);
    if (item) {
      const db = {
        ...get().db,
        entries: [...get().db.entries, item.snapshot],
        trash: get().db.trash.filter((t: Trashed)=>t.id!==tid),
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
}

function setReminderTimesFn(set: any, get: any, times: string[]) {
  const db = { ...get().db, settings: { ...get().db.settings, reminders: { ...get().db.settings.reminders, times } } };
  set({ db }); get()._recompute();
}

function setRemindersEnabledFn(set: any, get: any, enabled: boolean) {
  const db = { ...get().db, settings: { ...get().db.settings, reminders: { ...get().db.settings.reminders, enabled } } };
  set({ db }); get()._recompute();
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
    advancedGoals: get().db.advancedGoals.map((g: AdvancedGoal) => g.id === id ? { ...g, ...patch } : g)
  };
  set({ db }); get()._recompute();
}

function deleteAdvancedGoal(set: any, get: any, id: string) {
  const db = {
    ...get().db,
    advancedGoals: get().db.advancedGoals.filter((g: AdvancedGoal) => g.id !== id)
  };
  set({ db }); get()._recompute();
}

function toggleAdvancedGoal(set: any, get: any, id: string) {
  const db = {
    ...get().db,
    advancedGoals: get().db.advancedGoals.map((g: AdvancedGoal) =>
      g.id === id ? { ...g, isActive: !g.isActive } : g
    )
  };
  set({ db }); get()._recompute();
}

// Preset CRUD operations
function addPreset(set: any, get: any, preset: DrinkPreset) {
  // Check if preset with same name already exists
  const exists = get().db.presets.find((p: DrinkPreset) => p.name === preset.name);
  if (exists) return; // Don't add duplicates
  
  const db = { ...get().db, presets: [...get().db.presets, preset] };
  set({ db }); get()._recompute();
}

function editPreset(set: any, get: any, name: string, preset: DrinkPreset) {
  const db = {
    ...get().db,
    presets: get().db.presets.map((p: DrinkPreset) => p.name === name ? preset : p)
  };
  set({ db }); get()._recompute();
}

function deletePreset(set: any, get: any, name: string) {
  const db = {
    ...get().db,
    presets: get().db.presets.filter((p: DrinkPreset) => p.name !== name)
  };
  set({ db }); get()._recompute();
}

// Health metrics operations
function addHealthMetric(set: any, get: any, metric: HealthMetric) {
  const metrics = get().db.healthMetrics || [];
  // Replace existing metric for the same date
  const filtered = metrics.filter((m: HealthMetric) => m.date !== metric.date);
  const db = { ...get().db, healthMetrics: [...filtered, metric] };
  set({ db });
}

function getHealthMetricsForDateRange(get: any, startDate: string, endDate: string): HealthMetric[] {
  const metrics = get().db.healthMetrics || [];
  return metrics.filter((m: HealthMetric) => m.date >= startDate && m.date <= endDate);
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
    // Health metrics
    addHealthMetric: (metric: HealthMetric) => addHealthMetric(set, get, metric),
    getHealthMetricsForDateRange: (startDate: string, endDate: string) => getHealthMetricsForDateRange(get, startDate, endDate),
    _recompute: () => recompute(set, get),
  } as Store;
}

export const useDB = create<Store>()(
  persist(
    (set, get) => createStore(set, get),
    {
      name: DB_KEY,
      version: CURRENT_DB_VERSION,
      // [BUG-DB-SERIALIZATION] preferencesStorage is a string-based
      // StateStorage adapter (it shells out to localStorage on web,
      // Capacitor.Preferences on native — both string-only). Wrap it
      // in createJSONStorage so Zustand serializes/deserializes the
      // PersistStorage<T> shape (StorageValue) through JSON before it
      // touches the adapter. The previous `as unknown as PersistStorage`
      // cast lied to the type system: Zustand passed in an object,
      // localStorage coerced it to "[object Object]", and every persisted
      // db became unrecoverable.
      storage: createJSONStorage(() => preferencesStorage),
      migrate: async (persisted: unknown, v: number) => {
        // [R11-2] Defensive validation before migration. If the
        // persisted blob is corrupt (browser bug, OS crash, malicious
        // extension wrote garbage), report it to dbRecovery so the
        // DataRecoveryScreen can surface options to the user, and
        // return undefined so Zustand falls back to the store's
        // initial state. The user keeps a working app; nothing
        // unrecoverable happens behind their back.
        const inner = (persisted as { db: unknown } | undefined)?.db;
        const validation = validateDB(inner);
        if (!validation.ok && validation.reason !== 'empty') {
          reportCorruption(validation.reason, inner);
          return undefined;
        }
        const migrated = migrateDB(validation.ok ? validation.db : undefined, v, CURRENT_DB_VERSION);
        return migrated ? { db: migrated } : undefined;
      },
      partialize: (s: Store): { db: DB } => ({ db: s.db })
    }
  )
);
