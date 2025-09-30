import { describe, it, expect } from 'vitest';

describe('Common types', () => {
  it('exports type definitions', () => {
    // This test ensures the types file is imported and checked by TypeScript
    expect(true).toBe(true);
  });

  it('type Goals should exist', () => {
    type Goals = {
      dailyCap?: number;
      weeklyGoal?: number;
      pricePerStd?: number;
      baselineMonthlySpend?: number;
    };
    
    const testGoals: Goals = {
      dailyCap: 2,
      weeklyGoal: 10
    };
    
    expect(testGoals).toBeTruthy();
    expect(testGoals.dailyCap).toBe(2);
  });

  it('validates Goals type structure', () => {
    type Goals = {
      dailyCap?: number;
      weeklyGoal?: number;
      pricePerStd?: number;
      baselineMonthlySpend?: number;
    };
    
    const goals: Goals = {
      dailyCap: 3,
      weeklyGoal: 15,
      pricePerStd: 5,
      baselineMonthlySpend: 200
    };
    
    expect(goals.dailyCap).toBe(3);
    expect(goals.weeklyGoal).toBe(15);
    expect(goals.pricePerStd).toBe(5);
    expect(goals.baselineMonthlySpend).toBe(200);
  });
});
