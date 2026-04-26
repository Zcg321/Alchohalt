import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FEATURE_FLAGS } from '../../config/features';
import {
  type FeatureKey,
  type PlanId,
  hasFeature as hasFeatureForPlan,
  isPaidPlan,
} from '../../config/plans';

/**
 * Subscription store — single client-side source of truth for the user's
 * current plan + entitlement.
 *
 * Set ONLY by:
 *   - app load: IAP provider's `restore()` result
 *   - purchase success: SubscriptionManager wires `purchase()` → setPlan
 *   - tests / mock provider
 *
 * Reads everywhere via `usePremiumFeatures()` (React) or `hasFeature()`
 * (non-React).
 */

export interface UserSubscription {
  plan: PlanId;
  /** When this entitlement was last verified by the IAP provider. */
  verifiedAt: number;
  /** Monthly/yearly: when the period ends. Lifetime/free: null. */
  periodEndAt: number | null;
  /** Currently in any free trial granted by the store. */
  trialActive: boolean;
  /** RevenueCat customer-info hash (debug; never sent anywhere). */
  customerInfoSnapshot?: string;
}

interface SubscriptionStore {
  subscription: UserSubscription;
  setSubscription: (sub: UserSubscription) => void;
  setPlan: (plan: PlanId) => void;
  reset: () => void;
}

const FREE_DEFAULT: UserSubscription = {
  plan: 'free',
  verifiedAt: 0,
  periodEndAt: null,
  trialActive: false,
};

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set) => ({
      subscription: FREE_DEFAULT,
      setSubscription: (sub) => set({ subscription: sub }),
      setPlan: (plan) =>
        set({
          subscription: {
            plan,
            verifiedAt: Date.now(),
            periodEndAt: null,
            trialActive: false,
          },
        }),
      reset: () => set({ subscription: FREE_DEFAULT }),
    }),
    {
      name: 'alchohalt-subscription',
      version: 2, // bumped from v1 to invalidate any old MVP-mode shape
    },
  ),
);

/**
 * Non-React entitlement check. Use `usePremiumFeatures()` in components.
 *
 * Behavior matrix:
 *   - ENABLE_SUBSCRIPTIONS=false → premium gates always closed
 *     (legacy MVP mode; nothing is purchasable)
 *   - ENABLE_SUBSCRIPTIONS=true + plan=free → premium gates closed
 *   - ENABLE_SUBSCRIPTIONS=true + plan=any paid → premium gates open
 *   - In ALL modes → free features always available
 */
export function hasFeature(feature: FeatureKey): boolean {
  const { subscription } = useSubscriptionStore.getState();
  if (!FEATURE_FLAGS.ENABLE_SUBSCRIPTIONS) {
    return hasFeatureForPlan('free', feature);
  }
  return hasFeatureForPlan(subscription.plan, feature);
}

/** React hook — re-renders on subscription change. */
export function usePremiumFeatures() {
  const subscription = useSubscriptionStore((s) => s.subscription);

  const has = (feature: FeatureKey): boolean => {
    if (!FEATURE_FLAGS.ENABLE_SUBSCRIPTIONS) {
      return hasFeatureForPlan('free', feature);
    }
    return hasFeatureForPlan(subscription.plan, feature);
  };

  const isPremium =
    FEATURE_FLAGS.ENABLE_SUBSCRIPTIONS && isPaidPlan(subscription.plan);

  return {
    plan: subscription.plan,
    isPremium,
    isFree: !isPremium,
    hasFeature: has,
    /** UI helper: should we show the soft-paywall CTA? */
    needsUpgrade: (feature: FeatureKey) => !has(feature),

    // ── Backward-compat shims (legacy callers) ──
    // Existing components reference camelCase properties. These map onto
    // the canonical FeatureKey gates so we can migrate callers
    // incrementally without breaking the build.
    canExportData: true,                          // json_export is free
    canViewAdvancedAnalytics: has('advanced_viz'),
    canAccessAIInsights: has('ai_insights'),
    canTrackMoodTriggers: true,                   // HALT free; mood↔drink correlation is premium
    canSetCustomGoals: true,
    hasUnlimitedHistory: true,
    hasPrioritySupport: false,
    hasAdFreeExperience: true,
    isTrialActive: subscription.trialActive,
  };
}
