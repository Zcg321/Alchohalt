import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DiagnosticsAudit from '../DiagnosticsAudit';
import { useDB } from '../../../store/db';

/* [R13-4] Read-only audit panel — surfaces what the app is doing
 * right now (notifications, accessibility, locale, backup). Tests
 * pin the rendered audit rows + the privacy posture (no fetch, no
 * remote, all values from local state or media queries). */

beforeEach(() => {
  /* Reset DB to defaults each test so prior writes don't leak. */
  useDB.setState((s) => ({
    db: {
      ...s.db,
      settings: {
        ...s.db.settings,
        calmNotifications: undefined,
        theme: 'light',
        language: 'en',
      },
    },
  }));
});

describe('[R13-4] DiagnosticsAudit panel', () => {
  it('renders the four audit fieldsets: Notifications / Accessibility / Locale / Backup', () => {
    render(<DiagnosticsAudit />);
    /* The legend text appears once per fieldset; getAllByText handles
     * cases where "Notifications" might match both the legend and a
     * type label inside the panel. */
    expect(screen.getAllByText(/Notifications/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/^Accessibility$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Locale$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Backup$/i)).toBeInTheDocument();
  });

  it('shows the calm-config defaults when calmNotifications is undefined', () => {
    render(<DiagnosticsAudit />);
    /* Default cap = 2, quiet hours 23:00 → 07:00, only Daily check-in on. */
    expect(screen.getByTestId('audit-notif-cap').textContent).toMatch(/2/);
    expect(screen.getByTestId('audit-notif-quiet').textContent).toMatch(/23:00.*07:00/);
    expect(screen.getByTestId('audit-notif-types').textContent).toMatch(/Daily check-in/);
  });

  it('shows "none" when the user has disabled all notification types', () => {
    useDB.setState((s) => ({
      db: {
        ...s.db,
        settings: {
          ...s.db.settings,
          calmNotifications: {
            types: {
              dailyCheckin: false,
              goalMilestone: false,
              retrospective: false,
              backupVerification: false,
              weeklyRecap: false,
            },
          },
        },
      },
    }));
    render(<DiagnosticsAudit />);
    expect(screen.getByTestId('audit-notif-types').textContent).toMatch(/none/);
  });

  it('shows the user-overridden quiet-hours window', () => {
    useDB.setState((s) => ({
      db: {
        ...s.db,
        settings: {
          ...s.db.settings,
          calmNotifications: { quietHours: { startHour: 22, endHour: 8 } },
        },
      },
    }));
    render(<DiagnosticsAudit />);
    expect(screen.getByTestId('audit-notif-quiet').textContent).toMatch(/22:00.*08:00/);
  });

  it('always shows the app-wide quiet-hours floor (cannot widen past)', () => {
    render(<DiagnosticsAudit />);
    expect(screen.getByTestId('audit-notif-floor').textContent).toMatch(/cannot widen past/i);
  });

  it('renders accessibility rows: theme, reduced motion, high contrast', () => {
    render(<DiagnosticsAudit />);
    expect(screen.getByTestId('audit-a11y-theme')).toBeInTheDocument();
    expect(screen.getByTestId('audit-a11y-motion')).toBeInTheDocument();
    expect(screen.getByTestId('audit-a11y-contrast')).toBeInTheDocument();
  });

  it('renders the active language row', () => {
    render(<DiagnosticsAudit />);
    expect(screen.getByTestId('audit-locale-lang')).toBeInTheDocument();
    expect(screen.getByTestId('audit-locale-stored')).toBeInTheDocument();
  });

  it('honestly reports "not tracked" for last-backup since the verifier does not persist a ts', () => {
    render(<DiagnosticsAudit />);
    expect(screen.getByTestId('audit-backup-last').textContent).toMatch(/not tracked/i);
  });

  it('survives missing window.matchMedia (SSR / older test envs)', () => {
    const orig = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', { value: undefined, writable: true });
    expect(() => render(<DiagnosticsAudit />)).not.toThrow();
    Object.defineProperty(window, 'matchMedia', { value: orig, writable: true });
  });

  it('matchMedia returning a matching reduced-motion query reflects in the audit row', () => {
    const orig = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation((q: string) => ({
        matches: q.includes('reduced-motion'),
        media: q,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      })),
      writable: true,
    });
    render(<DiagnosticsAudit />);
    expect(screen.getByTestId('audit-a11y-motion').textContent).toMatch(/on \(system\)/);
    Object.defineProperty(window, 'matchMedia', { value: orig, writable: true });
  });
});
