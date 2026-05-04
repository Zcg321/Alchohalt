/**
 * [R25-E] Quick-mode backdating window — 'yesterday' toggle.
 *
 * Pins:
 *  - Default ('today' / undefined): existing 10-min backdating window.
 *  - 'yesterday': window extends to start of previous calendar day.
 *  - The link copy switches to acknowledge the wider window.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TrackTab from '../tabs/TrackTab';
import { useDB } from '../../store/db';
import { LanguageProvider } from '../../i18n';

const baseProps = {
  goals: { dailyCap: 2, weeklyGoal: 14, baselineMonthlySpend: 0, pricePerStd: 5 },
  presets: [] as never[],
  editing: null,
  onAddDrink: vi.fn(),
  onSaveDrink: vi.fn(),
  onSaveDrinkOriginal: vi.fn(),
  onDeleteDrink: vi.fn(),
  onCancelEdit: vi.fn(),
};

beforeEach(() => {
  if (typeof window !== 'undefined') window.localStorage.clear();
  useDB.getState().setSettings({ drinkLogMode: 'quick' });
});

afterEach(() => {
  if (typeof window !== 'undefined') window.localStorage.clear();
  vi.useRealTimers();
});

function renderTab(drinks: { ts: number }[]) {
  const drinksFull = drinks.map((d) => ({
    ts: d.ts,
    volumeMl: 355,
    abvPct: 5,
    intention: 'social' as const,
    craving: 0,
    halt: [] as never[],
    alt: '',
  }));
  return render(
    <LanguageProvider>
      <TrackTab {...baseProps} drinks={drinksFull} onStartEdit={vi.fn()} />
    </LanguageProvider>,
  );
}

describe('[R25-E] quick-log backdating window — yesterday toggle', () => {
  it('default: 30-min-old drink still in window', () => {
    // R25-E doesn't shrink the existing 10-min window; verify default
    // unchanged with a fresh drink
    const ts = Date.now() - 5 * 60 * 1000;
    renderTab([{ ts }]);
    expect(screen.getByTestId('quick-log-backdate-link')).toBeTruthy();
  });

  it('default: 11-min-old drink hidden', () => {
    const ts = Date.now() - 11 * 60 * 1000;
    renderTab([{ ts }]);
    expect(screen.queryByTestId('quick-log-backdate-link')).toBeNull();
  });

  it('yesterday: 11-min-old drink shows the link', () => {
    useDB.getState().setSettings({ quickLogBackdatingWindow: 'yesterday' });
    const ts = Date.now() - 11 * 60 * 1000;
    renderTab([{ ts }]);
    expect(screen.getByTestId('quick-log-backdate-link')).toBeTruthy();
  });

  it('yesterday: 6-hour-old drink shows the link', () => {
    useDB.getState().setSettings({ quickLogBackdatingWindow: 'yesterday' });
    const ts = Date.now() - 6 * 60 * 60 * 1000;
    renderTab([{ ts }]);
    expect(screen.getByTestId('quick-log-backdate-link')).toBeTruthy();
  });

  it('yesterday: a drink at midday yesterday is in the window', () => {
    useDB.getState().setSettings({ quickLogBackdatingWindow: 'yesterday' });
    // Anchor to noon yesterday — always within the floor (start of yesterday)
    // regardless of what hour the test runs at.
    const noonYesterday = new Date();
    noonYesterday.setDate(noonYesterday.getDate() - 1);
    noonYesterday.setHours(12, 0, 0, 0);
    renderTab([{ ts: noonYesterday.getTime() }]);
    expect(screen.getByTestId('quick-log-backdate-link')).toBeTruthy();
  });

  it('yesterday: a drink from two days ago is OUT of window', () => {
    useDB.getState().setSettings({ quickLogBackdatingWindow: 'yesterday' });
    // Anchor to noon two days ago — guaranteed to be before the start
    // of yesterday regardless of test time-of-day.
    const noonTwoDaysAgo = new Date();
    noonTwoDaysAgo.setDate(noonTwoDaysAgo.getDate() - 2);
    noonTwoDaysAgo.setHours(12, 0, 0, 0);
    renderTab([{ ts: noonTwoDaysAgo.getTime() }]);
    expect(screen.queryByTestId('quick-log-backdate-link')).toBeNull();
  });

  it('yesterday: link copy reflects the wider window', () => {
    useDB.getState().setSettings({ quickLogBackdatingWindow: 'yesterday' });
    const ts = Date.now() - 11 * 60 * 1000;
    renderTab([{ ts }]);
    const link = screen.getByTestId('quick-log-backdate-link');
    expect(link.textContent).toMatch(/last night|yesterday|earlier/i);
  });
});
