import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import SmartRecommendations from '../SmartRecommendations';
import type { Drink } from '../../drinks/DrinkForm';

describe('SmartRecommendations', () => {
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
    render(<SmartRecommendations drinks={mockDrinks} />);
    expect(document.body).toBeTruthy();
  });

  it('renders with empty drinks', () => {
    render(<SmartRecommendations drinks={[]} />);
    expect(document.body).toBeTruthy();
  });

  it('handles undefined drinks', () => {
    render(<SmartRecommendations drinks={undefined as any} />);
    expect(document.body).toBeTruthy();
  });
});
