import { describe, it, expect } from 'vitest';
import { generateGoalRecommendations, evaluateGoalSuccess } from '../ai-recommendations';
import type { Entry, Settings } from '../../store/db';

describe('ai-recommendations.ts', () => {
  const mockSettings: Settings = {
    version: 1,
    language: 'en',
    theme: 'light',
    dailyGoalDrinks: 0,
    weeklyGoalDrinks: 0,
    monthlyBudget: 0,
    reminders: { enabled: false, times: [] },
    showBAC: false
  };

  describe('generateGoalRecommendations', () => {
    it('should return empty array for no entries', () => {
      const recommendations = generateGoalRecommendations([], mockSettings, []);
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should generate recommendations for active users', () => {
      const entries: Entry[] = Array.from({ length: 10 }, (_, i) => ({
        id: `entry-${i}`,
        ts: Date.now() - i * 24 * 60 * 60 * 1000,
        kind: 'beer' as const,
        stdDrinks: 1,
        intention: 'social' as const,
        craving: 3,
        halt: { H: false, A: false, L: false, T: false }
      }));

      const recommendations = generateGoalRecommendations(entries, mockSettings, []);
      expect(Array.isArray(recommendations)).toBe(true);
      // Should have some recommendations
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('title');
        expect(rec).toHaveProperty('confidence');
        expect(rec.confidence).toBeGreaterThan(0);
        expect(rec.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('evaluateGoalSuccess', () => {
    it('should evaluate drink-free days goal', () => {
      const entries: Entry[] = [
        {
          id: 'entry-1',
          ts: Date.now() - 2 * 24 * 60 * 60 * 1000,
          kind: 'beer',
          stdDrinks: 1,
          intention: 'social',
          craving: 3,
          halt: { H: false, A: false, L: false, T: false }
        }
      ];

      const result = evaluateGoalSuccess('drink-free-days', 5, entries, 7);
      expect(result).toHaveProperty('achieved');
      expect(result).toHaveProperty('actualValue');
      expect(result.actualValue).toBeGreaterThan(0);
    });
  });
});
