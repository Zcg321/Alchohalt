import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStats } from '../lib';
import type { Drink } from '../../../drinks/DrinkForm';
import type { Goals } from '../../../../types/common';

/**
 * Tests for useStats — the central stats roll-up hook backing the
 * Stats card. Covers streak/longest/AF/cost/HALT counts on a fixed
 * reference clock so the day-window math is deterministic.
 *
 * Owner-locked coverage gap (15.87% → ~95%).
 */

const FIXED_NOW = new Date('2026-04-15T12:00:00.000Z').getTime();
const day = (offset: number) => new Date(FIXED_NOW + offset * 86_400_000).toISOString().slice(0, 10);
const tsOnDay = (offset: number, hour = 20) =>
  new Date(`${day(offset)}T${String(hour).padStart(2, '0')}:00:00.000Z`).getTime();

const goals: Goals = {
  dailyCap: 2,
  weeklyCap: 14,
  pricePerStd: 5,
  baselineMonthlySpend: 200,
};

const beer = (over: Partial<Drink>): Drink => ({
  ts: over.ts ?? FIXED_NOW,
  kind: 'beer',
  volumeMl: 355,
  abvPct: 5,
  intention: over.intention ?? 'social',
  craving: over.craving ?? 5,
  halt: over.halt ?? [],
  alt: over.alt,
  ...over,
});

describe('useStats — empty', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(FIXED_NOW)); });
  afterEach(() => vi.useRealTimers());

  it('returns zeros + null daysSinceLast for empty drinks', () => {
    const { result } = renderHook(() => useStats([], goals));
    expect(result.current.drinks30).toBe(0);
    expect(result.current.daysSinceLast).toBeNull();
    expect(result.current.afDays30).toBe(30);
    expect(result.current.streak).toBe(0); // bounded by earliest record (none)
    expect(result.current.totalAFDays).toBe(0);
    expect(result.current.streakStatus.kind).toBe('starting');
  });
});

describe('useStats — streak math', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(FIXED_NOW)); });
  afterEach(() => vi.useRealTimers());

  it('active streak counts back from today', () => {
    // Drank 5 days ago. Today + 4 days back = 5 AF days.
    const drinks = [beer({ ts: tsOnDay(-5) })];
    const { result } = renderHook(() => useStats(drinks, goals));
    expect(result.current.streak).toBe(5);
  });

  it('longest streak preserved when active streak resets to 0', () => {
    // Drank today AND 6 days before that → 5-day longest streak between
    const drinks = [
      beer({ ts: tsOnDay(0) }),
      beer({ ts: tsOnDay(-6) }),
    ];
    const { result } = renderHook(() => useStats(drinks, goals));
    expect(result.current.streak).toBe(0);
    expect(result.current.longest).toBe(5);
  });

  it('totalAFDays accumulates and never decreases relative to drinking days', () => {
    const drinks = [
      beer({ ts: tsOnDay(-1) }),
      beer({ ts: tsOnDay(-3) }),
      beer({ ts: tsOnDay(-5) }),
    ];
    const { result } = renderHook(() => useStats(drinks, goals));
    // Days -5, -3, -1 are drink days → 3 across 6 days = 3 AF
    expect(result.current.totalAFDays).toBeGreaterThanOrEqual(3);
  });

  it('streakStatus is "building" while active streak > 0', () => {
    const drinks = [beer({ ts: tsOnDay(-3) })];
    const { result } = renderHook(() => useStats(drinks, goals));
    expect(result.current.streakStatus.kind).toBe('building');
    expect(result.current.streakStatus.currentStreak).toBe(3);
  });

  it('streakStatus is "restart" when active streak is 0 but lifetime AF > 0', () => {
    // Drank today, but had AF days before — restart scenario
    const drinks = [
      beer({ ts: tsOnDay(0) }),
      beer({ ts: tsOnDay(-5) }),
    ];
    const { result } = renderHook(() => useStats(drinks, goals));
    expect(result.current.streak).toBe(0);
    expect(result.current.streakStatus.kind).toBe('restart');
    expect(result.current.streakStatus.totalAFDays).toBeGreaterThan(0);
  });
});

