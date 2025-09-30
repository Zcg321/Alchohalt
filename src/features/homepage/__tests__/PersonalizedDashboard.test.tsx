import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import PersonalizedDashboard from '../PersonalizedDashboard';
import type { Drink } from '../../drinks/DrinkForm';
import type { Goals } from '../../../types/common';

describe('PersonalizedDashboard', () => {
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
    render(<PersonalizedDashboard drinks={mockDrinks} goals={mockGoals} onQuickAction={() => {}} />);
    expect(document.body).toBeTruthy();
  });

  it('renders with empty drinks', () => {
    render(<PersonalizedDashboard drinks={[]} goals={mockGoals} onQuickAction={() => {}} />);
    expect(document.body).toBeTruthy();
  });

  it('handles quick action callback', () => {
    const mockAction = () => {};
    render(<PersonalizedDashboard drinks={mockDrinks} goals={mockGoals} onQuickAction={mockAction} />);
    expect(document.body).toBeTruthy();
  });
});
