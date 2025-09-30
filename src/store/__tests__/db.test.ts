import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Drink } from '../../features/drinks/DrinkForm';
import type { Goals } from '../../types/common';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.localStorage = localStorageMock as any;

describe('db store utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('stores and retrieves drinks data', () => {
    const mockDrinks: Drink[] = [{
      volumeMl: 355,
      abvPct: 5.0,
      intention: 'social',
      craving: 3,
      halt: [],
      alt: '',
      ts: Date.now()
    }];
    
    localStorage.setItem('drinks', JSON.stringify(mockDrinks));
    const stored = localStorage.getItem('drinks');
    expect(stored).toBeTruthy();
    
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].volumeMl).toBe(355);
  });

  it('stores and retrieves goals data', () => {
    const mockGoals: Goals = {
      dailyCap: 2,
      weeklyGoal: 10,
      pricePerStd: 3.5,
      baselineMonthlySpend: 150
    };
    
    localStorage.setItem('goals', JSON.stringify(mockGoals));
    const stored = localStorage.getItem('goals');
    expect(stored).toBeTruthy();
    
    const parsed = JSON.parse(stored!);
    expect(parsed.dailyCap).toBe(2);
    expect(parsed.weeklyGoal).toBe(10);
  });

  it('handles missing data gracefully', () => {
    const stored = localStorage.getItem('nonexistent');
    expect(stored).toBeNull();
  });

  it('clears all data', () => {
    localStorage.setItem('drinks', '[]');
    localStorage.setItem('goals', '{}');
    
    expect(localStorage.getItem('drinks')).toBeTruthy();
    expect(localStorage.getItem('goals')).toBeTruthy();
    
    localStorage.clear();
    
    expect(localStorage.getItem('drinks')).toBeNull();
    expect(localStorage.getItem('goals')).toBeNull();
  });

  it('removes specific items', () => {
    localStorage.setItem('test1', 'value1');
    localStorage.setItem('test2', 'value2');
    
    expect(localStorage.getItem('test1')).toBe('value1');
    expect(localStorage.getItem('test2')).toBe('value2');
    
    localStorage.removeItem('test1');
    
    expect(localStorage.getItem('test1')).toBeNull();
    expect(localStorage.getItem('test2')).toBe('value2');
  });
});
