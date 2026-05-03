/**
 * [R20-4] Storage migration contract.
 *
 * Pins migrateDB() behavior so future schema bumps (v1 → v2) land
 * with explicit fixture-coverage rather than ad-hoc shape changes.
 * Today CURRENT_DB_VERSION is 1; this test file establishes the
 * patterns a future v2 fixture should follow:
 *
 *   1. Fixture for the OLD shape (e.g. preV1, v1).
 *   2. Migration test: feed old shape into migrateDB(old, oldV, newV)
 *      and assert the result is shape-correct + data-preserving.
 *   3. Idempotence test: migrateDB(currentShape, currentV, currentV)
 *      returns the same shape (no double-bump).
 *   4. Forward-fixture test: a v(N+1) fixture passed with from=N
 *      doesn't lose its v(N+1)-only fields.
 *
 * Real-fixture-data per version: the legacy / v1 fixtures here
 * mirror the actual user data shape, including drinks with mood
 * tags and goals. A future v2 fixture should be added next to
 * the v1Fixture below when v2 lands.
 */

import { describe, expect, it } from 'vitest';
import type { DB } from '../../store/db';
import { migrateDB } from '../migrate';

/* ───── Fixtures ───── */

/** Pre-v1 (legacy): no `version` field anywhere. */
const preV1Fixture: Partial<DB> = {
  entries: [
    {
      id: 'e1',
      ts: 1700000000000,
      kind: 'beer',
      stdDrinks: 1.42,
      intention: 'social',
      craving: 0.3,
      halt: { H: true, A: false, L: false, T: false },
    },
  ],
  trash: [],
  settings: {
    language: 'en',
    theme: 'system',
    dailyGoalDrinks: 2,
    weeklyGoalDrinks: 14,
    monthlyBudget: 0,
    reminders: { enabled: false, times: [] },
    showBAC: false,
  } as unknown as DB['settings'],
  advancedGoals: [],
  presets: [],
  meta: {},
};

/** v1: explicit version: 1 on db + settings. */
const v1Fixture: DB = {
  version: 1,
  entries: [
    {
      id: 'e1',
      ts: 1700000000000,
      kind: 'beer',
      stdDrinks: 1.42,
      intention: 'social',
      craving: 0.3,
      halt: { H: true, A: false, L: false, T: false },
    },
  ],
  trash: [],
  settings: {
    version: 1,
    language: 'en',
    theme: 'system',
    dailyGoalDrinks: 2,
    weeklyGoalDrinks: 14,
    monthlyBudget: 0,
    reminders: { enabled: false, times: [] },
    showBAC: false,
  } as DB['settings'],
  advancedGoals: [],
  presets: [
    { name: 'Beer (12oz)', volumeMl: 355, abvPct: 5.0 },
  ],
  healthMetrics: [],
  meta: {},
};

/* ───── Tests ───── */

describe('[R20-4] migrateDB pre-v1 → v1', () => {
  it('stamps version=1 on the db when input has no version', () => {
    const result = migrateDB(preV1Fixture as DB, undefined, 1);
    expect(result).toBeDefined();
    expect(result!.version).toBe(1);
  });

  it('stamps version=1 on settings when settings exists', () => {
    const result = migrateDB(preV1Fixture as DB, undefined, 1);
    expect(result!.settings.version).toBe(1);
  });

  it('preserves entries array byte-for-byte across migration', () => {
    const result = migrateDB(preV1Fixture as DB, undefined, 1);
    expect(result!.entries).toEqual(preV1Fixture.entries);
  });

  it('preserves user-customized goal numbers', () => {
    const result = migrateDB(preV1Fixture as DB, undefined, 1);
    expect(result!.settings.dailyGoalDrinks).toBe(2);
    expect(result!.settings.weeklyGoalDrinks).toBe(14);
  });
});

describe('[R20-4] migrateDB v1 → v1 (idempotent)', () => {
  it('returns a db with the same version', () => {
    const result = migrateDB(v1Fixture, 1, 1);
    expect(result!.version).toBe(1);
  });

  it('preserves entries identically', () => {
    const result = migrateDB(v1Fixture, 1, 1);
    expect(result!.entries).toEqual(v1Fixture.entries);
  });

  it('preserves presets', () => {
    const result = migrateDB(v1Fixture, 1, 1);
    expect(result!.presets).toEqual(v1Fixture.presets);
  });

  it('does not mutate the input object', () => {
    const before = JSON.stringify(v1Fixture);
    migrateDB(v1Fixture, 1, 1);
    expect(JSON.stringify(v1Fixture)).toBe(before);
  });
});

describe('[R20-4] migrateDB undefined / corrupt input', () => {
  it('returns undefined when persisted is undefined', () => {
    expect(migrateDB(undefined, undefined, 1)).toBeUndefined();
  });

  it('returns undefined when persisted is null', () => {
    expect(migrateDB(null as unknown as DB, undefined, 1)).toBeUndefined();
  });
});

describe('[R20-4] migrateDB future-version safety', () => {
  /* If a user roams between devices and downgrades the app, a v2
   * fixture might land on a v1-aware client. Today migrateDB just
   * stamps `to`, which would lose v2-only fields if any existed.
   * When v2 lands, this test should be EDITED to fail loudly until
   * the migrator implements proper down-migration OR a graceful-
   * degradation path. For now, the assertion documents the gap. */
  it('TODO when v2 lands: define down-migration policy', () => {
    /* Smoke: a fictional v2-shaped fixture passes through current
     * migrate.ts without loss of unknown fields. Today the migrator
     * spreads the input, so unknown fields survive. */
    const v2ShapedFixture = {
      ...v1Fixture,
      futureField: 'should-survive',
    } as DB & { futureField: string };
    const result = migrateDB(v2ShapedFixture, 2, 1) as (DB & { futureField?: string }) | undefined;
    expect(result?.futureField).toBe('should-survive');
  });
});
