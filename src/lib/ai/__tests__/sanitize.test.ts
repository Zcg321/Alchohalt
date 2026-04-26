/**
 * Adversarial tests for the AI sanitize layer.
 *
 * These tests guard the privacy claim. If any test fails, the build
 * fails — and that means a real-money privacy claim is at risk.
 * Treat these like security tests, not feature tests.
 */

import { describe, expect, it } from 'vitest';
import {
  assertNoForbiddenFields,
  buildSanitizedPayload,
  buildTransportPayload,
  generateInstanceId,
} from '../sanitize';
import { FORBIDDEN_FIELDS } from '../types';
import type { Entry } from '../../../store/db';

const FIXED_INSTANCE = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'entry-id-' + Math.random(),
    ts: Date.now() - 1000 * 60 * 60 * 24, // yesterday
    kind: 'beer',
    stdDrinks: 1,
    intention: 'social',
    craving: 3,
    halt: { H: false, A: false, L: false, T: false },
    mood: 'calm',
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────────
// Allowlist shape: payload only contains the declared keys.
// ──────────────────────────────────────────────────────────────────

describe('sanitize: payload shape is the complete allowlist', () => {
  it('contains exactly the documented top-level keys, no more', () => {
    const payload = buildSanitizedPayload({
      entries: [makeEntry()],
      instanceId: FIXED_INSTANCE,
    });
    const keys = Object.keys(payload).sort();
    expect(keys).toEqual([
      'currentStreakDays',
      'dayOfWeekCounts',
      'haltCounts',
      'instanceId',
      'intentionCounts',
      'locale',
      'moodTagCounts',
      'schemaVersion',
      'weeklyBuckets',
    ]);
  });

  it('refuses to build without an instanceId (fails closed)', () => {
    expect(() =>
      buildSanitizedPayload({ entries: [], instanceId: '' }),
    ).toThrow(/instanceId/);
  });
});

// ──────────────────────────────────────────────────────────────────
// Adversarial inputs: forbidden fields cannot leak.
// ──────────────────────────────────────────────────────────────────

describe('sanitize: FORBIDDEN_FIELDS never appear in serialized output', () => {
  it('drops free-text fields (notes, journal, voiceTranscript, altAction)', () => {
    const evil = makeEntry({
      notes: 'My therapist said I should track this',
      journal: 'Today I felt overwhelmed at work because of John',
      voiceTranscript: 'I had a bourbon at 9 PM with my brother Mike',
      altAction: 'Called my AA sponsor named Sarah',
    });
    const transport = buildTransportPayload({
      entries: [evil],
      instanceId: FIXED_INSTANCE,
    });
    expect(transport).not.toContain('therapist');
    expect(transport).not.toContain('overwhelmed');
    expect(transport).not.toContain('John');
    expect(transport).not.toContain('Mike');
    expect(transport).not.toContain('Sarah');
    expect(transport).not.toContain('AA sponsor');
  });

  it('refuses to serialize a payload that smuggles a forbidden key', () => {
    const tampered = {
      schemaVersion: 1 as const,
      instanceId: FIXED_INSTANCE,
      weeklyBuckets: [],
      moodTagCounts: {} as Record<string, number>,
      haltCounts: { hungry: 0, angry: 0, lonely: 0, tired: 0 },
      intentionCounts: {} as Record<string, number>,
      dayOfWeekCounts: [0, 0, 0, 0, 0, 0, 0],
      currentStreakDays: 0,
      locale: 'en' as const,
      // Smuggled fields:
      notes: 'I drank because I was sad',
      email: 'user@example.com',
    };
    expect(() => assertNoForbiddenFields(tampered)).toThrow(/forbidden field/);
  });

  it('refuses long free-text-shaped string values regardless of key name', () => {
    // Even if a future contributor adds a permitted-name field that
    // they fill with a journal entry, the heuristic should catch it.
    const tampered = {
      schemaVersion: 1 as const,
      instanceId: FIXED_INSTANCE,
      weeklyBuckets: [
        {
          isoWeek: '2026-W17',
          drinkCount: 1,
          totalStdDrinks: 1,
          avgCraving: 0,
          summary:
            'this is a long human-written sentence about how the user has been feeling lately and it should not be allowed through the sanitizer',
        } as unknown as { isoWeek: string; drinkCount: number; totalStdDrinks: number; avgCraving: number },
      ],
      moodTagCounts: {} as Record<string, number>,
      haltCounts: { hungry: 0, angry: 0, lonely: 0, tired: 0 },
      intentionCounts: {} as Record<string, number>,
      dayOfWeekCounts: [0, 0, 0, 0, 0, 0, 0],
      currentStreakDays: 0,
      locale: 'en' as const,
    };
    expect(() => assertNoForbiddenFields(tampered)).toThrow(
      /free-text-shaped/,
    );
  });

  it.each(FORBIDDEN_FIELDS)(
    'never lets a top-level key "%s" survive serialization',
    (field) => {
      // Build a forged object containing both the legit shape AND the
      // forbidden key. assertNoForbiddenFields must reject it.
      const forged = {
        schemaVersion: 1 as const,
        instanceId: FIXED_INSTANCE,
        weeklyBuckets: [],
        moodTagCounts: {},
        haltCounts: { hungry: 0, angry: 0, lonely: 0, tired: 0 },
        intentionCounts: {},
        dayOfWeekCounts: [0, 0, 0, 0, 0, 0, 0],
        currentStreakDays: 0,
        locale: 'en' as const,
        [field]: 'whatever',
      };
      expect(() => assertNoForbiddenFields(forged)).toThrow(
        new RegExp(`forbidden field "${field}"`),
      );
    },
  );
});

