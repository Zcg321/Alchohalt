/**
 * [R8-F] Real-data resilience pass — 1000 random fixture user states.
 *
 * Every previous round used hand-picked fixtures: empty user, day-1
 * user, 7-day streak, returning-from-relapse user. Those fixtures
 * caught the cases the author was thinking about, but they don't
 * cover the unknown-unknowns: a user with 5000 entries spread across
 * 6 years; a user with the clock skewed to 2050; a user whose entries
 * landed at the exact midnight rollover; a user whose first entry is
 * tomorrow because of a timezone bug.
 *
 * This test generates 1000 deterministic-random user states and runs
 * each through the streak/AF-day/stats math. Any crash, NaN, Infinity,
 * or impossible invariant violation (e.g. current streak greater than
 * total AF days) fails the test with the seed that produced it — so
 * the author can reproduce by hardcoding the seed and stepping through.
 *
 * The RNG is seeded so this test is deterministic. Increasing
 * STATES_PER_RUN above 1000 will spend more CI time finding rarer
 * pathologies; 1000 is the sweet spot where the test runs in a couple
 * seconds and catches every malformed state we've found in practice.
 */

import { describe, expect, it } from 'vitest';

import {
  computeLongestStreak,
  computeStreak,
  computeTotalAFDays,
  daysSinceLastDrink,
  getStreakStatus,
} from '../calc';
import { computeStats } from '../stats';
import type { Entry, Settings } from '../../store/db';

const STATES_PER_RUN = 1000;
const RNG_SEED = 0xc0ffee;

/** Deterministic mulberry32 PRNG — seeded once per run. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface State {
  entries: Entry[];
  settings: Settings;
  drinksByDay: Record<string, number>;
}

function dayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

function makeState(rand: () => number): State {
  const now = Date.now();
  // Span: between 1 and 7 years of history.
  const spanDays = Math.floor(rand() * 7 * 365) + 1;
  // Sparsity: between 0% (perfect AF stretch) and 100% (drank every day).
  const drinkProbability = rand();
  // Entries: between 0 and 4000. Long-tail to stress the loops.
  const entryCount = Math.floor(rand() * 4001);

  const entries: Entry[] = [];
  const drinksByDay: Record<string, number> = {};
  for (let i = 0; i < entryCount; i += 1) {
    if (rand() > drinkProbability) continue;
    const tsOffsetDays = Math.floor(rand() * spanDays);
    /* Mix of negative offsets (past) and a sliver of future-skew offsets
     * (clock-drift / timezone bugs). The math should not crash on
     * future entries; it should ignore them or count them as
     * "drinking today" depending on the function. */
    const direction = rand() < 0.98 ? -1 : 1;
    const ts = now + direction * tsOffsetDays * 86400_000;
    const stdDrinks = rand() * 8; // 0–8 standard drinks per entry
    entries.push({
      id: `e${i}`,
      ts,
      kind: 'beer',
      stdDrinks,
      intention: 'social',
      craving: Math.floor(rand() * 11),
      halt: { H: false, A: false, L: false, T: false },
    });
    const k = dayKey(ts);
    drinksByDay[k] = (drinksByDay[k] ?? 0) + (stdDrinks > 0 ? 1 : 0);
  }

  const settings: Settings = {
    version: 1,
    language: 'en',
    theme: 'system',
    dailyGoalDrinks: Math.floor(rand() * 5),
    weeklyGoalDrinks: Math.floor(rand() * 30),
    monthlyBudget: Math.floor(rand() * 500),
    reminders: { enabled: false, times: [] },
    showBAC: false,
  };
  return { entries, settings, drinksByDay };
}

function check(label: string, value: number, seedTag: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} returned non-finite (${value}) for seed ${seedTag}`);
  }
  if (value < 0) {
    throw new Error(`${label} returned negative (${value}) for seed ${seedTag}`);
  }
}

describe('Real-data resilience — random fixture sweep', () => {
  /* The streak math walks day-by-day across the full span (up to 7
   * years), and computeStats walks 30 + weekly-bucket entries on top.
   * 1000 iterations × ~10k ops per iteration = a 10-30s test. The
   * default 5s vitest timeout is too tight; bump it explicitly. */
  it(`runs ${STATES_PER_RUN} random user states without crash or invariant violation`, { timeout: 60_000 }, () => {
    const root = rng(RNG_SEED);
    let dropped = 0;
    for (let i = 0; i < STATES_PER_RUN; i += 1) {
      // Per-iteration seed for reproducibility on failure.
      const seed = Math.floor(root() * 0xffffffff) >>> 0;
      const state = makeState(rng(seed));
      const tag = `iter=${i} seed=0x${seed.toString(16)}`;

      let streak: number;
      let longest: number;
      let days: number;
      let totalAF: number;
      let stats: ReturnType<typeof computeStats>;
      try {
        streak = computeStreak(state.drinksByDay);
        longest = computeLongestStreak(state.drinksByDay);
        days = daysSinceLastDrink(state.drinksByDay);
        totalAF = computeTotalAFDays(state.drinksByDay);
        stats = computeStats(state.entries, state.settings);
      } catch (err) {
        throw new Error(`compute crashed on ${tag}: ${(err as Error).message}`);
      }

      check('computeStreak', streak, tag);
      check('computeLongestStreak', longest, tag);
      check('daysSinceLastDrink', days, tag);
      check('computeTotalAFDays', totalAF, tag);
      check('computeStats.currentAFStreak', stats.currentAFStreak, tag);
      check('computeStats.longestAFStreak', stats.longestAFStreak, tag);
      check('computeStats.monthlySpend', stats.monthlySpend, tag);

      /* Invariant: current streak <= longest streak. computeStats and
       * computeStreak operate on different shapes (entries vs.
       * drinksByDay) so divergence is a real bug. */
      if (streak > longest) {
        throw new Error(
          `Invariant violation: computeStreak (${streak}) > computeLongestStreak (${longest}) for ${tag}`,
        );
      }
      /* Invariant: streak <= totalAFDays. A streak is a contiguous
       * subset of total AF days. */
      if (streak > totalAF) {
        throw new Error(
          `Invariant violation: streak (${streak}) > totalAFDays (${totalAF}) for ${tag}`,
        );
      }
      /* Invariant: getStreakStatus is consistent with the inputs. */
      const status = getStreakStatus(streak, totalAF);
      if (status.kind === 'building' && streak === 0) {
        throw new Error(`getStreakStatus returned 'building' with streak=0 for ${tag}`);
      }
      if (status.kind === 'starting' && totalAF !== 0) {
        throw new Error(
          `getStreakStatus returned 'starting' with totalAF=${totalAF} for ${tag}`,
        );
      }

      // Drop counters so the test summary is informative.
      if (state.entries.length === 0) dropped += 1;
    }
    /* Sanity: with 1000 states and entry counts up to 4000 across 7
     * years, we should see at least a handful of empty states (entry
     * count of zero) — but most states will be non-empty. */
    expect(dropped).toBeGreaterThan(0);
    expect(dropped).toBeLessThan(STATES_PER_RUN);
  });
});
