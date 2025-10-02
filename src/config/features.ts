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
  ENABLE_LOCAL_ENCRYPTION: import.meta.env.VITE_ENABLE_LOCAL_ENCRYPTION === 'true' || false,
  ENABLE_APP_LOCK: import.meta.env.VITE_ENABLE_APP_LOCK === 'true' || false,
  ENABLE_IAP: import.meta.env.VITE_ENABLE_IAP === 'true' || false,
  ENABLE_ANALYTICS_TILES: import.meta.env.VITE_ENABLE_ANALYTICS_TILES === 'true' || false,
  
  // New Enhanced Features
  ENABLE_HEALTH_INTEGRATION: import.meta.env.VITE_ENABLE_HEALTH_INTEGRATION === 'true' || false,
  ENABLE_VOICE_LOGGING: import.meta.env.VITE_ENABLE_VOICE_LOGGING === 'true' || false,
  ENABLE_SOCIAL_FEATURES: import.meta.env.VITE_ENABLE_SOCIAL_FEATURES === 'true' || false,
  ENABLE_AI_RECOMMENDATIONS: import.meta.env.VITE_ENABLE_AI_RECOMMENDATIONS === 'true' || false,
  ENABLE_JOURNALING: import.meta.env.VITE_ENABLE_JOURNALING === 'true' || false,
  ENABLE_THERAPY_RESOURCES: import.meta.env.VITE_ENABLE_THERAPY_RESOURCES === 'true' || false,
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
