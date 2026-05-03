import { describe, it, expect } from 'vitest';
import { computePeakHour, formatHour12 } from '../peakHour';
import type { Drink } from '../../../types/common';

function drinkAt(year: number, month: number, day: number, hour: number, std = 1): Drink {
  // month is 1-12 (human convention).
  const ts = new Date(year, month - 1, day, hour, 0, 0).getTime();
  return {
    ts,
    volumeMl: std === 0 ? 0 : 350,
    abvPct: std === 0 ? 0 : 5,
    intention: 'social',
    craving: 0,
    halt: [],
    alt: '',
  };
}

describe('[R14-5] computePeakHour', () => {
  it('returns null for empty drinks', () => {
    expect(computePeakHour([])).toBeNull();
  });

  it('returns null when total drinks below minDrinks threshold', () => {
    const drinks = [
      drinkAt(2026, 5, 1, 20),
      drinkAt(2026, 5, 2, 20),
      drinkAt(2026, 5, 3, 20),
    ];
    // Default minDrinks=7; only 3 drinks → null.
    expect(computePeakHour(drinks)).toBeNull();
  });

  it('returns null when peak hour has too few distinct days', () => {
    // 7 drinks at 8 PM but all on the same day → peakDays=1 < minDays=3.
    const drinks = Array.from({ length: 7 }, (_, i) => drinkAt(2026, 5, 1, 20));
    expect(computePeakHour(drinks)).toBeNull();
  });

  it('finds the peak hour when above thresholds', () => {
    const drinks: Drink[] = [];
    // 4 days × 2 drinks each at 8 PM = 8 drinks across 4 days at hour 20.
    for (let day = 1; day <= 4; day++) {
      drinks.push(drinkAt(2026, 5, day, 20));
      drinks.push(drinkAt(2026, 5, day, 20));
    }
    const r = computePeakHour(drinks);
    expect(r).not.toBeNull();
    expect(r?.peakHour).toBe(20);
    expect(r?.drinksInPeakHour).toBe(8);
    expect(r?.daysWithPeakHour).toBe(4);
    expect(r?.avgDrinksOnThoseDays).toBe(2);
  });

  it('counts only real drinks (skips std=0 AF markers)', () => {
    // Real drinks at hour 20 across 3 days; AF markers at noon would
    // otherwise be the peak by count if not filtered.
    const drinks: Drink[] = [];
    for (let day = 1; day <= 4; day++) {
      drinks.push(drinkAt(2026, 5, day, 20));
      drinks.push(drinkAt(2026, 5, day, 20));
      // 5 AF markers at noon — would dominate by count if std=0
      // wasn't filtered out.
      for (let i = 0; i < 5; i++) {
        drinks.push(drinkAt(2026, 5, day, 12, 0));
      }
    }
    const r = computePeakHour(drinks);
    expect(r?.peakHour).toBe(20);
  });

  it('avgDrinksOnThoseDays is the mean across all-hours on peak days', () => {
    // Days with peak (20) entries also have other entries earlier.
    const drinks: Drink[] = [];
    for (let day = 1; day <= 3; day++) {
      drinks.push(drinkAt(2026, 5, day, 18)); // earlier
      drinks.push(drinkAt(2026, 5, day, 20)); // peak
      drinks.push(drinkAt(2026, 5, day, 20)); // peak
    }
    // Plus 1 day with only an 18:00 drink (not a peak-hour day).
    drinks.push(drinkAt(2026, 5, 7, 18));
    const r = computePeakHour(drinks);
    expect(r?.peakHour).toBe(20);
    expect(r?.daysWithPeakHour).toBe(3);
    // Each peak day has 3 drinks total; avg = 3.
    expect(r?.avgDrinksOnThoseDays).toBe(3);
  });

  it('honors custom minDrinks/minDaysWithPeak', () => {
    const drinks: Drink[] = [];
    for (let day = 1; day <= 2; day++) {
      drinks.push(drinkAt(2026, 5, day, 20));
    }
    expect(computePeakHour(drinks)).toBeNull();
    expect(
      computePeakHour(drinks, { minDrinks: 2, minDaysWithPeak: 2 }),
    ).not.toBeNull();
  });

  it('breaks ties by lowest hour (deterministic)', () => {
    // 4 drinks at hour 18 over 4 days, 4 drinks at hour 20 over 4 days
    // — tie. Should return hour 18 (lower).
    const drinks: Drink[] = [];
    for (let day = 1; day <= 4; day++) {
      drinks.push(drinkAt(2026, 5, day, 18));
      drinks.push(drinkAt(2026, 5, day, 20));
    }
    const r = computePeakHour(drinks);
    expect(r?.peakHour).toBe(18);
  });
});

describe('[R14-5] formatHour12', () => {
  it('formats 0 as 12 AM', () => {
    expect(formatHour12(0)).toBe('12 AM');
  });
  it('formats 12 as 12 PM', () => {
    expect(formatHour12(12)).toBe('12 PM');
  });
  it('formats morning hours', () => {
    expect(formatHour12(3)).toBe('3 AM');
    expect(formatHour12(11)).toBe('11 AM');
  });
  it('formats afternoon hours', () => {
    expect(formatHour12(13)).toBe('1 PM');
    expect(formatHour12(20)).toBe('8 PM');
    expect(formatHour12(23)).toBe('11 PM');
  });
});
