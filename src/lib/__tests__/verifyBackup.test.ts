import { describe, expect, it } from 'vitest';
import { encryptBackup, verifyBackup } from '../encrypted-backup';
import type { DB } from '../../store/db';

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
        notes: 'birthday party',
      },
      {
        id: 'a2',
        ts: 1_700_086_400_000,
        kind: 'wine',
        stdDrinks: 1.5,
        intention: 'taste',
        craving: 1,
        halt: { H: false, A: false, L: false, T: false },
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
    advancedGoals: [
      {
        id: 'g1',
        type: 'streak',
        title: '7-day streak',
        description: 'Consecutive days without alcohol',
        target: 7,
        current: 0,
        unit: 'days',
        isActive: true,
      },
    ],
    presets: [] as DB['presets'],
    healthMetrics: [] as DB['healthMetrics'],
    meta: {},
    ...overrides,
  };
}

describe('verifyBackup', () => {
  it('reports ok with entry/goal/preset counts on a valid backup', async () => {
    const file = await encryptBackup(db(), 'correct-pass-123');
    const report = await verifyBackup(file, 'correct-pass-123');
    expect(report.ok).toBe(true);
    if (report.ok) {
      expect(report.entriesCount).toBe(2);
      expect(report.goalsCount).toBe(1);
      expect(report.presetsCount).toBe(0);
      expect(report.schemaVersion).toBe(1);
      expect(report.sizeBytes).toBeGreaterThan(100);
      expect(report.verifiedAt).toBeGreaterThan(0);
    }
  }, 20_000);

  it('returns wrong-passphrase report (not throw) on bad passphrase', async () => {
    const file = await encryptBackup(db(), 'correct-pass-123');
    const report = await verifyBackup(file, 'WRONG-pass');
    expect(report.ok).toBe(false);
    if (!report.ok) {
      expect(report.error).toMatch(/passphrase didn't unlock/i);
      expect(report.hint).toMatch(/case-sensitive/i);
    }
  }, 20_000);

  it('returns format-error report when magic header is wrong', async () => {
    const report = await verifyBackup('NOT-OUR-FORMAT\n{}\nx\ny', 'pass');
    expect(report.ok).toBe(false);
    if (!report.ok) {
      expect(report.error).toMatch(/isn't an Alchohalt backup/i);
      expect(report.hint).toMatch(/\.alch-backup/);
    }
  });

  it('returns malformed-file report when truncated', async () => {
    const report = await verifyBackup('ALCH-BACKUP-V1\n{}', 'pass');
    expect(report.ok).toBe(false);
    if (!report.ok) {
      expect(report.error).toMatch(/incomplete|truncated/i);
    }
  });

  it('returns malformed-file report when KDF params are corrupt', async () => {
    const report = await verifyBackup(
      'ALCH-BACKUP-V1\nNOT-JSON\nx\ny',
      'pass-anything',
    );
    expect(report.ok).toBe(false);
    if (!report.ok) {
      expect(report.error).toMatch(/incomplete|truncated/i);
    }
  });

  it('returns missing-passphrase report when passphrase is empty', async () => {
    const file = await encryptBackup(db(), 'correct-pass-123');
    const report = await verifyBackup(file, '');
    expect(report.ok).toBe(false);
    if (!report.ok) {
      expect(report.error).toMatch(/Passphrase required/i);
    }
  }, 20_000);

  it('returns tampered-ciphertext report', async () => {
    const file = await encryptBackup(db(), 'correct-pass-123');
    const lines = file.split('\n');
    const ct = lines[3]!;
    lines[3] = (ct[0] === 'A' ? 'B' : 'A') + ct.slice(1);
    const report = await verifyBackup(lines.join('\n'), 'correct-pass-123');
    expect(report.ok).toBe(false);
    if (!report.ok) {
      // Tampering surfaces as "wrong passphrase" because the AEAD MAC
      // can't tell us *which* failed — both look like decrypt failure.
      // What matters is we don't claim the file is valid.
      expect(report.error).toMatch(/passphrase|damaged/i);
    }
  }, 20_000);

  it('reports structural-damage if decrypted content is missing entries', async () => {
    // Hand-craft a "valid" backup with a degenerate DB that's missing
    // the entries array. Use the public encrypt path with a custom
    // payload by overriding the entries field to non-array. Easiest:
    // encrypt a normal DB then mutate ciphertext? No — AEAD will catch
    // that. Instead, encrypt a partial DB cast to any.
    const partial = { version: 1, settings: db().settings } as unknown as DB;
    const file = await encryptBackup(partial, 'pass-for-damaged');
    const report = await verifyBackup(file, 'pass-for-damaged');
    expect(report.ok).toBe(false);
    if (!report.ok) {
      expect(report.error).toMatch(/damaged/i);
      expect(report.hint).toMatch(/Missing core fields/i);
    }
  }, 20_000);

  it('does not mutate the source file body', async () => {
    const file = await encryptBackup(db(), 'correct-pass-123');
    const before = file;
    await verifyBackup(file, 'correct-pass-123');
    expect(file).toBe(before);
  }, 20_000);
});
