/**
 * [R29-D] ArchivedExperimentsBanner — render guard tests.
 *
 * Verifies:
 *   1. Renders nothing when no experiments are archived.
 *   2. Renders nothing when an experiment is archived but has no
 *      declared winner (registry-archived bookkeeping).
 *   3. Renders one row per archived-with-winner experiment.
 *   4. Distinguishes runtime-archive vs registry-archive in copy.
 *   5. Surfaces both the experiment key and the winning arm.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ArchivedExperimentsBanner from '../ArchivedExperimentsBanner';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';
import * as bucket from '../bucket';
import * as registryModule from '../registry';
import type { Experiment } from '../registry';

const TEST_REGISTRY: readonly Experiment[] = [
  {
    key: 'registry-archived-with-winner',
    variants: ['control', 'first-person-trying'] as const,
    status: 'archived',
    description: '[R25-G winner: first-person-trying] details ...',
  },
  {
    key: 'registry-archived-no-winner',
    variants: ['control', 'b'] as const,
    status: 'archived',
    description: 'old experiment, no marker',
  },
  {
    key: 'active-with-winner',
    variants: ['control', 'softer'] as const,
    status: 'active',
    description: '[winner: softer] still active',
  },
  {
    key: 'active-no-winner',
    variants: ['control', 'b'] as const,
    status: 'active',
    description: 'no marker',
  },
];

beforeEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  useDB.getState().setSettings({
    archivedExperimentKeys: undefined as never,
    satisfactionSignals: undefined as never,
  });
  vi.spyOn(registryModule, 'REGISTRY', 'get').mockReturnValue(TEST_REGISTRY);
  vi.spyOn(bucket, 'readExposures').mockReturnValue([]);
});

afterEach(() => {
  vi.restoreAllMocks();
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
});

describe('[R29-D] ArchivedExperimentsBanner', () => {
  it('renders the banner for a registry-archived experiment with a declared winner', () => {
    render(<ArchivedExperimentsBanner />);
    expect(screen.getByTestId('archived-experiments-banner')).toBeTruthy();
    expect(
      screen.getByTestId('archived-banner-row-registry-archived-with-winner'),
    ).toBeTruthy();
    expect(
      screen.getByTestId('archived-banner-arm-registry-archived-with-winner').textContent,
    ).toContain('first-person-trying');
  });

  it('does NOT show registry-archived rows that have no declared winner', () => {
    render(<ArchivedExperimentsBanner />);
    expect(
      screen.queryByTestId('archived-banner-row-registry-archived-no-winner'),
    ).toBeNull();
  });

  it('does NOT show active experiments (even when they have a winner)', () => {
    render(<ArchivedExperimentsBanner />);
    expect(screen.queryByTestId('archived-banner-row-active-with-winner')).toBeNull();
    expect(screen.queryByTestId('archived-banner-row-active-no-winner')).toBeNull();
  });

  it('surfaces a runtime-archived experiment after the owner taps Archive Losers', () => {
    useDB.getState().setSettings({
      archivedExperimentKeys: ['active-with-winner'] as never,
    });
    render(<ArchivedExperimentsBanner />);
    expect(screen.getByTestId('archived-banner-row-active-with-winner')).toBeTruthy();
    expect(
      screen.getByTestId('archived-banner-arm-active-with-winner').textContent,
    ).toContain('softer');
    /* Copy distinguishes runtime vs registry archive. */
    expect(
      screen.getByTestId('archived-banner-row-active-with-winner').textContent,
    ).toContain('Runtime archive');
    expect(
      screen.getByTestId('archived-banner-row-registry-archived-with-winner').textContent,
    ).toContain('Registry archive');
  });

  it('renders nothing when no experiments are archived AND no winners declared on archived ones', () => {
    vi.spyOn(registryModule, 'REGISTRY', 'get').mockReturnValue([
      {
        key: 'plain-active',
        variants: ['control', 'b'] as const,
        status: 'active',
        description: 'no marker',
      },
      {
        key: 'plain-archived',
        variants: ['a', 'b'] as const,
        status: 'archived',
        description: 'no marker',
      },
    ]);
    const { container } = render(<ArchivedExperimentsBanner />);
    expect(screen.queryByTestId('archived-experiments-banner')).toBeNull();
    expect(container.firstChild).toBeNull();
  });
});
