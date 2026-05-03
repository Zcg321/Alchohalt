import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import PeakHourCard from '../PeakHourCard';
import type { Drink } from '../../../types/common';

function drinkAt(day: number, hour: number, std = 1): Drink {
  const ts = new Date(2026, 4, day, hour, 0, 0).getTime();
  return {
    ts,
    volumeMl: std === 0 ? 0 : 350,
    abvPct: std === 0 ? 0 : 5,
    intention: 'social',
    craving: 0,
    halt: [],
    alt: '',
  };
}

describe('[R14-5] PeakHourCard', () => {
  it('renders nothing when no peak pattern surfaces', () => {
    const { container } = render(<PeakHourCard drinks={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when below threshold (only 3 drinks)', () => {
    const drinks = [drinkAt(1, 20), drinkAt(2, 20), drinkAt(3, 20)];
    const { container } = render(<PeakHourCard drinks={drinks} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the peak-hour line when threshold met', () => {
    const drinks: Drink[] = [];
    for (let day = 1; day <= 4; day++) {
      drinks.push(drinkAt(day, 20));
      drinks.push(drinkAt(day, 20));
    }
    render(<PeakHourCard drinks={drinks} />);
    expect(screen.getByTestId('peak-hour-card')).toBeInTheDocument();
    expect(screen.getByText(/8 PM – 9 PM/)).toBeInTheDocument();
    expect(screen.getByText(/average/)).toBeInTheDocument();
    expect(screen.getByText(/2\.0 drinks/)).toBeInTheDocument();
  });

  it('shows entry count and day count in the caption', () => {
    const drinks: Drink[] = [];
    for (let day = 1; day <= 5; day++) {
      drinks.push(drinkAt(day, 20));
    }
    drinks.push(drinkAt(1, 20)); // extra entry on day 1
    drinks.push(drinkAt(2, 20)); // extra entry on day 2
    render(<PeakHourCard drinks={drinks} />);
    // 7 entries, 5 days
    expect(screen.getByText(/7 entries across 5 days/)).toBeInTheDocument();
  });

  it('renders no exclamation, no second-person commands', () => {
    const drinks: Drink[] = [];
    for (let day = 1; day <= 4; day++) {
      drinks.push(drinkAt(day, 20));
      drinks.push(drinkAt(day, 20));
    }
    render(<PeakHourCard drinks={drinks} />);
    const card = screen.getByTestId('peak-hour-card');
    const text = card.textContent ?? '';
    expect(text).not.toContain('!');
    expect(text).not.toMatch(/\bconsider\b/i);
    expect(text).not.toMatch(/\bshould\b/i);
    expect(text).not.toMatch(/\btry to\b/i);
  });

  it('handles midnight peak gracefully (12 AM – 1 AM)', () => {
    const drinks: Drink[] = [];
    for (let day = 1; day <= 4; day++) {
      drinks.push(drinkAt(day, 0));
      drinks.push(drinkAt(day, 0));
    }
    render(<PeakHourCard drinks={drinks} />);
    expect(screen.getByText(/12 AM – 1 AM/)).toBeInTheDocument();
  });

  it('handles noon peak gracefully (12 PM – 1 PM)', () => {
    const drinks: Drink[] = [];
    for (let day = 1; day <= 4; day++) {
      drinks.push(drinkAt(day, 12));
      drinks.push(drinkAt(day, 12));
    }
    render(<PeakHourCard drinks={drinks} />);
    expect(screen.getByText(/12 PM – 1 PM/)).toBeInTheDocument();
  });

  it('handles 11 PM peak (rolls to 12 AM end label)', () => {
    const drinks: Drink[] = [];
    for (let day = 1; day <= 4; day++) {
      drinks.push(drinkAt(day, 23));
      drinks.push(drinkAt(day, 23));
    }
    render(<PeakHourCard drinks={drinks} />);
    expect(screen.getByText(/11 PM – 12 AM/)).toBeInTheDocument();
  });
});
