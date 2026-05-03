/**
 * [R20-5] Splash CSS is self-sufficient (no Tailwind / runtime needed).
 *
 * Vitest companion to e2e/perf/cold-start.spec.ts. The e2e spec
 * exercises the full network-throttled cold load; this unit test
 * pins the invariant that the inline <style> block alone styles the
 * entire splash markup — no Tailwind classes, no runtime CSS.
 *
 * If a future change adds a Tailwind class to the splash <div>, this
 * test fails: it would mean the cold-load splash depends on the
 * bundle finishing, defeating the perceived-perf win.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(__dirname, '..', '..');
const HTML = readFileSync(join(REPO_ROOT, 'index.html'), 'utf-8');

/* Pull every class name on every element inside #initial-loader.
 * Anything that doesn't start with `alch-splash-` is suspicious —
 * either a Tailwind class (won't style without bundle) or a
 * forgotten dev-only class. */
function extractSplashClasses(html: string): string[] {
  const splashStart = html.indexOf('id="initial-loader"');
  if (splashStart < 0) throw new Error('splash not found in index.html');
  /* Find the matching </div> for the splash container. We close on
   * the first </div> after the splash-inner span. Heuristic but
   * works because the splash is small and well-defined. */
  const splashEnd = html.indexOf('</div>\n\n    <!-- App root', splashStart);
  if (splashEnd < 0) throw new Error('splash close not found');
  const splashHtml = html.slice(splashStart, splashEnd);
  const classMatches = [...splashHtml.matchAll(/class="([^"]+)"/g)];
  return classMatches.flatMap((m) => m[1]!.trim().split(/\s+/));
}

describe('[R20-5] inline splash is bundle-independent', () => {
  it('every class on the splash starts with alch-splash- (matches inline CSS)', () => {
    const classes = extractSplashClasses(HTML);
    expect(classes.length, 'splash should have at least one styled element').toBeGreaterThan(0);
    for (const cls of classes) {
      expect(
        cls,
        `unexpected class on splash: "${cls}" — would not style without the bundle`,
      ).toMatch(/^alch-splash-/);
    }
  });

  it('inline <style> defines all classes the splash uses', () => {
    const classes = extractSplashClasses(HTML);
    const styleMatch = HTML.match(/<style>([\s\S]*?)<\/style>/);
    expect(styleMatch).not.toBeNull();
    const styleBody = styleMatch![1]!;
    for (const cls of classes) {
      expect(
        styleBody,
        `inline <style> missing rule for .${cls}`,
      ).toContain(`.${cls}`);
    }
  });

  it('inline <style> covers prefers-reduced-motion + dark mode', () => {
    const styleMatch = HTML.match(/<style>([\s\S]*?)<\/style>/);
    const styleBody = styleMatch![1]!;
    /* Reduced-motion guard so the spinner doesn't animate when the
     * user's system says no. */
    expect(styleBody).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    /* Dark-mode guard so the splash background matches the system
     * theme on cold load (no flash-of-light-mode). */
    expect(styleBody).toMatch(/@media\s*\(prefers-color-scheme:\s*dark\)/);
  });
});
