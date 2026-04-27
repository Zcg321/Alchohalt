/**
 * [BUG-4 / BUG-9] Regression tests for the onboarding modal:
 *   - Skip button click marks onboarding complete and dismisses.
 *   - Backdrop click dismisses + persists (BUG-9).
 *   - Escape key dismisses + persists (BUG-9).
 *
 * Persistence is delegated to the zustand-backed db store; we assert
 * the modal disappears AND db.settings.hasCompletedOnboarding flips
 * to true so it does not re-fire on next mount.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import OnboardingFlow from '../OnboardingFlow';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';

beforeEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  // Reset onboarding completion to fresh-install.
  useDB.getState().setSettings({ hasCompletedOnboarding: false });
});

afterEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
});

describe('OnboardingFlow — Skip button [BUG-4]', () => {
  it('renders a working Skip button that completes onboarding', () => {
    render(<OnboardingFlow />);
    const skip = screen.getByTestId('onboarding-skip');
    fireEvent.click(skip);
    expect(useDB.getState().db.settings.hasCompletedOnboarding).toBe(true);
    expect(screen.queryByTestId('onboarding-modal')).toBeNull();
  });

  it('top-right close (X) button also completes onboarding', () => {
    render(<OnboardingFlow />);
    // The X is labelled by the same i18n "Skip" string (aria-label).
    const closes = screen.getAllByLabelText(/skip/i);
    expect(closes.length).toBeGreaterThan(0);
    fireEvent.click(closes[0]);
    expect(useDB.getState().db.settings.hasCompletedOnboarding).toBe(true);
  });
});

describe('OnboardingFlow — backdrop + Escape [BUG-9]', () => {
  it('clicking the backdrop completes onboarding', () => {
    render(<OnboardingFlow />);
    const modal = screen.getByTestId('onboarding-modal');
    fireEvent.click(modal); // outermost = backdrop
    expect(useDB.getState().db.settings.hasCompletedOnboarding).toBe(true);
    expect(screen.queryByTestId('onboarding-modal')).toBeNull();
  });

  it('Escape key completes onboarding', () => {
    render(<OnboardingFlow />);
    expect(screen.getByTestId('onboarding-modal')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(useDB.getState().db.settings.hasCompletedOnboarding).toBe(true);
  });
});

describe('OnboardingFlow — does not re-fire after completion', () => {
  it('mounting fresh after completion does NOT show the modal', () => {
    useDB.getState().setSettings({ hasCompletedOnboarding: true });
    const { queryByTestId } = render(<OnboardingFlow />);
    expect(queryByTestId('onboarding-modal')).toBeNull();
  });
});
