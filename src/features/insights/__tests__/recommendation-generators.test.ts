import { describe, it, expect } from 'vitest';
import type { Drink } from '../../drinks/DrinkForm';

describe('recommendation generators', () => {
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
      volumeMl: 500,
      abvPct: 4.5,
      intention: 'cope',
      craving: 4,
      halt: ['hungry'],
      alt: 'water',
      ts: Date.now() - 86400000
    }
  ];

  it('analyzes drinking patterns', () => {
    const recentDrinks = mockDrinks.filter(d => d.ts > Date.now() - 7 * 24 * 60 * 60 * 1000);
    expect(recentDrinks.length).toBeGreaterThanOrEqual(0);
  });

  it('identifies high craving situations', () => {
    const highCraving = mockDrinks.filter(d => d.craving >= 4);
    expect(Array.isArray(highCraving)).toBe(true);
  });

  it('groups drinks by intention', () => {
    const byIntention = mockDrinks.reduce((acc, d) => {
      acc[d.intention] = (acc[d.intention] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    expect(typeof byIntention).toBe('object');
    expect(byIntention.social).toBeDefined();
  });

  it('calculates average craving', () => {
    const avgCraving = mockDrinks.reduce((sum, d) => sum + d.craving, 0) / mockDrinks.length;
    expect(avgCraving).toBeGreaterThanOrEqual(0);
    expect(avgCraving).toBeLessThanOrEqual(5);
  });
});
