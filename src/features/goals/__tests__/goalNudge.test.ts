import { describe, it, expect } from 'vitest';
import { computeGoalNudge } from '../goalNudge';
import type { Entry } from '../../../store/db';

function entry(ts: number, stdDrinks = 1): Entry {
  return {
    id: `e-${ts}`,
    ts,
    kind: 'beer',
    stdDrinks,
    intention: 'social',
    craving: 0,
    halt: { H: false, A: false, L: false, T: false },
  };
}

const NOW = new Date('2026-05-03T12:00:00').getTime();
const DAY = 86400000;

describe('[R15-2] computeGoalNudge', () => {
  it('returns null when feature disabled', () => {
    const result = computeGoalNudge({
      entries: [entry(NOW - DAY, 5)],
      dailyCap: 1,
      enabled: false,
      dismissedAt: undefined,
      now: NOW,
    });
    expect(result).toBeNull();
  });

  it('returns null when dailyCap is zero or negative', () => {
    expect(
      computeGoalNudge({
        entries: [entry(NOW - DAY, 5)],
        dailyCap: 0,
        enabled: true,
        dismissedAt: undefined,
        now: NOW,
      })
    ).toBeNull();
    expect(
      computeGoalNudge({
        entries: [entry(NOW - DAY, 5)],
        dailyCap: -1,
        enabled: true,
        dismissedAt: undefined,
        now: NOW,
      })
    ).toBeNull();
  });

  it('returns null when dailyCap is NaN', () => {
    const result = computeGoalNudge({
      entries: [entry(NOW - DAY, 5)],
      dailyCap: NaN,
      enabled: true,
      dismissedAt: undefined,
      now: NOW,
    });
    expect(result).toBeNull();
  });

  it('returns null when no entries in last 7 days', () => {
    const result = computeGoalNudge({
      entries: [entry(NOW - 30 * DAY, 5)],
      dailyCap: 1,
      enabled: true,
      dismissedAt: undefined,
      now: NOW,
    });
    expect(result).toBeNull();
  });

  it('returns null when avg ≤ goal', () => {
    // 7 entries × 1 std → 7 std / 7 days = 1.0 avg, equal to goal → no nudge
    const entries: Entry[] = [];
    for (let i = 0; i < 7; i++) entries.push(entry(NOW - i * DAY, 1));
    const result = computeGoalNudge({
      entries,
      dailyCap: 1,
      enabled: true,
      dismissedAt: undefined,
      now: NOW,
    });
    expect(result).toBeNull();
  });

  it('fires when avg exceeds goal', () => {
    // 7 entries × 2 std → 14 std / 7 days = 2.0 avg > 1.5 goal
    const entries: Entry[] = [];
    for (let i = 0; i < 7; i++) entries.push(entry(NOW - i * DAY, 2));
    const result = computeGoalNudge({
      entries,
      dailyCap: 1.5,
      enabled: true,
      dismissedAt: undefined,
      now: NOW,
    });
    expect(result).not.toBeNull();
    expect(result?.goalPerDay).toBe(1.5);
    expect(result?.avgPerDay).toBe(2);
  });

  it('returns null when dismissed within last 7 days', () => {
    const entries: Entry[] = [];
    for (let i = 0; i < 7; i++) entries.push(entry(NOW - i * DAY, 2));
    const result = computeGoalNudge({
      entries,
      dailyCap: 1.5,
      enabled: true,
      dismissedAt: NOW - 3 * DAY,
      now: NOW,
    });
    expect(result).toBeNull();
  });

  it('fires again after dismissal expires (>7 days)', () => {
    const entries: Entry[] = [];
    for (let i = 0; i < 7; i++) entries.push(entry(NOW - i * DAY, 2));
    const result = computeGoalNudge({
      entries,
      dailyCap: 1.5,
      enabled: true,
      dismissedAt: NOW - 8 * DAY,
      now: NOW,
    });
    expect(result).not.toBeNull();
  });

  it('rounds avgPerDay to one decimal', () => {
    // 3 entries × 5 std + 2 entries × 2 std = 19 std / 7 days = 2.714...
    const entries: Entry[] = [
      entry(NOW - DAY, 5),
      entry(NOW - 2 * DAY, 5),
      entry(NOW - 3 * DAY, 5),
      entry(NOW - 4 * DAY, 2),
      entry(NOW - 5 * DAY, 2),
    ];
    const result = computeGoalNudge({
      entries,
      dailyCap: 1,
      enabled: true,
      dismissedAt: undefined,
      now: NOW,
    });
    expect(result?.avgPerDay).toBe(2.7);
  });

  it('ignores entries outside the trailing 7-day window', () => {
    const entries: Entry[] = [
      entry(NOW - 2 * DAY, 5),
      entry(NOW - 30 * DAY, 100), // outside, ignored
    ];
    const result = computeGoalNudge({
      entries,
      dailyCap: 1,
      enabled: true,
      dismissedAt: undefined,
      now: NOW,
    });
    // 5 std / 7 days = 0.71 → below cap of 1 → null
    expect(result).toBeNull();
  });
});
