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
    // [ROUND-5-B] X uses aria-label="Close" (was "Skip"). Two distinct
    // dismiss controls share the dialog: the icon X (Close) and the
    // bottom "Skip and explore" text link.
    const closeBtn = screen.getByLabelText(/close/i);
    fireEvent.click(closeBtn);
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

describe('OnboardingFlow — diagnostics [R9-2]', () => {
  it('records skipPath="x-button" when X is clicked', () => {
    render(<OnboardingFlow />);
    const closes = screen.getAllByLabelText(/skip/i);
    fireEvent.click(closes[0]);
    const diag = useDB.getState().db.settings.onboardingDiagnostics;
    expect(diag?.status).toBe('skipped');
    expect(diag?.skipPath).toBe('x-button');
  });

  it('records skipPath="just-looking" when tertiary is clicked', () => {
    render(<OnboardingFlow />);
    const tertiary = screen.getByTestId('onboarding-just-looking');
    fireEvent.click(tertiary);
    const diag = useDB.getState().db.settings.onboardingDiagnostics;
    expect(diag?.status).toBe('skipped');
    expect(diag?.skipPath).toBe('just-looking');
  });

  it('records skipPath="skip-explore" when bottom skip is clicked', () => {
    render(<OnboardingFlow />);
    fireEvent.click(screen.getByTestId('onboarding-skip'));
    const diag = useDB.getState().db.settings.onboardingDiagnostics;
    expect(diag?.skipPath).toBe('skip-explore');
  });

  it('records skipPath="escape" when Escape is pressed', () => {
    render(<OnboardingFlow />);
    fireEvent.keyDown(window, { key: 'Escape' });
    const diag = useDB.getState().db.settings.onboardingDiagnostics;
    expect(diag?.skipPath).toBe('escape');
  });

  it('records status="completed" with intent + trackStyle when full flow finishes', () => {
    render(<OnboardingFlow />);
    fireEvent.click(screen.getByText('Cutting back'));
    fireEvent.click(screen.getByText('30-day reset'));
    fireEvent.click(screen.getByText(/Get started/i));
    const diag = useDB.getState().db.settings.onboardingDiagnostics;
    expect(diag?.status).toBe('completed');
    expect(diag?.intent).toBe('cut-back');
    expect(diag?.trackStyle).toBe('thirty-day');
    expect(diag?.completedAt).toBeGreaterThan(0);
  });
});
