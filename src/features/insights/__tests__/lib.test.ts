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
      expect(streak).toBe(4); // Should have 4 alcohol-free days
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
      expect(streak).toBe(5); // Should count back to start of tracking
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
      expect(streak).toBe(3); // Jan 3, 4, 5 should be alcohol-free
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
      expect(streak).toBe(2); // Jan 9, 10 should be alcohol-free after drinking on Jan 8
    });
  });
});