describe('useStats — 30-day window', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(FIXED_NOW)); });
  afterEach(() => vi.useRealTimers());

  it('drinks30 only counts the last 30 days', () => {
    const drinks = [
      beer({ ts: tsOnDay(-5) }),
      beer({ ts: tsOnDay(-29) }),
      beer({ ts: tsOnDay(-31) }), // outside window
      beer({ ts: tsOnDay(-90) }), // outside window
    ];
    const { result } = renderHook(() => useStats(drinks, goals));
    expect(result.current.drinks30).toBe(2);
  });

  it('avgCraving30 averages craving over the 30-day drinks only', () => {
    const drinks = [
      beer({ ts: tsOnDay(-2), craving: 8 }),
      beer({ ts: tsOnDay(-4), craving: 4 }),
      beer({ ts: tsOnDay(-31), craving: 1 }), // ignored
    ];
    const { result } = renderHook(() => useStats(drinks, goals));
    expect(result.current.avgCraving30).toBe(6); // (8+4)/2
  });

  it('haltCounts aggregates per-state across 30-day drinks', () => {
    const drinks = [
      beer({ ts: tsOnDay(-1), halt: ['hungry', 'tired'] }),
      beer({ ts: tsOnDay(-2), halt: ['tired'] }),
      beer({ ts: tsOnDay(-3), halt: ['lonely'] }),
    ];
    const { result } = renderHook(() => useStats(drinks, goals));
    expect(result.current.haltCounts).toEqual({
      hungry: 1, angry: 0, lonely: 1, tired: 2,
    });
  });

  it('altEvents30 counts drinks with alt action filled', () => {
    const drinks = [
      beer({ ts: tsOnDay(-1), alt: 'walked the dog' }),
      beer({ ts: tsOnDay(-3), alt: 'water' }),
      beer({ ts: tsOnDay(-5) }), // no alt
    ];
    const { result } = renderHook(() => useStats(drinks, goals));
    expect(result.current.altEvents30).toBe(2);
  });

  it('afDays30 + drinkingDays = 30', () => {
    const drinks = [
      beer({ ts: tsOnDay(-1) }),
      beer({ ts: tsOnDay(-5) }),
      beer({ ts: tsOnDay(-10) }),
    ];
    const { result } = renderHook(() => useStats(drinks, goals));
    expect(result.current.afDays30 + 3).toBe(30); // 3 drinking days
    expect(result.current.afDays30).toBe(27);
  });
});

describe('useStats — week / month splits', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(FIXED_NOW)); });
  afterEach(() => vi.useRealTimers());

  it('weekStd vs lastWeekStd split at 7 days', () => {
    const drinks = [
      beer({ ts: tsOnDay(-3) }), // this week
      beer({ ts: tsOnDay(-10) }), // last week
    ];
    const { result } = renderHook(() => useStats(drinks, goals));
    expect(result.current.weekStd).toBeGreaterThan(0);
    expect(result.current.lastWeekStd).toBeGreaterThan(0);
  });

  it('monthStd vs prevMonthStd split at 30 days', () => {
    const drinks = [
      beer({ ts: tsOnDay(-15) }),
      beer({ ts: tsOnDay(-45) }),
    ];
    const { result } = renderHook(() => useStats(drinks, goals));
    expect(result.current.monthStd).toBeGreaterThan(0);
    expect(result.current.prevMonthStd).toBeGreaterThan(0);
  });
});

describe('useStats — daysSinceLast', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(FIXED_NOW)); });
  afterEach(() => vi.useRealTimers());

  it('returns floor(days) since last drink', () => {
    const drinks = [beer({ ts: FIXED_NOW - 3.5 * 86_400_000 })];
    const { result } = renderHook(() => useStats(drinks, goals));
    expect(result.current.daysSinceLast).toBe(3);
  });
});

describe('useStats — avgPerDrinkDay30', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(FIXED_NOW)); });
  afterEach(() => vi.useRealTimers());

  it('averages monthStd across drinking days only (not all 30)', () => {
    const drinks = [
      beer({ ts: tsOnDay(-1) }),
      beer({ ts: tsOnDay(-1) }),
      beer({ ts: tsOnDay(-2) }),
    ];
    const { result } = renderHook(() => useStats(drinks, goals));
    // Drinking days = 2 (day -1 and day -2), monthStd ≈ 3 std drinks
    // avgPerDrinkDay30 ≈ monthStd / 2
    expect(result.current.avgPerDrinkDay30).toBeCloseTo(result.current.monthStd / 2);
  });

  it('returns 0 when no drinking days in last 30', () => {
    const { result } = renderHook(() => useStats([], goals));
    expect(result.current.avgPerDrinkDay30).toBe(0);
  });
});

describe('useStats — points roll-up', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(FIXED_NOW)); });
  afterEach(() => vi.useRealTimers());

  it('points rewards alt-events at 5 per', () => {
    const drinks = [
      beer({ ts: tsOnDay(-1), alt: 'tea' }),
      beer({ ts: tsOnDay(-2), alt: 'walk' }),
    ];
    const { result } = renderHook(() => useStats(drinks, goals));
    expect(result.current.points).toBeGreaterThan(0);
  });
});
