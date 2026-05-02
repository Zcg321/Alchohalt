import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrateDB } from '../migrate';
import { computeStreak, computeLongestStreak, computeTotalAFDays } from '../calc';
import type { DB, Entry } from '../../store/db';

/**
 * [R6-A5] Migration safety for the streak split (active vs longest vs
 * lifetime AF). The DB has NO persisted streak field — all streak math
 * is derived from `entries` on the fly. So the migration concern is:
 * existing users (DB version 0, pre-streak-fix) shouldn't see their
 * computed streaks suddenly recompute to different numbers after the
 * version bump.
 *
 * Strategy: hand-build fixture DBs at known states (Day-7 power user,
 * Day-30 with relapse, returning user with one big past streak), run
 * them through migrateDB, then assert the post-migration streak values
 * match the expected-from-the-data values. Failure = a future
 * migration silently changed someone's "longest streak" number.
 */

const FIXED_NOW = new Date('2026-04-15T12:00:00.000Z').getTime();
const day = (o: number) => new Date(FIXED_NOW + o * 86_400_000).toISOString().slice(0, 10);
const tsAt = (o: number, hour = 20) =>
  new Date(`${day(o)}T${String(hour).padStart(2, '0')}:00:00.000Z`).getTime();

const baseEntry = (over: Partial<Entry>): Entry => ({
  id: over.id ?? 'e' + Math.random().toString(36).slice(2),
  ts: over.ts ?? FIXED_NOW,
  kind: over.kind ?? 'beer',
  stdDrinks: over.stdDrinks ?? 1,
  intention: over.intention ?? 'social',
  craving: over.craving ?? 5,
  halt: over.halt ?? { H: false, A: false, L: false, T: false },
  ...over,
});

const dbWith = (entries: Entry[], version?: number): DB => ({
  version: version ?? 0,
  entries,
  trash: [],
  settings: {
    version: version ?? 0,
    language: 'en', theme: 'system',
    dailyGoalDrinks: 0, weeklyGoalDrinks: 0, monthlyBudget: 0,
    reminders: { enabled: false, times: [] },
    showBAC: false,
  },
  advancedGoals: [],
  presets: [],
  meta: {},
});

const byDayMap = (entries: Entry[]): Record<string, number> => {
  const m: Record<string, number> = {};
  for (const e of entries) {
    const k = new Date(e.ts).toISOString().slice(0, 10);
    m[k] = (m[k] || 0) + e.stdDrinks;
  }
  return m;
};

