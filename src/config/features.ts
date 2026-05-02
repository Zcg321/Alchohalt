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
  ENABLE_APP_LOCK: import.meta.env.VITE_ENABLE_APP_LOCK === 'true' || false,
  ENABLE_IAP: import.meta.env.VITE_ENABLE_IAP === 'true' || false,
  ENABLE_ANALYTICS_TILES: import.meta.env.VITE_ENABLE_ANALYTICS_TILES === 'true' || false,
  
  // New Enhanced Features
  ENABLE_HEALTH_INTEGRATION: import.meta.env.VITE_ENABLE_HEALTH_INTEGRATION === 'true' || false,
  ENABLE_VOICE_LOGGING: import.meta.env.VITE_ENABLE_VOICE_LOGGING === 'true' || false,
  ENABLE_SOCIAL_FEATURES: import.meta.env.VITE_ENABLE_SOCIAL_FEATURES === 'true' || false,
  // [R7-A4] Default-on as of 2026-05-02 after the regex-audit + per-state
  // uniqueness checks in src/lib/__tests__/ai-recommendations.deep.test.ts
  // and the persona-walkthrough screenshots in e2e/personas/. The opt-out
  // toggle in Settings → Insights writes db.settings.aiRecommendationsOptOut.
  // Resolved at runtime via isAIRecommendationsEnabled() rather than this
  // module-load const, so the QA Playwright spec can flip it via
  // localStorage('alchohalt:ai-recommendations-override') without a rebuild.
  ENABLE_AI_RECOMMENDATIONS:
    import.meta.env.VITE_ENABLE_AI_RECOMMENDATIONS === 'false' ? false : true,
  ENABLE_JOURNALING: import.meta.env.VITE_ENABLE_JOURNALING === 'true' || false,
  ENABLE_THERAPY_RESOURCES: import.meta.env.VITE_ENABLE_THERAPY_RESOURCES === 'true' || false,

  // Native chrome polish — wiring landed in round-2 polish, default
  // off until verified on a real iOS + Android device. Web side is a
  // no-op shim, so flipping these on web is harmless. To enable
  // native, also: npm install @capacitor/status-bar @capacitor/haptics
  // and npx cap sync.
  ENABLE_NATIVE_STATUS_BAR: import.meta.env.VITE_ENABLE_NATIVE_STATUS_BAR === 'true' || false,
  ENABLE_NATIVE_HAPTICS: import.meta.env.VITE_ENABLE_NATIVE_HAPTICS === 'true' || false,
} as const;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature];
}

/**
 * [R7-A4] Resolve the AI-recommendations flag at runtime.
 *
 * Precedence:
 *   1. localStorage('alchohalt:ai-recommendations-override') — QA-only;
 *      values 'true' / 'false'. Used by the Playwright proxy spec to
 *      walk both states without a rebuild. Production users will
 *      never set this.
 *   2. settings.aiRecommendationsOptOut — owner-facing opt-out toggle
 *      surfaced in Settings → Insights. Wins over the build default.
 *   3. FEATURE_FLAGS.ENABLE_AI_RECOMMENDATIONS — build-time default
 *      (true as of 2026-05-02).
 *
 * Pure read; no side effects. Safe to call from React render or any
 * other non-effect context.
 */
export function isAIRecommendationsEnabled(
  optOut?: boolean,
): boolean {
  // 1. Test/QA override (web only — Capacitor.Preferences shim writes
  // through to localStorage so the same key works in dev / preview).
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('alchohalt:ai-recommendations-override');
      if (raw === 'true') return true;
      if (raw === 'false') return false;
    } catch {
      // localStorage may be disabled (private browsing); fall through.
    }
  }
  // 2. User-facing opt-out.
  if (optOut === true) return false;
  // 3. Build default.
  return FEATURE_FLAGS.ENABLE_AI_RECOMMENDATIONS;
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
