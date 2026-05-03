/**
 * [R21-1] Insights worker client — sync-fallback path.
 *
 * jsdom doesn't ship a Worker implementation, so the client's
 * fallback path runs the compute synchronously on the caller's
 * thread. These tests pin that contract so a future Vite/Vitest
 * upgrade that suddenly DOES expose Worker doesn't silently break
 * tests that assume sync resolution.
 *
 * The off-thread path is exercised in production; we don't try to
 * fake a Worker here. Doing so would test the mock, not the real
 * worker.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import {
  runProgressData,
  runTagPatterns,
  _resetForTests,
} from '../insightsWorkerClient';
import type { Drink } from '../../features/drinks/DrinkForm';

beforeEach(() => {
  _resetForTests();
});

const sampleDrinks: Drink[] = [
  {
    ts: Date.now() - 1 * 86_400_000,
    volumeMl: 355,
    abvPct: 5.0,
    intention: 'social',
    craving: 0.3,
    halt: [],
    alt: '',
    tags: ['friday', 'social'],
  },
  {
    ts: Date.now() - 2 * 86_400_000,
    volumeMl: 150,
    abvPct: 12.0,
    intention: 'celebrate',
    craving: 0.5,
    halt: [],
    alt: '',
    tags: ['friday', 'dinner'],
  },
  {
    ts: Date.now() - 3 * 86_400_000,
    volumeMl: 355,
    abvPct: 5.0,
    intention: 'cope',
    craving: 0.7,
    halt: ['tired'],
    alt: '',
    tags: ['friday'],
  },
];

describe('[R21-1] insightsWorkerClient — sync fallback', () => {
  it('runProgressData resolves with a ProgressData shape', async () => {
    const result = await runProgressData(sampleDrinks, {
      dailyCap: 2,
      weeklyGoal: 10,
      pricePerStd: 5,
      baselineMonthlySpend: 200,
    });
    expect(result).toBeDefined();
    expect(typeof result.dailyProgress).toBe('number');
    expect(typeof result.weeklyProgress).toBe('number');
    expect(result.streakMilestones).toBeDefined();
    expect(result.healthMetrics).toBeDefined();
    expect(result.monthlySpending).toBeDefined();
  });

  it('runTagPatterns resolves with an array', async () => {
    const result = await runTagPatterns(sampleDrinks, { minOccurrences: 1 });
    expect(Array.isArray(result)).toBe(true);
    /* The "friday" tag appears on all 3 drinks; threshold=1 so it
     * surfaces. Don't pin order/values — that's the unit test's job
     * for tagPatterns.ts. We're testing the worker plumbing. */
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles empty input gracefully', async () => {
    const result = await runProgressData([], {
      dailyCap: 2,
      weeklyGoal: 10,
      pricePerStd: 5,
      baselineMonthlySpend: 200,
    });
    expect(result.healthMetrics.alcoholFreeDays).toBe(30);
  });

  it('typed wrappers preserve types end-to-end', async () => {
    const patterns = await runTagPatterns(sampleDrinks, { minOccurrences: 1 });
    if (patterns.length > 0) {
      const first = patterns[0]!;
      expect(typeof first.tag).toBe('string');
      expect(typeof first.count).toBe('number');
      expect(typeof first.avgStd).toBe('number');
      expect(typeof first.deltaVsOverall).toBe('number');
    }
  });
});
