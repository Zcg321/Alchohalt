/**
 * [R9-T3] Regression: Insights cards render under themed group
 * headings instead of one tall flat column. The 8-card stack from
 * round-4-7 was honest but heavy; we now show "What's working" /
 * "Patterns we noticed" / "Things to try" so users can scan structure.
 *
 * We assert headings appear when the matching insight type exists,
 * and DO NOT render headings for empty groups.
 */
import React from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import InsightsPanel from '../InsightsPanel';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';
import type { Drink } from '../../drinks/DrinkForm';
import type { Goals } from '../../../types/common';

const goals: Goals = {
  dailyCap: 0,
  weeklyGoal: 0,
  baselineMonthlySpend: 0,
  pricePerStd: 5,
};

beforeEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  useDB.setState({ db: { ...useDB.getState().db, entries: [] } });
});

describe('InsightsPanel — themed groupings [R9-T3]', () => {
  it('renders no group headings when there are zero drinks', () => {
    render(<InsightsPanel drinks={[]} goals={goals} />);
    expect(screen.queryByText("What's working")).toBeNull();
    expect(screen.queryByText('Patterns we noticed')).toBeNull();
    expect(screen.queryByText('Things to try')).toBeNull();
  });

  it('renders the achievement group heading when a streak exists', () => {
    // Build drinks that put "Cravings improving" into the achievement
    // bucket: older window has high craving, recent window low. Streak
    // logic also picks up the trailing AF days as an achievement.
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const drinks: Drink[] = [
      // Older 14-28 days ago, high craving
      { ts: now - 20 * day, volumeMl: 355, abvPct: 5, craving: 8, intention: 'cope', halt: [], alt: '' },
      { ts: now - 18 * day, volumeMl: 355, abvPct: 5, craving: 8, intention: 'cope', halt: [], alt: '' },
      // Recent 0-14, low
      { ts: now - 5 * day, volumeMl: 355, abvPct: 5, craving: 1, intention: 'social', halt: [], alt: '' },
      { ts: now - 4 * day, volumeMl: 355, abvPct: 5, craving: 1, intention: 'social', halt: [], alt: '' },
    ];

    render(<InsightsPanel drinks={drinks} goals={goals} />);
    // Cravings-improving is an achievement → group heading should
    // render. Streak path may or may not trigger depending on the
    // exact day boundary; we assert the heading is present either way.
    expect(screen.getByText("What's working")).toBeInTheDocument();
  });
});