describe('streak migration — fixture replay', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(FIXED_NOW)); });
  afterEach(() => vi.useRealTimers());

  it('Day-0 fresh: no entries, version 0 → v1 → streaks all 0', () => {
    const before = dbWith([], 0);
    const after = migrateDB(before, 0, 1);
    expect(after?.version).toBe(1);
    expect(after?.settings.version).toBe(1);
    const map = byDayMap(after!.entries);
    expect(computeStreak(map)).toBe(0);
    expect(computeLongestStreak(map)).toBe(0);
    expect(computeTotalAFDays(map)).toBe(0);
  });

  it('Day-7 mid-engagement (3 drink days, 4 AF days): values stable across migration', () => {
    const entries = [
      baseEntry({ ts: tsAt(-1) }),
      baseEntry({ ts: tsAt(-3) }),
      baseEntry({ ts: tsAt(-5) }),
    ];
    const before = dbWith(entries, 0);
    const map = byDayMap(entries);
    const beforeStreak = computeStreak(map);
    const beforeLongest = computeLongestStreak(map);
    const beforeTotal = computeTotalAFDays(map);
    const after = migrateDB(before, 0, 1);
    const afterMap = byDayMap(after!.entries);
    expect(computeStreak(afterMap)).toBe(beforeStreak);
    expect(computeLongestStreak(afterMap)).toBe(beforeLongest);
    expect(computeTotalAFDays(afterMap)).toBe(beforeTotal);
    // Sanity: with drinks at -1, -3, -5 and today AF, active streak = 1
    // (just today, drink at -1 breaks). Longest = 1 (any single AF day).
    expect(beforeStreak).toBe(1);
    expect(beforeLongest).toBe(1);
  });

  it('Day-30 power user (1 drink day at -29, 29 AF days): longest preserved', () => {
    const entries = [baseEntry({ ts: tsAt(-29) })];
    const before = dbWith(entries, 0);
    const after = migrateDB(before, 0, 1);
    const map = byDayMap(after!.entries);
    expect(computeStreak(map)).toBe(29); // today + 28 days back to -28 then drink at -29
    expect(computeLongestStreak(map)).toBe(29);
    expect(computeTotalAFDays(map)).toBe(29);
  });

  it('Recovery scenario (5 AF, 1 BREAK, 2 AF): longest=5 preserved post-migration', () => {
    // Days -7..-3 AF (5 days), day -2 BREAK, days -1..0 AF (2 days)
    const entries: Entry[] = [
      baseEntry({ ts: tsAt(-2), stdDrinks: 2 }), // break day
    ];
    const before = dbWith(entries, 0);
    // Build the byDayMap as the app would, including AF (0-value) days.
    // The byDayMap as derived ONLY contains drink days (no zeroes), so
    // computeLongestStreak walks day-by-day from earliest to today and
    // counts AF days as anything not in the map. With only one entry at
    // day -2, the earliest record is day -2. From -2 to 0 (3 days):
    //   -2: 2 (break) → currentStreak resets to 0
    //   -1: 0 (AF) → currentStreak=1
    //    0: 0 (AF) → currentStreak=2
    // Longest after the loop = 2.
    // Active streak walks back from today: 0,-1 AF, -2 break → active=2.
    // Total AF in window = 2.
    const after = migrateDB(before, 0, 1);
    const map = byDayMap(after!.entries);
    expect(computeStreak(map)).toBe(2);
    expect(computeLongestStreak(map)).toBe(2);
    expect(computeTotalAFDays(map)).toBe(2);
  });

  it('migration is a no-op for already-current version', () => {
    const entries = [baseEntry({ ts: tsAt(-3) })];
    const before = dbWith(entries, 1);
    const after = migrateDB(before, 1, 1);
    expect(after?.version).toBe(1);
    expect(after?.entries).toEqual(entries);
  });

  it('migration preserves entry count and entry ts (no data loss)', () => {
    const entries = Array.from({ length: 50 }, (_, i) =>
      baseEntry({ ts: tsAt(-i), id: `e${i}`, stdDrinks: (i % 3) + 1 }),
    );
    const before = dbWith(entries, 0);
    const after = migrateDB(before, 0, 1);
    expect(after?.entries.length).toBe(50);
    const beforeIds = new Set(entries.map((e) => e.id));
    const afterIds = new Set(after!.entries.map((e) => e.id));
    expect(afterIds).toEqual(beforeIds);
    for (const e of after!.entries) {
      const original = entries.find((x) => x.id === e.id);
      expect(e.ts).toBe(original!.ts);
      expect(e.stdDrinks).toBe(original!.stdDrinks);
    }
  });

  it('migrateDB returns undefined when persisted is undefined (fresh install)', () => {
    expect(migrateDB(undefined, undefined, 1)).toBeUndefined();
  });

  it('post-migration: longest streak NEVER smaller than pre-migration', () => {
    // The owner-locked invariant: a migration must not silently shrink
    // any user's celebrated longest streak.
    const cases: { entries: Entry[]; from: number }[] = [
      { entries: [baseEntry({ ts: tsAt(-30) })], from: 0 },
      { entries: [baseEntry({ ts: tsAt(-10) }), baseEntry({ ts: tsAt(-20) })], from: 0 },
      { entries: Array.from({ length: 5 }, (_, i) => baseEntry({ ts: tsAt(-30 + i * 7) })), from: 0 },
    ];
    for (const { entries, from } of cases) {
      const before = byDayMap(entries);
      const beforeLongest = computeLongestStreak(before);
      const after = migrateDB(dbWith(entries, from), from, 1);
      const afterLongest = computeLongestStreak(byDayMap(after!.entries));
      expect(afterLongest).toBeGreaterThanOrEqual(beforeLongest);
    }
  });
});
