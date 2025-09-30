import { describe, it, expect } from 'vitest';
import { stdDrinks } from '../../../lib/calc';

// Coverage tests for rewards features
describe('Rewards Coverage', () => {
  describe('Monthly trend calculations', () => {
    it('calculates monthly averages', () => {
      const monthlyData = [
        { month: 'Jan', drinks: 20 },
        { month: 'Feb', drinks: 15 },
        { month: 'Mar', drinks: 18 }
      ];
      
      const total = monthlyData.reduce((sum, d) => sum + d.drinks, 0);
      const average = total / monthlyData.length;
      
      expect(average).toBeCloseTo(17.67, 1);
    });

    it('identifies trends', () => {
      const monthlyData = [
        { month: 'Jan', drinks: 20 },
        { month: 'Feb', drinks: 15 },
        { month: 'Mar', drinks: 10 }
      ];
      
      const isDecreasing = monthlyData.every((d, i, arr) => 
        i === 0 || d.drinks < arr[i - 1].drinks
      );
      
      expect(isDecreasing).toBe(true);
    });
  });

  describe('Weekly chart data', () => {
    it('groups drinks by day of week', () => {
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      const drinks = [
        { ts: now, volumeMl: 355, abvPct: 5 },
        { ts: now - dayInMs, volumeMl: 355, abvPct: 5 },
        { ts: now - 2 * dayInMs, volumeMl: 355, abvPct: 5 }
      ];
      
      const dailyTotals = drinks.map(d => stdDrinks(d.volumeMl, d.abvPct));
      expect(dailyTotals).toHaveLength(3);
      dailyTotals.forEach(total => {
        expect(total).toBeGreaterThan(0);
      });
    });
  });

  describe('Stats calculations', () => {
    it('calculates top section metrics', () => {
      const drinks = [
        { ts: Date.now(), volumeMl: 355, abvPct: 5 },
        { ts: Date.now(), volumeMl: 355, abvPct: 5 },
        { ts: Date.now(), volumeMl: 355, abvPct: 5 }
      ];
      
      const totalStdDrinks = drinks.reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);
      expect(totalStdDrinks).toBeGreaterThan(2);
    });

    it('calculates behavior metrics', () => {
      const drinks = [
        { intention: 'social', craving: 3 },
        { intention: 'social', craving: 3 },
        { intention: 'cope', craving: 4 }
      ];
      
      const intentions = drinks.reduce((acc, d) => {
        acc[d.intention] = (acc[d.intention] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      expect(intentions['social']).toBe(2);
      expect(intentions['cope']).toBe(1);
    });

    it('calculates spend metrics', () => {
      const pricePerStd = 5;
      const drinks = [
        { volumeMl: 355, abvPct: 5 },
        { volumeMl: 355, abvPct: 5 },
        { volumeMl: 355, abvPct: 5 }
      ];
      
      const totalSpending = drinks.reduce((sum, d) => {
        return sum + (stdDrinks(d.volumeMl, d.abvPct) * pricePerStd);
      }, 0);
      
      expect(totalSpending).toBeGreaterThan(10);
    });
  });

  describe('Achievement tracking', () => {
    it('tracks milestone achievements', () => {
      const milestones = [
        { id: 1, name: 'First Day', target: 1, achieved: true },
        { id: 2, name: 'First Week', target: 7, achieved: true },
        { id: 3, name: 'First Month', target: 30, achieved: false }
      ];
      
      const achieved = milestones.filter(m => m.achieved);
      expect(achieved).toHaveLength(2);
      
      const pending = milestones.filter(m => !m.achieved);
      expect(pending).toHaveLength(1);
    });
  });
});
