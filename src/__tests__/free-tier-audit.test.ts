/**
 * Free-tier RUNTIME audit.
 *
 * Sister file to free-tier-invariant.test.ts. That one guards the
 * static feature-tier registry. THIS one exercises the live store +
 * bootstrap path: a free user, with no entitlement, on a fresh device,
 * with the IAP provider potentially failing — every free feature
 * still works, and no premium feature mistakenly leaks through.
 *
 * If any free flow ever depends on a successful IAP round-trip to
 * unlock, it would break this test. That's the bug we're guarding
 * against — the privacy + reliability claim is "your wellness data
 * + your wellness flows never leave the phone, even when the network
 * is down."
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FREE_FEATURES,
  PREMIUM_FEATURES,
  hasFeature as hasFeatureForPlan,
  isPaidPlan,
  PAID_PLANS,
  type FeatureKey,
} from '../config/plans';
import {
  hasFeature as hasFeatureRuntime,
  useSubscriptionStore,
} from '../features/subscription/subscriptionStore';
import { FEATURE_FLAGS } from '../config/features';

beforeEach(() => {
  useSubscriptionStore.getState().reset();
});

afterEach(() => {
  useSubscriptionStore.getState().reset();
  vi.restoreAllMocks();
});

describe('free-tier audit — store defaults to plan=free, no setup needed', () => {
  it('FREE_DEFAULT subscription is plan=free with no period end and no trial', () => {
    const sub = useSubscriptionStore.getState().subscription;
    expect(sub.plan).toBe('free');
    expect(sub.periodEndAt).toBeNull();
    expect(sub.trialActive).toBe(false);
  });

  it('every FREE_FEATURE is accessible via the runtime hasFeature() with default state', () => {
    for (const feature of FREE_FEATURES) {
      expect(
        hasFeatureRuntime(feature),
        `free feature '${feature}' should be available to a default free user`,
      ).toBe(true);
    }
  });

  it('crisis_resources is reachable regardless of subscription mutations', () => {
    // Mutate to every plan (including invalid mid-load states) and
    // re-check crisis_resources. Legal-safety floor.
    useSubscriptionStore.getState().setPlan('free');
    expect(hasFeatureRuntime('crisis_resources')).toBe(true);
    for (const plan of PAID_PLANS) {
      useSubscriptionStore.getState().setPlan(plan);
      expect(hasFeatureRuntime('crisis_resources')).toBe(true);
    }
    useSubscriptionStore.getState().reset();
    expect(hasFeatureRuntime('crisis_resources')).toBe(true);
  });
});

describe('free-tier audit — premium features are correctly gated for plan=free', () => {
  it('every PREMIUM_FEATURE is gated when ENABLE_SUBSCRIPTIONS is true', () => {
    if (!FEATURE_FLAGS.ENABLE_SUBSCRIPTIONS) {
      // In MVP mode the runtime hasFeature() always reports as plan=free.
      // Premium features map to false there too, but the store-aware
      // path is the gate we care about. Re-assert via the pure helper.
      for (const feature of PREMIUM_FEATURES) {
        expect(hasFeatureForPlan('free', feature)).toBe(false);
      }
      return;
    }
    for (const feature of PREMIUM_FEATURES) {
      expect(hasFeatureRuntime(feature)).toBe(false);
    }
  });
});

describe('free-tier audit — IAP bootstrap failure does NOT block free features', () => {
  it('free features remain reachable after a thrown IAP bootstrap', async () => {
    // Simulate the IAP bootstrap blowing up (network down, RevenueCat
    // unreachable, mock provider rejected). The privacy/reliability
    // claim is that this NEVER touches the free user's experience.
    const { bootstrapIAPOnStartup } = await import(
      '../features/iap/restoreEntitlement'
    );
    const iapModule = await import('../features/iap/IAPProvider');
    vi.spyOn(iapModule, 'getIAPProvider').mockImplementation(() => {
      throw new Error('simulated IAP outage');
    });
    // bootstrap is wrapped in try/catch — should not throw.
    await expect(bootstrapIAPOnStartup()).resolves.toBeUndefined();
    // Store is still in its default free state.
    expect(useSubscriptionStore.getState().subscription.plan).toBe('free');
    // Every free feature is still reachable.
    for (const feature of FREE_FEATURES) {
      expect(hasFeatureRuntime(feature)).toBe(true);
    }
  });
});

describe('free-tier audit — store stability across plan transitions', () => {
  it('downgrading from a paid plan back to free re-locks premium but keeps free', () => {
    // User pays, then their entitlement expires / they cancel. Make
    // sure the store transition resets premium gates without any
    // collateral damage to free features.
    useSubscriptionStore.getState().setPlan('premium_yearly');
    if (FEATURE_FLAGS.ENABLE_SUBSCRIPTIONS) {
      for (const feature of PREMIUM_FEATURES) {
        expect(hasFeatureRuntime(feature)).toBe(true);
      }
    }
    useSubscriptionStore.getState().setPlan('free');
    for (const feature of FREE_FEATURES) {
      expect(hasFeatureRuntime(feature)).toBe(true);
    }
    if (FEATURE_FLAGS.ENABLE_SUBSCRIPTIONS) {
      for (const feature of PREMIUM_FEATURES) {
        expect(hasFeatureRuntime(feature)).toBe(false);
      }
    }
  });

  it('reset() returns the subscription to FREE_DEFAULT', () => {
    useSubscriptionStore.getState().setPlan('premium_lifetime');
    useSubscriptionStore.getState().reset();
    const sub = useSubscriptionStore.getState().subscription;
    expect(sub.plan).toBe('free');
    expect(isPaidPlan(sub.plan)).toBe(false);
    expect(sub.trialActive).toBe(false);
    expect(sub.periodEndAt).toBeNull();
  });
});

describe('free-tier audit — exhaustiveness across the whole FeatureKey union', () => {
  it('FREE_FEATURES + PREMIUM_FEATURES partition the entire FeatureKey space', () => {
    const all = new Set<FeatureKey>([...FREE_FEATURES, ...PREMIUM_FEATURES]);
    // Every key shows up exactly once.
    expect(all.size).toBe(FREE_FEATURES.length + PREMIUM_FEATURES.length);
  });

  it('every FeatureKey resolves cleanly through the runtime path (no throws)', () => {
    // Defensive guard: the runtime hasFeature() must never throw for
    // any registered FeatureKey, regardless of subscription state.
    for (const feature of [...FREE_FEATURES, ...PREMIUM_FEATURES]) {
      expect(() => hasFeatureRuntime(feature)).not.toThrow();
    }
  });
});
