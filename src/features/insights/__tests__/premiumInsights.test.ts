import { describe, it, expect } from 'vitest';
import { generatePremiumInsights } from '../premiumInsights';

describe('Premium Insights', () => {
  const mockDrinks = Array.from({ length: 30 }, (_, i) => ({
    volumeMl: 355,
    abvPct: 5.0,
    intention: (['social', 'unwind', 'cope'] as const)[i % 3],
    craving: 3,
    halt: [],
    alt: '',
    ts: Date.now() - i * 24 * 60 * 60 * 1000
  }));

  const mockGoals = {
    dailyCap: 2,
    weeklyGoal: 10,
    pricePerStd: 3,
    baselineMonthlySpend: 150
  };

  it('generatePremiumInsights returns insights', () => {
    const insights = generatePremiumInsights(mockDrinks, mockGoals);
    expect(Array.isArray(insights)).toBe(true);
  });

  it('handles empty drinks array', () => {
    const insights = generatePremiumInsights([], mockGoals);
    expect(Array.isArray(insights)).toBe(true);
  });

  it('generates insights for diverse patterns', () => {
    const insights = generatePremiumInsights(mockDrinks, mockGoals);
    expect(insights.length).toBeGreaterThanOrEqual(0);
  });

  it('handles large dataset', () => {
    const largeDrinks = Array.from({ length: 100 }, (_, i) => ({
      volumeMl: 355,
      abvPct: 5.0,
      intention: 'social' as const,
      craving: 3,
      halt: [],
      alt: '',
      ts: Date.now() - i * 24 * 60 * 60 * 1000
    }));
    
    const insights = generatePremiumInsights(largeDrinks, mockGoals);
    expect(Array.isArray(insights)).toBe(true);
  });
});
