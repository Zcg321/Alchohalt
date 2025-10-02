import React from 'react';
import { usePremiumFeatures } from '../features/subscription/subscriptionStore';
import { FEATURE_FLAGS } from '../config/features';

interface PremiumGateProps {
  children: React.ReactNode;
  feature?: string;
  fallback?: React.ReactNode;
  requirePremium?: boolean;
}

/**
 * PremiumGate component - conditionally renders content based on premium status
 * 
 * @param children - Content to show when user has premium access
 * @param feature - Optional specific feature to check
 * @param fallback - Optional content to show when user doesn't have premium access
 * @param requirePremium - If true, requires premium; if false, only checks feature flags
 */
export function PremiumGate({ 
  children, 
  feature, 
  fallback = null, 
  requirePremium = true 
}: PremiumGateProps) {
  const { isPremium, isTrialActive, hasFeature } = usePremiumFeatures();
  
  // If subscriptions are disabled globally, show nothing (MVP mode)
  if (requirePremium && !FEATURE_FLAGS.ENABLE_SUBSCRIPTIONS) {
    return <>{fallback}</>;
  }
  
  // Check specific feature if provided
  if (feature) {
    const canAccess = hasFeature(feature);
    return canAccess ? <>{children}</> : <>{fallback}</>;
  }
  
  // Check general premium status
  const hasPremium = isPremium || isTrialActive;
  
  if (requirePremium && !hasPremium) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * PremiumBadge - shows a visual indicator for premium features
 */
export function PremiumBadge({ className = '' }: { className?: string }) {
  if (!FEATURE_FLAGS.ENABLE_SUBSCRIPTIONS) return null;
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 ${className}`}>
      ✨ Premium
    </span>
  );
}

/**
 * UpgradePrompt - shows a prompt to upgrade to premium
 */
export function UpgradePrompt({ 
  title = "Upgrade to Premium",
  message = "This feature is available in our premium plan.",
  className = ''
}: { 
  title?: string;
  message?: string;
  className?: string;
}) {
  if (!FEATURE_FLAGS.ENABLE_SUBSCRIPTIONS) return null;
  
  return (
    <div className={`p-4 border border-amber-200 rounded-xl bg-amber-50 dark:bg-amber-900/20 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">✨</span>
        <div className="flex-1">
          <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
            {title}
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {message}
          </p>
          <button 
            className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
            onClick={() => {
              // TODO: Navigate to subscription page
              console.log('Navigate to subscription page');
            }}
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
