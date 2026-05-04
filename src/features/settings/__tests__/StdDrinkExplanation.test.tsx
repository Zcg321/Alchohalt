/**
 * [R26-A] StdDrinkExplanation — Settings tooltip rendering test.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StdDrinkExplanation from '../StdDrinkExplanation';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';

beforeEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  const current = useDB.getState().db;
  const { stdDrinkSystem: _drop, ...settingsWithoutSys } = current.settings;
  useDB.setState({
    db: {
      ...current,
      settings: settingsWithoutSys,
    },
  });
});

afterEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('[R26-A] StdDrinkExplanation', () => {
  it('renders a collapsed details element with summary', () => {
    render(<StdDrinkExplanation />);
    const det = screen.getByTestId('stddrink-explainer');
    expect(det).toBeInTheDocument();
    expect(det.tagName).toBe('DETAILS');
    expect(det).not.toHaveAttribute('open');
  });

  it('shows US explanation by default (14g + NIAAA reference)', () => {
    render(<StdDrinkExplanation />);
    const grams = screen.getByTestId('stddrink-grams');
    expect(grams.textContent).toMatch(/14/);
    expect(grams.textContent).toMatch(/US/);
    const list = screen.getByTestId('stddrink-equivalences');
    expect(list.textContent).toMatch(/12 oz beer/i);
  });

  it('switches to UK unit when stdDrinkSystem is uk', () => {
    useDB.getState().setSettings({ stdDrinkSystem: 'uk' });
    render(<StdDrinkExplanation />);
    const grams = screen.getByTestId('stddrink-grams');
    expect(grams.textContent).toMatch(/8/);
    expect(grams.textContent ?? '').toMatch(/unit/i);
    const list = screen.getByTestId('stddrink-equivalences');
    expect(list.textContent ?? '').toMatch(/half a pint/i);
  });

  it('switches to AU 10g definition when stdDrinkSystem is au', () => {
    useDB.getState().setSettings({ stdDrinkSystem: 'au' });
    render(<StdDrinkExplanation />);
    const grams = screen.getByTestId('stddrink-grams');
    expect(grams.textContent).toMatch(/10/);
    const list = screen.getByTestId('stddrink-equivalences');
    expect(list.textContent ?? '').toMatch(/middy|pot|285/i);
  });

  it('switches to NZ definition when stdDrinkSystem is nz', () => {
    useDB.getState().setSettings({ stdDrinkSystem: 'nz' });
    render(<StdDrinkExplanation />);
    const grams = screen.getByTestId('stddrink-grams');
    expect(grams.textContent).toMatch(/10/);
    expect(grams.textContent).toMatch(/NZ/);
  });
});
