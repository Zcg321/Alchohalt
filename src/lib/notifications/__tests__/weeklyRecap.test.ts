import { describe, expect, it } from 'vitest';
import {
  buildWeeklyRecap,
  composeWeeklyRecapBody,
  computeWeeklyRecapStats,
  type WeeklyRecapStats,
} from '../weeklyRecap';
import type { Drink } from '../../../types/common';

/* [R13-2] Weekly-recap notification body. Local-only: no analytics,
 * no fetch, no remote. Voice is calm-factual, never exclamation,
 * round delta to 5%, hide "over cap" when goals.dailyCap <= 0. */

const DAY_MS = 86_400_000;
const NOW = Date.UTC(2026, 4, 3, 12, 0, 0);

function drink(daysAgo: number, volumeMl = 355, abvPct = 5.0): Drink {
  return {
    ts: NOW - daysAgo * DAY_MS,
    volumeMl,
    abvPct,
    intention: 'social' as const,
    craving: 5,
    halt: [],
    alt: '',
  } as Drink;
}

describe('[R13-2] computeWeeklyRecapStats', () => {
  it('returns 7 AF days when no drinks logged', () => {
    const stats = computeWeeklyRecapStats([], 0, NOW);
    expect(stats.afDays).toBe(7);
    expect(stats.loggedDrinkDays).toBe(0);
    expect(stats.daysOverCap).toBe(0);
    expect(stats.totalStd).toBe(0);
    expect(stats.priorTotalStd).toBe(0);
    expect(stats.capTracked).toBe(false);
  });

  it('counts each unique drink-day once, regardless of how many drinks that day', () => {
    const stats = computeWeeklyRecapStats(
      [drink(1), drink(1), drink(1), drink(3)],
      0,
      NOW,
    );
    expect(stats.loggedDrinkDays).toBe(2);
    expect(stats.afDays).toBe(5);
  });

  it('flags daysOverCap only when dailyCap > 0 AND a day exceeds it', () => {
    /* 1 std beer + 1 std beer = 2 std on day 1; cap at 1.5 → over.
     * Single beer on day 3 = 1 std → under cap. */
    const stats = computeWeeklyRecapStats(
      [drink(1), drink(1), drink(3)],
      1.5,
      NOW,
    );
    expect(stats.daysOverCap).toBe(1);
    expect(stats.capTracked).toBe(true);
  });

  it('capTracked false when dailyCap is 0 (user never set one)', () => {
    const stats = computeWeeklyRecapStats([drink(1)], 0, NOW);
    expect(stats.capTracked).toBe(false);
    expect(stats.daysOverCap).toBe(0);
  });

  it('priorTotalStd reflects drinks 7-13 days ago, not in current window', () => {
    /* drink 9 days ago = prior window, drink 1 day ago = current.
     * 9-days-ago is OUTSIDE the lookback by the way bucketWindow
     * works, but that's part of the "prior 7" definition. */
    const stats = computeWeeklyRecapStats(
      [drink(1), drink(8), drink(10)],
      0,
      NOW,
    );
    expect(stats.totalStd).toBeGreaterThan(0);
    expect(stats.priorTotalStd).toBeGreaterThan(0);
  });
});

describe('[R13-2] composeWeeklyRecapBody', () => {
  function makeStats(overrides: Partial<WeeklyRecapStats> = {}): WeeklyRecapStats {
    return {
      afDays: 5,
      loggedDrinkDays: 2,
      daysOverCap: 0,
      totalStd: 4,
      priorTotalStd: 5,
      capTracked: false,
      ...overrides,
    };
  }

  it('renders the canonical happy-path body', () => {
    const body = composeWeeklyRecapBody(
      makeStats({ afDays: 5, loggedDrinkDays: 2, capTracked: true, daysOverCap: 1 }),
    );
    expect(body).toMatch(/^Last week: 5 AF days, 2 logged drink days, 1 over cap\./);
  });

  it('hides over-cap fragment when dailyCap is 0 (capTracked: false)', () => {
    const body = composeWeeklyRecapBody(
      makeStats({ capTracked: false, daysOverCap: 0 }),
    );
    expect(body).not.toMatch(/over cap/);
  });

  it('singular fragment grammar: "1 AF day" not "1 AF days"', () => {
    const body = composeWeeklyRecapBody(makeStats({ afDays: 1, loggedDrinkDays: 1 }));
    expect(body).toMatch(/1 AF day,/);
    expect(body).toMatch(/1 logged drink day/);
  });

  it('shows "Down N% from prior week" when current is lower', () => {
    const body = composeWeeklyRecapBody(makeStats({ totalStd: 4, priorTotalStd: 5 }));
    expect(body).toMatch(/Down 20% from prior week/);
  });

  it('shows "Up N% from prior week" when current is higher', () => {
    const body = composeWeeklyRecapBody(makeStats({ totalStd: 6, priorTotalStd: 5 }));
    expect(body).toMatch(/Up 20% from prior week/);
  });

  it('rounds delta to nearest 5% so the line never reads as false precision', () => {
    /* totalStd / priorTotalStd = 8/5 = 1.6 → 60% up → rounded to 60% */
    const body = composeWeeklyRecapBody(makeStats({ totalStd: 8, priorTotalStd: 5 }));
    expect(body).toMatch(/Up 60% from prior week/);
  });

  it('says "Same as last week" when delta rounds to 0', () => {
    /* 5.05 / 5 = 1.01 → 1% → rounds to 0% */
    const body = composeWeeklyRecapBody(makeStats({ totalStd: 5.05, priorTotalStd: 5 }));
    expect(body).toMatch(/Same as last week/);
  });

  it('omits delta line when there is no prior data to compare against', () => {
    const body = composeWeeklyRecapBody(makeStats({ totalStd: 4, priorTotalStd: 0 }));
    expect(body).toMatch(/^Last week: 5 AF days, 2 logged drink days\.$/);
  });

  it('reads "No drinks this week" when current is zero but prior was non-zero', () => {
    const body = composeWeeklyRecapBody(
      makeStats({ totalStd: 0, priorTotalStd: 5, loggedDrinkDays: 0, afDays: 7 }),
    );
    expect(body).toMatch(/No drinks this week/);
  });

  it('honors includeDelta=false to skip the second line', () => {
    const body = composeWeeklyRecapBody(
      makeStats({ totalStd: 4, priorTotalStd: 5 }),
      { includeDelta: false },
    );
    expect(body).not.toMatch(/from prior week/);
  });

  it('contains no exclamation marks (calm voice)', () => {
    const body = composeWeeklyRecapBody(makeStats({ afDays: 7, loggedDrinkDays: 0 }));
    expect(body).not.toMatch(/!/);
  });
});

describe('[R13-2] buildWeeklyRecap convenience', () => {
  it('returns the canonical title + a body', () => {
    const r = buildWeeklyRecap([drink(1), drink(3)], 1.5, NOW);
    expect(r.title).toBe('Weekly recap');
    expect(r.body).toMatch(/^Last week:/);
  });
});
