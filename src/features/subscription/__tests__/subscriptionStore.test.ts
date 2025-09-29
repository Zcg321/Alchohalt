import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSubscriptionStore } from '../subscriptionStore';
import type { UserSubscription } from '../SubscriptionManager';

describe('subscriptionStore', () => {
  beforeEach(() => {
    // Clear store state between tests
    useSubscriptionStore.getState().clearSubscription();
  });

  describe('setSubscription and clearSubscription', () => {
    it('sets and clears subscription', () => {
      const store = useSubscriptionStore.getState();
      const subscription: UserSubscription = {
        id: 'sub_123',
        status: 'active',
        plan: 'premium_monthly',
        startedAt: new Date(),
        nextBillingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      store.setSubscription(subscription);
      expect(useSubscriptionStore.getState().currentSubscription).toEqual(subscription);

      store.clearSubscription();
      expect(useSubscriptionStore.getState().currentSubscription).toBeUndefined();
    });
  });

  describe('isPremium', () => {
    it('returns true for active premium monthly subscription', () => {
      const store = useSubscriptionStore.getState();
      const subscription: UserSubscription = {
        id: 'sub_123',
        status: 'active',
        plan: 'premium_monthly',
        startedAt: new Date(),
        nextBillingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      store.setSubscription(subscription);
      expect(store.isPremium()).toBe(true);
    });

    it('returns true for active premium yearly subscription', () => {
      const store = useSubscriptionStore.getState();
      const subscription: UserSubscription = {
        id: 'sub_123',
        status: 'active',
        plan: 'premium_yearly',
        startedAt: new Date(),
        nextBillingAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      };

      store.setSubscription(subscription);
      expect(store.isPremium()).toBe(true);
    });

    it('returns false for trial subscription', () => {
      const store = useSubscriptionStore.getState();
      const subscription: UserSubscription = {
        id: 'sub_123',
        status: 'trial',
        plan: 'premium_monthly',
        startedAt: new Date(),
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      store.setSubscription(subscription);
      expect(store.isPremium()).toBe(false);
    });

    it('returns false when no subscription', () => {
      const store = useSubscriptionStore.getState();
      expect(store.isPremium()).toBe(false);
    });
  });

  describe('isTrialActive', () => {
    it('returns true for active trial with future end date', () => {
      const store = useSubscriptionStore.getState();
      const subscription: UserSubscription = {
        id: 'sub_123',
        status: 'trial',
        plan: 'premium_monthly',
        startedAt: new Date(),
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      store.setSubscription(subscription);
      expect(store.isTrialActive()).toBe(true);
    });

    it('returns false for expired trial', () => {
      const store = useSubscriptionStore.getState();
      const subscription: UserSubscription = {
        id: 'sub_123',
        status: 'trial',
        plan: 'premium_monthly',
        startedAt: new Date(),
        trialEndsAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // Yesterday
      };

      store.setSubscription(subscription);
      expect(store.isTrialActive()).toBe(false);
    });

    it('returns false for active subscription (not trial)', () => {
      const store = useSubscriptionStore.getState();
      const subscription: UserSubscription = {
        id: 'sub_123',
        status: 'active',
        plan: 'premium_monthly',
        startedAt: new Date(),
        nextBillingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      store.setSubscription(subscription);
      expect(store.isTrialActive()).toBe(false);
    });
  });

  describe('getRemainingTrialDays', () => {
    it('calculates remaining trial days correctly', () => {
      const store = useSubscriptionStore.getState();
      const trialEndsAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
      const subscription: UserSubscription = {
        id: 'sub_123',
        status: 'trial',
        plan: 'premium_monthly',
        startedAt: new Date(),
        trialEndsAt
      };

      store.setSubscription(subscription);
      expect(store.getRemainingTrialDays()).toBe(5);
    });

    it('returns 0 for expired trial', () => {
      const store = useSubscriptionStore.getState();
      const subscription: UserSubscription = {
        id: 'sub_123',
        status: 'trial',
        plan: 'premium_monthly',
        startedAt: new Date(),
        trialEndsAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // Yesterday
      };

      store.setSubscription(subscription);
      expect(store.getRemainingTrialDays()).toBe(0);
    });

    it('returns 0 when no trial end date', () => {
      const store = useSubscriptionStore.getState();
      const subscription: UserSubscription = {
        id: 'sub_123',
        status: 'active',
        plan: 'premium_monthly',
        startedAt: new Date(),
        nextBillingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      store.setSubscription(subscription);
      expect(store.getRemainingTrialDays()).toBe(0);
    });
  });
});