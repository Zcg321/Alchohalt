/**
 * Pricing tiers + feature gate matrix.
 *
 * Owner-locked spec (2026-04-26):
 *   - Hybrid: Free + Monthly + Annual + Lifetime
 *   - Prices: $0 / $4.99/mo / $24.99/yr / $69 once
 *   - Free covers ~75% of value (logging, streak, money saved, journal,
 *     crisis resources, biometric lock, one reminder, full data export
 *     in JSON + CSV — round-11 ethics call: data ownership ≠ paywall)
 *   - Premium adds analytics, multi-reminder, PDF export, encrypted
 *     backup, multi-preset, advanced viz, icon themes, future AI insights
 *
 * This file is the SINGLE SOURCE OF TRUTH for what's free vs paid.
 * Everything else (UI gates, soft-paywalls, IAP product list) reads
 * from here. If you want to move a feature between tiers, change ONE
 * line here.
 */

export type PlanId = 'free' | 'premium_monthly' | 'premium_yearly' | 'premium_lifetime';

export interface PlanDef {
  id: PlanId;
  name: string;
  /** Display price string. */
  priceLabel: string;
  /** Cents for analytics + ad-attribution math. */
  amountCents: number;
  currency: 'usd';
  cadence: 'free' | 'monthly' | 'yearly' | 'lifetime';
  /** RevenueCat product identifier. Set in App Store Connect + Play Console. */
  productId: string | null;
  /** Subtitle for pricing card. */
  subtitle: string;
}

export const PLANS: Record<PlanId, PlanDef> = {
  free: {
    id: 'free',
    name: 'Free',
    priceLabel: '$0',
    amountCents: 0,
    currency: 'usd',
    cadence: 'free',
    productId: null,
    subtitle: 'Everything you need to start. Forever.',
  },
  premium_monthly: {
    id: 'premium_monthly',
    name: 'Monthly',
    priceLabel: '$4.99 / month',
    amountCents: 499,
    currency: 'usd',
    cadence: 'monthly',
    productId: 'com.alchohalt.app.premium_monthly',
    subtitle: 'Try premium without commitment.',
  },
  premium_yearly: {
    id: 'premium_yearly',
    name: 'Yearly',
    priceLabel: '$24.99 / year',
    amountCents: 2499,
    currency: 'usd',
    cadence: 'yearly',
    productId: 'com.alchohalt.app.premium_yearly',
    subtitle: 'Save 48% vs monthly.',
  },
  premium_lifetime: {
    id: 'premium_lifetime',
    name: 'Lifetime',
    priceLabel: '$69 once',
    amountCents: 6900,
    currency: 'usd',
    cadence: 'lifetime',
    productId: 'com.alchohalt.app.premium_lifetime',
    subtitle: 'Pay once. Yours forever. No subscription trap.',
  },
};

export const PAID_PLANS: PlanId[] = [
  'premium_monthly',
  'premium_yearly',
  'premium_lifetime',
];

export function isPaidPlan(plan: PlanId): boolean {
  return PAID_PLANS.includes(plan);
}

// ─────────────────────────────────────────────────────────
// Feature gate matrix
//
// Add a new feature: add to FeatureKey union + give it a tier in
// FEATURE_TIER. That's it. Every callsite that gates is one
// hasFeature(plan, 'feature_key') call.
// ─────────────────────────────────────────────────────────

export type FeatureKey =
  // FREE — never gated, even if entitlement check fails
  | 'drink_log'             // unlimited drink logging
  | 'streak_tracker'        // streak + soft-restart language
  | 'money_saved_widget'    // home-screen savings counter
  | 'basic_journal'         // daily journal text + emoji + mood tag
  | 'crisis_resources'      // 988, SAMHSA, AA, SMART — NEVER gate
  | 'biometric_lock'        // privacy floor, never gated
  | 'local_only_privacy'    // the wedge
  | 'one_default_reminder'  // single reminder, free
  | 'json_export'           // basic JSON export+import (existing) — free per R10 ethics judge: data ownership ≠ paywall
  | 'csv_export'             // [R11-C] moved to free per R10 ethics judge: data ownership ≠ paywall
  | 'dark_mode'             // free polish
  | 'multi_language'        // free polish
  // PREMIUM — soft-paywalled (preview + Unlock CTA)
  | 'mood_drink_correlation'  // on-device pattern analytics
  | 'multi_reminders'         // multiple custom reminders + messages
  | 'pdf_export'              // PDF report (premium for now — formatting / charts ≠ raw data)
  | 'encrypted_backup'        // libsodium .alch-backup file
  | 'custom_drink_presets'    // multiple cost templates
  | 'advanced_viz'            // heatmaps, day-of-week patterns
  | 'icon_themes'             // 3-5 alternate icons
  | 'ai_insights';            // future, opt-in, on-device when feasible

/**
 * Per-feature tier requirement.
 * 'free' → always available
 * 'premium' → requires any paid plan (monthly / yearly / lifetime)
 */
export const FEATURE_TIER: Record<FeatureKey, 'free' | 'premium'> = {
  drink_log:             'free',
  streak_tracker:        'free',
  money_saved_widget:    'free',
  basic_journal:         'free',
  crisis_resources:      'free',
  biometric_lock:        'free',
  local_only_privacy:    'free',
  one_default_reminder:  'free',
  json_export:           'free',
  csv_export:            'free', // [R11-C] data ownership shouldn't be paywalled (round-10 ethics judge)
  dark_mode:             'free',
  multi_language:        'free',

  mood_drink_correlation: 'premium',
  multi_reminders:        'premium',
  pdf_export:             'premium',
  encrypted_backup:       'premium',
  custom_drink_presets:   'premium',
  advanced_viz:           'premium',
  icon_themes:            'premium',
  ai_insights:            'premium',
};

/**
 * Single source of truth for "does this user have this feature?"
 *
 * Pure function — pass in the user's plan + the feature key, get a boolean.
 * No store reads, no React, no side effects. Trivially testable.
 */
export function hasFeature(plan: PlanId, feature: FeatureKey): boolean {
  if (FEATURE_TIER[feature] === 'free') return true;
  return isPaidPlan(plan);
}

/** All free features in stable order — used by tests + listing UI. */
export const FREE_FEATURES: FeatureKey[] = (
  Object.keys(FEATURE_TIER) as FeatureKey[]
).filter((k) => FEATURE_TIER[k] === 'free');

/** All premium features in stable order. */
export const PREMIUM_FEATURES: FeatureKey[] = (
  Object.keys(FEATURE_TIER) as FeatureKey[]
).filter((k) => FEATURE_TIER[k] === 'premium');

/** Compatibility helper: legacy code uses this enum. */
export type EntitlementState = 'free' | 'premium';

export function entitlementForPlan(plan: PlanId): EntitlementState {
  return isPaidPlan(plan) ? 'premium' : 'free';
}
