/**
 * AI Insights network client.
 *
 * Owner-locked architecture decision (2026-04-26):
 *
 *   "API key handling: NOT in client-side env. Must proxy through a
 *    server-side endpoint. We don't have server in alchohalt — this
 *    becomes 'AI Insights requires a backend' which is a non-trivial
 *    v1 scope decision; consider deferring AI Insights to v1.1 with a
 *    Cloudflare Worker proxy if we don't want a full backend.
 *    DOCUMENT this constraint clearly in the architecture doc — DON'T
 *    ship a client that exposes the API key in the bundle."
 *
 * v1 implementation:
 *   - VITE_ENABLE_AI_INSIGHTS_NETWORK feature flag governs whether
 *     this module's `requestAIInsights()` ever performs a fetch.
 *   - With the flag OFF (default), it returns a stub response and
 *     never touches the network. The UI tile renders a "Coming soon"
 *     placeholder; the consent flow + sanitize layer + Settings UI
 *     are all live, so the architecture is reviewable today.
 *   - With the flag ON, it expects `VITE_AI_PROXY_URL` to point at a
 *     server-side proxy (NOT directly at Anthropic). The proxy is
 *     responsible for holding the API key and rate-limiting per
 *     `payload.instanceId`.
 *
 * No code path in this module ever reads an API key from the client
 * bundle. Static analysis: grep for ANTHROPIC_API_KEY across src/ —
 * this module must NOT be a hit.
 */

import { hasValidConsent } from './consent';
import { buildTransportPayload, type SanitizeInput } from './sanitize';
import type { AIConsentState } from './types';

export interface AIInsightsResult {
  ok: boolean;
  /** Provider-rendered insight list. Free-text, but only shown to the user. */
  insights?: ReadonlyArray<{
    title: string;
    body: string;
    /** 0-1 confidence the provider attached. */
    confidence?: number;
  }>;
  /** When ok=false, why it failed (no PII, safe to log). */
  reason?:
    | 'no-consent'
    | 'network-disabled'
    | 'proxy-error'
    | 'aborted'
    | 'rate-limited'
    | 'malformed-response';
}

interface RequestArgs extends SanitizeInput {
  consent: AIConsentState;
  /** AbortSignal for client-side cancellation when user toggles consent off. */
  signal?: AbortSignal;
}

/**
 * Request AI insights. Fail-closed contract:
 *   - No valid consent → returns { ok:false, reason:'no-consent' }
 *   - Feature flag off → returns { ok:false, reason:'network-disabled' }
 *   - Network error → returns { ok:false, reason:'proxy-error' }
 *   - User aborted (toggled off mid-flight) → reason:'aborted'
 */
export async function requestAIInsights(
  args: RequestArgs,
): Promise<AIInsightsResult> {
  if (!hasValidConsent(args.consent)) {
    return { ok: false, reason: 'no-consent' };
  }

  // Feature flag: until a backend proxy exists, this module never
  // touches the network. The architecture is wired; the wire is cut.
  const networkEnabled =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_ENABLE_AI_INSIGHTS_NETWORK === 'true';
  if (!networkEnabled) {
    return { ok: false, reason: 'network-disabled' };
  }

  // Build the sanitized transport payload.
  let body: string;
  try {
    body = buildTransportPayload({
      entries: args.entries,
      windowDays: args.windowDays,
      locale: args.locale,
      instanceId: args.consent.instanceId,
    });
  } catch {
    return { ok: false, reason: 'malformed-response' };
  }

  // Proxy URL is required when the flag is on. If missing, we still
  // refuse to fetch — never fall back to direct provider call.
  const proxyUrl =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    typeof import.meta.env.VITE_AI_PROXY_URL === 'string'
      ? import.meta.env.VITE_AI_PROXY_URL
      : '';
  if (!proxyUrl) {
    return { ok: false, reason: 'network-disabled' };
  }

  try {
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      signal: args.signal,
    });
    if (res.status === 429) return { ok: false, reason: 'rate-limited' };
    if (!res.ok) return { ok: false, reason: 'proxy-error' };
    const json = (await res.json()) as { insights?: AIInsightsResult['insights'] };
    if (!json || !Array.isArray(json.insights)) {
      return { ok: false, reason: 'malformed-response' };
    }
    return { ok: true, insights: json.insights };
  } catch (err) {
    if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
      return { ok: false, reason: 'aborted' };
    }
    return { ok: false, reason: 'proxy-error' };
  }
}

/** Convenience boolean: should the AI Insights tile show its consent CTA, the loading state, or the empty/disabled placeholder? */
export type AITileState =
  | 'needs-consent'      // user hasn't granted
  | 'network-disabled'   // feature flag off (v1 default)
  | 'ready'              // consent + flag both on; can request
  | 'in-flight'          // mid-request
  | 'error';

export function deriveTileState(
  consent: AIConsentState,
  inFlight: boolean,
  lastError: AIInsightsResult['reason'] | null,
): AITileState {
  if (!hasValidConsent(consent)) return 'needs-consent';
  const networkEnabled =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_ENABLE_AI_INSIGHTS_NETWORK === 'true';
  if (!networkEnabled) return 'network-disabled';
  if (inFlight) return 'in-flight';
  if (lastError && lastError !== 'aborted') return 'error';
  return 'ready';
}
