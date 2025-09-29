import { describe, it, expect, vi } from 'vitest';
import { startOfDay, isSameDay, computeStats } from '../stats';
import type { Entry, Settings } from '../../store/db';

describe('stats utilities', () => {
  describe('startOfDay', () => {
    it('returns timestamp for start of day', () => {
      const ts = new Date('2024-01-15T14:30:45.123Z').getTime();
      const start = startOfDay(ts);
      const startDate = new Date(start);
      
      expect(startDate.getHours()).toBe(0);
      expect(startDate.getMinutes()).toBe(0);
      expect(startDate.getSeconds()).toBe(0);
      expect(startDate.getMilliseconds()).toBe(0);
      expect(startDate.getDate()).toBe(15);
      expect(startDate.getMonth()).toBe(0); // January
    });
  });

  describe('isSameDay', () => {
    it('returns true for timestamps on same day', () => {
      const morning = new Date('2024-01-15T08:00:00Z').getTime();
      const evening = new Date('2024-01-15T20:30:00Z').getTime();
      
      expect(isSameDay(morning, evening)).toBe(true);
    });

    it('returns false for timestamps on different days', () => {
      const today = new Date('2024-01-15T23:59:59Z').getTime();
      const tomorrow = new Date('2024-01-16T00:00:01Z').getTime();
      
      expect(isSameDay(today, tomorrow)).toBe(false);
    });
  });

  describe('computeStats', () => {
    it('computes weekly buckets correctly', () => {
      const entries: Entry[] = [
        {
          id: '1',
          ts: new Date('2024-01-15T10:00:00Z').getTime(), // Monday
          stdDrinks: 2,
          cost: 10,
          volumeMl: 500,
          abvPct: 5,
          intention: 'social',
          craving: 3,
          halt: [],
          alt: ''
        },
        {
          id: '2', 
          ts: new Date('2024-01-17T15:00:00Z').getTime(), // Wednesday
          stdDrinks: 1.5,
          cost: 8,
          volumeMl: 355,
          abvPct: 5,
          intention: 'taste',
          craving: 2,
          halt: [],
          alt: ''
        }
      ];

      const settings: Settings = {
        dailyCap: 2,
        weeklyGoal: 10,
        pricePerStd: 5,
        baselineMonthlySpend: 150,
        profileEnabled: false,
        weightKg: 70,
        sex: 'male'
      };

      const stats = computeStats(entries, settings);
      
      expect(stats.weeks).toHaveLength(1);
      expect(stats.weeks[0].stdDrinks).toBe(3.5); // 2 + 1.5
      expect(stats.weeks[0].cost).toBe(18); // 10 + 8
    });

    it('handles empty entries array', () => {
      const settings: Settings = {
        dailyCap: 2,
        weeklyGoal: 10,
        pricePerStd: 5,
        baselineMonthlySpend: 150,
        profileEnabled: false,
        weightKg: 70,
        sex: 'male'
      };

      const stats = computeStats([], settings);
      
      expect(stats.weeks).toHaveLength(0);
      expect(stats.line).toHaveLength(30); // Should still have 30 days of zero data
    });

    it('computes 30-day line data', () => {
      vi.setSystemTime(new Date('2024-01-30T12:00:00Z'));
      
      const entries: Entry[] = [
        {
          id: '1',
          ts: new Date('2024-01-29T10:00:00Z').getTime(),
          stdDrinks: 2,
          cost: 10,
          volumeMl: 500,
          abvPct: 5,
          intention: 'social',
          craving: 3,
          halt: [],
          alt: ''
        }
      ];

      const settings: Settings = {
        dailyCap: 2,
        weeklyGoal: 10,
        pricePerStd: 5,
        baselineMonthlySpend: 150,
        profileEnabled: false,
        weightKg: 70,
        sex: 'male'
      };

      const stats = computeStats(entries, settings);
      
      expect(stats.line).toHaveLength(30);
      // Most days should have 0, but one day should have 2
      const totalStd = stats.line.reduce((sum, day) => sum + day.stdDrinks, 0);
      expect(totalStd).toBe(2);
    });
  });
});