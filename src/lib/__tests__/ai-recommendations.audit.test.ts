import { describe, expect, it, vi } from 'vitest';
import { generateGoalRecommendations } from '../ai-recommendations';
import type { Entry, Settings } from '../../store/db';

/**
 * [R7-A4] Audit pass for ai-recommendations on the eve of flipping the
 * default-on flag. Two questions Round 7's prompt insisted we answer
 * before flipping:
 *
 *   1. Does the rendered text ever contain medical-sounding claims?
 *      (regex audit — broader than R6's single "makes them lighter"
 *      regression).
 *   2. Does the engine produce *different* output for *different* user
 *      data, or is it just random text dressed up?
 *
 * Both must pass before the GoalRecommendations surface gets mounted
 * by default. See src/config/features.ts and audit-walkthrough/
 * ai-recommendations-flag-2026-05-01.md for the decision record.
 */

vi.mock('../../config/features', () => ({
  FEATURE_FLAGS: { ENABLE_AI_RECOMMENDATIONS: true },
}));

const FIXED_NOW = new Date('2026-04-15T12:00:00.000Z').getTime();

const settingsBase: Settings = {
  version: 1,
  language: 'en',
  theme: 'light',
  dailyGoalDrinks: 0,
  weeklyGoalDrinks: 0,
  monthlyBudget: 0,
  reminders: { enabled: false, times: [] },
  showBAC: false,
};

const entry = (over: Partial<Entry>): Entry => ({
  id: over.id ?? 'e' + Math.random().toString(36).slice(2),
  ts: over.ts ?? FIXED_NOW,
  kind: over.kind ?? 'beer',
  stdDrinks: over.stdDrinks ?? 1,
  intention: over.intention ?? 'social',
  craving: over.craving ?? 5,
  halt: over.halt ?? { H: false, A: false, L: false, T: false },
  ...over,
});

/**
 * Medical-claim regex panel. Each entry tests a specific class of
 * over-claim. The bar is "no recommendation text matches any of these
 * for any plausible input" — copy that lands on a medical claim is a
 * launch-blocker for an alcohol-tracker that explicitly disclaims
 * medical-device status.
 */
const MEDICAL_CLAIM_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /diagnos/i, reason: 'diagnosis claim' },
  { pattern: /\bcure[sd]?\b/i, reason: 'cure claim' },
  { pattern: /\btreat(s|ed|ment)\b/i, reason: 'treatment claim' },
  { pattern: /heal\s+(your|the)\s+liver/i, reason: 'organ-healing claim' },
  { pattern: /alcohol(?:ism|\s+use\s+disorder|\s+dependence)/i, reason: 'clinical-condition naming' },
  { pattern: /\bremiss(ion|ive)\b/i, reason: 'remission claim' },
  { pattern: /\b(detox|withdraw(al|ing|s)?)\b/i, reason: 'medical-process claim' },
  { pattern: /makes them lighter/i, reason: 'R6 regression — overpromised craving softening' },
  { pattern: /\bproven\s+to\b/i, reason: 'unsubstantiated efficacy claim' },
  { pattern: /\bclinical(ly)?\b/i, reason: 'clinical authority claim' },
  { pattern: /\bdoctor[s]?\s+recommend/i, reason: 'borrowed authority' },
  { pattern: /\bguarantee/i, reason: 'outcome guarantee' },
];

