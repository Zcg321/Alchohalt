import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import History from '../History';
import type { Drink } from '../../features/drinks/DrinkForm';

describe('History', () => {
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

  it('renders without crashing with drinks', () => {
    render(<History drinks={mockDrinks} onStartEdit={() => {}} onDeleteDrink={() => {}} />);
    expect(document.body).toBeTruthy();
  });

  it('renders with empty drinks array', () => {
    render(<History drinks={[]} onStartEdit={() => {}} onDeleteDrink={() => {}} />);
    expect(document.body).toBeTruthy();
  });

  it('accepts callback props', () => {
    const mockEdit = () => {};
    const mockDelete = () => {};
    render(<History drinks={mockDrinks} onStartEdit={mockEdit} onDeleteDrink={mockDelete} />);
    expect(document.body).toBeTruthy();
  });
});
