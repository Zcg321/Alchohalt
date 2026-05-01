/**
 * Shared seed + storage primitives for Playwright-driven capture.
 *
 * Extracted from capture_screenshots.ts so other Playwright drivers in
 * the repo (walkthroughs / audits / regression captures) can reuse the
 * exact same seed payload + storage key without parallelling code.
 *
 * Per the sovereign + reuse-first rule: anything Playwright-related in
 * this repo seeds via these helpers. Adding a new field to the Entry
 * shape happens here, not in three sibling scripts.
 */

/** localStorage key the persisted Zustand store uses on web/PWA. */
export const DB_KEY = 'alchohalt:alchohalt.db';

export interface SeedOptions {
  /** Anchor "now" — defaults to Date.now() at call time. Override for determinism. */
  now?: number;
  /** Whether to seed the demo entry at all. Default true. */
  withEntry?: boolean;
  /** Whether to mark onboarding complete. Default true. */
  onboarded?: boolean;
  /** How many days before "now" the seed entry should sit. Default 14 (calm streak). */
  entryAgeDays?: number;
  /** Override settings.dailyGoalDrinks (default 2). 0 = goal not set. */
  dailyGoal?: number;
  /** Override settings.weeklyGoalDrinks (default 7). 0 = goal not set. */
  weeklyGoal?: number;
  /** Inject one or more advanced goals (default none). */
  advancedGoals?: Array<Record<string, unknown>>;
}

/**
 * 7-day calm-streak seed: a single early entry from 14 days ago, then a
 * clean week. Reads as "real recovery progress," not aspirational.
 */
export function makeSeedPayload(opts: SeedOptions = {}): string {
  const now = opts.now ?? Date.now();
  const withEntry = opts.withEntry ?? true;
  const onboarded = opts.onboarded ?? true;
  const entryAgeDays = opts.entryAgeDays ?? 14;
  const dailyGoal = opts.dailyGoal ?? 2;
  const weeklyGoal = opts.weeklyGoal ?? 7;
  const advancedGoals = opts.advancedGoals ?? [];
  const day = 24 * 60 * 60 * 1000;
  const entry = {
    id: 'demo-entry-1',
    ts: now - entryAgeDays * day,
    kind: 'beer' as const,
    stdDrinks: 1.5,
    cost: 7.5,
    intention: 'social' as const,
    craving: 3,
    halt: { H: false, A: false, L: false, T: false },
    notes: 'dinner with friends',
    mood: 'calm' as const,
  };
  const db = {
    version: 5,
    entries: withEntry ? [entry] : [],
    trash: [],
    settings: {
      version: 1,
      language: 'en',
      theme: 'system',
      dailyGoalDrinks: dailyGoal,
      weeklyGoalDrinks: weeklyGoal,
      monthlyBudget: 80,
      reminders: { enabled: false, times: [] },
      showBAC: false,
      hasCompletedOnboarding: onboarded,
    },
    advancedGoals,
    presets: [],
    meta: {},
  };
  return JSON.stringify({ state: { db }, version: 5 });
}
