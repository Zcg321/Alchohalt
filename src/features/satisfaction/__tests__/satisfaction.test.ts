/**
 * [R26-1] satisfaction module — pure logic tests.
 */
import { describe, it, expect } from 'vitest';
import {
  shouldShowSatisfactionChip,
  summarizeSatisfaction,
  totalSatisfactionCount,
  SATISFACTION_SUPPRESS_MS,
  SATISFACTION_SURFACES,
  type SatisfactionSignal,
} from '../satisfaction';

describe('[R26-1] shouldShowSatisfactionChip', () => {
  const NOW = 1_700_000_000_000;

  it('returns false when surface has not been used yet', () => {
    expect(
      shouldShowSatisfactionChip({
        surface: 'insights-tab',
        signals: undefined,
        surfaceUsedTs: undefined,
        now: NOW,
      }),
    ).toBe(false);
  });

  it('returns true on first use with no prior signals', () => {
    expect(
      shouldShowSatisfactionChip({
        surface: 'insights-tab',
        signals: [],
        surfaceUsedTs: NOW - 60_000,
        now: NOW,
      }),
    ).toBe(true);
  });

  it('returns false when a recent same-surface signal exists', () => {
    const recent: SatisfactionSignal = {
      surface: 'insights-tab',
      response: 'up',
      ts: NOW - 24 * 60 * 60 * 1000,
    };
    expect(
      shouldShowSatisfactionChip({
        surface: 'insights-tab',
        signals: [recent],
        surfaceUsedTs: NOW - 60_000,
        now: NOW,
      }),
    ).toBe(false);
  });

  it('returns true once 14 days have passed since the last signal', () => {
    const old: SatisfactionSignal = {
      surface: 'insights-tab',
      response: 'up',
      ts: NOW - SATISFACTION_SUPPRESS_MS,
    };
    expect(
      shouldShowSatisfactionChip({
        surface: 'insights-tab',
        signals: [old],
        surfaceUsedTs: NOW - 60_000,
        now: NOW,
      }),
    ).toBe(true);
  });

  it('signals on a different surface do not block this surface', () => {
    const otherSurface: SatisfactionSignal = {
      surface: 'drink-form',
      response: 'down',
      ts: NOW - 60_000,
    };
    expect(
      shouldShowSatisfactionChip({
        surface: 'insights-tab',
        signals: [otherSurface],
        surfaceUsedTs: NOW - 60_000,
        now: NOW,
      }),
    ).toBe(true);
  });
});

describe('[R26-1] summarizeSatisfaction', () => {
  it('returns one entry per known surface, all zero by default', () => {
    const tallies = summarizeSatisfaction(undefined);
    expect(tallies.length).toBe(SATISFACTION_SURFACES.length);
    for (const t of tallies) {
      expect(t.up).toBe(0);
      expect(t.down).toBe(0);
    }
  });

  it('counts up + down separately per surface', () => {
    const signals: SatisfactionSignal[] = [
      { surface: 'insights-tab', response: 'up', ts: 1 },
      { surface: 'insights-tab', response: 'up', ts: 2 },
      { surface: 'insights-tab', response: 'down', ts: 3 },
      { surface: 'drink-form', response: 'down', ts: 4 },
    ];
    const tallies = summarizeSatisfaction(signals);
    const insights = tallies.find((t) => t.surface === 'insights-tab')!;
    expect(insights.up).toBe(2);
    expect(insights.down).toBe(1);
    const form = tallies.find((t) => t.surface === 'drink-form')!;
    expect(form.up).toBe(0);
    expect(form.down).toBe(1);
  });
});

describe('[R26-1] totalSatisfactionCount', () => {
  it('returns 0 for empty/undefined input', () => {
    expect(totalSatisfactionCount(undefined)).toBe(0);
    expect(totalSatisfactionCount([])).toBe(0);
  });

  it('counts all signals regardless of surface', () => {
    const signals: SatisfactionSignal[] = [
      { surface: 'insights-tab', response: 'up', ts: 1 },
      { surface: 'drink-form', response: 'down', ts: 2 },
      { surface: 'today-panel', response: 'up', ts: 3 },
    ];
    expect(totalSatisfactionCount(signals)).toBe(3);
  });
});
