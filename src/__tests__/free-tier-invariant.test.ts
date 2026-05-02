import { describe, expect, it } from 'vitest';
import {
  FEATURE_TIER,
  FREE_FEATURES,
  PREMIUM_FEATURES,
  hasFeature,
  type FeatureKey,
} from '../config/plans';

/**
 * Owner-locked invariants. These tests guard the free-vs-premium split.
 * If a contributor moves a free feature into premium (or vice versa)
 * the change should be deliberate — these tests force them to update
 * the lists explicitly.
 */

const REQUIRED_FREE: FeatureKey[] = [
  'drink_log',
  'streak_tracker',
  'money_saved_widget',
  'basic_journal',
  'crisis_resources',
  'biometric_lock',
  'local_only_privacy',
  'one_default_reminder',
  'json_export',
  // [R11-C] CSV export moved free: data ownership shouldn't be paywalled
  // (round-10 ethics judge). PDF stays premium because that's
  // formatting/charts, not raw data.
  'csv_export',
  'dark_mode',
  'multi_language',
];

const REQUIRED_PREMIUM: FeatureKey[] = [
  'mood_drink_correlation',
  'multi_reminders',
  'pdf_export',
  'encrypted_backup',
  'custom_drink_presets',
  'advanced_viz',
  'icon_themes',
  'ai_insights',
];

describe('free-tier invariant — these features MUST stay free', () => {
  for (const feature of REQUIRED_FREE) {
    it(`${feature} is in the free tier`, () => {
      expect(FEATURE_TIER[feature]).toBe('free');
    });

    it(`${feature} is accessible to plan='free'`, () => {
      expect(hasFeature('free', feature)).toBe(true);
    });

    it(`${feature} is also accessible to every paid plan`, () => {
      expect(hasFeature('premium_monthly', feature)).toBe(true);
      expect(hasFeature('premium_yearly', feature)).toBe(true);
      expect(hasFeature('premium_lifetime', feature)).toBe(true);
    });
  }
});

describe('crisis_resources invariant — never gated, ever', () => {
  // The most legally-safety-critical line. Restating the assertion
  // separately so a bisect points at this exact rule.
  it('crisis_resources is always free', () => {
    expect(FEATURE_TIER.crisis_resources).toBe('free');
    expect(hasFeature('free', 'crisis_resources')).toBe(true);
  });
});

describe('premium-tier invariant — these features MUST stay premium', () => {
  for (const feature of REQUIRED_PREMIUM) {
    it(`${feature} is in the premium tier`, () => {
      expect(FEATURE_TIER[feature]).toBe('premium');
    });

    it(`${feature} is gated for plan='free'`, () => {
      expect(hasFeature('free', feature)).toBe(false);
    });

    it(`${feature} is unlocked for any paid plan`, () => {
      expect(hasFeature('premium_monthly', feature)).toBe(true);
      expect(hasFeature('premium_yearly', feature)).toBe(true);
      expect(hasFeature('premium_lifetime', feature)).toBe(true);
    });
  }
});

describe('feature-tier registry consistency', () => {
  it('FREE_FEATURES + PREMIUM_FEATURES === every key in FEATURE_TIER', () => {
    const all = new Set<FeatureKey>([...FREE_FEATURES, ...PREMIUM_FEATURES]);
    expect(all.size).toBe(Object.keys(FEATURE_TIER).length);
    for (const k of Object.keys(FEATURE_TIER) as FeatureKey[]) {
      expect(all.has(k)).toBe(true);
    }
  });

  it('no feature is in both FREE and PREMIUM lists', () => {
    const intersection = FREE_FEATURES.filter((f) =>
      (PREMIUM_FEATURES as FeatureKey[]).includes(f),
    );
    expect(intersection).toEqual([]);
  });

  it('REQUIRED_FREE and REQUIRED_PREMIUM together cover every FeatureKey (no orphans)', () => {
    const required = new Set<FeatureKey>([
      ...REQUIRED_FREE,
      ...REQUIRED_PREMIUM,
    ]);
    for (const k of Object.keys(FEATURE_TIER) as FeatureKey[]) {
      expect(required.has(k), `feature '${k}' is not in either required list`).toBe(true);
    }
  });
});
