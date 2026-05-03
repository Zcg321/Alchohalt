import { describe, it, expect } from 'vitest';
import { createExportWithAutoVerify } from '../backup-auto-verify';
import type { DB } from '../../store/db';

const baseDB: DB = {
  entries: [],
  goals: { dailyCap: 0, weeklyGoal: 0, pricePerStd: 0, baselineMonthlySpend: 0 },
  settings: { showBAC: false, language: 'en' as 'en' | 'es' | 'de' },
  presets: [],
  advancedGoals: [],
  version: 1,
};

describe('[R15-3] createExportWithAutoVerify', () => {
  it('returns ok=true when the export round-trips cleanly', async () => {
    const result = await createExportWithAutoVerify(baseDB);
    expect(result.verification.ok).toBe(true);
    expect(result.verification.type).toBe('json');
    expect(result.verification.error).toBeUndefined();
    expect(result.verification.ts).toBeGreaterThan(0);
    expect(result.payload.checksum).toBeTruthy();
  });

  it('payload preserves the original DB shape', async () => {
    const db: DB = {
      ...baseDB,
      entries: [
        {
          id: 'e1',
          ts: 1700000000000,
          kind: 'beer',
          stdDrinks: 1,
          intention: 'social',
          craving: 0,
          halt: { H: false, A: false, L: false, T: false },
        },
      ],
    };
    const result = await createExportWithAutoVerify(db);
    expect(result.verification.ok).toBe(true);
    expect(result.payload.data.entries).toHaveLength(1);
    expect(result.payload.data.entries[0].id).toBe('e1');
  });

  it('records a numeric timestamp', async () => {
    const before = Date.now();
    const result = await createExportWithAutoVerify(baseDB);
    const after = Date.now();
    expect(result.verification.ts).toBeGreaterThanOrEqual(before);
    expect(result.verification.ts).toBeLessThanOrEqual(after);
  });
});
