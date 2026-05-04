import { describe, it, expect } from 'vitest';
import {
  estimateEthanolKcal,
  trailing7DayKcal,
  calorieEquivalence,
  KCAL_PER_GRAM_ETHANOL,
} from '../calorieEstimate';

describe('[R25-B] calorieEstimate', () => {
  describe('estimateEthanolKcal', () => {
    it('returns 0 for empty drinks', () => {
      expect(estimateEthanolKcal([])).toBe(0);
    });

    it('a US 12oz of 5% beer is ~98 ethanol kcal', () => {
      const beer = [{ ts: 1000, volumeMl: 355, abvPct: 5 }];
      expect(estimateEthanolKcal(beer)).toBe(98);
    });

    it('a 5oz wine at 12% is ~98 ethanol kcal', () => {
      const wine = [{ ts: 1000, volumeMl: 148, abvPct: 12 }];
      expect(estimateEthanolKcal(wine)).toBe(98);
    });

    it('a 1.5oz shot at 40% is ~98 ethanol kcal', () => {
      const shot = [{ ts: 1000, volumeMl: 44, abvPct: 40 }];
      expect(estimateEthanolKcal(shot)).toBe(97);
    });

    it('sums multiple drinks', () => {
      const drinks = [
        { ts: 1000, volumeMl: 355, abvPct: 5 },
        { ts: 2000, volumeMl: 355, abvPct: 5 },
        { ts: 3000, volumeMl: 148, abvPct: 12 },
      ];
      expect(estimateEthanolKcal(drinks)).toBe(294);
    });

    it('honors sinceTs cutoff', () => {
      const drinks = [
        { ts: 1000, volumeMl: 355, abvPct: 5 },
        { ts: 5000, volumeMl: 355, abvPct: 5 },
      ];
      expect(estimateEthanolKcal(drinks, 2000)).toBe(98);
    });

    it('filters NaN volumeMl/abvPct safely', () => {
      const drinks = [
        { ts: 1000, volumeMl: 355, abvPct: 5 },
        { ts: 2000, volumeMl: NaN, abvPct: 5 },
        { ts: 3000, volumeMl: 355, abvPct: NaN },
      ];
      expect(estimateEthanolKcal(drinks)).toBe(98);
    });

    it('uses 7 kcal/g constant (defensible floor)', () => {
      expect(KCAL_PER_GRAM_ETHANOL).toBe(7);
    });
  });

  describe('trailing7DayKcal', () => {
    it('only counts drinks within 7 days of nowTs', () => {
      const now = 30 * 24 * 60 * 60 * 1000;
      const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
      const drinks = [
        { ts: tenDaysAgo, volumeMl: 355, abvPct: 5 },
        { ts: threeDaysAgo, volumeMl: 355, abvPct: 5 },
      ];
      expect(trailing7DayKcal(drinks, now)).toBe(98);
    });
  });

  describe('calorieEquivalence', () => {
    it('returns 0 for both fields when kcal=0', () => {
      expect(calorieEquivalence(0)).toEqual({ walkingMinutes: 0, breadSlices: 0 });
    });

    it('a single beer (~98 kcal) ≈ 24 minutes walking, 1 slice bread', () => {
      const eq = calorieEquivalence(98);
      expect(eq.walkingMinutes).toBe(24);
      expect(eq.breadSlices).toBe(1);
    });

    it('a 7-drink week (~700 kcal) ≈ 175 minutes walking, 9 slices bread', () => {
      const eq = calorieEquivalence(700);
      expect(eq.walkingMinutes).toBe(175);
      expect(eq.breadSlices).toBe(9);
    });

    it('floors do not round up', () => {
      // 79 kcal = 19.75 min walking, 1.05 bread slices → floors to 19, 1
      const eq = calorieEquivalence(79);
      expect(eq.walkingMinutes).toBe(19);
      expect(eq.breadSlices).toBe(1);
    });
  });
});