// ──────────────────────────────────────────────────────────────────
// Aggregation correctness — bucketing should be lossy enough.
// ──────────────────────────────────────────────────────────────────

describe('sanitize: aggregations are lossy (no exact timestamps leak)', () => {
  it('emits ISO-week labels, never raw ms timestamps', () => {
    // A specific recent moment within the default 90-day window.
    const recentTs = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const evil = makeEntry({ ts: recentTs });
    const payload = buildSanitizedPayload({
      entries: [evil],
      instanceId: FIXED_INSTANCE,
    });
    const json = JSON.stringify(payload);
    expect(json).not.toContain(String(recentTs));
    // Should still have a week label
    expect(json).toMatch(/\d{4}-W\d{2}/);
  });

  it('mood counts are integers, never the raw mood-tag-per-entry list', () => {
    const entries = [
      makeEntry({ mood: 'happy' }),
      makeEntry({ mood: 'happy' }),
      makeEntry({ mood: 'sad' }),
    ];
    const payload = buildSanitizedPayload({
      entries,
      instanceId: FIXED_INSTANCE,
    });
    expect(payload.moodTagCounts.happy).toBe(2);
    expect(payload.moodTagCounts.sad).toBe(1);
    expect(payload.moodTagCounts.calm).toBe(0);
  });

  it('drops mood values not in the allowed enum (no smuggling new tags)', () => {
    const entries = [
      makeEntry({
        // @ts-expect-error — testing rejection of unknown mood
        mood: 'PII:my-secret',
      }),
    ];
    const payload = buildSanitizedPayload({
      entries,
      instanceId: FIXED_INSTANCE,
    });
    const json = JSON.stringify(payload);
    expect(json).not.toContain('PII');
    expect(json).not.toContain('my-secret');
  });
});

// ──────────────────────────────────────────────────────────────────
// Instance ID generation.
// ──────────────────────────────────────────────────────────────────

describe('sanitize: instance ID generator', () => {
  it('produces a 32-char lowercase hex string', () => {
    const id = generateInstanceId();
    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });

  it('produces unique IDs across calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateInstanceId()));
    expect(ids.size).toBe(50);
  });
});

// ──────────────────────────────────────────────────────────────────
// Empty / pathological inputs.
// ──────────────────────────────────────────────────────────────────

describe('sanitize: empty input produces well-formed empty payload', () => {
  it('zero entries → zero counts everywhere, well-formed shape', () => {
    const payload = buildSanitizedPayload({
      entries: [],
      instanceId: FIXED_INSTANCE,
    });
    expect(payload.weeklyBuckets).toEqual([]);
    expect(Object.values(payload.moodTagCounts).every((v) => v === 0)).toBe(true);
    expect(Object.values(payload.haltCounts).every((v) => v === 0)).toBe(true);
    expect(payload.dayOfWeekCounts).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(payload.currentStreakDays).toBeGreaterThanOrEqual(0);
  });
});
