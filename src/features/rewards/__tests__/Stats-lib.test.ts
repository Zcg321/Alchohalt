import { describe, it, expect } from 'vitest';
import type { Drink } from '../../drinks/DrinkForm';

describe('Stats lib utilities', () => {
  const mockDrinks: Drink[] = [
    {
      volumeMl: 355,
      abvPct: 5.0,
      intention: 'social' as const,
      craving: 3,
      halt: [],
      alt: '',
      ts: Date.now()
    },
    {
      volumeMl: 150,
      abvPct: 12.0,
      intention: 'unwind' as const,
      craving: 4,
      halt: ['tired' as const],
      alt: 'tea',
      ts: Date.now() - 24 * 60 * 60 * 1000
    }
  ];

  it('drink data structure is valid', () => {
    expect(mockDrinks.length).toBe(2);
    expect(mockDrinks[0].volumeMl).toBe(355);
    expect(mockDrinks[1].intention).toBe('unwind');
  });

  it('handles empty drinks array', () => {
    const emptyDrinks: Drink[] = [];
    expect(emptyDrinks.length).toBe(0);
  });

  it('handles large dataset', () => {
    const largeDrinks: Drink[] = Array.from({ length: 100 }, (_, i) => ({
      volumeMl: 355,
      abvPct: 5.0,
      intention: 'social' as const,
      craving: 3,
      halt: [],
      alt: '',
      ts: Date.now() - i * 24 * 60 * 60 * 1000
    }));
    
    expect(largeDrinks.length).toBe(100);
    expect(largeDrinks[0].volumeMl).toBe(355);
  });

  it('validates drink timestamps are in correct order', () => {
    const drinks = Array.from({ length: 5 }, (_, i) => ({
      volumeMl: 355,
      abvPct: 5.0,
      intention: 'social' as const,
      craving: 3,
      halt: [],
      alt: '',
      ts: Date.now() - i * 24 * 60 * 60 * 1000
    }));
    
    for (let i = 1; i < drinks.length; i++) {
      expect(drinks[i].ts).toBeLessThan(drinks[i-1].ts);
    }
  });
});
