/**
 * [R25-B] CalorieTile — opt-in tile, off by default.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import CalorieTile from '../CalorieTile';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';
import type { Drink } from '../../../types/common';

beforeEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
});

afterEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
});

function recentDrink(daysAgo: number, volumeMl = 355, abvPct = 5): Drink {
  return {
    ts: Date.now() - daysAgo * 24 * 60 * 60 * 1000,
    volumeMl,
    abvPct,
    intention: 'social',
    craving: 0,
    halt: [],
    alt: '',
  };
}

describe('[R25-B] CalorieTile', () => {
  it('renders nothing when settings.showCalorieTile is undefined (default off)', () => {
    const { container } = render(<CalorieTile drinks={[recentDrink(1)]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when settings.showCalorieTile === false', () => {
    useDB.getState().setSettings({ showCalorieTile: false });
    const { container } = render(<CalorieTile drinks={[recentDrink(1)]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when opted-in but zero recent drinks', () => {
    useDB.getState().setSettings({ showCalorieTile: true });
    const { container } = render(<CalorieTile drinks={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the tile when opted in and recent drinks exist', () => {
    useDB.getState().setSettings({ showCalorieTile: true });
    render(<CalorieTile drinks={[recentDrink(1), recentDrink(2)]} />);
    expect(screen.getByTestId('calorie-tile')).toBeInTheDocument();
    // 2 beers ≈ 196 kcal
    expect(screen.getByTestId('calorie-tile-kcal').textContent).toMatch(/19/);
  });

  it('shows walking + bread equivalence rows', () => {
    useDB.getState().setSettings({ showCalorieTile: true });
    render(<CalorieTile drinks={[recentDrink(1), recentDrink(2), recentDrink(3)]} />);
    expect(screen.getByTestId('calorie-tile-walking')).toBeInTheDocument();
    expect(screen.getByTestId('calorie-tile-bread')).toBeInTheDocument();
  });

  it('uses singular "slice" when bread count is 1', () => {
    useDB.getState().setSettings({ showCalorieTile: true });
    // ~98 kcal = 1 slice bread
    render(<CalorieTile drinks={[recentDrink(1)]} />);
    const breadEl = screen.getByTestId('calorie-tile-bread');
    expect(breadEl.textContent).toMatch(/1\s+slice\b/);
  });

  it('uses plural "slices" when bread count > 1', () => {
    useDB.getState().setSettings({ showCalorieTile: true });
    // 7 beers ≈ 686 kcal = 9 slices
    const drinks = Array.from({ length: 7 }, (_, i) => recentDrink(i));
    render(<CalorieTile drinks={drinks} />);
    const breadEl = screen.getByTestId('calorie-tile-bread');
    expect(breadEl.textContent).toMatch(/slices/);
  });

  it('does not include drinks older than 7 days', () => {
    useDB.getState().setSettings({ showCalorieTile: true });
    const drinks = [
      recentDrink(1),       // included
      recentDrink(10),      // excluded
      recentDrink(15),      // excluded
    ];
    render(<CalorieTile drinks={drinks} />);
    // Only the 1-day-ago drink: ~98 kcal
    expect(screen.getByTestId('calorie-tile-kcal').textContent).toBe('98');
  });

  it('frames the number with "ethanol kcal" + floor disclaimer', () => {
    useDB.getState().setSettings({ showCalorieTile: true });
    render(<CalorieTile drinks={[recentDrink(1)]} />);
    expect(screen.getByText(/ethanol kcal/i)).toBeInTheDocument();
    expect(screen.getByText(/defensible floor/i)).toBeInTheDocument();
  });
});
