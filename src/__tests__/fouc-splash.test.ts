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
    const desc = m![1];
    expect(desc.toLowerCase()).not.toMatch(/ai-powered|smart recommendations/);
    expect(desc.toLowerCase()).toMatch(/calm|crisis|leaderboard/);
  });

  it('respects prefers-reduced-motion (spinner does not animate)', () => {
    expect(HTML).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });

  it('fade-out script removes the loader from the DOM', () => {
    expect(HTML).toMatch(/loader\.remove/);
    expect(HTML).toMatch(/data-fade/);
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
