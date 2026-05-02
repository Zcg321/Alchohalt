/**
 * [R7-A3/B] Fixture user-data states for persona walkthroughs.
 *
 * Each fixture is a serialized {state: {db}} blob matching the shape
 * Zustand's persist() writes to localStorage under key "alchohalt.db".
 * The Playwright spec injects this via page.addInitScript() before
 * the SPA mounts, so the app boots into the persona state without any
 * UI driving.
 *
 * Personas, per Round-7 §A3:
 *   day0      — fresh user, no entries (Settings tab still works)
 *   day7      — mid-streak (3 days AF, before that 1 light-drinking day,
 *               crisis modal verifies, hard-time panel verifies)
 *   day30     — established user, 30 entries spanning a month, mixed
 *               drink types and HALT states, weekly cap set
 *   recovery  — explicit Round-7 sequence: 5 AF / 1 BREAK / 2 AF
 *               (last log was a single light-drinking day a week ago,
 *               then nothing, then today another single drink)
 */

type Halt = { H: boolean; A: boolean; L: boolean; T: boolean };
type DrinkKind = 'beer' | 'wine' | 'spirits' | 'cocktail' | 'other';
type Intention =
  | 'celebrate'
  | 'social'
  | 'taste'
  | 'bored'
  | 'cope'
  | 'other';

interface Entry {
  id: string;
  ts: number;
  kind: DrinkKind;
  stdDrinks: number;
  cost?: number;
  intention: Intention;
  craving: number;
  halt: Halt;
  altAction?: string;
  notes?: string;
}

interface DB {
  version: number;
  entries: Entry[];
  trash: unknown[];
  settings: {
    version: number;
    language: 'en' | 'es';
    theme: 'system' | 'light' | 'dark';
    dailyGoalDrinks: number;
    weeklyGoalDrinks: number;
    monthlyBudget: number;
    reminders: { enabled: boolean; times: string[] };
    showBAC: boolean;
    /** Marked true on every persona so the 3-beat onboarding overlay
     * doesn't intercept clicks during the walkthrough. Day-0 still
     * represents a user with no entries; the difference is they've
     * finished or skipped the intro. */
    hasCompletedOnboarding: boolean;
  };
  advancedGoals: unknown[];
  presets: { name: string; volumeMl: number; abvPct: number }[];
  healthMetrics: unknown[];
  meta: Record<string, unknown>;
}

const DEFAULT_PRESETS = [
  { name: 'Beer (12oz)', volumeMl: 355, abvPct: 5.0 },
  { name: 'Wine (5oz)', volumeMl: 148, abvPct: 12.0 },
  { name: 'Shot (1.5oz)', volumeMl: 44, abvPct: 40.0 },
  { name: 'Light Beer (12oz)', volumeMl: 355, abvPct: 4.2 },
];

const NO_HALT: Halt = { H: false, A: false, L: false, T: false };

/** Pinned reference time so screenshots are stable across days. */
const REF_NOW = new Date('2026-05-01T18:00:00Z').getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

function blankDB(): DB {
  return {
    version: 1,
    entries: [],
    trash: [],
    settings: {
      version: 1,
      language: 'en',
      theme: 'system',
      dailyGoalDrinks: 0,
      weeklyGoalDrinks: 0,
      monthlyBudget: 0,
      reminders: { enabled: false, times: [] },
      showBAC: false,
      hasCompletedOnboarding: true,
    },
    advancedGoals: [],
    presets: [...DEFAULT_PRESETS],
    healthMetrics: [],
    meta: {},
  };
}

function entry(
  id: string,
  ts: number,
  kind: DrinkKind,
  stdDrinks: number,
  intention: Intention,
  halt: Partial<Halt> = {},
  craving = 3,
): Entry {
  return {
    id,
    ts,
    kind,
    stdDrinks,
    intention,
    craving,
    halt: { ...NO_HALT, ...halt },
  };
}

export type PersonaName = 'day0' | 'day7' | 'day30' | 'recovery';

export const PERSONAS: Record<PersonaName, () => { state: { db: DB }; version: number }> = {
  /**
   * Day-0: opened the app for the first time today. No entries, no
   * goals set, no reminders. The Settings tab and the marketing /
   * empty-state surfaces are the relevant ones.
   */
  day0: () => {
    const db = blankDB();
    return { state: { db }, version: 1 };
  },

  /**
   * Day-7: mid-week, has been logging consistently. 7 days of mixed
   * data (some AF, some moderate). Daily cap set to 2.
   */
  day7: () => {
    const db = blankDB();
    db.settings.dailyGoalDrinks = 2;
    db.settings.weeklyGoalDrinks = 7;
    db.settings.reminders = { enabled: true, times: ['20:00'] };
    db.entries = [
      entry('e1', REF_NOW - 6 * DAY_MS, 'beer', 1.5, 'social', { L: true }, 4),
      entry('e2', REF_NOW - 5 * DAY_MS, 'wine', 1.2, 'taste', {}, 2),
      entry('e3', REF_NOW - 4 * DAY_MS, 'beer', 2.0, 'social', { T: true }, 5),
      entry('e4', REF_NOW - 1 * DAY_MS, 'wine', 1.0, 'celebrate', {}, 1),
    ];
    return { state: { db }, version: 1 };
  },

  /**
   * Day-30: a month of mixed data. 30 entries, full year of streak
   * math available, weekly cap and monthly budget set, theme = system,
   * a couple of presets edited.
   */
  day30: () => {
    const db = blankDB();
    db.settings.dailyGoalDrinks = 2;
    db.settings.weeklyGoalDrinks = 8;
    db.settings.monthlyBudget = 80;
    db.settings.reminders = { enabled: true, times: ['09:00', '21:00'] };
    db.settings.theme = 'light';
    const intents: Intention[] = ['social', 'celebrate', 'cope', 'taste', 'bored'];
    const kinds: DrinkKind[] = ['beer', 'wine', 'spirits', 'cocktail'];
    db.entries = Array.from({ length: 30 }, (_, i) => {
      const intent = intents[i % intents.length]!;
      const kind = kinds[i % kinds.length]!;
      const halt: Partial<Halt> =
        i % 7 === 0 ? { H: true } : i % 5 === 0 ? { L: true } : i % 9 === 0 ? { T: true } : {};
      return entry(
        `d30-${i}`,
        REF_NOW - i * DAY_MS - 6 * 60 * 60 * 1000,
        kind,
        1 + (i % 3) * 0.4,
        intent,
        halt,
        2 + (i % 5),
      );
    });
    return { state: { db }, version: 1 };
  },

  /**
   * Recovery: returning user. Round-7 explicit sequence — 5 AF days,
   * 1 break (one drink), 2 AF days. They quit before, slipped, and
   * are back in the app today with no judgment.
   */
  recovery: () => {
    const db = blankDB();
    db.settings.dailyGoalDrinks = 0; // AF target
    db.settings.weeklyGoalDrinks = 0;
    db.settings.reminders = { enabled: true, times: ['20:30'] };
    // Today and yesterday: AF (no entries — AF is the absence of an
    // entry, that's how the app detects streak)
    // 2 days ago: BREAK — one wine
    // 3-7 days ago: 5 AF (no entries)
    db.entries = [
      entry(
        'r1',
        REF_NOW - 2 * DAY_MS - 4 * 60 * 60 * 1000,
        'wine',
        1.4,
        'cope',
        { L: true, T: true },
        7,
      ),
    ];
    return { state: { db }, version: 1 };
  },
};