/** Plausible-input fixtures spanning the 4 recommendation paths. */
function inputs() {
  // High-craving streak → triggers craving-management
  const highCraving = Array.from({ length: 14 }, (_, i) =>
    entry({ ts: FIXED_NOW - i * 86_400_000, craving: 8, stdDrinks: 1.5 }),
  );
  // Heavy-drinker → triggers weekly-limit + drink-free-days
  const heavy = Array.from({ length: 30 }, (_, i) =>
    entry({
      ts: FIXED_NOW - i * 86_400_000,
      stdDrinks: 4 + (i % 2),
      kind: 'beer',
      cost: 8,
    }),
  );
  // Light-drinker with cost data → triggers budget
  const budgeted = Array.from({ length: 20 }, (_, i) =>
    entry({ ts: FIXED_NOW - i * 86_400_000, stdDrinks: 1, cost: 12 }),
  );
  // HALT-heavy → exercises halt-aware language paths
  const haltHeavy = Array.from({ length: 14 }, (_, i) =>
    entry({
      ts: FIXED_NOW - i * 86_400_000,
      craving: 7,
      halt: i % 2 === 0 ? { H: true, A: false, L: true, T: false } : { H: false, A: true, L: false, T: true },
    }),
  );
  return { highCraving, heavy, budgeted, haltHeavy };
}

describe('[R7-A4] ai-recommendations regex audit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FIXED_NOW));
  });
  afterEach(() => vi.useRealTimers());

  for (const [label, fixture] of Object.entries(inputs())) {
    it(`no medical claims in any recommendation for "${label}" fixture`, () => {
      const recs = generateGoalRecommendations(fixture, settingsBase, []);
      // Concatenate all user-visible strings on every rec.
      const corpus = recs
        .flatMap((r) => [r.title, r.description, r.rationale])
        .join('\n\n');
      expect(corpus.length, 'should produce at least one rec for this fixture').toBeGreaterThan(0);
      for (const { pattern, reason } of MEDICAL_CLAIM_PATTERNS) {
        const match = corpus.match(pattern);
        expect(
          match,
          `medical-claim leak (${reason}): matched "${match?.[0]}" in ${label} corpus`,
        ).toBeNull();
      }
    });
  }
});

describe('[R7-A4] ai-recommendations is data-driven, not random', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FIXED_NOW));
  });
  afterEach(() => vi.useRealTimers());

  it('produces measurably different output for different user data', () => {
    const { highCraving, heavy, budgeted, haltHeavy } = inputs();
    const variants = [
      { name: 'highCraving', recs: generateGoalRecommendations(highCraving, settingsBase, []) },
      { name: 'heavy', recs: generateGoalRecommendations(heavy, settingsBase, []) },
      { name: 'budgeted', recs: generateGoalRecommendations(budgeted, settingsBase, []) },
      { name: 'haltHeavy', recs: generateGoalRecommendations(haltHeavy, settingsBase, []) },
    ];

    // Each fixture should produce at least one recommendation.
    for (const v of variants) {
      expect(v.recs.length, `${v.name} produced 0 recs — silent failure`).toBeGreaterThan(0);
    }

    // Pairwise: any two distinct fixtures should differ in either the
    // set of rec types OR the suggestedValue/rationale of at least one
    // overlapping type. Pure-random output would by chance match
    // sometimes but never deterministically — the engine matches
    // deterministically for the same input, so we test the inverse:
    // different inputs => different outputs.
    for (let i = 0; i < variants.length; i++) {
      for (let j = i + 1; j < variants.length; j++) {
        const a = variants[i]!.recs;
        const b = variants[j]!.recs;
        const sigA = a.map((r) => `${r.type}:${r.suggestedValue}:${r.rationale}`).sort().join('|');
        const sigB = b.map((r) => `${r.type}:${r.suggestedValue}:${r.rationale}`).sort().join('|');
        expect(
          sigA,
          `fixtures "${variants[i]!.name}" and "${variants[j]!.name}" produced identical output — engine may not be data-driven`,
        ).not.toBe(sigB);
      }
    }
  });

  it('is deterministic for the same input', () => {
    const { highCraving } = inputs();
    const a = generateGoalRecommendations(highCraving, settingsBase, []);
    const b = generateGoalRecommendations(highCraving, settingsBase, []);
    const sigA = a.map((r) => `${r.type}:${r.suggestedValue}:${r.rationale}`).sort().join('|');
    const sigB = b.map((r) => `${r.type}:${r.suggestedValue}:${r.rationale}`).sort().join('|');
    expect(sigA).toBe(sigB);
  });
});
