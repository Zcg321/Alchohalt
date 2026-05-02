import { describe, it, expect } from 'vitest';
import {
  shouldEscalate,
  recordHardTimeOpen,
  recentOpenCount,
  ESCALATION_THRESHOLD,
  ESCALATION_WINDOW_MS,
  DEFAULT_PROVIDERS,
} from '../escalation';

const NOW = new Date('2026-05-15T12:00:00').getTime();
const HOUR = 60 * 60 * 1000;

describe('shouldEscalate', () => {
  it('false on undefined log', () => {
    expect(shouldEscalate(undefined, NOW)).toBe(false);
  });

  it('false below threshold', () => {
    expect(shouldEscalate([NOW - HOUR, NOW - 2 * HOUR], NOW)).toBe(false);
  });

  it('true at threshold within window', () => {
    expect(
      shouldEscalate([NOW - HOUR, NOW - 2 * HOUR, NOW - 3 * HOUR], NOW)
    ).toBe(true);
  });

  it('false when threshold opens are older than window', () => {
    const old = NOW - 2 * ESCALATION_WINDOW_MS;
    expect(shouldEscalate([old, old + 1, old + 2], NOW)).toBe(false);
  });

  it('only counts opens within window', () => {
    const opens = [
      NOW - HOUR,
      NOW - 2 * HOUR,
      NOW - 30 * HOUR, // outside 24h window
    ];
    expect(recentOpenCount(opens, NOW)).toBe(2);
    expect(shouldEscalate(opens, NOW)).toBe(false);
  });
});

describe('recordHardTimeOpen', () => {
  it('appends a new timestamp', () => {
    const next = recordHardTimeOpen([NOW - HOUR], NOW);
    expect(next).toEqual([NOW - HOUR, NOW]);
  });

  it('prunes entries older than 7 days', () => {
    const week = 7 * 24 * 60 * 60 * 1000;
    const next = recordHardTimeOpen([NOW - week - 1, NOW - HOUR], NOW);
    expect(next).toEqual([NOW - HOUR, NOW]);
  });

  it('handles undefined initial log', () => {
    expect(recordHardTimeOpen(undefined, NOW)).toEqual([NOW]);
  });
});

describe('DEFAULT_PROVIDERS', () => {
  it('includes the free SAMHSA locator', () => {
    const samhsa = DEFAULT_PROVIDERS.find((p) => p.id === 'samhsa-locator');
    expect(samhsa).toBeDefined();
    expect(samhsa?.free).toBe(true);
  });

  it('uses no affiliate or tracking parameters in URLs', () => {
    for (const p of DEFAULT_PROVIDERS) {
      expect(p.url).not.toMatch(/utm_|affiliate|aff=|ref=|partner/i);
    }
  });

  it('threshold and window match constants', () => {
    expect(ESCALATION_THRESHOLD).toBe(3);
    expect(ESCALATION_WINDOW_MS).toBe(24 * 60 * 60 * 1000);
  });
});
