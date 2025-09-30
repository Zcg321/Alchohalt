import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import InsightsPanel from '../InsightsPanel';
import type { Drink } from '../../drinks/DrinkForm';
import type { Goals } from '../../../types/common';

describe('InsightsPanel', () => {
  const mockDrinks: Drink[] = [
    {
      volumeMl: 355,
      abvPct: 5.0,
      intention: 'social',
      craving: 3,
      halt: [],
      alt: '',
      ts: Date.now()
    }
  ];

  const mockGoals: Goals = {
    dailyCap: 2,
    weeklyGoal: 10,
    pricePerStd: 3.5,
    baselineMonthlySpend: 150
  };

  it('renders without crashing', () => {
    render(<InsightsPanel drinks={mockDrinks} goals={mockGoals} />);
    expect(document.body).toBeTruthy();
  });

  it('renders with empty drinks', () => {
    render(<InsightsPanel drinks={[]} goals={mockGoals} />);
    expect(document.body).toBeTruthy();
  });

  it('handles missing goals', () => {
    render(<InsightsPanel drinks={mockDrinks} goals={undefined as any} />);
    expect(document.body).toBeTruthy();
  });
});
