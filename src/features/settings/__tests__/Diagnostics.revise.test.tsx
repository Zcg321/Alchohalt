/**
 * [R10-C] Diagnostics card "Update my intent" — re-asks step 1 of
 * onboarding and preserves prior answers in history.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Diagnostics from '../Diagnostics';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';

beforeEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  useDB.setState({
    db: {
      ...useDB.getState().db,
      settings: {
        ...useDB.getState().db.settings,
        onboardingDiagnostics: {
          status: 'completed',
          intent: 'cut-back',
          trackStyle: 'day-by-day',
          completedAt: 1700000000000,
        },
        onboardingDiagnosticsHistory: undefined,
      },
    },
  });
});

afterEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
});

describe('Diagnostics revise flow', () => {
  it('renders Update my intent button', () => {
    render(<Diagnostics />);
    expect(screen.getByTestId('diagnostics-update-intent')).toBeInTheDocument();
  });

  it('opens IntentRevisionModal when clicked', () => {
    render(<Diagnostics />);
    fireEvent.click(screen.getByTestId('diagnostics-update-intent'));
    expect(screen.getByTestId('intent-revision-modal')).toBeInTheDocument();
  });

  it('records new intent and appends prior to history', () => {
    render(<Diagnostics />);
    fireEvent.click(screen.getByTestId('diagnostics-update-intent'));
    fireEvent.click(screen.getByTestId('intent-revision-quit'));

    const settings = useDB.getState().db.settings;
    expect(settings.onboardingDiagnostics?.intent).toBe('quit');
    expect(settings.onboardingDiagnostics?.trackStyle).toBe('day-by-day'); // preserved
    const history = settings.onboardingDiagnosticsHistory ?? [];
    expect(history).toHaveLength(1);
    expect(history[0]?.intent).toBe('cut-back');
    expect(history[0]?.revisedAt).toBeGreaterThan(0);
  });

  it('shows history count after a revision', () => {
    useDB.getState().setSettings({
      onboardingDiagnosticsHistory: [
        {
          status: 'completed',
          intent: 'cut-back',
          completedAt: 1600000000000,
          revisedAt: 1700000000000,
        },
      ],
    });
    render(<Diagnostics />);
    expect(screen.getByText(/1 prior answer/i)).toBeInTheDocument();
  });
});
