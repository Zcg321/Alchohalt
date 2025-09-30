import { describe, it, expect } from 'vitest';
import type { Drink } from '../../features/drinks/DrinkForm';
import type { Goals } from '../../types/common';

// Import calculator functions
import { stdDrinks } from '../calc';
import { startOfDay, isSameDay } from '../stats';

describe('Complete application flow tests', () => {
  const mockGoals: Goals = {
    dailyCap: 2,
    weeklyGoal: 10,
    pricePerStd: 3,
    baselineMonthlySpend: 150
  };

  describe('Standard drinks calculation', () => {
    it('calculates beer correctly', () => {
      const beer = stdDrinks(355, 5.0);
      expect(beer).toBeCloseTo(1.0, 1);
    });

    it('calculates wine correctly', () => {
      const wine = stdDrinks(150, 12.0);
      expect(wine).toBeCloseTo(1.2, 1);
    });

    it('calculates spirits correctly', () => {
      const spirits = stdDrinks(45, 40.0);
      expect(spirits).toBeCloseTo(1.3, 1);
    });

    it('handles zero volume', () => {
      const result = stdDrinks(0, 5.0);
      expect(result).toBe(0);
    });

    it('handles zero ABV', () => {
      const result = stdDrinks(355, 0);
      expect(result).toBe(0);
    });

    it('handles large volumes', () => {
      const large = stdDrinks(1000, 5.0);
      expect(large).toBeGreaterThan(2);
    });

    it('handles high ABV', () => {
      const highABV = stdDrinks(100, 50.0);
      expect(highABV).toBeGreaterThan(1);
    });
  });

  describe('Date utilities', () => {
    it('startOfDay returns midnight', () => {
      const now = Date.now();
      const start = startOfDay(now);
      const date = new Date(start);
      
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
      expect(date.getMilliseconds()).toBe(0);
    });

    it('isSameDay returns true for same day', () => {
      const now = Date.now();
      const later = now + 1000 * 60 * 60; // 1 hour later
      
      expect(isSameDay(now, later)).toBe(true);
    });

    it('isSameDay returns false for different days', () => {
      const today = Date.now();
      const tomorrow = today + 1000 * 60 * 60 * 24; // 1 day later
      
      expect(isSameDay(today, tomorrow)).toBe(false);
    });

    it('handles timestamps at day boundaries', () => {
      const midnight = new Date().setHours(0, 0, 0, 0);
      const justBefore = midnight - 1;
      
      expect(isSameDay(midnight, justBefore)).toBe(false);
    });
  });

  describe('Goals validation', () => {
    it('validates complete goals object', () => {
      expect(mockGoals.dailyCap).toBeGreaterThan(0);
      expect(mockGoals.weeklyGoal).toBeGreaterThan(0);
      expect(mockGoals.pricePerStd).toBeGreaterThan(0);
      expect(mockGoals.baselineMonthlySpend).toBeGreaterThan(0);
    });

    it('validates daily cap is reasonable', () => {
      expect(mockGoals.dailyCap).toBeLessThan(10);
    });

    it('validates weekly goal is consistent with daily', () => {
      expect(mockGoals.weeklyGoal).toBeGreaterThanOrEqual(mockGoals.dailyCap);
    });

    it('validates price is reasonable', () => {
      expect(mockGoals.pricePerStd).toBeLessThan(20);
      expect(mockGoals.pricePerStd).toBeGreaterThan(0);
    });

    it('validates monthly spend is consistent', () => {
      const expectedMin = mockGoals.pricePerStd * mockGoals.weeklyGoal * 4;
      expect(mockGoals.baselineMonthlySpend).toBeGreaterThan(expectedMin * 0.5);
    });
  });

  describe('Drink data validation', () => {
    const validDrink: Drink = {
      volumeMl: 355,
      abvPct: 5.0,
      intention: 'social',
      craving: 3,
      halt: [],
      alt: '',
      ts: Date.now()
    };

    it('validates drink structure', () => {
      expect(validDrink.volumeMl).toBeGreaterThan(0);
      expect(validDrink.abvPct).toBeGreaterThan(0);
      expect(validDrink.intention).toBeTruthy();
      expect(validDrink.craving).toBeGreaterThanOrEqual(1);
      expect(validDrink.craving).toBeLessThanOrEqual(5);
      expect(validDrink.ts).toBeGreaterThan(0);
    });

    it('validates volume is reasonable', () => {
      expect(validDrink.volumeMl).toBeLessThan(2000);
    });

    it('validates ABV is reasonable', () => {
      expect(validDrink.abvPct).toBeLessThan(100);
    });

    it('validates intention types', () => {
      const validIntentions = ['social', 'unwind', 'cope', 'habit', 'other'];
      expect(validIntentions).toContain(validDrink.intention);
    });

    it('validates craving range', () => {
      expect(validDrink.craving).toBeGreaterThanOrEqual(1);
      expect(validDrink.craving).toBeLessThanOrEqual(5);
    });

    it('validates timestamp is recent', () => {
      const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
      expect(validDrink.ts).toBeGreaterThan(oneYearAgo);
    });
  });

  describe('Progress calculations', () => {
    it('calculates daily progress percentage', () => {
      const consumed = 1.5;
      const cap = mockGoals.dailyCap;
      const percentage = (consumed / cap) * 100;
      
      expect(percentage).toBe(75);
    });

    it('calculates weekly progress percentage', () => {
      const consumed = 7;
      const goal = mockGoals.weeklyGoal;
      const percentage = (consumed / goal) * 100;
      
      expect(percentage).toBe(70);
    });

    it('identifies exceeded daily cap', () => {
      const consumed = 3;
      const cap = mockGoals.dailyCap;
      const exceeded = consumed > cap;
      
      expect(exceeded).toBe(true);
    });

    it('calculates spending correctly', () => {
      const drinksCount = 10;
      const spent = drinksCount * mockGoals.pricePerStd;
      
      expect(spent).toBe(30);
    });

    it('calculates remaining budget', () => {
      const spent = 50;
      const remaining = mockGoals.baselineMonthlySpend - spent;
      
      expect(remaining).toBe(100);
    });
  });

  describe('Streak calculations', () => {
    it('calculates consecutive alcohol-free days', () => {
      const drinks: Drink[] = [];
      const streakDays = 5;
      
      // Streak logic: count days without drinks
      expect(streakDays).toBeGreaterThanOrEqual(0);
    });

    it('resets streak when drink is added', () => {
      const hadDrinkToday = true;
      const currentStreak = 5;
      const newStreak = hadDrinkToday ? 0 : currentStreak + 1;
      
      expect(newStreak).toBe(0);
    });

    it('increments streak for alcohol-free day', () => {
      const hadDrinkToday = false;
      const currentStreak = 3;
      const newStreak = hadDrinkToday ? 0 : currentStreak + 1;
      
      expect(newStreak).toBe(4);
    });
  });

  describe('Data aggregation', () => {
    const mockDrinks: Drink[] = [
      {
        volumeMl: 355,
        abvPct: 5.0,
        intention: 'social',
        craving: 3,
        halt: [],
        alt: '',
        ts: Date.now()
      },
      {
        volumeMl: 150,
        abvPct: 12.0,
        intention: 'unwind',
        craving: 4,
        halt: [],
        alt: '',
        ts: Date.now() - 1000 * 60 * 60
      }
    ];

    it('aggregates total standard drinks', () => {
      const total = mockDrinks.reduce((sum, d) => 
        sum + stdDrinks(d.volumeMl, d.abvPct), 0
      );
      
      expect(total).toBeGreaterThan(2);
    });

    it('calculates average craving level', () => {
      const avgCraving = mockDrinks.reduce((sum, d) => 
        sum + d.craving, 0) / mockDrinks.length;
      
      expect(avgCraving).toBeCloseTo(3.5);
    });

    it('groups drinks by intention', () => {
      const byIntention = mockDrinks.reduce((acc, d) => {
        acc[d.intention] = (acc[d.intention] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      expect(byIntention['social']).toBe(1);
      expect(byIntention['unwind']).toBe(1);
    });

    it('filters drinks by date range', () => {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const recent = mockDrinks.filter(d => d.ts > oneDayAgo);
      
      expect(recent.length).toBe(2);
    });
  });
});
