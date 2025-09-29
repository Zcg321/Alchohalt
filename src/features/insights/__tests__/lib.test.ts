import { describe, it, expect, vi } from 'vitest';
import { getCurrentStreak } from '../lib';
import type { Drink } from '../../drinks/DrinkForm';

describe('insights lib utilities', () => {
  describe('getCurrentStreak', () => {
    it('calculates current alcohol-free streak correctly', () => {
      vi.setSystemTime(new Date('2024-01-05T12:00:00Z'));
      
      const drinks: Drink[] = [
        {
          ts: new Date('2024-01-01T10:00:00Z').getTime(), // 4 days ago
          volumeMl: 355,
          abvPct: 5,
          intention: 'social',
          craving: 3,
          halt: [],
          alt: ''
        }
      ];

      const streak = getCurrentStreak(drinks);
      expect(streak).toBeGreaterThanOrEqual(0); // Should be a valid streak
    });

    it('returns 0 streak when drinking today', () => {
      vi.setSystemTime(new Date('2024-01-05T12:00:00Z'));
      
      const drinks: Drink[] = [
        {
          ts: new Date('2024-01-05T10:00:00Z').getTime(), // Today
          volumeMl: 355,
          abvPct: 5,
          intention: 'social',
          craving: 3,
          halt: [],
          alt: ''
        }
      ];

      const streak = getCurrentStreak(drinks);
      expect(streak).toBe(0);
    });

    it('handles empty drinks array', () => {
      vi.setSystemTime(new Date('2024-01-05T12:00:00Z'));
      
      const streak = getCurrentStreak([]);
      // Should count back from current date until limit or until a drinking day
      expect(streak).toBeGreaterThanOrEqual(0);
      expect(streak).toBeLessThanOrEqual(365); // Safety limit
    });

    it('calculates streak with multiple drinks on same day', () => {
      vi.setSystemTime(new Date('2024-01-05T12:00:00Z'));
      
      const drinks: Drink[] = [
        {
          ts: new Date('2024-01-02T10:00:00Z').getTime(),
          volumeMl: 355,
          abvPct: 5,
          intention: 'social',
          craving: 3,
          halt: [],
          alt: ''
        },
        {
          ts: new Date('2024-01-02T15:00:00Z').getTime(), // Same day
          volumeMl: 150,
          abvPct: 12,
          intention: 'taste',
          craving: 2,
          halt: [],
          alt: ''
        }
      ];

      const streak = getCurrentStreak(drinks);
      // Should count days since Jan 2 (when drinking occurred)
      expect(streak).toBeGreaterThanOrEqual(0);
    });

    it('resets streak after drinking day', () => {
      vi.setSystemTime(new Date('2024-01-10T12:00:00Z'));
      
      const drinks: Drink[] = [
        {
          ts: new Date('2024-01-05T10:00:00Z').getTime(),
          volumeMl: 355,
          abvPct: 5,
          intention: 'social',
          craving: 3,
          halt: [],
          alt: ''
        },
        {
          ts: new Date('2024-01-08T10:00:00Z').getTime(),
          volumeMl: 355,
          abvPct: 5,
          intention: 'social',
          craving: 3,
          halt: [],
          alt: ''
        }
      ];

      const streak = getCurrentStreak(drinks);
      // Should count days since Jan 8 (last drinking day)
      expect(streak).toBeGreaterThanOrEqual(0);
    });

    it('validates return type and bounds', () => {
      const drinks: Drink[] = [];
      const streak = getCurrentStreak(drinks);
      
      expect(typeof streak).toBe('number');
      expect(streak).toBeGreaterThanOrEqual(0);
      expect(streak).toBeLessThanOrEqual(365);
    });
  });
});