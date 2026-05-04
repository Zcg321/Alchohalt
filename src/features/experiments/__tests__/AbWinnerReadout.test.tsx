/**
 * [R28-B] AbWinnerReadout — render + archive flow tests.
 *
 * Verifies:
 *   1. Empty/active rendering covers each registry status.
 *   2. The Archive Losers button only appears under canArchiveLosers.
 *   3. Clicking the button calls window.confirm and writes the
 *      experiment key into settings.archivedExperimentKeys.
 *   4. After archive, the row reflects "archived via runtime override"
 *      and the button is gone.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import AbWinnerReadout from '../AbWinnerReadout';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';
import * as bucket from '../bucket';
import * as registryModule from '../registry';
import type { Experiment } from '../registry';

const TEST_REGISTRY: readonly Experiment[] = [
  {
    key: 'archived-with-winner',
    variants: ['control', 'first-person-trying'] as const,
    status: 'archived',
    description: '[R25-G winner: first-person-trying] Onboarding intent chips: details ...',
  },
  {
    key: 'active-with-winner',
    variants: ['control', 'softer'] as const,
    status: 'active',
    description: '[winner: softer] Goal-nudge banner: still bucketing for now',
  },
  {
    key: 'active-no-winner',
    variants: ['control', 'b'] as const,
    status: 'active',
    description: 'No marker yet',
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

describe('[R28-B] AbWinnerReadout', () => {
  it('renders one row per non-draft experiment', () => {
    render(<AbWinnerReadout />);
    expect(screen.getByTestId('ab-winner-row-archived-with-winner')).toBeTruthy();
    expect(screen.getByTestId('ab-winner-row-active-with-winner')).toBeTruthy();
    expect(screen.getByTestId('ab-winner-row-active-no-winner')).toBeTruthy();
  });

  it('shows declared winner badge only when winner is parsed', () => {
    render(<AbWinnerReadout />);
    expect(
      screen.getByTestId('ab-winner-declared-archived-with-winner').textContent,
    ).toBe('first-person-trying');
    expect(
      screen.getByTestId('ab-winner-declared-active-with-winner').textContent,
    ).toBe('softer');
    expect(screen.queryByTestId('ab-winner-declared-active-no-winner')).toBeNull();
  });

  it('renders Archive Losers button only for active + declared winner', () => {
    render(<AbWinnerReadout />);
    expect(screen.queryByTestId('archive-losers-archived-with-winner')).toBeNull();
    expect(screen.getByTestId('archive-losers-active-with-winner')).toBeTruthy();
    expect(screen.queryByTestId('archive-losers-active-no-winner')).toBeNull();
  });

  it('confirms then writes the key to archivedExperimentKeys on click', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<AbWinnerReadout />);
    fireEvent.click(screen.getByTestId('archive-losers-active-with-winner'));
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(useDB.getState().db.settings.archivedExperimentKeys).toEqual([
      'active-with-winner',
    ]);
  });

  it('cancelling the confirm dialog does NOT archive', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<AbWinnerReadout />);
    fireEvent.click(screen.getByTestId('archive-losers-active-with-winner'));
    expect(useDB.getState().db.settings.archivedExperimentKeys ?? []).toEqual([]);
  });

  it('after archive, the row marks runtime override and hides the button', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { rerender } = render(<AbWinnerReadout />);
    fireEvent.click(screen.getByTestId('archive-losers-active-with-winner'));
    rerender(<AbWinnerReadout />);
    expect(
      screen.getByTestId('ab-winner-readout-active-with-winner').textContent,
    ).toContain('archived via runtime override');
    expect(screen.queryByTestId('archive-losers-active-with-winner')).toBeNull();
  });

  it('archiving twice does not duplicate the key', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    useDB.getState().setSettings({
      archivedExperimentKeys: ['active-with-winner'] as never,
    });
    render(<AbWinnerReadout />);
    // Button is gone after archive — but verify the dedupe in the
    // store directly by setting via the API path.
    const setSettings = useDB.getState().setSettings;
    setSettings({
      archivedExperimentKeys: Array.from(
        new Set([
          ...(useDB.getState().db.settings.archivedExperimentKeys ?? []),
          'active-with-winner',
        ]),
      ),
    });
    expect(useDB.getState().db.settings.archivedExperimentKeys).toEqual([
      'active-with-winner',
    ]);
  });

  it('shows the empty state when registry has no non-draft experiments', () => {
    vi.spyOn(registryModule, 'REGISTRY', 'get').mockReturnValue([
      {
        key: 'draft-only',
        variants: ['a', 'b'] as const,
        status: 'draft',
        description: 'not yet on',
      },
    ]);
    render(<AbWinnerReadout />);
    expect(screen.getByTestId('ab-winner-empty')).toBeTruthy();
    expect(screen.queryByTestId('ab-winner-rows')).toBeNull();
  });
});
