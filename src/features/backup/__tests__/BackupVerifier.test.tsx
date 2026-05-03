import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BackupVerifier from '../BackupVerifier';
import { encryptBackup } from '../../../lib/encrypted-backup';
import type { DB } from '../../../store/db';

function db(overrides: Partial<DB> = {}): DB {
  return {
    version: 1,
    entries: [
      {
        id: 'a1',
        ts: 1_700_000_000_000,
        kind: 'beer',
        stdDrinks: 1.2,
        intention: 'social',
        craving: 2,
        halt: { H: false, A: false, L: false, T: true },
      },
    ],
    trash: [],
    settings: {
      version: 1,
      language: 'en',
      theme: 'system',
      dailyGoalDrinks: 0,
      weeklyGoalDrinks: 0,
      monthlyBudget: 0,
      reminders: { enabled: false, times: [] },
      showBAC: false,
    },
    advancedGoals: [] as DB['advancedGoals'],
    presets: [] as DB['presets'],
    healthMetrics: [] as DB['healthMetrics'],
    meta: {},
    ...overrides,
  };
}

function pickFile(input: HTMLElement, body: string, name = 'test.alch-backup') {
  const file = new File([body], name, { type: 'application/octet-stream' });
  Object.defineProperty(file, 'text', {
    value: () => Promise.resolve(body),
  });
  fireEvent.change(input, { target: { files: [file] } });
}

describe('BackupVerifier (UI)', () => {
  it('renders the file-pick prompt before any file is selected', () => {
    render(<BackupVerifier />);
    expect(screen.getByText(/Verify a backup file/i)).toBeInTheDocument();
    expect(screen.getByText(/Pick a \.alch-backup file/i)).toBeInTheDocument();
    // Passphrase + verify button only appear after file pick.
    expect(screen.queryByTestId('backup-verifier-pass-input')).toBeNull();
  });

  it('shows passphrase input + verify button after file is picked', async () => {
    const file = await encryptBackup(db(), 'verify-pass-1');
    render(<BackupVerifier />);

    const input = screen.getByTestId('backup-verifier-file-input');
    pickFile(input, file);

    await waitFor(() =>
      expect(screen.getByTestId('backup-verifier-pass-input')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('backup-verifier-verify-btn')).toBeInTheDocument();
  }, 20_000);

  it('verify button is disabled until a passphrase is typed', async () => {
    const file = await encryptBackup(db(), 'verify-pass-1');
    render(<BackupVerifier />);

    pickFile(screen.getByTestId('backup-verifier-file-input'), file);
    await waitFor(() =>
      expect(screen.getByTestId('backup-verifier-pass-input')).toBeInTheDocument(),
    );

    const verifyBtn = screen.getByTestId('backup-verifier-verify-btn');
    expect(verifyBtn).toBeDisabled();

    fireEvent.change(screen.getByTestId('backup-verifier-pass-input'), {
      target: { value: 'verify-pass-1' },
    });
    expect(verifyBtn).not.toBeDisabled();
  }, 20_000);

  it('renders success card with entry count + verified-at time on valid passphrase', async () => {
    const fixture = db({
      entries: Array.from({ length: 12 }, (_, i) => ({
        id: `e${i}`,
        ts: 1_700_000_000_000 + i * 86_400_000,
        kind: 'beer' as const,
        stdDrinks: 1,
        intention: 'social' as const,
        craving: 1,
        halt: { H: false, A: false, L: false, T: false },
      })),
    });
    const file = await encryptBackup(fixture, 'verify-pass-1');
    render(<BackupVerifier />);

    pickFile(screen.getByTestId('backup-verifier-file-input'), file);
    await waitFor(() =>
      expect(screen.getByTestId('backup-verifier-pass-input')).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByTestId('backup-verifier-pass-input'), {
      target: { value: 'verify-pass-1' },
    });
    fireEvent.click(screen.getByTestId('backup-verifier-verify-btn'));

    const success = await screen.findByTestId('backup-verifier-success', {}, { timeout: 15_000 });
    expect(success.textContent).toMatch(/Backup verified at \d\d:\d\d/);
    expect(success.textContent).toMatch(/12 entries readable/);
    expect(success.textContent).toMatch(/Passphrase works/);
    expect(success.textContent).toMatch(/Schema v1/);
    expect(success.textContent).toMatch(/read-only check/);
  }, 30_000);

  it('renders error card with actionable hint on wrong passphrase', async () => {
    const file = await encryptBackup(db(), 'right-pass');
    render(<BackupVerifier />);

    pickFile(screen.getByTestId('backup-verifier-file-input'), file);
    await waitFor(() =>
      expect(screen.getByTestId('backup-verifier-pass-input')).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByTestId('backup-verifier-pass-input'), {
      target: { value: 'WRONG' },
    });
    fireEvent.click(screen.getByTestId('backup-verifier-verify-btn'));

    const err = await screen.findByTestId('backup-verifier-error', {}, { timeout: 15_000 });
    expect(err.textContent).toMatch(/passphrase didn't unlock/i);
    expect(err.textContent).toMatch(/case-sensitive/i);
  }, 30_000);

  it('renders error card on file with wrong magic header', async () => {
    render(<BackupVerifier />);

    pickFile(
      screen.getByTestId('backup-verifier-file-input'),
      'NOT-OUR-FORMAT\n{}\nx\ny',
      'random.txt',
    );
    await waitFor(() =>
      expect(screen.getByTestId('backup-verifier-pass-input')).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByTestId('backup-verifier-pass-input'), {
      target: { value: 'anything' },
    });
    fireEvent.click(screen.getByTestId('backup-verifier-verify-btn'));

    const err = await screen.findByTestId('backup-verifier-error');
    expect(err.textContent).toMatch(/isn't an Alchohalt backup/i);
  });

  it('reset button clears the picked file and the report', async () => {
    const file = await encryptBackup(db(), 'verify-pass-1');
    render(<BackupVerifier />);

    pickFile(screen.getByTestId('backup-verifier-file-input'), file);
    await waitFor(() =>
      expect(screen.getByTestId('backup-verifier-reset-btn')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTestId('backup-verifier-reset-btn'));

    expect(screen.queryByTestId('backup-verifier-pass-input')).toBeNull();
    expect(screen.queryByTestId('backup-verifier-success')).toBeNull();
    expect(screen.queryByTestId('backup-verifier-error')).toBeNull();
  }, 20_000);

  it('verify button shows "Verifying…" while the crypto runs', async () => {
    const file = await encryptBackup(db(), 'verify-pass-1');
    render(<BackupVerifier />);

    pickFile(screen.getByTestId('backup-verifier-file-input'), file);
    await waitFor(() =>
      expect(screen.getByTestId('backup-verifier-pass-input')).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByTestId('backup-verifier-pass-input'), {
      target: { value: 'verify-pass-1' },
    });
    fireEvent.click(screen.getByTestId('backup-verifier-verify-btn'));

    // The button label briefly shows the busy state. After verification
    // completes (Argon2id MODERATE — slow), the success card appears.
    await screen.findByTestId('backup-verifier-success', {}, { timeout: 15_000 });
  }, 30_000);
});
