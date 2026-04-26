/**
 * AI Insights consent state.
 *
 * Owner-locked invariant: BEFORE the first AI Insights call ever,
 * surface a consent screen. Per-call invalidation: if user toggles
 * off in Settings, in-flight AI requests are aborted client-side
 * (the consent gate in `client.ts` checks state on every call).
 *
 * Consent is stored locally only — we have no account system. The
 * disclosureVersion field lets us require re-consent if the privacy
 * disclosure copy materially changes.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateInstanceId } from './sanitize';
import {
  CURRENT_DISCLOSURE_VERSION,
  type AIConsentState,
  type AIProviderId,
} from './types';

interface AIConsentStore {
  consent: AIConsentState;
  /** Grant consent. Generates a fresh instanceId. */
  grant: (provider: AIProviderId) => void;
  /** Revoke consent. Wipes the instanceId — next grant rotates. */
  revoke: () => void;
  /** Reset to fresh-install state. Tests + Settings → wipe-data. */
  reset: () => void;
}

const FRESH: AIConsentState = {
  granted: false,
  grantedAt: null,
  revokedAt: null,
  disclosureVersion: 0,
  instanceId: '',
  provider: null,
};

export const useAIConsentStore = create<AIConsentStore>()(
  persist(
    (set) => ({
      consent: FRESH,
      grant: (provider) =>
        set({
          consent: {
            granted: true,
            grantedAt: Date.now(),
            revokedAt: null,
            disclosureVersion: CURRENT_DISCLOSURE_VERSION,
            instanceId: generateInstanceId(),
            provider,
          },
        }),
      revoke: () =>
        set((s) => ({
          consent: {
            granted: false,
            grantedAt: s.consent.grantedAt,
            revokedAt: Date.now(),
            disclosureVersion: s.consent.disclosureVersion,
            instanceId: '',
            provider: null,
          },
        })),
      reset: () => set({ consent: FRESH }),
    }),
    {
      name: 'alchohalt-ai-consent',
      version: 1,
    },
  ),
);

/**
 * Pure check (no React) — does the user currently have valid consent
 * to make an AI Insights call right now?
 *
 * "Valid" means:
 *   - granted = true
 *   - disclosureVersion matches CURRENT_DISCLOSURE_VERSION (force
 *     re-consent if we materially changed the disclosure copy)
 *   - instanceId is non-empty (sanity)
 *   - revokedAt is older than grantedAt (defensive)
 */
export function hasValidConsent(consent: AIConsentState): boolean {
  if (!consent.granted) return false;
  if (consent.disclosureVersion !== CURRENT_DISCLOSURE_VERSION) return false;
  if (!consent.instanceId) return false;
  if (consent.revokedAt && consent.grantedAt && consent.revokedAt > consent.grantedAt) {
    return false;
  }
  return true;
}

/** React hook — re-renders on consent change. */
export function useAIConsent() {
  const consent = useAIConsentStore((s) => s.consent);
  const grant = useAIConsentStore((s) => s.grant);
  const revoke = useAIConsentStore((s) => s.revoke);
  return {
    consent,
    isValid: hasValidConsent(consent),
    grant,
    revoke,
  };
}
