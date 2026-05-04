/**
 * [R27-C] Beat 4: log style.
 *
 * R26-4 ex-Reframe / ex-Sunnyside user audit found that the quick-vs-
 * detailed toggle was buried in Settings → Appearance — first-week
 * users defaulted into detailed mode without knowing the alternative
 * existed. R27-C surfaces it once during onboarding.
 *
 * Pins:
 *   - Beat 4 renders the two-chip prompt + Get started fallback.
 *   - "Fast" chip persists drinkLogMode='quick' and finishes onboarding.
 *   - "Detailed" chip persists drinkLogMode='detailed' and finishes.
 *   - "Get started" fallback persists drinkLogMode='detailed' (the
 *     existing default) — closing without picking is the same as
 *     picking detailed.
 *   - Progress bar shows 4 of 4.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import OnboardingFlow from '../OnboardingFlow';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';

function flushChipDelay() {
  act(() => { vi.advanceTimersByTime(600); });
}

beforeEach(() => {
  vi.useFakeTimers();
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  useDB.getState().setSettings({
    hasCompletedOnboarding: false,
    onboardingDiagnostics: undefined,
    drinkLogMode: undefined,
  });
});

afterEach(() => {
  vi.useRealTimers();
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
});

function advanceToBeatFour() {
  flushChipDelay();
  fireEvent.click(screen.getByTestId('onboarding-chip-cut-back'));
  fireEvent.click(screen.getByText(/one day at a time/i));
  fireEvent.click(screen.getByTestId('onboarding-privacy-continue'));
}

describe('Beat 4 — log style [R27-C]', () => {
  it('renders the two-chip prompt + Get started fallback', () => {
    render(<OnboardingFlow />);
    advanceToBeatFour();
    expect(screen.getByTestId('onboarding-log-mode-quick')).toBeTruthy();
    expect(screen.getByTestId('onboarding-log-mode-detailed')).toBeTruthy();
    expect(screen.getByTestId('onboarding-log-mode-skip')).toBeTruthy();
    expect(screen.getByText(/log fast or in detail/i)).toBeTruthy();
  });

  it('Fast chip persists drinkLogMode=quick and finishes', () => {
    render(<OnboardingFlow />);
    advanceToBeatFour();
    fireEvent.click(screen.getByTestId('onboarding-log-mode-quick'));
    const settings = useDB.getState().db.settings;
    expect(settings.drinkLogMode).toBe('quick');
    expect(settings.hasCompletedOnboarding).toBe(true);
    expect(settings.onboardingDiagnostics?.status).toBe('completed');
  });

  it('Detailed chip persists drinkLogMode=detailed and finishes', () => {
    render(<OnboardingFlow />);
    advanceToBeatFour();
    fireEvent.click(screen.getByTestId('onboarding-log-mode-detailed'));
    const settings = useDB.getState().db.settings;
    expect(settings.drinkLogMode).toBe('detailed');
    expect(settings.hasCompletedOnboarding).toBe(true);
    expect(settings.onboardingDiagnostics?.status).toBe('completed');
  });

  it('Get started fallback defaults to detailed', () => {
    render(<OnboardingFlow />);
    advanceToBeatFour();
    fireEvent.click(screen.getByTestId('onboarding-log-mode-skip'));
    const settings = useDB.getState().db.settings;
    expect(settings.drinkLogMode).toBe('detailed');
    expect(settings.hasCompletedOnboarding).toBe(true);
  });

  it('progress bar reads "Step 4 of 4" on Beat 4', () => {
    render(<OnboardingFlow />);
    advanceToBeatFour();
    const progress = screen.getByRole('progressbar');
    expect(progress.getAttribute('aria-valuenow')).toBe('4');
    expect(progress.getAttribute('aria-valuemax')).toBe('4');
    expect(progress.getAttribute('aria-label')).toBe('Step 4 of 4');
  });
});
