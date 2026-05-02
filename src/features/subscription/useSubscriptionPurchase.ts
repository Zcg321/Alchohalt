import { useState } from 'react';
import type { PlanId } from '../../config/plans';
import { useSubscriptionStore } from './subscriptionStore';
import { useAnalytics } from '../analytics/analytics';
import { getIAPProvider, type ProductId } from '../iap/IAPProvider';
import { hapticForEvent } from '../../shared/haptics';

const FAILED_MSG =
  "Purchase didn't go through. Try again, or use Restore prior purchases if you bought already on another device.";
const ERROR_MSG = "Couldn't complete the purchase. Try again, or contact your app store if it keeps happening.";

export function useSubscriptionPurchase(onSubscribe?: (planId: PlanId) => Promise<void>) {
  const { setSubscription } = useSubscriptionStore();
  const { trackSubscriptionEvent } = useAnalytics();
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (planId: PlanId) => {
    if (pendingPlan) return;
    if (planId === 'free') return;
    setError(null);
    setPendingPlan(planId);
    try {
      if (onSubscribe) {
        await onSubscribe(planId);
        trackSubscriptionEvent('subscribed', planId);
      } else {
        const provider = getIAPProvider();
        const productId = planId as ProductId;
        const purchase = await provider.purchase(productId);
        if (purchase.state === 'approved') {
          const state = await provider.getEntitlementState();
          setSubscription({
            plan: planId,
            verifiedAt: Date.now(),
            periodEndAt: state.expiryDate ? state.expiryDate.getTime() : null,
            trialActive: !!state.isTrialActive,
          });
          trackSubscriptionEvent('subscribed', planId);
        } else if (purchase.state !== 'cancelled') {
          setError(FAILED_MSG);
          hapticForEvent('error');
        }
      }
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message ?? ERROR_MSG);
      hapticForEvent('error');
    } finally {
      setPendingPlan(null);
    }
  };

  return { pendingPlan, error, handleSubscribe };
}
