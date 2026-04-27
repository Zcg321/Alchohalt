/**
 * Regression test for [BUG-3]: "Daily Limit Reached" alert was firing
 * on fresh-install state (0 drinks today, dailyCap defaulting to 0)
 * because `0 >= 0` evaluated to true. The alert read as a high-urgency
 * scolding to a user who hadn't logged anything yet.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import SmartRecommendations from '../SmartRecommendations';
import type { Goals } from '../../../types/common';

const ZERO_GOALS: Goals = {
  dailyCap: 0,
  weeklyGoal: 0,
  monthlyBudget: 0,
  pricePerStd: 5,
  baselineMonthlySpend: 0,
};

describe('SmartRecommendations — fresh-install regression [BUG-3]', () => {
  it('does NOT show "Daily limit reached" when dailyCap is 0 and zero drinks logged', () => {
    render(<SmartRecommendations drinks={[]} goals={ZERO_GOALS} />);
    expect(screen.queryByText(/daily limit reached/i)).toBeNull();
    expect(screen.queryByText(/approaching daily limit/i)).toBeNull();
  });

  it('does NOT show daily-limit alerts when user has set a cap but logged 0 today', () => {
    const goals: Goals = { ...ZERO_GOALS, dailyCap: 3 };
    render(<SmartRecommendations drinks={[]} goals={goals} />);
    expect(screen.queryByText(/daily limit reached/i)).toBeNull();
    expect(screen.queryByText(/approaching daily limit/i)).toBeNull();
  });
});
