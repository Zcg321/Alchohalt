/**
 * [R23-C] Decide-later tertiary chip on onboarding step 1.
 *
 * Pins:
 *   - The chip exists with stable testid `onboarding-chip-undecided`
 *   - Tapping it advances the user to step 2 (track-style)
 *     — distinct from the just-looking link, which dismisses the modal
 *   - Diagnostics records intent='undecided' on completion
 *   - The 44pt minimum touch target floor is preserved
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
  });
});

afterEach(() => {
  vi.useRealTimers();
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
});

describe('Decide-later tertiary chip [R23-C]', () => {
  it('renders the Decide-later chip alongside the three primary chips', () => {
    render(<OnboardingFlow />);
    flushChipDelay();
    expect(screen.getByTestId('onboarding-chip-cut-back')).toBeTruthy();
    expect(screen.getByTestId('onboarding-chip-quit')).toBeTruthy();
    expect(screen.getByTestId('onboarding-chip-curious')).toBeTruthy();
    expect(screen.getByTestId('onboarding-chip-undecided')).toBeTruthy();
  });

  it('Decide-later advances to step 2 (track-style), not dismiss', () => {
    render(<OnboardingFlow />);
    flushChipDelay();
    fireEvent.click(screen.getByTestId('onboarding-chip-undecided'));
    // Modal stays open; we should now be on step 2 — the track-style
    // heading appears. The just-looking link dismisses; this chip
    // advances.
    expect(screen.queryByTestId('onboarding-modal')).toBeTruthy();
    expect(screen.getByText(/track/i)).toBeTruthy();
  });

  it('records intent=undecided on completion', () => {
    render(<OnboardingFlow />);
    flushChipDelay();
    fireEvent.click(screen.getByTestId('onboarding-chip-undecided'));
    // Step 2: pick any track style to advance.
    fireEvent.click(screen.getByText(/one day at a time/i));
    // [R27-C] Step 3 is now privacy → Continue; Step 4 is log style.
    fireEvent.click(screen.getByTestId('onboarding-privacy-continue'));
    // Step 4: Get started (defaults log mode to detailed).
    fireEvent.click(screen.getByText(/get started/i));
    const diag = useDB.getState().db.settings.onboardingDiagnostics;
    expect(diag?.status).toBe('completed');
    expect(diag?.intent).toBe('undecided');
  });

  it('Decide-later chip meets the 44pt minimum touch target', () => {
    render(<OnboardingFlow />);
    flushChipDelay();
    const chip = screen.getByTestId('onboarding-chip-undecided');
    expect(chip.className).toMatch(/min-h-\[44px\]/);
  });
});
