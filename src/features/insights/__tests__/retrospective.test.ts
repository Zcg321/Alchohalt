import { describe, it, expect } from 'vitest';
import {
  computeRetrospective,
  pickRetrospectiveWindow,
  shouldShowRetrospectivePrompt,
  RETROSPECTIVE_WINDOWS,
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

describe('pickRetrospectiveWindow', () => {
  it('returns null when no prior-window data', () => {
    expect(pickRetrospectiveWindow([entry(10)], NOW)).toBeNull();
  });

  it('picks 30-day when 60+ days of history', () => {
    expect(pickRetrospectiveWindow([entry(45)], NOW)?.days).toBe(30);
  });

  it('picks 90-day when 180+ days', () => {
    expect(pickRetrospectiveWindow([entry(150)], NOW)?.days).toBe(90);
  });

  it('picks 365-day when 700+ days', () => {
    expect(pickRetrospectiveWindow([entry(700)], NOW)?.days).toBe(365);
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
