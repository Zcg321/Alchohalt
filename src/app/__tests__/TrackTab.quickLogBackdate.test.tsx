/**
 * [R24-FF2] Quick-mode "earlier today?" backdating link.
 *
 * Pins:
 *  - In quick mode, when the most-recent drink was logged within the
 *    last 10 minutes, an "Earlier today?" link is rendered.
 *  - The link is hidden once that window expires.
 *  - Clicking it calls onStartEdit with the most-recent drink, which
 *    routes the user into the standard edit form (no separate UI).
 *  - The link is not rendered in detailed mode.
 *  - The link is not rendered when the detailed disclosure is open.
 *
 * Window matches the typical "I forgot to log when I actually drank
 * it" lag for someone who just sat down with their phone.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

function renderTab(drinks: { ts: number }[], onStartEdit = vi.fn()) {
  const drinksFull = drinks.map((d) => ({
    ts: d.ts,
    volumeMl: 355,
    abvPct: 5,
    intention: 'social' as const,
    craving: 0,
    halt: [] as never[],
    alt: '',
  }));
  return {
    onStartEdit,
    rendered: render(
      <LanguageProvider>
        <TrackTab
          {...baseProps}
          drinks={drinksFull}
          onStartEdit={onStartEdit}
        />
      </LanguageProvider>,
    ),
  };
}

describe('TrackTab quick-log backdate link [R24-FF2]', () => {
  it('renders link when most-recent drink is < 10 minutes old', () => {
    const recentTs = Date.now() - 5 * 60 * 1000;
    renderTab([{ ts: recentTs }]);
    expect(screen.getByTestId('quick-log-backdate-link')).toBeTruthy();
  });

  it('does NOT render link when most-recent drink is > 10 minutes old', () => {
    const oldTs = Date.now() - 11 * 60 * 1000;
    renderTab([{ ts: oldTs }]);
    expect(screen.queryByTestId('quick-log-backdate-link')).toBeNull();
  });

  it('does NOT render link when there are no drinks', () => {
    renderTab([]);
    expect(screen.queryByTestId('quick-log-backdate-link')).toBeNull();
  });

  it('clicking the link calls onStartEdit with the most-recent drink', () => {
    const tsA = Date.now() - 8 * 60 * 1000;
    const tsB = Date.now() - 2 * 60 * 1000;
    const onStartEdit = vi.fn();
    renderTab([{ ts: tsA }, { ts: tsB }], onStartEdit);
    fireEvent.click(screen.getByTestId('quick-log-backdate-link'));
    expect(onStartEdit).toHaveBeenCalledWith(
      expect.objectContaining({ ts: tsB }),
    );
  });

  it('does not render link in detailed mode', () => {
    useDB.getState().setSettings({ drinkLogMode: 'detailed' });
    const recentTs = Date.now() - 1 * 60 * 1000;
    renderTab([{ ts: recentTs }]);
    expect(screen.queryByTestId('quick-log-backdate-link')).toBeNull();
  });

  it('does not render link when detailed disclosure is open', () => {
    const recentTs = Date.now() - 1 * 60 * 1000;
    renderTab([{ ts: recentTs }]);
    fireEvent.click(screen.getByTestId('quick-log-toggle-detailed'));
    expect(screen.queryByTestId('quick-log-backdate-link')).toBeNull();
  });
});
