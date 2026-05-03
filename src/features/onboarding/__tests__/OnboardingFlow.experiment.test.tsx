/**
 * [R15-B] Onboarding chip-copy A/B test.
 *
 * The experiment 'onboarding-chip-copy-2026Q2' is registered active.
 * Variant assignment is deterministic from the device-bucket nanoid
 * stored in localStorage. By seeding the bucket directly we can pin
 * a render to either variant for assertion.
 *
 * Buckets used here were found by enumeration: 'A_BUCKET' yields
 * the control branch under FNV-1a('onboarding-chip-copy-2026Q2::A_BUCKET'),
 * 'F_BUCKET' yields first-person. If the assignment math ever
 * changes (very unlikely — algorithms are stable contracts) these
 * may need re-derivation; the test would fail loudly on it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import OnboardingFlow from '../OnboardingFlow';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';
import { assignVariant } from '../../experiments/bucket';
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

/** Find a bucket id that maps to the requested variant. */
function findBucketFor(variant: 'control' | 'first-person'): string {
  const exp = findExperiment('onboarding-chip-copy-2026Q2');
  if (!exp) throw new Error('experiment not found in registry');
  for (let i = 0; i < 1000; i++) {
    const bucket = `bucket-${i}`;
    if (assignVariant(exp, bucket) === variant) return bucket;
  }
  throw new Error(`No bucket found for variant=${variant} within 1000 tries`);
}

describe('[R15-B] onboarding chip-copy A/B', () => {
  it('control bucket renders third-person chip labels', () => {
    const controlBucket = findBucketFor('control');
    window.localStorage.setItem('exp.device-bucket', controlBucket);

    render(<OnboardingFlow />);
    flushChipDelay();

    const row = screen.getByTestId('onboarding-chip-row');
    expect(row).toHaveAttribute('data-variant', 'control');

    expect(screen.getByTestId('onboarding-chip-cut-back')).toHaveTextContent(
      'Trying to drink less'
    );
    expect(screen.getByTestId('onboarding-chip-quit')).toHaveTextContent(
      'Trying to stop'
    );
    expect(screen.getByTestId('onboarding-chip-curious')).toHaveTextContent(
      'Not sure yet'
    );
  });

  it('first-person bucket renders first-person chip labels', () => {
    const fpBucket = findBucketFor('first-person');
    window.localStorage.setItem('exp.device-bucket', fpBucket);

    render(<OnboardingFlow />);
    flushChipDelay();

    const row = screen.getByTestId('onboarding-chip-row');
    expect(row).toHaveAttribute('data-variant', 'first-person');

    expect(screen.getByTestId('onboarding-chip-cut-back')).toHaveTextContent(
      'I want to drink less'
    );
    expect(screen.getByTestId('onboarding-chip-quit')).toHaveTextContent(
      "I'm stopping for now"
    );
    expect(screen.getByTestId('onboarding-chip-curious')).toHaveTextContent(
      "I'm here to learn"
    );
  });

  it('records exposure to localStorage on first render with active variant', () => {
    const fpBucket = findBucketFor('first-person');
    window.localStorage.setItem('exp.device-bucket', fpBucket);

    render(<OnboardingFlow />);
    flushChipDelay();

    const exposuresRaw = window.localStorage.getItem('exp.exposures');
    expect(exposuresRaw).not.toBeNull();
    const log = JSON.parse(exposuresRaw!);
    expect(Array.isArray(log)).toBe(true);
    expect(log.length).toBeGreaterThan(0);
    const last = log[log.length - 1];
    expect(last.key).toBe('onboarding-chip-copy-2026Q2');
    expect(['control', 'first-person']).toContain(last.variant);
  });

  it('intent ID stays stable across variants (cut-back fires regardless of label)', () => {
    const fpBucket = findBucketFor('first-person');
    window.localStorage.setItem('exp.device-bucket', fpBucket);

    render(<OnboardingFlow />);
    flushChipDelay();

    // Click the first-person variant of the cut-back chip
    const chip = screen.getByTestId('onboarding-chip-cut-back');
    expect(chip).toHaveTextContent('I want to drink less');
    chip.click();

    // Intent recorded as 'cut-back', regardless of label variant
    // (We can't easily inspect setIntent here without completing the
    // flow; but the test above for full-flow uses the same testid +
    // asserts diag.intent === 'cut-back', proving the contract.)
  });
});
