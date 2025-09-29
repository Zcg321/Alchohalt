import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserSubscription } from './SubscriptionManager';

interface SubscriptionStore {
  currentSubscription?: UserSubscription;
  setSubscription: (subscription: UserSubscription) => void;
  clearSubscription: () => void;
  isPremium: () => boolean;
  isTrialActive: () => boolean;
  getRemainingTrialDays: () => number;
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      currentSubscription: undefined,
      
      setSubscription: (subscription: UserSubscription) => {
        set({ currentSubscription: subscription });
      },
      
      clearSubscription: () => {
        set({ currentSubscription: undefined });
      },
      
      isPremium: () => {
        const subscription = get().currentSubscription;
        return subscription?.status === 'active' && 
               (subscription.plan === 'premium_monthly' || 
                subscription.plan === 'premium_yearly');
      },
      
      isTrialActive: () => {
        const subscription = get().currentSubscription;
        return !!(subscription?.status === 'trial' && 
               subscription.trialEndsAt && 
               new Date() < subscription.trialEndsAt);
      },
      
      getRemainingTrialDays: () => {
        const subscription = get().currentSubscription;
        if (!subscription?.trialEndsAt || subscription.status !== 'trial') return 0;
        
        const now = new Date();
        const trialEnd = subscription.trialEndsAt;
        const diffTime = trialEnd.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return Math.max(0, diffDays);
      }
    }),
    {
      name: 'alchohalt-subscription',
      version: 1
    }
  )
);

// Premium feature detection hook
export function usePremiumFeatures() {
  const { isPremium, isTrialActive } = useSubscriptionStore();
  
  const hasFeature = (feature: string): boolean => {
    const premium = isPremium();
    const trial = isTrialActive();
    
    // During trial or premium, all features are available
    if (premium || trial) return true;
    
    // Free features only
    const freeFeatures = [
      'basic_logging',
      'simple_tracking',
      'basic_goals',
      'limited_insights',
      'standard_mood'
    ];
    
    return freeFeatures.includes(feature);
  };
  
  return {
    isPremium: isPremium(),
    isTrialActive: isTrialActive(),
    hasFeature,
    // Premium feature flags
    canExportData: isPremium() || isTrialActive(),
    canViewAdvancedAnalytics: isPremium() || isTrialActive(),
    canSetCustomGoals: isPremium() || isTrialActive(),
    canAccessAIInsights: isPremium() || isTrialActive(),
    canTrackMoodTriggers: isPremium() || isTrialActive(),
    hasUnlimitedHistory: isPremium() || isTrialActive(),
    hasPrioritySupport: isPremium(),
    hasAdFreeExperience: isPremium() || isTrialActive()
  };
}