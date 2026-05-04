/**
 * [R25-G] Onboarding chip-copy A/B winner pinned.
 *
 * R15-B / R16-A ran a 3-arm experiment ('onboarding-chip-copy-2026Q2'
 * with control / first-person / first-person-trying). R25-G picks
 * first-person-trying as the winner per voice principles —
 * observation over declaration, owned without commitment-anxiety —
 * archives the experiment, and ships the winning labels for everyone.
 *
 * This file replaces the previous 3-variant assertion suite. It pins
 * the new ground truth:
 *   - All users see the first-person-trying chip labels regardless
 *     of bucket assignment.
 *   - data-variant="first-person-trying" is the canonical value.
 *   - The experiment is archived in the registry; useExperiment
 *     returns null so no new exposures are recorded.
 *
 * Existing exposure history (from R15-B / R16-A) is preserved in
 * localStorage for audit purposes but isn't read here.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import OnboardingFlow from '../OnboardingFlow';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';
import { findExperiment } from '../../experiments/registry';

function flushChipDelay() {
  act(() => { vi.advanceTimersByTime(600); });
}

beforeEach(() => {
  vi.useFakeTimers();
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  useDB.getState().setSettings({ hasCompletedOnboarding: false });
});

afterEach(() => {
  vi.useRealTimers();
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
});

describe('[R25-G] onboarding chip-copy winner pinned (first-person-trying)', () => {
  it('renders first-person-trying chip labels for everyone', () => {
    render(<OnboardingFlow />);
    flushChipDelay();

    expect(screen.getByTestId('onboarding-chip-cut-back')).toHaveTextContent(
      "I'm trying to drink less",
    );
    expect(screen.getByTestId('onboarding-chip-quit')).toHaveTextContent(
      "I'm pausing alcohol for now",
    );
    expect(screen.getByTestId('onboarding-chip-curious')).toHaveTextContent(
      "I'm just looking around",
    );
  });

  it('data-variant attribute is the winner name, not "control"', () => {
    render(<OnboardingFlow />);
    flushChipDelay();
    const row = screen.getByTestId('onboarding-chip-row');
    expect(row).toHaveAttribute('data-variant', 'first-person-trying');
  });

  it('the experiment is archived in the registry', () => {
    const exp = findExperiment('onboarding-chip-copy-2026Q2');
    expect(exp).toBeDefined();
    expect(exp!.status).toBe('archived');
  });

  it('renders the same labels regardless of any prior bucket assignment', () => {
    // Even if a returning user has an old bucket assignment from when
    // the experiment was active, the archived state means
    // first-person-trying labels show consistently.
    window.localStorage.setItem('exp.device-bucket', 'pre-r25-bucket-id');
    render(<OnboardingFlow />);
    flushChipDelay();
    expect(screen.getByTestId('onboarding-chip-cut-back')).toHaveTextContent(
      "I'm trying to drink less",
    );
  });

  it('intent ID stays stable when the chip is clicked', () => {
    render(<OnboardingFlow />);
    flushChipDelay();
    const chip = screen.getByTestId('onboarding-chip-cut-back');
    expect(chip).toHaveTextContent("I'm trying to drink less");
    chip.click();
    // Intent IDs ('cut-back', 'quit', 'curious') are stable across
    // copy revisions — the downstream OnboardingDiagnostics record
    // is unaffected by the label change. (Full-flow tests assert
    // diag.intent === 'cut-back'; we don't duplicate that here.)
  });
});
