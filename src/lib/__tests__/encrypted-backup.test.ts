import { describe, expect, it } from 'vitest';
import { decryptBackup, encryptBackup } from '../encrypted-backup';
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
    advancedGoals: [],
    presets: [],
    healthMetrics: [],
    meta: {},
    ...overrides,
  };
}

describe('encryptBackup → decryptBackup — round-trip', () => {
  it('round-trips with the correct passphrase', async () => {
    const original = db();
    const encrypted = await encryptBackup(original, 'correct-horse-battery');
    expect(encrypted.startsWith('ALCH-BACKUP-V1\n')).toBe(true);
    const restored = await decryptBackup(encrypted, 'correct-horse-battery');
    expect(restored.entries).toEqual(original.entries);
    expect(restored.settings).toEqual(original.settings);
  }, 20_000);

  it('rejects empty / very short passphrases on encrypt', async () => {
    await expect(encryptBackup(db(), '')).rejects.toThrow(/at least 6/);
    await expect(encryptBackup(db(), 'abc')).rejects.toThrow(/at least 6/);
  });

  it('wrong passphrase fails decrypt with a clear error', async () => {
    const file = await encryptBackup(db(), 'correct-pass');
    await expect(decryptBackup(file, 'wrong-pass')).rejects.toThrow(
      /Wrong passphrase|tampered/,
    );
  }, 20_000);

  it('tampered ciphertext fails decrypt (AEAD MAC catches it)', async () => {
    const file = await encryptBackup(db(), 'correct-pass');
    const lines = file.split('\n');
    // Flip a character in the ciphertext line (last line)
    const ct = lines[3]!;
    lines[3] = ct[0] === 'A' ? 'B' + ct.slice(1) : 'A' + ct.slice(1);
    await expect(decryptBackup(lines.join('\n'), 'correct-pass')).rejects.toThrow();
  }, 20_000);

  it('rejects file with wrong magic header', async () => {
    await expect(
      decryptBackup('NOT-OUR-FORMAT\n{}\nx\ny', 'pass'),
    ).rejects.toThrow(/Unsupported backup format/);
  });

  it('rejects malformed file (too few lines)', async () => {
    await expect(decryptBackup('ALCH-BACKUP-V1\n{}', 'pass')).rejects.toThrow(
      /malformed/,
    );
  });

  it('rejects file with corrupted KDF params JSON', async () => {
    await expect(
      decryptBackup('ALCH-BACKUP-V1\nNOT-JSON\nx\ny', 'pass'),
    ).rejects.toThrow(/KDF params/);
  });

  it('produces different ciphertext on repeated encrypt (random nonce + salt)', async () => {
    const a = await encryptBackup(db(), 'same-pass');
    const b = await encryptBackup(db(), 'same-pass');
    expect(a).not.toBe(b);
  }, 20_000);

  /* [R27-3] User-installed dictionary backup audit. The encrypted
   * backup serializes the entire DB via JSON.stringify, which
   * includes:
   *   - settings.userCrisisLine (custom crisis number)
   *   - db.presets (custom drink presets)
   *   - db.advancedGoals (custom goals)
   * Round-trip must preserve all three so device-swap / reinstall
   * users don't lose content they personally added. */
  it('[R27-3] round-trips a custom user crisis line', async () => {
    const original = db({
      settings: {
        ...db().settings,
        userCrisisLine: {
          label: "My therapist",
          phone: "+1-555-0100",
          description: "weekday hours",
        },
      },
    });
    const encrypted = await encryptBackup(original, 'correct-horse-battery');
    const restored = await decryptBackup(encrypted, 'correct-horse-battery');
    expect(restored.settings.userCrisisLine).toEqual({
      label: "My therapist",
      phone: "+1-555-0100",
      description: "weekday hours",
    });
  }, 20_000);

  it('[R27-3] round-trips custom drink presets', async () => {
    const original = db({
      presets: [
        { name: "House porter", volumeMl: 568, abvPct: 5.4 },
        { name: "Costco vodka pour", volumeMl: 60, abvPct: 40 },
      ],
    });
    const encrypted = await encryptBackup(original, 'correct-horse-battery');
    const restored = await decryptBackup(encrypted, 'correct-horse-battery');
    expect(restored.presets).toEqual(original.presets);
  }, 20_000);

  it('[R27-3] round-trips custom advanced goals', async () => {
    const original = db({
      advancedGoals: [
        {
          id: 'goal-1',
          type: 'streak',
          title: 'Three dry days a week',
          description: 'aim for at least three alcohol-free days every week',
          target: 3,
          current: 0,
          unit: 'days',
          isActive: true,
        },
      ],
    });
    const encrypted = await encryptBackup(original, 'correct-horse-battery');
    const restored = await decryptBackup(encrypted, 'correct-horse-battery');
    expect(restored.advancedGoals).toEqual(original.advancedGoals);
  }, 20_000);

  it('[R27-3] round-trips ALL user-installed content together (full simulated device-swap)', async () => {
    const original = db({
      settings: {
        ...db().settings,
        userCrisisLine: { label: 'Therapist', phone: '+1-555-0100' },
      },
      presets: [
        { name: 'Local IPA', volumeMl: 473, abvPct: 6.5 },
      ],
      advancedGoals: [
        {
          id: 'goal-2',
          type: 'reduction',
          title: '10% less this month',
          description: '',
          target: 10,
          current: 0,
          unit: '%',
          isActive: true,
        },
      ],
    });
    const encrypted = await encryptBackup(original, 'a-good-passphrase');
    const restored = await decryptBackup(encrypted, 'a-good-passphrase');
    expect(restored.settings.userCrisisLine).toEqual(original.settings.userCrisisLine);
    expect(restored.presets).toEqual(original.presets);
    expect(restored.advancedGoals).toEqual(original.advancedGoals);
  }, 20_000);
});
