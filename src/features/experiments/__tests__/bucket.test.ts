import { describe, it, expect, beforeEach } from 'vitest';
import {
  assignVariant,
  getDeviceBucket,
  resetDeviceBucket,
  recordExposure,
  readExposures,
  clearExposures,
} from '../bucket';
import type { Experiment } from '../registry';

beforeEach(() => {
  // Each test starts with a clean localStorage.
  if (typeof localStorage !== 'undefined') localStorage.clear();
});

describe('[R14-4] getDeviceBucket', () => {
  it('returns a non-empty string', () => {
    const b = getDeviceBucket();
    expect(typeof b).toBe('string');
    expect(b.length).toBeGreaterThan(0);
  });

  it('returns the same value on subsequent calls (persistence)', () => {
    const a = getDeviceBucket();
    const b = getDeviceBucket();
    expect(a).toBe(b);
  });

  it('returns a fresh value after resetDeviceBucket', () => {
    const a = getDeviceBucket();
    resetDeviceBucket();
    const b = getDeviceBucket();
    expect(b).not.toBe(a);
  });
});

describe('[R14-4] assignVariant', () => {
  function makeExp(overrides: Partial<Experiment> = {}): Experiment {
    return {
      key: 'test',
      variants: ['A', 'B'],
      status: 'active',
      description: '',
      ...overrides,
    };
  }

  it('returns the only variant when there is just one', () => {
    expect(assignVariant(makeExp({ variants: ['only'] }), 'bucket')).toBe('only');
  });

  it('throws when variants is empty', () => {
    expect(() => assignVariant(makeExp({ variants: [] }), 'bucket')).toThrow();
  });

  it('throws when weights length mismatches variants', () => {
    const exp = makeExp({ variants: ['A', 'B'], weights: [1, 1, 1] });
    expect(() => assignVariant(exp, 'bucket')).toThrow();
  });

  it('throws when weights sum to zero', () => {
    const exp = makeExp({ variants: ['A', 'B'], weights: [0, 0] });
    expect(() => assignVariant(exp, 'bucket')).toThrow();
  });

  it('is deterministic — same inputs → same variant', () => {
    const exp = makeExp();
    const a = assignVariant(exp, 'bucket-1');
    const b = assignVariant(exp, 'bucket-1');
    expect(a).toBe(b);
  });

  it('different keys can yield different variants for same bucket', () => {
    const expA = makeExp({ key: 'one' });
    const expB = makeExp({ key: 'two' });
    // Not guaranteed to differ for any single bucket — but across many
    // buckets, the fraction differing should approach 0.5. Sample 100
    // buckets and assert at least one differs.
    let differCount = 0;
    for (let i = 0; i < 100; i++) {
      const bucket = `b-${i}`;
      if (assignVariant(expA, bucket) !== assignVariant(expB, bucket)) {
        differCount += 1;
      }
    }
    expect(differCount).toBeGreaterThan(20);
    expect(differCount).toBeLessThan(80);
  });

  it('uniform weights produce roughly even distribution', () => {
    const exp = makeExp();
    let aCount = 0;
    const N = 1000;
    for (let i = 0; i < N; i++) {
      if (assignVariant(exp, `b-${i}`) === 'A') aCount += 1;
    }
    // Expect ~500. Allow ±100 (10% slop).
    expect(aCount).toBeGreaterThan(400);
    expect(aCount).toBeLessThan(600);
  });

  it('weighted distribution skews toward heavier variant', () => {
    const exp = makeExp({ weights: [9, 1] });
    let aCount = 0;
    const N = 1000;
    for (let i = 0; i < N; i++) {
      if (assignVariant(exp, `b-${i}`) === 'A') aCount += 1;
    }
    // Expect ~900. Allow ±60.
    expect(aCount).toBeGreaterThan(840);
    expect(aCount).toBeLessThan(960);
  });
});

describe('[R14-4] exposure log', () => {
  it('starts empty', () => {
    expect(readExposures()).toEqual([]);
  });

  it('records exposures in order', () => {
    recordExposure('exp1', 'A');
    recordExposure('exp1', 'A');
    recordExposure('exp2', 'B');
    const log = readExposures();
    expect(log).toHaveLength(3);
    expect(log[0]?.key).toBe('exp1');
    expect(log[2]?.key).toBe('exp2');
    expect(log[2]?.variant).toBe('B');
    expect(typeof log[0]?.ts).toBe('number');
  });

  it('caps log size at MAX_EXPOSURES (FIFO eviction)', () => {
    for (let i = 0; i < 220; i++) {
      recordExposure(`exp-${i}`, 'A');
    }
    const log = readExposures();
    expect(log.length).toBeLessThanOrEqual(200);
    // Oldest should have been evicted.
    expect(log[0]?.key).not.toBe('exp-0');
    // Newest should be present.
    expect(log[log.length - 1]?.key).toBe('exp-219');
  });

  it('clearExposures empties the log', () => {
    recordExposure('exp1', 'A');
    expect(readExposures()).toHaveLength(1);
    clearExposures();
    expect(readExposures()).toEqual([]);
  });

  it('returns empty array when localStorage holds bad JSON', () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('exp.exposures', 'not-json');
    }
    expect(readExposures()).toEqual([]);
  });
});
