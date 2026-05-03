/**
 * Regression for [BUG-FOUC-SPLASH].
 *
 * Cold loads were showing serif "Alchohalt" + "Loading your wellness
 * coach…" on a white background for the first 2-3 seconds before
 * Tailwind hydrated. Looked "developer-built." Fix: inline critical
 * CSS for the splash so the pre-hydration view matches the post-
 * hydration brand chrome.
 *
 * This test pins the contract: index.html ships an inline <style> block
 * that styles the splash with the brand palette, the splash markup uses
 * those styled classes, and the meta-description follows the [MARKETING-1]
 * positioning canon (calm, not "AI-powered").
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(__dirname, '..', '..');
const HTML = readFileSync(join(REPO_ROOT, 'index.html'), 'utf-8');

describe('[BUG-FOUC-SPLASH] cold-load chrome', () => {
  it('ships inline <style> with the brand palette before bundle loads', () => {
    expect(HTML).toMatch(/<style>[\s\S]*--alch-sage:\s*#5A8073/i);
    expect(HTML).toMatch(/--alch-cream:\s*#F8F5F0/i);
  });

  it('splash element uses the inline-styled classes (not Tailwind only)', () => {
    expect(HTML).toMatch(/id="initial-loader"/);
    expect(HTML).toMatch(/class="alch-splash-inner"/);
    expect(HTML).toMatch(/class="alch-splash-spinner"/);
    expect(HTML).toMatch(/class="alch-splash-wordmark"/);
  });

  it('does NOT ship the old slate-gradient splash markup', () => {
    expect(HTML).not.toMatch(/from-slate-900/);
    expect(HTML).not.toMatch(/Loading your wellness coach/);
  });

  it('meta description follows MARKETING-1 positioning (calm, not AI-powered)', () => {
    const m = HTML.match(/<meta\s+name="description"\s+content="([^"]+)"/);
    expect(m, 'meta description tag missing').not.toBeNull();
    const desc = m![1]!;
    expect(desc.toLowerCase()).not.toMatch(/ai-powered|smart recommendations/);
    expect(desc.toLowerCase()).toMatch(/calm|crisis|leaderboard/);
  });

  it('respects prefers-reduced-motion (spinner does not animate)', () => {
    expect(HTML).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });

  it('[R19-5] loader removal handled by main.tsx (no inline script in HTML)', () => {
    /* The inline loader-removal script was extracted to src/main.tsx
     * in R19-5 so the CSP can declare script-src 'self' with no
     * inline-script allowance. Verify HTML contains no inline
     * <script> bodies (a script tag with src= is fine). */
    const inlineScript = HTML.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/);
    if (inlineScript) {
      const body = inlineScript[1]?.trim() ?? '';
      expect(body, `unexpected inline script body: ${body.slice(0, 80)}`).toBe('');
    }
  });
});

describe('[R19-5] CSP meta-tag fallback', () => {
  it('ships a Content-Security-Policy meta-tag for non-Vercel hosts', () => {
    expect(HTML).toMatch(/<meta[^>]+http-equiv="Content-Security-Policy"/);
  });

  it('CSP forbids object-src and frame-ancestors', () => {
    const m = HTML.match(/<meta[^>]+http-equiv="Content-Security-Policy"[^>]+content="([^"]+)"/);
    expect(m).not.toBeNull();
    const csp = m![1] ?? '';
    expect(csp).toMatch(/object-src 'none'/);
    expect(csp).toMatch(/frame-ancestors 'none'/);
    expect(csp).toMatch(/script-src 'self'/);
  });
});

describe('[R20-A] CSP style-src sha256 hash matches inline <style> body', () => {
  /* R20-A added a SHA-256 hash of the inline <style> block to style-src
   * as defense-in-depth. Even when 'unsafe-inline' is dropped (a future
   * follow-up once dynamic-width inline styles migrate to CSS `attr()`
   * typed reads), the splash still loads via the hash.
   *
   * If the inline <style> body is edited, this test fails and tells you
   * to recompute the hash and update both index.html and vercel.json.
   * Recompute via:
   *   node -e "const c=require('crypto');const h=require('fs').readFileSync('index.html','utf8');const m=h.match(/<style>([\\s\\S]*?)<\\/style>/);console.log('sha256-'+c.createHash('sha256').update(m[1],'utf8').digest('base64'))"
   */
  it('hash in meta CSP matches the actual <style> block content', async () => {
    const styleMatch = HTML.match(/<style>([\s\S]*?)<\/style>/);
    expect(styleMatch, 'no inline <style> block found').not.toBeNull();
    const styleBody = styleMatch![1]!;

    const cspMatch = HTML.match(/<meta[^>]+http-equiv="Content-Security-Policy"[^>]+content="([^"]+)"/);
    const csp = cspMatch![1]!;
    const hashMatch = csp.match(/'sha256-([A-Za-z0-9+/=]+)'/);
    expect(hashMatch, 'meta CSP missing sha256 hash for style-src').not.toBeNull();

    const { createHash } = await import('node:crypto');
    const actualHash = createHash('sha256').update(styleBody, 'utf8').digest('base64');
    expect(hashMatch![1]).toBe(actualHash);
  });

  it('vercel.json CSP header carries the same sha256 hash as the meta CSP', async () => {
    const vercelJson: { headers: Array<{ headers: Array<{ key: string; value: string }> }> } =
      JSON.parse(readFileSync(join(REPO_ROOT, 'vercel.json'), 'utf-8'));
    const cspHeader = vercelJson.headers
      .flatMap((h) => h.headers)
      .find((kv) => kv.key === 'Content-Security-Policy');
    expect(cspHeader, 'vercel.json missing CSP header').toBeDefined();
    const headerHash = cspHeader!.value.match(/'sha256-([A-Za-z0-9+/=]+)'/);
    expect(headerHash, 'vercel.json CSP missing sha256 hash').not.toBeNull();

    const styleBody = HTML.match(/<style>([\s\S]*?)<\/style>/)![1]!;
    const { createHash } = await import('node:crypto');
    const actualHash = createHash('sha256').update(styleBody, 'utf8').digest('base64');
    expect(headerHash![1]).toBe(actualHash);
  });
});

describe('[A11Y-VIEWPORT-ZOOM] viewport meta does not block zoom', () => {
  it('viewport meta omits maximum-scale and user-scalable=no (WCAG 1.4.4)', () => {
    const m = HTML.match(/<meta\s+name="viewport"\s+content="([^"]+)"/);
    expect(m, 'viewport meta tag missing').not.toBeNull();
    const content = m![1];
    expect(content).toMatch(/width=device-width/);
    expect(content).toMatch(/initial-scale=1/);
    expect(content).not.toMatch(/maximum-scale=1/);
    expect(content).not.toMatch(/user-scalable\s*=\s*no/);
  });
});
