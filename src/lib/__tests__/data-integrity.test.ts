/**
 * Data integrity tests for export/import, schema migration, and data validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createExport, validateImport, processImport, type ExportData } from '../data-export';
import { migrateToVersion, validateSchema, CURRENT_SCHEMA_VERSION } from '../schema';
import type { DB } from '../../store/db';

const mockDB: DB = {
  version: 1,
  entries: [
    {
      id: 'test-1',
      ts: Date.now(),
      kind: 'beer',
      stdDrinks: 1.2,
      cost: 5.50,
      intention: 'social',
      craving: 3,
      halt: { H: false, A: false, L: true, T: false },
      altAction: 'Called a friend instead',
    }
  ],
  trash: [],
  settings: {
    version: 1,
    language: 'en',
    theme: 'system',
    dailyGoalDrinks: 2,
    weeklyGoalDrinks: 10,
    monthlyBudget: 200,
    reminders: { enabled: true, times: ['18:00'] },
    showBAC: false
  },
  advancedGoals: [],
  presets: [
    { name: 'Beer (12oz)', volumeMl: 355, abvPct: 5.0 }
  ],
  meta: {}
};

describe('Data Export/Import Integrity', () => {
  let exportData: ExportData;

  beforeEach(async () => {
    exportData = await createExport(mockDB);
  });

  it('should create valid export with checksum', async () => {
    expect(exportData).toHaveProperty('version');
    expect(exportData).toHaveProperty('timestamp');
    expect(exportData).toHaveProperty('data');
    expect(exportData).toHaveProperty('checksum');
    expect(typeof exportData.checksum).toBe('string');
    expect(exportData.checksum.length).toBeGreaterThan(0);
  });

  it('should validate correct export data', async () => {
    const result = await validateImport(exportData);
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject corrupted checksum', async () => {
    const corruptedData = { ...exportData, checksum: 'invalid-checksum' };
    const result = await validateImport(corruptedData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('integrity check failed');
  });

  it('should reject invalid data structure', async () => {
    const invalidData = { ...exportData, data: null };
    const result = await validateImport(invalidData);
    expect(result.success).toBe(false);
  });

  it('should handle missing required fields', async () => {
    const incompleteData = { version: 1, timestamp: new Date().toISOString() };
    const result = await validateImport(incompleteData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required fields');
  });

  it('should process import with conflict detection', async () => {
    const { migratedData, conflicts } = await processImport(exportData, mockDB);
    expect(migratedData).toBeTruthy();
    expect(Array.isArray(conflicts)).toBe(true);
  });
});

describe('Schema Migration', () => {
  it('should validate correct schema', () => {
    const result = validateSchema(mockDB);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing required fields', () => {
    const invalidDB = { ...mockDB, entries: null };
    const result = validateSchema(invalidDB);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should migrate to current version', () => {
    const v1Data = { ...mockDB, version: 1 };
    const migrated = migrateToVersion(v1Data, CURRENT_SCHEMA_VERSION);
    expect(migrated.version).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('should handle forward migration', () => {
    const oldData = { ...mockDB, version: 1 };
    const migrated = migrateToVersion(oldData, 2);
    expect(migrated.version).toBe(2);
    if (migrated.settings) {
      expect(migrated.settings).toHaveProperty('subscription');
    }
  });

  it('should handle rollback migration', () => {
    const newData = {
      ...mockDB,
      version: 2,
      settings: {
        ...mockDB.settings,
        subscription: { plan: 'free', status: 'inactive' }
      }
    };
    const rolledBack = migrateToVersion(newData, 1);
    expect(rolledBack.version).toBe(1);
    expect(rolledBack.settings.subscription).toBeUndefined();
  });
});

describe('Data Integrity Stress Tests', () => {
  it('should handle large datasets', async () => {
    const largeDB = {
      ...mockDB,
      entries: Array.from({ length: 1000 }, (_, i) => ({
        ...mockDB.entries[0],
        id: `test-${i}`,
        ts: Date.now() + i * 1000
      }))
    };

    const exportData = await createExport(largeDB);
    const validation = await validateImport(exportData);
    expect(validation.success).toBe(true);
  });

  it('should preserve data precision through export/import cycle', async () => {
    const preciseDB = {
      ...mockDB,
      entries: [{
        ...mockDB.entries[0],
        stdDrinks: 1.23456789,
        cost: 12.345,
        ts: 1640995200000 // Specific timestamp
      }]
    };

    const exportData = await createExport(preciseDB);
    const validation = await validateImport(exportData);
    expect(validation.success).toBe(true);

    const { migratedData } = await processImport(exportData, mockDB);
    expect(migratedData.entries[0].stdDrinks).toBe(1.23456789);
    expect(migratedData.entries[0].cost).toBe(12.345);
    expect(migratedData.entries[0].ts).toBe(1640995200000);
  });

  it('should handle edge cases in data validation', () => {
    const edgeCases = [
      null,
      undefined,
      {},
      { version: 'invalid' },
      { version: 1, entries: 'not-array' },
      { version: 1, entries: [], settings: null }
    ];

    edgeCases.forEach(testCase => {
      const result = validateSchema(testCase);
      expect(result.valid).toBe(false);
    });
  });
});