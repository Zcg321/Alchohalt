/**
 * [R29-A C2] FirstLaunchPrivacyCard — render + dismiss tests.
 *
 * Verifies:
 *   1. Card renders for a fresh user (no dismissal stamp, no drinks).
 *   2. Card hides once the user has logged > 3 drinks.
 *   3. Card hides once dismissed; tapping the dismiss button stamps a
 *      timestamp into settings.firstLaunchPrivacyCardDismissedAt.
 *   4. Card stays hidden across re-renders after dismissal.
 */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import FirstLaunchPrivacyCard from '../FirstLaunchPrivacyCard';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';

beforeEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  useDB.getState().setSettings({
    firstLaunchPrivacyCardDismissedAt: undefined as never,
  });
});

afterEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
});

describe('[R29-A C2] FirstLaunchPrivacyCard', () => {
  it('renders for a fresh user (no drinks, no dismissal)', () => {
    render(<FirstLaunchPrivacyCard drinksLogged={0} />);
    expect(screen.getByTestId('first-launch-privacy-card')).toBeTruthy();
    expect(screen.getByTestId('first-launch-privacy-claim').textContent).toMatch(
      /no analytics/i,
    );
  });

  it('renders for a user with 1-3 drinks logged', () => {
    render(<FirstLaunchPrivacyCard drinksLogged={2} />);
    expect(screen.getByTestId('first-launch-privacy-card')).toBeTruthy();
  });

  it('hides once the user has logged more than 3 drinks', () => {
    render(<FirstLaunchPrivacyCard drinksLogged={4} />);
    expect(screen.queryByTestId('first-launch-privacy-card')).toBeNull();
  });

  it('hides once dismissed', () => {
    useDB.getState().setSettings({
      firstLaunchPrivacyCardDismissedAt: Date.now(),
    });
    render(<FirstLaunchPrivacyCard drinksLogged={0} />);
    expect(screen.queryByTestId('first-launch-privacy-card')).toBeNull();
  });

  it('clicking the dismiss button stamps the dismissal timestamp and hides the card', () => {
    const { rerender } = render(<FirstLaunchPrivacyCard drinksLogged={0} />);
    fireEvent.click(screen.getByTestId('first-launch-privacy-dismiss'));
    expect(
      useDB.getState().db.settings.firstLaunchPrivacyCardDismissedAt,
    ).toBeGreaterThan(0);
    rerender(<FirstLaunchPrivacyCard drinksLogged={0} />);
    expect(screen.queryByTestId('first-launch-privacy-card')).toBeNull();
  });
});
