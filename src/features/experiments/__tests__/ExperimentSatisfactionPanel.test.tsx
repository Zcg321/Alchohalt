/**
 * [R27-2] ExperimentSatisfactionPanel — basic render tests.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExperimentSatisfactionPanel from '../ExperimentSatisfactionPanel';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';
import * as bucket from '../bucket';
import type { SatisfactionSignal } from '../../satisfaction/satisfaction';

beforeEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  useDB.getState().setSettings({
    satisfactionSignals: undefined as never,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
});

describe('[R27-2] ExperimentSatisfactionPanel', () => {
  it('shows the empty state when no exposures are recorded', () => {
    vi.spyOn(bucket, 'readExposures').mockReturnValue([]);
    render(<ExperimentSatisfactionPanel />);
    expect(screen.getByTestId('experiment-satisfaction-empty')).toBeTruthy();
    expect(screen.queryByTestId('experiment-satisfaction-rows')).toBeNull();
  });

  it('renders a row per exposed experiment with its variant', () => {
    vi.spyOn(bucket, 'readExposures').mockReturnValue([
      { key: 'goal-nudge-copy-2026Q2', variant: 'softer', ts: 1000 },
    ]);
    const sigs: SatisfactionSignal[] = [
      { surface: 'today-panel', response: 'up', ts: 2000 },
    ];
    useDB.getState().setSettings({ satisfactionSignals: sigs as never });
    render(<ExperimentSatisfactionPanel />);
    expect(
      screen.getByTestId('experiment-satisfaction-row-goal-nudge-copy-2026Q2'),
    ).toBeTruthy();
    expect(
      screen.getByTestId('experiment-satisfaction-variant-goal-nudge-copy-2026Q2').textContent,
    ).toBe('softer');
    expect(
      screen.getByTestId('experiment-satisfaction-cell-goal-nudge-copy-2026Q2').textContent,
    ).toMatch(/1 up.*0 down.*100%/);
  });

  it('shows the no-signals dash when there are exposures but no post-exposure signals', () => {
    vi.spyOn(bucket, 'readExposures').mockReturnValue([
      { key: 'goal-nudge-copy-2026Q2', variant: 'control', ts: 5000 },
    ]);
    // Pre-exposure signal — should NOT be counted.
    const sigs: SatisfactionSignal[] = [
      { surface: 'today-panel', response: 'up', ts: 100 },
    ];
    useDB.getState().setSettings({ satisfactionSignals: sigs as never });
    render(<ExperimentSatisfactionPanel />);
    const cell = screen.getByTestId('experiment-satisfaction-cell-goal-nudge-copy-2026Q2');
    expect(cell.textContent).toMatch(/no signals after exposure/);
  });
});
