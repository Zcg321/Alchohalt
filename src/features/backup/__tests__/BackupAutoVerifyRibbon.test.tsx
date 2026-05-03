/**
 * [R15-3] BackupAutoVerifyRibbon tests.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import BackupAutoVerifyRibbon from '../BackupAutoVerifyRibbon';
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
        lastBackupAutoVerification: undefined,
        lastBackupRibbonDismissedTs: undefined,
      },
    },
  });
});

afterEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
});

describe('[R15-3] BackupAutoVerifyRibbon', () => {
  it('renders nothing when no verification has run', () => {
    const { container } = render(<BackupAutoVerifyRibbon />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when the last verification succeeded', () => {
    useDB.getState().setSettings({
      lastBackupAutoVerification: { ts: Date.now(), ok: true, type: 'json' },
    });
    const { container } = render(<BackupAutoVerifyRibbon />);
    expect(container.firstChild).toBeNull();
  });

  it('renders ribbon when the last verification failed', () => {
    useDB.getState().setSettings({
      lastBackupAutoVerification: {
        ts: Date.now(),
        ok: false,
        error: 'checksum mismatch',
        type: 'json',
      },
    });
    render(<BackupAutoVerifyRibbon />);
    expect(screen.getByTestId('backup-auto-verify-ribbon')).toBeInTheDocument();
    expect(screen.getByTestId('backup-auto-verify-ribbon-link')).toHaveAttribute(
      'href',
      '#diagnostics-card'
    );
  });

  it('persists dismissedTs when dismiss clicked', () => {
    const ts = Date.now();
    useDB.getState().setSettings({
      lastBackupAutoVerification: { ts, ok: false, type: 'json' },
    });
    render(<BackupAutoVerifyRibbon />);
    fireEvent.click(screen.getByTestId('backup-auto-verify-ribbon-dismiss'));
    expect(useDB.getState().db.settings.lastBackupRibbonDismissedTs).toBe(ts);
  });

  it('hides ribbon after dismiss for the same verification run', () => {
    const ts = Date.now();
    useDB.getState().setSettings({
      lastBackupAutoVerification: { ts, ok: false, type: 'json' },
      lastBackupRibbonDismissedTs: ts,
    });
    const { container } = render(<BackupAutoVerifyRibbon />);
    expect(container.firstChild).toBeNull();
  });

  it('shows ribbon again on a NEWER failed verification', () => {
    const oldTs = 1000;
    const newTs = 2000;
    useDB.getState().setSettings({
      lastBackupAutoVerification: { ts: newTs, ok: false, type: 'json' },
      lastBackupRibbonDismissedTs: oldTs,
    });
    render(<BackupAutoVerifyRibbon />);
    expect(screen.getByTestId('backup-auto-verify-ribbon')).toBeInTheDocument();
  });
});
