/**
 * [R23-4] Insights tab empty-state illustration.
 *
 * Pins:
 *   - The empty state renders when drinks.length === 0
 *   - The decorative SVG is present and aria-hidden (so it doesn't
 *     pollute the accessible tree — text content carries the meaning)
 *   - The "Nothing to chart yet." text remains intact (voice gate)
 *   - The "Add a few entries…" hint text remains intact (voice gate)
 *   - The empty-state container has a stable testid for future
 *     visual-regression / a11y dump runs
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import InsightsTab from '../tabs/InsightsTab';
import { LanguageProvider } from '../../i18n';

const baseGoals = {
  dailyCap: 2,
  weeklyGoal: 14,
  baselineMonthlySpend: 0,
  pricePerStd: 5,
};

describe('[R23-4] InsightsTab empty-state illustration', () => {
  it('renders the empty-state container with stable testid', () => {
    render(
      <LanguageProvider>
        <InsightsTab drinks={[]} goals={baseGoals} />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('insights-empty-state')).toBeTruthy();
  });

  it('renders an aria-hidden decorative SVG', () => {
    const { container } = render(
      <LanguageProvider>
        <InsightsTab drinks={[]} goals={baseGoals} />
      </LanguageProvider>,
    );
    const svg = container.querySelector('[data-testid="insights-empty-state"] svg');
    expect(svg).toBeTruthy();
    /* Must be aria-hidden so SR users hear the text only, not "graphic" */
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps the observational voice intact (no exclamation, no cheerleader)', () => {
    render(
      <LanguageProvider>
        <InsightsTab drinks={[]} goals={baseGoals} />
      </LanguageProvider>,
    );
    expect(screen.getByText(/nothing to chart yet/i)).toBeTruthy();
    expect(screen.getByText(/add a few entries/i)).toBeTruthy();
    /* Voice gate: no "!" anywhere in the empty state */
    const empty = screen.getByTestId('insights-empty-state');
    expect(empty.textContent ?? '').not.toContain('!');
  });

  it('illustration disappears when drinks are present', () => {
    const drinks = [
      {
        volumeMl: 355,
        abvPct: 5,
        intention: 'social' as const,
        craving: 0,
        halt: [] as never[],
        alt: '',
        ts: Date.now(),
      },
    ];
    render(
      <LanguageProvider>
        <InsightsTab drinks={drinks} goals={baseGoals} />
      </LanguageProvider>,
    );
    expect(screen.queryByTestId('insights-empty-state')).toBeNull();
  });
});
