/**
 * [R20-1] Perf budget: computeProgressData on 250K drinks.
 *
 * Round 12 tested compute correctness against 100K. R20 extends the
 * stress envelope to 250K and pins a hard time budget. The pipeline
 * was making 8+ separate filter/reduce passes — each O(n) — which on
 * a power user's 5-year-history (a real edge case but one we need to
 * not crater) cost 50-200ms of main-thread block.
 *
 * R20-1 collapses those passes into a single accumulator (one pass
 * over `drinks`, all buckets/totals updated inline). The test pins
 * the new budget so a future regression that re-introduces multi-
 * pass aggregation surfaces immediately.
 *
 * Threshold rationale: 250K rows × 8 passes ≈ 2M ops; single-pass
 * is 250K ops. On a typical CI runner (slowest 5% of devs) we see
 * ~30ms for single-pass; budget is 200ms to give 6× headroom
 * against CI variance. If this test starts flaking, suspect a
 * regression to multi-pass before raising the budget.
 */

import { describe, expect, it } from 'vitest';
import type { Drink } from '../../drinks/DrinkForm';
import { computeProgressData } from '../progressMath';

const FIXTURE_SIZE = 250_000;
const BUDGET_MS = 200;

function makeFixture(n: number): Drink[] {
  /* Spread across ~5 years so today/week/month filters are
   * meaningful (each window catches a non-trivial slice). */
  const fiveYearsMs = 5 * 365 * 24 * 60 * 60 * 1000;
  const start = Date.now() - fiveYearsMs;
  const drinks: Drink[] = [];
  for (let i = 0; i < n; i++) {
    /* Pseudo-random but deterministic: use i for a stable
     * fixture across runs so the perf number is comparable. */
    const t = start + (i / n) * fiveYearsMs;
    drinks.push({
      ts: t,
      volumeMl: 355 + (i % 7) * 10,
      abvPct: 4 + (i % 5),
      intention: 'social',
      craving: (i % 11) / 10,
      halt: [],
      alt: '',
    });
  }
  return drinks;
}

describe('[R20-1] computeProgressData perf budget (250K drinks)', () => {
  it(`completes in under ${BUDGET_MS}ms on a 250K fixture`, () => {
    const drinks = makeFixture(FIXTURE_SIZE);
    const goals = {
      dailyCap: 2,
      weeklyGoal: 14,
      pricePerStd: 5,
      baselineMonthlySpend: 200,
    };

    /* Warm up V8 + dispense with first-run JIT cost.
     * One warmup; the measurement happens on the second call. */
    computeProgressData(drinks, goals);

    const start = performance.now();
    const result = computeProgressData(drinks, goals);
    const elapsed = performance.now() - start;

    /* Sanity: result has all expected fields populated. */
    expect(result.dailyProgress).toBeTypeOf('number');
    expect(result.weeklyProgress).toBeTypeOf('number');
    expect(result.monthlySpending.actual).toBeGreaterThanOrEqual(0);
    expect(result.streakMilestones.next).toBeGreaterThan(0);
    expect(['improving', 'stable', 'declining']).toContain(
      result.healthMetrics.improvementTrend,
    );

    expect(
      elapsed,
      `computeProgressData took ${elapsed.toFixed(1)}ms on ${FIXTURE_SIZE} drinks; budget is ${BUDGET_MS}ms`,
    ).toBeLessThan(BUDGET_MS);
  });
});
