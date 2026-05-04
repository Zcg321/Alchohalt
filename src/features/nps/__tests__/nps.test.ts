/**
 * [R24-3] NPS pulse — gate + helpers.
 */
import { describe, it, expect } from 'vitest';
import {
  shouldShowNpsPrompt,
  clampScore,
  normalizeReason,
  bucketForScore,
  NPS_INTERVAL_MS,
  NPS_FIRST_RUN_FLOOR_MS,
  NPS_REASON_MAX,
} from '../nps';

const NOW = 1_700_000_000_000;

describe('shouldShowNpsPrompt [R24-3]', () => {
  it('returns false when there are no entries yet', () => {
    expect(
      shouldShowNpsPrompt({
        firstEntryTs: undefined,
        responses: undefined,
        dismissedAt: undefined,
        now: NOW,
      }),
    ).toBe(false);
  });

  it('returns false before the 14-day usage floor', () => {
    expect(
      shouldShowNpsPrompt({
        firstEntryTs: NOW - (NPS_FIRST_RUN_FLOOR_MS - 1),
        responses: undefined,
        dismissedAt: undefined,
        now: NOW,
      }),
    ).toBe(false);
  });

  it('returns true at the 14-day usage floor when never seen', () => {
    expect(
      shouldShowNpsPrompt({
        firstEntryTs: NOW - NPS_FIRST_RUN_FLOOR_MS,
        responses: undefined,
        dismissedAt: undefined,
        now: NOW,
      }),
    ).toBe(true);
  });

  it('returns false within 30 days of the most-recent response', () => {
    expect(
      shouldShowNpsPrompt({
        firstEntryTs: NOW - 365 * 86400000,
        responses: [{ ts: NOW - (NPS_INTERVAL_MS - 1), score: 8 }],
        dismissedAt: undefined,
        now: NOW,
      }),
    ).toBe(false);
  });

  it('returns true 30 days after the most-recent response', () => {
    expect(
      shouldShowNpsPrompt({
        firstEntryTs: NOW - 365 * 86400000,
        responses: [{ ts: NOW - NPS_INTERVAL_MS, score: 8 }],
        dismissedAt: undefined,
        now: NOW,
      }),
    ).toBe(true);
  });

  it('treats a recent dismissal as a 30-day suppression', () => {
    expect(
      shouldShowNpsPrompt({
        firstEntryTs: NOW - 365 * 86400000,
        responses: undefined,
        dismissedAt: NOW - (NPS_INTERVAL_MS - 1),
        now: NOW,
      }),
    ).toBe(false);
  });

  it('uses the most-recent of (response, dismissal) when both exist', () => {
    expect(
      shouldShowNpsPrompt({
        firstEntryTs: NOW - 365 * 86400000,
        responses: [{ ts: NOW - 2 * NPS_INTERVAL_MS, score: 8 }],
        dismissedAt: NOW - 1000,
        now: NOW,
      }),
    ).toBe(false);
  });

  it('handles multiple responses by picking the latest', () => {
    expect(
      shouldShowNpsPrompt({
        firstEntryTs: NOW - 365 * 86400000,
        responses: [
          { ts: NOW - 90 * 86400000, score: 6 },
          { ts: NOW - 60 * 86400000, score: 7 },
          { ts: NOW - 5 * 86400000, score: 9 },
        ],
        dismissedAt: undefined,
        now: NOW,
      }),
    ).toBe(false);
  });
});

describe('clampScore', () => {
  it('clamps below 0', () => {
    expect(clampScore(-5)).toBe(0);
  });
  it('clamps above 10', () => {
    expect(clampScore(15)).toBe(10);
  });
  it('rounds fractional inputs', () => {
    expect(clampScore(7.6)).toBe(8);
    expect(clampScore(7.4)).toBe(7);
  });
  it('rejects NaN', () => {
    expect(clampScore(Number.NaN)).toBe(0);
  });
  it('preserves valid integers', () => {
    for (let i = 0; i <= 10; i++) expect(clampScore(i)).toBe(i);
  });
});

describe('normalizeReason', () => {
  it('returns undefined for empty / undefined / whitespace', () => {
    expect(normalizeReason(undefined)).toBeUndefined();
    expect(normalizeReason('')).toBeUndefined();
    expect(normalizeReason('   ')).toBeUndefined();
  });
  it('trims surrounding whitespace', () => {
    expect(normalizeReason('  hello  ')).toBe('hello');
  });
  it('caps length at NPS_REASON_MAX', () => {
    const long = 'x'.repeat(NPS_REASON_MAX + 50);
    const out = normalizeReason(long);
    expect(out).toHaveLength(NPS_REASON_MAX);
  });
});

describe('bucketForScore', () => {
  it.each([
    [0, 'detractor'],
    [5, 'detractor'],
    [6, 'detractor'],
    [7, 'passive'],
    [8, 'passive'],
    [9, 'promoter'],
    [10, 'promoter'],
  ] as const)('score %i → %s', (score, expected) => {
    expect(bucketForScore(score)).toBe(expected);
  });
});
