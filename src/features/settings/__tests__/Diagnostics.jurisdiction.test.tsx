/**
 * [R15-C] Diagnostics jurisdiction callout.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Diagnostics from '../Diagnostics';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';

beforeEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  // exactOptionalPropertyTypes: stdDrinkSystem is optional without
  // | undefined, so we delete the key rather than assign undefined.
  const current = useDB.getState().db;
  const { stdDrinkSystem: _drop, ...settingsWithoutSys } = current.settings;
  useDB.setState({
    db: {
      ...current,
      settings: {
        ...settingsWithoutSys,
        onboardingDiagnostics: undefined,
      },
    },
  });
});

afterEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('[R15-C] Diagnostics jurisdiction callout', () => {
  it('renders the callout block with the active system label', () => {
    render(<Diagnostics />);
    const block = screen.getByTestId('diagnostics-jurisdiction');
    expect(block).toBeInTheDocument();
    // Default JSDOM locale typically en-US → 'us' label
    expect(block).toHaveTextContent(/std-drink definition/);
  });

  it('shows auto-detected hint when stdDrinkSystem is unset', () => {
    render(<Diagnostics />);
    expect(screen.getByTestId('diagnostics-jurisdiction-auto')).toBeInTheDocument();
    expect(screen.getByTestId('diagnostics-jurisdiction-auto').textContent).toMatch(
      /Detected from your locale/i
    );
  });

  it('hides auto-detected hint when user has explicitly set jurisdiction', () => {
    useDB.getState().setSettings({ stdDrinkSystem: 'uk' });
    render(<Diagnostics />);
    expect(screen.queryByTestId('diagnostics-jurisdiction-auto')).not.toBeInTheDocument();
    const block = screen.getByTestId('diagnostics-jurisdiction');
    expect(block).toHaveTextContent(/United Kingdom/);
  });

  it('renders an anchor link to the settings picker', () => {
    render(<Diagnostics />);
    const link = screen.getByTestId('diagnostics-jurisdiction-link');
    expect(link).toHaveAttribute('href', '#stddrink-system');
    expect(link).toHaveTextContent(/Change jurisdiction/i);
  });

  it('renders the Australia label when stdDrinkSystem === au', () => {
    useDB.getState().setSettings({ stdDrinkSystem: 'au' });
    render(<Diagnostics />);
    expect(screen.getByTestId('diagnostics-jurisdiction')).toHaveTextContent(
      /Australia/
    );
  });
});
