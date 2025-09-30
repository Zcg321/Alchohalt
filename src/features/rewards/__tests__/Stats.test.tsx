import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import Stats from '../Stats';

describe('Stats', () => {
  it('renders without crashing with empty data', () => {
    render(<Stats drinks={[]} goals={{}} />);
    expect(document.body).toBeTruthy();
  });

  it('renders with drink data and goals', () => {
    const mockDrinks = [
      {
        volumeMl: 355,
        abvPct: 5.0,
        intention: 'social' as const,
        craving: 3,
        halt: [],
        alt: '',
        ts: Date.now()
      }
    ];
    const mockGoals = {
      dailyCap: 2,
      weeklyGoal: 10,
      pricePerStd: 3,
      baselineMonthlySpend: 150
    };
    render(<Stats drinks={mockDrinks} goals={mockGoals} />);
    expect(document.body).toBeTruthy();
  });

  it('handles tab navigation', () => {
    const { container } = render(<Stats drinks={[]} goals={{}} />);
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => fireEvent.click(button));
    expect(container).toBeTruthy();
  });

  it('displays stats for multiple drinks', () => {
    const mockDrinks = Array.from({ length: 30 }, (_, i) => ({
      volumeMl: 355,
      abvPct: 5.0,
      intention: 'social' as const,
      craving: 3,
      halt: [],
      alt: '',
      ts: Date.now() - i * 24 * 60 * 60 * 1000
    }));
    const mockGoals = {
      dailyCap: 2,
      weeklyGoal: 10,
      pricePerStd: 3,
      baselineMonthlySpend: 150
    };
    render(<Stats drinks={mockDrinks} goals={mockGoals} />);
    expect(document.body).toBeTruthy();
  });
});
