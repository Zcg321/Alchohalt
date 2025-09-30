/**
 * Feature flags for Alchohalt
 * 
 * Controls which features are enabled in the application.
 * For MVP release, subscription features are disabled until payment integration is complete.
 */

export const FEATURE_FLAGS = {
  // Subscription & Premium Features
  // Set to false for MVP release (no payment system integration yet)
  ENABLE_SUBSCRIPTIONS: import.meta.env.VITE_ENABLE_SUBSCRIPTIONS === 'true' || false,
  ENABLE_PREMIUM_FEATURES: import.meta.env.VITE_ENABLE_PREMIUM_FEATURES === 'true' || false,
  
  // Core Features (always enabled)
  ENABLE_DRINK_LOGGING: true,
  ENABLE_HALT_TRACKING: true,
  ENABLE_GOALS: true,
  ENABLE_STATISTICS: true,
  ENABLE_SPENDING_TRACKER: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_DATA_EXPORT: true, // Basic JSON export/import (not PDF/CSV premium export)
  ENABLE_DARK_MODE: true,
  ENABLE_MULTI_LANGUAGE: true,
  
  // Future Features (not yet implemented)
  ENABLE_MULTI_DEVICE_SYNC: false,
  ENABLE_PDF_CSV_EXPORT: false,
  ENABLE_CLOUD_BACKUP: false,
} as const;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature];
}

/**
 * For MVP release: subscription features return free tier behavior
 */
export function getSubscriptionConfig() {
  return {
    enabled: FEATURE_FLAGS.ENABLE_SUBSCRIPTIONS,
    defaultTier: 'free',
    allowUpgrade: FEATURE_FLAGS.ENABLE_SUBSCRIPTIONS,
  };
}
