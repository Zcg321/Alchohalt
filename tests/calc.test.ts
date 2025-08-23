import { describe, it, expect, vi } from 'vitest';
import {
  gramsAlcohol,
  stdDrinks,
  widmarkBAC,
  computeStreak,
  computePoints,
  computeLongestStreak
} from '../src/lib/calc';

describe('calc library', () => {
  it('calculates grams of alcohol', () => {
    expect(gramsAlcohol(500, 5)).toBeCloseTo(19.725, 3);
  });

  it('calculates standard drinks', () => {
    expect(stdDrinks(350, 5)).toBeCloseTo(0.986, 3);
  });

  it('estimates BAC and metabolism', () => {
    const now = Date.now();
    const drinks = [
      { ts: now - 2 * 3600000, volumeMl: 355, abvPct: 5 },
      { ts: now - 1 * 3600000, volumeMl: 150, abvPct: 12 }
    ];
    const bac = widmarkBAC(drinks, 80, 'male', now);
    expect(bac).toBeGreaterThan(0);
    const later = now + 10 * 3600000;
    const bacLater = widmarkBAC(drinks, 80, 'male', later);
    expect(bacLater).toBeLessThan(bac);
    expect(bacLater).toBe(0);
  });

  it('computes alcohol-free streak', () => {
    vi.setSystemTime(new Date('2024-01-03'));
    const data: Record<string, number> = {
      '2024-01-03': 0,
      '2024-01-02': 0,
      '2024-01-01': 1
    };
    expect(computeStreak(data)).toBe(2);
  });

  it('finds longest AF streak', () => {
    vi.setSystemTime(new Date('2024-01-10'));
    const data: Record<string, number> = {
      '2024-01-10': 0,
      '2024-01-09': 0,
      '2024-01-08': 1,
      '2024-01-07': 0,
      '2024-01-06': 0,
      '2024-01-05': 0
    };
    expect(computeLongestStreak(data)).toBe(3);
  });

  it('computes points', () => {
    const data = {
      '2024-01-03': { std: 0, coping: 0 },
      '2024-01-02': { std: 2, coping: 1 }
    };
    const points = computePoints(data, 3, 1);
    expect(points).toBe(16);
  });
});
