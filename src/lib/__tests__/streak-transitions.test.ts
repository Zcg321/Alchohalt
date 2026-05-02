import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  computeStreak,
  computeLongestStreak,
  computeTotalAFDays,
  getStreakStatus,
} from '../calc';

// Fixed reference: 2026-04-15 (Wednesday). Avoids real-clock flake.
const FIXED_NOW = new Date('2026-04-15T12:00:00.000Z').getTime();

const day = (offsetDaysFromNow: number) =>
  new Date(FIXED_NOW + offsetDaysFromNow * 86_400_000).toISOString().slice(0, 10);

describe('streak transitions — 6 cases × 3 metrics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FIXED_NOW));
  });
  afterEach(() => vi.useRealTimers());

  // CASE 1: AF → AF (yesterday and today both alcohol-free)
  it('AF→AF: active streak grows, longest >= active, total counts both', () => {
    const drinks = { [day(-1)]: 0, [day(0)]: 0 };
    expect(computeStreak(drinks)).toBe(2);
    expect(computeLongestStreak(drinks)).toBeGreaterThanOrEqual(2);
    expect(computeTotalAFDays(drinks)).toBe(2);
  });

  // CASE 2: AF → BREAK (yesterday AF, today drink-day)
  it('AF→BREAK: active streak resets to 0, longest preserves yesterday=1, total=1', () => {
    const drinks = { [day(-1)]: 0, [day(0)]: 2 };
    expect(computeStreak(drinks)).toBe(0);
    // longest streak ever observed in this window is 1 (yesterday)
    expect(computeLongestStreak(drinks)).toBe(1);
    expect(computeTotalAFDays(drinks)).toBe(1);
  });

  // CASE 3: BREAK → AF (yesterday drink, today AF — soft-restart)
  it('BREAK→AF: active streak = 1, total = 1, status=building', () => {
    const drinks = { [day(-1)]: 3, [day(0)]: 0 };
    expect(computeStreak(drinks)).toBe(1);
    expect(computeLongestStreak(drinks)).toBe(1);
    expect(computeTotalAFDays(drinks)).toBe(1);
    expect(getStreakStatus(1, 1).kind).toBe('building');
  });

  // CASE 4: BREAK → BREAK (yesterday and today both drink-days)
  it('BREAK→BREAK: active streak=0, longest=0, total=0', () => {
    const drinks = { [day(-1)]: 1, [day(0)]: 2 };
    expect(computeStreak(drinks)).toBe(0);
    expect(computeLongestStreak(drinks)).toBe(0);
    expect(computeTotalAFDays(drinks)).toBe(0);
  });

  // CASE 5: gap → AF (no entry yesterday, today AF)
  it('gap→AF (only today logged AF): active=1, longest=1, total=1', () => {
    const drinks = { [day(0)]: 0 };
    expect(computeStreak(drinks)).toBe(1);
    expect(computeLongestStreak(drinks)).toBe(1);
    expect(computeTotalAFDays(drinks)).toBe(1);
  });

  // CASE 6: gap → BREAK (no entry yesterday, today drink)
  it('gap→BREAK (only today logged with drinks): active=0, longest=0, total=0', () => {
    const drinks = { [day(0)]: 2 };
    expect(computeStreak(drinks)).toBe(0);
    expect(computeLongestStreak(drinks)).toBe(0);
    expect(computeTotalAFDays(drinks)).toBe(0);
  });

  // INVARIANT: longest never shrinks when a NEW drink-day appears AFTER
  // a completed streak. Owner-locked: prior wins survive a relapse.
  it('30-day AF streak followed by relapse → longest still 30', () => {
    const drinks: Record<string, number> = {};
    for (let i = -30; i <= -1; i++) drinks[day(i)] = 0;
    drinks[day(0)] = 2; // relapse today
    expect(computeStreak(drinks)).toBe(0);
    expect(computeLongestStreak(drinks)).toBe(30);
    expect(computeTotalAFDays(drinks)).toBe(30);
    expect(getStreakStatus(0, 30).kind).toBe('restart');
  });

  // INVARIANT: longest preserved across multiple completed streaks.
  it('two completed streaks (5 then 3) → longest = 5', () => {
    const drinks: Record<string, number> = {};
    // streak A: days -10..-6 (5 AF days)
    for (let i = -10; i <= -6; i++) drinks[day(i)] = 0;
    drinks[day(-5)] = 1; // break
    // streak B: days -4..-2 (3 AF days)
    for (let i = -4; i <= -2; i++) drinks[day(i)] = 0;
    drinks[day(-1)] = 2; // break
    drinks[day(0)] = 1; // drink today
    expect(computeStreak(drinks)).toBe(0);
    expect(computeLongestStreak(drinks)).toBe(5);
    expect(computeTotalAFDays(drinks)).toBe(8);
  });
});
