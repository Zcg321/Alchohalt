/**
 * [R9-2] Diagnostics card surfaces local-only onboarding state.
 *
 * Asserts:
 *   - status reads "Not started" before any onboarding interaction
 *   - intent / trackStyle dashes when nothing chosen
 *   - status flips to "Skipped (just-looking)" after the tertiary
 *     skip path persists diagnostics
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
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
        onboardingDiagnostics: undefined,
      },
    },
  });
});

afterEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
});

describe('Diagnostics card', () => {
  it('renders "Not started" before any onboarding interaction', () => {
    render(<Diagnostics />);
    expect(screen.getByTestId('diagnostics-status').textContent).toContain(
      'Not started',
    );
    expect(screen.getByTestId('diagnostics-intent').textContent).toContain('—');
    expect(screen.getByTestId('diagnostics-trackstyle').textContent).toContain(
      '—',
    );
  });

  it('renders the recorded skipPath in parens after a skip', () => {
    useDB.getState().setSettings({
      onboardingDiagnostics: {
        status: 'skipped',
        skipPath: 'just-looking',
        completedAt: 1700000000000,
      },
    });
    render(<Diagnostics />);
    expect(screen.getByTestId('diagnostics-status').textContent).toContain(
      'Skipped',
    );
    expect(screen.getByTestId('diagnostics-status').textContent).toContain(
      'just-looking',
    );
  });

  it('renders the recorded intent + trackStyle on completion', () => {
    useDB.getState().setSettings({
      onboardingDiagnostics: {
        status: 'completed',
        intent: 'cut-back',
        trackStyle: 'thirty-day',
        completedAt: 1700000000000,
      },
    });
    render(<Diagnostics />);
    expect(screen.getByTestId('diagnostics-intent').textContent).toContain(
      'cut-back',
    );
    expect(screen.getByTestId('diagnostics-trackstyle').textContent).toContain(
      'thirty-day',
    );
  });
});
