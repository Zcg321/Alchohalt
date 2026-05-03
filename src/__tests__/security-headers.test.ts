/**
 * [R20-3] Pin the cross-origin-isolation header set in vercel.json.
 *
 * The four COxP headers added in R20-3:
 *   Cross-Origin-Opener-Policy:    same-origin
 *   Cross-Origin-Resource-Policy:  same-origin
 *   Cross-Origin-Embedder-Policy:  credentialless
 *
 * Together they lock down the cross-origin isolation posture:
 *   - COOP: same-origin: a popup or window.open target from a
 *     different origin can't read window.opener back into us.
 *   - CORP: same-origin: cross-origin sites can't <img>, <script>
 *     or <link> our resources without a CORS-allowed CORP header.
 *   - COEP: credentialless: same-as-require-corp but ALLOWS
 *     loading cross-origin no-cors resources WITHOUT credentials.
 *     This is the gentler mode — `require-corp` would break our
 *     Supabase / Sentry fetches unless we routed them through a
 *     proxy that sets CORP. `credentialless` works because our
 *     cross-origin fetches (Supabase, Sentry) are CORS+credentials-
 *     aware and don't need cookies.
 *
 * Plus the existing R19-5 set (X-Content-Type-Options, X-Frame-
 * Options, Referrer-Policy, Permissions-Policy, CSP) are sanity-
 * pinned here so a regression that drops one of them surfaces.
 *
 * If a future change needs to disable one of these (e.g. enabling
 * a third-party embed), edit this test deliberately — don't just
 * remove the assertion.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(__dirname, '..', '..');
const VERCEL = JSON.parse(readFileSync(join(REPO_ROOT, 'vercel.json'), 'utf-8')) as {
  headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
};

const globalHeaders = (() => {
  const block = VERCEL.headers.find((h) => h.source === '/(.*)');
  if (!block) throw new Error('vercel.json missing global /(.*) header block');
  const map = new Map<string, string>();
  for (const kv of block.headers) map.set(kv.key, kv.value);
  return map;
})();

describe('[R20-3] cross-origin-isolation headers', () => {
  it('Cross-Origin-Opener-Policy: same-origin', () => {
    expect(globalHeaders.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
  });

  it('Cross-Origin-Resource-Policy: same-origin', () => {
    expect(globalHeaders.get('Cross-Origin-Resource-Policy')).toBe('same-origin');
  });

  it('Cross-Origin-Embedder-Policy: credentialless (not require-corp)', () => {
    /* Pinning credentialless explicitly: require-corp would break
     * cross-origin no-CORS embeds without a proxy. */
    expect(globalHeaders.get('Cross-Origin-Embedder-Policy')).toBe('credentialless');
  });
});

describe('[R19-5+] existing security header set is intact', () => {
  it('X-Content-Type-Options: nosniff', () => {
    expect(globalHeaders.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('X-Frame-Options: DENY', () => {
    expect(globalHeaders.get('X-Frame-Options')).toBe('DENY');
  });

  it('Referrer-Policy: strict-origin-when-cross-origin', () => {
    expect(globalHeaders.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('Permissions-Policy locks camera/microphone/geolocation', () => {
    const p = globalHeaders.get('Permissions-Policy') ?? '';
    expect(p).toContain('camera=()');
    expect(p).toContain('microphone=()');
    expect(p).toContain('geolocation=()');
  });

  it('CSP carries object-src none + frame-ancestors none', () => {
    const csp = globalHeaders.get('Content-Security-Policy') ?? '';
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("script-src 'self'");
  });
});
