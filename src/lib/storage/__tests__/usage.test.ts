import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  computeAppUsedBytes,
  computeStorageUsage,
  formatBytes,
  readBrowserStorage,
} from '../usage';

/**
 * [R19-3] Storage-usage estimation tests.
 */

describe('formatBytes', () => {
  it('renders bytes with appropriate unit', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(900)).toBe('900 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(50 * 1024 * 1024)).toBe('50.0 MB');
    expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe('2.00 GB');
  });
});

describe('computeAppUsedBytes', () => {
  it('returns 0-ish for empty state', () => {
    const { bytes, entryCount } = computeAppUsedBytes({});
    expect(bytes).toBeGreaterThan(0); // includes JSON braces
    expect(bytes).toBeLessThan(100);
    expect(entryCount).toBe(0);
  });

  it('counts UTF-8 bytes accurately for non-ASCII strings', () => {
    const ascii = computeAppUsedBytes({
      entries: [{ note: 'aaaa' }],
    });
    const unicode = computeAppUsedBytes({
      entries: [{ note: 'éééé' }],
    });
    // Each accented é is 2 UTF-8 bytes vs 1 for ASCII a; the unicode
    // payload should be larger by exactly 4 bytes.
    expect(unicode.bytes - ascii.bytes).toBe(4);
  });

  it('scales linearly with entry count', () => {
    const small = computeAppUsedBytes({
      entries: Array(100).fill({ id: 'x', ts: 0, volumeMl: 350, abvPct: 5 }),
    });
    const big = computeAppUsedBytes({
      entries: Array(1000).fill({ id: 'x', ts: 0, volumeMl: 350, abvPct: 5 }),
    });
    expect(big.bytes).toBeGreaterThan(small.bytes * 9);
    expect(big.bytes).toBeLessThan(small.bytes * 11);
    expect(big.entryCount).toBe(1000);
  });
});

describe('readBrowserStorage', () => {
  const originalNavigator = globalThis.navigator;

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator,
    });
  });

  it('returns nulls when navigator.storage is unavailable', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { storage: undefined },
    });
    const result = await readBrowserStorage();
    expect(result).toEqual({ usedBytes: null, quotaBytes: null });
  });

  it('returns nulls when estimate throws', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { storage: { estimate: () => Promise.reject(new Error('denied')) } },
    });
    const result = await readBrowserStorage();
    expect(result).toEqual({ usedBytes: null, quotaBytes: null });
  });

  it('returns the estimate when API succeeds', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        storage: {
          estimate: () => Promise.resolve({ usage: 1234, quota: 5678 }),
        },
      },
    });
    const result = await readBrowserStorage();
    expect(result).toEqual({ usedBytes: 1234, quotaBytes: 5678 });
  });

  it('returns nulls for missing fields', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        storage: { estimate: () => Promise.resolve({}) },
      },
    });
    const result = await readBrowserStorage();
    expect(result).toEqual({ usedBytes: null, quotaBytes: null });
  });
});

describe('computeStorageUsage', () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { storage: undefined },
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator,
    });
  });

  it('does NOT warn when both signals are far below 80%', async () => {
    const usage = await computeStorageUsage({
      entries: Array(100).fill({ id: 'x', ts: 0 }),
    });
    expect(usage.warn).toBe(false);
    expect(usage.appPercentUsed).toBeLessThan(80);
  });

  it('warns when app-side exceeds 80% of soft cap', async () => {
    // Generate ~42 MB of fake entries — above 80% of the 50 MB soft cap.
    // Each entry serializes to roughly 700 bytes; 60K entries = ~42 MB.
    const fatNote = 'lorem ipsum dolor sit amet consectetur adipiscing elit '.repeat(10);
    const big = Array(80000).fill({
      id: 'long-id-' + 'x'.repeat(50),
      ts: 1234567890,
      volumeMl: 350,
      abvPct: 5,
      mood: 'neutral',
      note: fatNote,
    });
    const usage = await computeStorageUsage({ entries: big });
    expect(usage.warn).toBe(true);
    expect(usage.effectivePercentUsed).toBeGreaterThanOrEqual(80);
  });

  it('warns when browser estimate exceeds 80% even if app-side is small', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        storage: {
          estimate: () =>
            Promise.resolve({ usage: 8_000_000, quota: 10_000_000 }),
        },
      },
    });
    const usage = await computeStorageUsage({ entries: [] });
    expect(usage.warn).toBe(true);
    expect(usage.browserPercentUsed).toBe(80);
  });

  it('does NOT throw on an entirely empty/null state', async () => {
    const usage = await computeStorageUsage({});
    expect(usage.entryCount).toBe(0);
    expect(usage.warn).toBe(false);
  });
});
