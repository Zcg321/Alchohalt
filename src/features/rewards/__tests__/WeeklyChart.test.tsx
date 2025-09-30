import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import WeeklyChart from '../WeeklyChart';
import type { Drink } from '../../drinks/DrinkForm';

describe('WeeklyChart', () => {
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
    render(<WeeklyChart drinks={mockDrinks} />);
    expect(document.body).toBeTruthy();
  });

  it('renders with empty drinks array', () => {
    render(<WeeklyChart drinks={[]} />);
    expect(document.body).toBeTruthy();
  });

  it('renders with null drinks', () => {
    render(<WeeklyChart drinks={null as any} />);
    expect(document.body).toBeTruthy();
  });
});
