import React from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CrashReportsToggle from '../CrashReportsToggle';
import { useDB } from '../../../store/db';
import {
  __resetCrashReporterForTests,
  __getCrashReporterConfigForTests,
} from '../../../lib/crashReporter';

beforeEach(() => {
  __resetCrashReporterForTests();
  useDB.setState((s) => ({
    db: {
      ...s.db,
      settings: { ...s.db.settings, crashReportsEnabled: undefined },
    },
  }));
});

describe('[R19-4] CrashReportsToggle', () => {
  it('renders unchecked by default (opt-in, never opt-out)', () => {
    render(<CrashReportsToggle />);
    const checkbox = screen.getByTestId('crash-reports-checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('toggles settings.crashReportsEnabled and the live reporter config', () => {
    render(<CrashReportsToggle />);
    const checkbox = screen.getByTestId('crash-reports-checkbox') as HTMLInputElement;

    fireEvent.click(checkbox);
    expect(useDB.getState().db.settings.crashReportsEnabled).toBe(true);
    expect(__getCrashReporterConfigForTests().enabled).toBe(true);

    fireEvent.click(checkbox);
    expect(useDB.getState().db.settings.crashReportsEnabled).toBe(false);
    expect(__getCrashReporterConfigForTests().enabled).toBe(false);
  });

  it('explicit copy lists what we send and what we do not', () => {
    render(<CrashReportsToggle />);
    /* These specific phrases are the privacy receipt — if the test
     * fails because the copy changed, re-verify the copy still
     * accurately reflects what configureCrashReporter sends. */
    expect(screen.getByText(/error message, stack trace/i)).toBeInTheDocument();
    expect(screen.getByText(/no breadcrumbs/i)).toBeInTheDocument();
    expect(screen.getByText(/no IP address/i)).toBeInTheDocument();
  });
});
