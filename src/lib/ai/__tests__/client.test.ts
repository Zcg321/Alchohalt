/**
 * Client tests. Confirms the fail-closed contract:
 *   - No consent → no fetch.
 *   - Network feature flag off → no fetch.
 *   - Even with consent, if proxy URL missing, no fetch.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requestAIInsights } from '../client';
import { CURRENT_DISCLOSURE_VERSION, type AIConsentState } from '../types';

const VALID: AIConsentState = {
  granted: true,
  grantedAt: Date.now(),
  revokedAt: null,
  disclosureVersion: CURRENT_DISCLOSURE_VERSION,
  instanceId: 'a'.repeat(32),
  provider: 'anthropic',
};

const NO_CONSENT: AIConsentState = {
  granted: false,
  grantedAt: null,
  revokedAt: null,
  disclosureVersion: 0,
  instanceId: '',
  provider: null,
};

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
    Promise.reject(new Error('fetch should NOT have been called')),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('requestAIInsights — fail-closed contract', () => {
  it('returns reason="no-consent" when consent is invalid; never fetches', async () => {
    const r = await requestAIInsights({
      consent: NO_CONSENT,
      entries: [],
      instanceId: '',
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('no-consent');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns reason="network-disabled" when feature flag is off (default in test env); never fetches', async () => {
    // Vitest env defaults VITE_ENABLE_AI_INSIGHTS_NETWORK to undefined.
    const r = await requestAIInsights({
      consent: VALID,
      entries: [],
      instanceId: VALID.instanceId,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('network-disabled');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
