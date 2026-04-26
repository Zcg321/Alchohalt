/**
 * App-load IAP bootstrap. Called once at startup from main.tsx.
 *
 * Flow:
 *   1. Initialize the IAP provider (Mock in dev, RC in production).
 *   2. Restore prior purchases from the device's store account.
 *   3. Map the resulting entitlement state into subscriptionStore.setPlan.
 *
 * Failure mode: silent. Network down → mock returns empty → user stays
 * on free tier locally until next app open. NEVER blocks app startup.
 */

import { useSubscriptionStore } from '../subscription/subscriptionStore';
import type { PlanId } from '../../config/plans';
import { getIAPProvider, type ProductId } from './IAPProvider';

const PRODUCT_TO_PLAN: Record<ProductId, PlanId> = {
  premium_monthly: 'premium_monthly',
  premium_yearly: 'premium_yearly',
  premium_lifetime: 'premium_lifetime',
};

export async function bootstrapIAPOnStartup(): Promise<void> {
  try {
    const provider = getIAPProvider();
    await provider.initialize();
    const state = await provider.getEntitlementState();
    if (!state.isPremium) {
      // Free tier — leave the store at its persisted default.
      return;
    }
    if (!state.productId) return;
    const plan = PRODUCT_TO_PLAN[state.productId];
    if (!plan) return;
    useSubscriptionStore.getState().setSubscription({
      plan,
      verifiedAt: Date.now(),
      periodEndAt: state.expiryDate ? state.expiryDate.getTime() : null,
      trialActive: !!state.isTrialActive,
    });
  } catch (err) {
    // Honor the privacy claim: IAP failures NEVER break app open.
    // Log to console in dev; production drops silently.
    if (typeof console !== 'undefined') {
      console.warn('[iap] bootstrap failed (silent):', err);
    }
  }
}
