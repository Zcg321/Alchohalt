import { describe, it, expect } from 'vitest';
import {
  computeRetrospective,
  pickRetrospectiveWindow,
  shouldShowRetrospectivePrompt,
  daysUntilFirstRetrospective,
  RETROSPECTIVE_WINDOWS,
  MIN_PRIOR_WINDOW_DAYS,
} from '../retrospective';
import type { Entry } from '../../../store/db';

const NOW = new Date('2026-05-15T12:00:00').getTime();
const DAY = 86400000;

function entry(daysAgo: number, stdDrinks = 1, craving = 0): Entry {
  return {
    id: `e-${daysAgo}`,
    ts: NOW - daysAgo * DAY,
    kind: 'beer',
    stdDrinks,
    intention: 'social',
    craving,
    halt: { H: false, A: false, L: false, T: false },
  };
}

/** Build N entries on N distinct days starting at the given offset. */
function dailyEntries(startDaysAgo: number, count: number): Entry[] {
  return Array.from({ length: count }, (_, i) => entry(startDaysAgo - i));
}

describe('pickRetrospectiveWindow', () => {
  it('returns null when no prior-window data', () => {
    expect(pickRetrospectiveWindow([entry(10)], NOW)).toBeNull();
  });

  it('returns null when entries array is empty', () => {
    expect(pickRetrospectiveWindow([], NOW)).toBeNull();
  });

  it('[R11-D] returns null when 45-day-old user has thin prior data — Copilot regression', () => {
    // Original bug: a user with one entry at day -45 would get a 30-day
    // retro whose prior window (days 30-60) extended past their earliest
    // entry. Comparison was statistical noise.
    expect(pickRetrospectiveWindow([entry(45)], NOW)).toBeNull();
  });

  it('[R11-D] returns null when prior window has < 7 distinct days of data', () => {
    // 90-day-old user, but only 3 entries in the prior window of any size.
    const entries = [entry(90), entry(45), entry(50)];
    expect(pickRetrospectiveWindow(entries, NOW)).toBeNull();
  });

  it('[R11-D] picks 30-day when prior window has >= 7 distinct days AND priorStart >= earliest', () => {
    // earliest is day -65, prior window for 30-day is days -60 to -30.
    // Place 7 entries on distinct days in the prior window.
    const entries = [entry(65), ...dailyEntries(50, MIN_PRIOR_WINDOW_DAYS)];
    expect(pickRetrospectiveWindow(entries, NOW)?.days).toBe(30);
  });

  it('[R11-D] picks 90-day when 180+ days of history with dense prior', () => {
    // earliest day -200, prior window for 90-day is -180 to -90.
    const entries = [entry(200), ...dailyEntries(170, MIN_PRIOR_WINDOW_DAYS)];
    expect(pickRetrospectiveWindow(entries, NOW)?.days).toBe(90);
  });

  it('[R11-D] picks 365-day when 730+ days with dense prior', () => {
    const entries = [entry(750), ...dailyEntries(700, MIN_PRIOR_WINDOW_DAYS)];
    expect(pickRetrospectiveWindow(entries, NOW)?.days).toBe(365);
  });
});

describe('daysUntilFirstRetrospective', () => {
  it('returns null when there are no entries', () => {
    expect(daysUntilFirstRetrospective([], NOW)).toBeNull();
  });

  it('returns null when a retrospective is already available', () => {
    const entries = [entry(65), ...dailyEntries(50, MIN_PRIOR_WINDOW_DAYS)];
    expect(daysUntilFirstRetrospective(entries, NOW)).toBeNull();
  });

  it('returns positive day count for a thin-history user (counts up to first 30-day retro)', () => {
    // earliest = day -10 → need to wait until day 60 elapses → ~50 more days
    const remaining = daysUntilFirstRetrospective([entry(10)], NOW);
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(60);
  });

  it('returns 0 when threshold has just been crossed but density is missing', () => {
    // User signed up 60+ days ago but has only 1 entry — no density,
    // but the time gate is met. So days-until is 0 (unlocks as soon
    // as they log a few more days) — UI handles the messaging.
    const remaining = daysUntilFirstRetrospective([entry(70)], NOW);
    expect(remaining).toBe(0);
  });
});

describe('shouldShowRetrospectivePrompt', () => {
  it('shows when never shown before', () => {
    expect(shouldShowRetrospectivePrompt(undefined, NOW)).toBe(true);
  });

  it('hides within 30 days', () => {
    expect(shouldShowRetrospectivePrompt(NOW - 10 * DAY, NOW)).toBe(false);
  });

  it('shows after 30 days', () => {
    expect(shouldShowRetrospectivePrompt(NOW - 31 * DAY, NOW)).toBe(true);
  });
});

describe('computeRetrospective', () => {
  const window = RETROSPECTIVE_WINDOWS[0]!; // 30-day

  it('returns prior=null when no prior-window data', () => {
    const r = computeRetrospective([entry(5)], window, NOW);
    expect(r.prior).toBeNull();
    expect(r.totalDelta.pct).toBeNull();
  });

  it('computes deltas across two adjacent windows', () => {
    const entries = [
      entry(5, 2),  // recent
      entry(10, 2), // recent
      entry(40, 1), // prior
      entry(50, 1), // prior
    ];
    const r = computeRetrospective(entries, window, NOW);
    expect(r.recent.totalStdDrinks).toBe(4);
    expect(r.prior?.totalStdDrinks).toBe(2);
    expect(r.totalDelta.pct).toBe(100);
  });

  it('counts AF days correctly', () => {
    const entries = [entry(5, 2), entry(40, 2)];
    const r = computeRetrospective(entries, window, NOW);
    // 30 days, 1 drinking day → 29 AF
    expect(r.recent.afDays).toBe(29);
    expect(r.prior?.afDays).toBe(29);
  });

  it('computes avg craving', () => {
    const entries = [entry(5, 1, 4), entry(10, 1, 6)];
    const r = computeRetrospective(entries, window, NOW);
    expect(r.recent.avgCraving).toBe(5);
  });
});
