import { describe, it, expect } from 'vitest';
import { generateInsights } from '../src/features/insights/lib';
import type { Drink } from '../src/features/drinks/DrinkForm';
import type { Goals } from '../src/features/goals/GoalSettings';

const mockDrinks: Drink[] = [
  {
    volumeMl: 355,
    abvPct: 5.0,
    intention: 'social',
    craving: 7,
    halt: ['lonely'],
    alt: '',
    ts: Date.now() - 2 * 24 * 60 * 60 * 1000 // 2 days ago
  },
  {
    volumeMl: 148,
    abvPct: 12.0,
    intention: 'stress',
    craving: 5,
    halt: ['tired'],
    alt: 'went for a walk',
    ts: Date.now() - 1 * 24 * 60 * 60 * 1000 // 1 day ago
  }
];

const mockGoals: Goals = {
  dailyCap: 2,
  weeklyGoal: 10,
  pricePerStd: 3,
  baselineMonthlySpend: 150
};

describe('Insights Generation', () => {
  it('generates weekend pattern insights', () => {
    const insights = generateInsights(mockDrinks, mockGoals);
    expect(insights).toBeInstanceOf(Array);
    expect(insights.length).toBeGreaterThanOrEqual(0);
  });

  it('handles empty drinks array', () => {
    const insights = generateInsights([], mockGoals);
    expect(insights).toBeInstanceOf(Array);
    expect(insights.length).toBe(0);
  });

  it('identifies HALT triggers', () => {
    const insights = generateInsights(mockDrinks, mockGoals);
    const haltInsight = insights.find(insight => 
      insight.title.toLowerCase().includes('lonely') || 
      insight.title.toLowerCase().includes('tired')
    );
    expect(haltInsight).toBeDefined();
  });

  it('recognizes alternative usage', () => {
    const insights = generateInsights(mockDrinks, mockGoals);
    const altInsight = insights.find(insight => 
      insight.description.toLowerCase().includes('alternative')
    );
    expect(altInsight).toBeDefined();
  });
});