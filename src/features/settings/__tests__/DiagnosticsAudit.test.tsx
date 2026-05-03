import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DiagnosticsAudit from '../DiagnosticsAudit';
import { useDB } from '../../../store/db';
import { REGISTRY } from '../../experiments/registry';
import { recordExposure, clearExposures } from '../../experiments/bucket';

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
  it('renders the audit fieldsets: Notifications / Accessibility / Locale / Storage / Backup', () => {
    render(<DiagnosticsAudit />);
    /* The legend text appears once per fieldset; getAllByText handles
     * cases where "Notifications" might match both the legend and a
     * type label inside the panel. */
    expect(screen.getAllByText(/Notifications/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/^Accessibility$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Locale$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Storage$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Backup$/i)).toBeInTheDocument();
  });

  it('[R19-3] StorageFieldset shows app-data and entry-count rows', async () => {
    render(<DiagnosticsAudit />);
    const appUsed = await screen.findByTestId('audit-storage-app-used');
    expect(appUsed).toBeInTheDocument();
    expect(appUsed.textContent).toMatch(/soft cap/);

    const entryCount = await screen.findByTestId('audit-storage-entry-count');
    expect(entryCount).toBeInTheDocument();
    /* Default test DB has zero entries, so entry-count value renders "0". */
    expect(entryCount.textContent).toMatch(/0/);
  });

  it('[R19-3] StorageFieldset hides warning when below 80% threshold', async () => {
    render(<DiagnosticsAudit />);
    /* Wait for usage to compute */
    await screen.findByTestId('audit-storage-app-used');
    /* Default DB is small — no warning element should render. */
    expect(screen.queryByTestId('audit-storage-warning')).toBeNull();
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

  it('reports "never" for last-backup when no auto-verification has run', () => {
    // [R15-3] R15 replaces the R13-4 "not tracked" placeholder with
    // a real lastValue derived from settings.lastBackupAutoVerification.
    render(<DiagnosticsAudit />);
    expect(screen.getByTestId('audit-backup-last').textContent).toMatch(/never/i);
  });

  it('survives missing window.matchMedia (SSR / older test envs)', () => {
    const orig = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', { value: undefined, writable: true });
    expect(() => render(<DiagnosticsAudit />)).not.toThrow();
    Object.defineProperty(window, 'matchMedia', { value: orig, writable: true });
  });

  describe('[R17-B] active-experiment arm + exposure surfacing', () => {
    beforeEach(() => clearExposures());

    it('renders one row per active experiment with arm + exposure count', () => {
      render(<DiagnosticsAudit />);
      const activeExperiments = REGISTRY.filter((e) => e.status === 'active');
      // R16 ships at least the onboarding-chip + goal-nudge experiments active.
      expect(activeExperiments.length).toBeGreaterThan(0);
      for (const exp of activeExperiments) {
        const row = screen.getByTestId(`audit-exp-row-${exp.key}`);
        expect(row).toBeInTheDocument();
        // Arm label format: "arm: <variant> · N exposure[s]"
        expect(row.textContent).toMatch(/arm:/);
        expect(row.textContent).toMatch(/exposure/);
      }
    });

    it('counts recorded exposures per experiment key', () => {
      const active = REGISTRY.filter((e) => e.status === 'active');
      if (active.length === 0) return;
      const first = active[0]!;
      recordExposure(first.key, first.variants[0]!);
      recordExposure(first.key, first.variants[0]!);
      recordExposure(first.key, first.variants[0]!);
      render(<DiagnosticsAudit />);
      const cell = screen.getByTestId(`audit-exp-count-${first.key}`);
      expect(cell.textContent).toMatch(/3 exposures/);
    });

    it('reads the singular form when exactly one exposure has fired', () => {
      const active = REGISTRY.filter((e) => e.status === 'active');
      if (active.length === 0) return;
      const first = active[0]!;
      recordExposure(first.key, first.variants[0]!);
      render(<DiagnosticsAudit />);
      const cell = screen.getByTestId(`audit-exp-count-${first.key}`);
      expect(cell.textContent?.trim()).toBe('1 exposure');
    });
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
