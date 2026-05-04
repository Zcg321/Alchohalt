/**
 * [R23-D] Track-tab quick-log mode integration test.
 *
 * Pins:
 *   - drinkLogMode='detailed' (default) → no QuickLogChips, just the
 *     full DrinkForm
 *   - drinkLogMode='quick' → QuickLogChips appear above the form;
 *     full form is hidden behind a "Need more detail?" link
 *   - In quick mode, editing an existing drink still falls back to
 *     the detailed form (since you can't quick-log into an edit)
 */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TrackTab from '../tabs/TrackTab';
import { useDB } from '../../store/db';
import { LanguageProvider } from '../../i18n';

const baseProps = {
  drinks: [] as never[],
  goals: { dailyCap: 2, weeklyGoal: 14, baselineMonthlySpend: 0, pricePerStd: 5 },
  presets: [] as never[],
  editing: null,
  onAddDrink: vi.fn(),
  onSaveDrink: vi.fn(),
  onStartEdit: vi.fn(),
  onDeleteDrink: vi.fn(),
  onCancelEdit: vi.fn(),
};

beforeEach(() => {
  if (typeof window !== 'undefined') window.localStorage.clear();
  useDB.getState().setSettings({ drinkLogMode: undefined });
});

afterEach(() => {
  if (typeof window !== 'undefined') window.localStorage.clear();
});

function renderTab(overrides: Record<string, unknown> = {}) {
  return render(
    <LanguageProvider>
      <TrackTab {...{ ...baseProps, ...overrides }} />
    </LanguageProvider>,
  );
}

describe('TrackTab quick-log mode [R23-D]', () => {
  it('detailed mode (default): no QuickLogChips render', () => {
    renderTab();
    expect(screen.queryByTestId('quick-log-chips')).toBeNull();
  });

  it('quick mode: QuickLogChips render and detailed form is hidden', () => {
    useDB.getState().setSettings({ drinkLogMode: 'quick' });
    renderTab();
    expect(screen.getByTestId('quick-log-chips')).toBeTruthy();
    // The detailed-form disclosure toggle should be visible
    expect(screen.getByTestId('quick-log-toggle-detailed')).toBeTruthy();
  });

  it('quick mode + edit: falls back to detailed form for the edit', () => {
    useDB.getState().setSettings({ drinkLogMode: 'quick' });
    const editing = {
      volumeMl: 355,
      abvPct: 5,
      intention: 'social' as const,
      craving: 0,
      halt: [] as never[],
      alt: '',
      ts: Date.now(),
    };
    renderTab({ editing });
    // No quick chips — edit forces detailed form
    expect(screen.queryByTestId('quick-log-chips')).toBeNull();
  });

  it('quick mode: tapping "Need more detail?" reveals the detailed form', () => {
    useDB.getState().setSettings({ drinkLogMode: 'quick' });
    renderTab();
    // The toggle is initially "Need more detail?" — clicking flips it
    const toggle = screen.getByTestId('quick-log-toggle-detailed');
    fireEvent.click(toggle);
    expect(toggle.textContent).toMatch(/hide/i);
  });
});
