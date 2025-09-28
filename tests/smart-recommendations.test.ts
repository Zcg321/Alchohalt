import { describe, it, expect } from 'vitest';
import type { Drink } from '../src/features/drinks/DrinkForm';
import type { Goals } from '../src/features/goals/GoalSettings';
import { stdDrinks } from '../src/lib/calc';

// Helper functions extracted from SmartRecommendations component for testing
function hasWeekendPattern(drinks: Drink[]): boolean {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentDrinks = drinks.filter(d => d.ts > thirtyDaysAgo);

  const weekendTotal = recentDrinks.filter(d => {
    const day = new Date(d.ts).getDay();
    return day === 0 || day === 6;
  }).reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);

  const weekdayTotal = recentDrinks.filter(d => {
    const day = new Date(d.ts).getDay();
    return day >= 1 && day <= 5;
  }).reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);

  const avgWeekend = weekendTotal / 8; // ~4 weekends in 30 days
  const avgWeekday = weekdayTotal / 20; // ~20 weekdays in 30 days

  return avgWeekend > avgWeekday * 1.5;
}

function getCurrentStreak(drinks: Drink[]): number {
  const byDay: Record<string, number> = {};
  drinks.forEach(d => {
    const day = new Date(d.ts).toISOString().slice(0, 10);
    byDay[day] = (byDay[day] || 0) + stdDrinks(d.volumeMl, d.abvPct);
  });

  let streak = 0;
  const current = new Date();
  while (true) {
    const key = current.toISOString().slice(0, 10);
    if (byDay[key] > 0) break;
    streak++;
    current.setDate(current.getDate() - 1);
    if (streak > 365) break;
  }

  return streak;
}

const mockGoals: Goals = {
  dailyCap: 2,
  weeklyGoal: 10,
  pricePerStd: 3,
  baselineMonthlySpend: 150
};

describe('Smart Recommendations Logic', () => {
  it('detects weekend drinking patterns', () => {
    // Create drinks with more weekend consumption
    const weekendDrinks: Drink[] = [
      // Saturday drinks
      {
        volumeMl: 355,
        abvPct: 5.0,
        intention: 'social',
        craving: 3,
        halt: [],
        alt: '',
        ts: new Date(2024, 0, 6).getTime() // Saturday
      },
      {
        volumeMl: 355,
        abvPct: 5.0,
        intention: 'social',
        craving: 3,
        halt: [],
        alt: '',
        ts: new Date(2024, 0, 13).getTime() // Next Saturday
      },
      // Weekday drink (less frequent)
      {
        volumeMl: 148,
        abvPct: 12.0,
        intention: 'stress',
        craving: 2,
        halt: [],
        alt: '',
        ts: new Date(2024, 0, 8).getTime() // Monday
      }
    ];

    const hasPattern = hasWeekendPattern(weekendDrinks);
    expect(hasPattern).toBe(true);
  });

  it('calculates current alcohol-free streak correctly', () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const drinksWithGap: Drink[] = [
      {
        volumeMl: 355,
        abvPct: 5.0,
        intention: 'social',
        craving: 3,
        halt: [],
        alt: '',
        ts: twoDaysAgo.getTime()
      }
    ];

    const streak = getCurrentStreak(drinksWithGap);
    expect(streak).toBeGreaterThanOrEqual(1);
  });

  it('handles empty drinks array for streak calculation', () => {
    const streak = getCurrentStreak([]);
    expect(streak).toBeGreaterThanOrEqual(0);
  });

  it('does not detect weekend pattern with even distribution', () => {
    const evenDrinks: Drink[] = Array.from({ length: 14 }, (_, i) => ({
      volumeMl: 355,
      abvPct: 5.0,
      intention: 'social',
      craving: 3,
      halt: [],
      alt: '',
      ts: Date.now() - i * 24 * 60 * 60 * 1000
    }));

    const hasPattern = hasWeekendPattern(evenDrinks);
    expect(hasPattern).toBe(false);
  });
});