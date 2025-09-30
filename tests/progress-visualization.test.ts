import { describe, it, expect } from 'vitest';
import type { Drink } from '../src/features/drinks/DrinkForm';
import type { Goals } from '../src/types/common';
import { stdDrinks } from '../src/lib/calc';

// Progress calculation functions for testing
function calculateDailyProgress(drinks: Drink[], goals: Goals) {
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const todayDrinks = drinks.filter(d => d.ts >= todayStart);
  const todayStd = todayDrinks.reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);
  
  return {
    consumed: todayStd,
    limit: goals.dailyCap,
    percentage: Math.min((todayStd / goals.dailyCap) * 100, 100),
    isExceeded: todayStd > goals.dailyCap
  };
}

function calculateWeeklyProgress(drinks: Drink[], goals: Goals) {
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekDrinks = drinks.filter(d => d.ts >= weekStart);
  const weekStd = weekDrinks.reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);
  
  return {
    consumed: weekStd,
    goal: goals.weeklyGoal,
    percentage: Math.min((weekStd / goals.weeklyGoal) * 100, 100),
    isExceeded: weekStd > goals.weeklyGoal
  };
}

function calculateMonthlySpendingAnalysis(drinks: Drink[], goals: Goals) {
  const monthStart = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const monthDrinks = drinks.filter(d => d.ts >= monthStart);
  const actualSpend = monthDrinks.reduce((sum, d) => sum + (stdDrinks(d.volumeMl, d.abvPct) * goals.pricePerStd), 0);
  
  return {
    actual: actualSpend,
    budget: goals.baselineMonthlySpend,
    difference: actualSpend - goals.baselineMonthlySpend,
    percentage: (actualSpend / goals.baselineMonthlySpend) * 100,
    isOverBudget: actualSpend > goals.baselineMonthlySpend
  };
}

const mockGoals: Goals = {
  dailyCap: 2,
  weeklyGoal: 10,
  pricePerStd: 3,
  baselineMonthlySpend: 150
};

function testDailyProgressCalculations() {
  it('calculates daily progress correctly', () => {
    const todayDrinks: Drink[] = [
      {
        volumeMl: 355,
        abvPct: 5.0,
        intention: 'social',
        craving: 3,
        halt: [],
        alt: '',
        ts: Date.now() // Today
      }
    ];

    const progress = calculateDailyProgress(todayDrinks, mockGoals);
    expect(progress.consumed).toBeCloseTo(1, 1);
    expect(progress.limit).toBe(2);
    expect(progress.percentage).toBeCloseTo(50, 0);
    expect(progress.isExceeded).toBe(false);
  });

  it('detects when daily limit is exceeded', () => {
    const excessiveDrinks: Drink[] = [
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
        volumeMl: 355,
        abvPct: 5.0,
        intention: 'social',
        craving: 4,
        halt: [],
        alt: '',
        ts: Date.now()
      },
      {
        volumeMl: 355,
        abvPct: 5.0,
        intention: 'cope',
        craving: 5,
        halt: [],
        alt: '',
        ts: Date.now()
      }
    ];

    const progress = calculateDailyProgress(excessiveDrinks, mockGoals);
    expect(progress.isExceeded).toBe(true);
    expect(progress.percentage).toBe(100); // Capped at 100%
  });
}

function testWeeklyProgressCalculations() {
  it('calculates weekly progress correctly', () => {
    const weekDrinks: Drink[] = Array.from({ length: 5 }, (_, i) => ({
      volumeMl: 355,
      abvPct: 5.0,
      intention: 'social',
      craving: 3,
      halt: [],
      alt: '',
      ts: Date.now() - i * 24 * 60 * 60 * 1000
    }));

    const progress = calculateWeeklyProgress(weekDrinks, mockGoals);
    expect(progress.consumed).toBeCloseTo(5, 0);
    expect(progress.goal).toBe(10);
    expect(progress.percentage).toBeCloseTo(50, 0);
    expect(progress.isExceeded).toBe(false);
  });
}

function testMonthlySpendingCalculations() {
  it('calculates monthly spending analysis', () => {
    const monthDrinks: Drink[] = Array.from({ length: 10 }, (_, i) => ({
      volumeMl: 355,
      abvPct: 5.0,
      intention: 'social',
      craving: 3,
      halt: [],
      alt: '',
      ts: Date.now() - i * 24 * 60 * 60 * 1000
    }));

    const analysis = calculateMonthlySpendingAnalysis(monthDrinks, mockGoals);
    expect(analysis.actual).toBeCloseTo(30, 0); // 10 drinks * 1 std * $3
    expect(analysis.budget).toBe(150);
    expect(analysis.difference).toBeLessThan(0); // Under budget
    expect(analysis.isOverBudget).toBe(false);
  });
}

function testEmptyArrayHandling() {
  it('handles empty drinks array', () => {
    const dailyProgress = calculateDailyProgress([], mockGoals);
    expect(dailyProgress.consumed).toBe(0);
    expect(dailyProgress.percentage).toBe(0);
    expect(dailyProgress.isExceeded).toBe(false);

    const weeklyProgress = calculateWeeklyProgress([], mockGoals);
    expect(weeklyProgress.consumed).toBe(0);
    expect(weeklyProgress.percentage).toBe(0);
    expect(weeklyProgress.isExceeded).toBe(false);

    const spendingAnalysis = calculateMonthlySpendingAnalysis([], mockGoals);
    expect(spendingAnalysis.actual).toBe(0);
    expect(spendingAnalysis.isOverBudget).toBe(false);
  });
}

describe('Progress Visualization Calculations', () => {
  testDailyProgressCalculations();
  testWeeklyProgressCalculations();
  testMonthlySpendingCalculations();
  testEmptyArrayHandling();
});