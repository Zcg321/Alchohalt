import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MonthlyTrend from '../MonthlyTrend';
import type { Drink } from '../../drinks/DrinkForm';

describe('MonthlyTrend', () => {
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

  it('renders without crashing', () => {
    render(<MonthlyTrend drinks={mockDrinks} />);
    expect(document.body).toBeTruthy();
  });

  it('renders with empty drinks array', () => {
    render(<MonthlyTrend drinks={[]} />);
    expect(document.body).toBeTruthy();
  });

  it('handles undefined props gracefully', () => {
    render(<MonthlyTrend drinks={undefined as any} />);
    expect(document.body).toBeTruthy();
  });
});
