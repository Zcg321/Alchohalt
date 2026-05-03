/**
 * [R16-4] Replay-onboarding button tests.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import ReplayOnboardingButton from '../ReplayOnboardingButton';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';

beforeEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
});

afterEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  vi.restoreAllMocks();
});

function setOnboardingCompleted(value: boolean) {
  useDB.setState({
    db: {
      ...useDB.getState().db,
      settings: {
        ...useDB.getState().db.settings,
        hasCompletedOnboarding: value,
      },
    },
  });
}

describe('[R16-4] ReplayOnboardingButton', () => {
  it('renders the calm copy', () => {
    setOnboardingCompleted(true);
    render(<ReplayOnboardingButton />);
    expect(screen.getByText(/Replay the intro/i)).toBeInTheDocument();
    expect(
      screen.getByText(/None of your data is touched/i),
    ).toBeInTheDocument();
  });

  it('flips hasCompletedOnboarding to false when confirmed', () => {
    setOnboardingCompleted(true);
    /* Add a sample entry + a setting that should NOT be touched, to
     * prove the side-effect contract: only hasCompletedOnboarding flips. */
    const sentinelEntries = useDB.getState().db.entries;
    const sentinelGoal = useDB.getState().db.settings.dailyGoalDrinks;
    render(<ReplayOnboardingButton confirmFn={() => true} />);

    fireEvent.click(screen.getByTestId('replay-onboarding-button'));

    const after = useDB.getState().db;
    expect(after.settings.hasCompletedOnboarding).toBe(false);
    expect(after.entries).toBe(sentinelEntries);
    expect(after.settings.dailyGoalDrinks).toBe(sentinelGoal);
  });

  it('does NOT flip when the confirm dialog is cancelled', () => {
    setOnboardingCompleted(true);
    render(<ReplayOnboardingButton confirmFn={() => false} />);

    fireEvent.click(screen.getByTestId('replay-onboarding-button'));

    expect(useDB.getState().db.settings.hasCompletedOnboarding).toBe(true);
  });

  it('disables the button + shows hint when onboarding has not been completed yet', () => {
    setOnboardingCompleted(false);
    render(<ReplayOnboardingButton />);

    const btn = screen.getByTestId('replay-onboarding-button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(screen.getByTestId('replay-onboarding-hint')).toBeInTheDocument();
  });
});
