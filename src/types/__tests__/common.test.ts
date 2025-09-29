import type { Drink, Goals, DrinkPreset, Intention, Halt } from '../common';

describe('common types', () => {
  test('Intention type includes expected values', () => {
    const intentions: Intention[] = ['celebrate', 'social', 'taste', 'bored', 'cope', 'other'];
    expect(intentions).toHaveLength(6);
    expect(intentions).toContain('celebrate');
    expect(intentions).toContain('social');
  });

  test('Halt type includes expected values', () => {
    const halts: Halt[] = ['hungry', 'angry', 'lonely', 'tired'];
    expect(halts).toHaveLength(4);
    expect(halts).toContain('hungry');
    expect(halts).toContain('tired');
  });

  test('Drink interface can be created', () => {
    const drink: Drink = {
      volumeMl: 355,
      abvPct: 5.0,
      intention: 'social',
      craving: 3,
      halt: ['hungry'],
      alt: 'water',
      ts: Date.now()
    };
    expect(drink.volumeMl).toBe(355);
    expect(drink.intention).toBe('social');
  });

  test('Goals interface can be created', () => {
    const goals: Goals = {
      dailyCap: 2,
      weeklyGoal: 7,
      pricePerStd: 5.5,
      baselineMonthlySpend: 100
    };
    expect(goals.dailyCap).toBe(2);
    expect(goals.pricePerStd).toBe(5.5);
  });

  test('DrinkPreset interface can be created', () => {
    const preset: DrinkPreset = {
      name: 'Beer',
      volumeMl: 355,
      abvPct: 5.0
    };
    expect(preset.name).toBe('Beer');
    expect(preset.volumeMl).toBe(355);
  });
});