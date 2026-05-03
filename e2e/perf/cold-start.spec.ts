/**
 * [R20-5] Network-throttled cold-start perf spec.
 *
 * Lighthouse-CI uses a sim-3G profile but it audits a single
 * production page-load. R20-5 adds a real-throttle e2e walk that
 * proves the inline brand splash actually helps perceived perf:
 * even on a slow connection, the user sees branded chrome
 * (spinner + wordmark + tagline) within ~200ms of HTML arrival,
 * not a 2-3s blank page while the bundle downloads.
 *
 * Throttling: we slow down /assets/ chunk responses with a route
 * handler that delays each fulfill by `chunkDelayMs`. This is a
 * real network simulation — not Vite dev-server tricks — so the
 * splash render path is exercised exactly as the cold-load user
 * experiences it.
 *
 * Why not Playwright's `client.send('Network.emulateNetworkConditions')`:
 *   It works but applies globally, blocking even the initial HTML
 *   document. We want a moderate HTML download (so the splash
 *   markup arrives quickly) but a slow asset download (so we can
 *   prove the splash bridges the gap). route.continue() with a
 *   per-URL delay gives us that selectivity.
 *
 * Budgets: thresholds are deliberately generous to absorb CI
 * variance. They prove behavior, not exact-millisecond targets.
 *
 * NOT in the default CI run: this spec is opt-in via test.describe
 * + a grep filter (`-g 'R20-5'`). The default playwright run skips
 * it to keep CI fast. Run locally:
 *
 *   npm run build && npm run preview &
 *   npx playwright test e2e/perf/cold-start.spec.ts
 */

import { expect, test } from '@playwright/test';

test.describe('[R20-5] cold-start perf with throttled assets', () => {
  test('inline splash visible before bundle finishes downloading', async ({ page }) => {
    /* Throttle every /assets/ chunk by 800ms — generous enough to
     * make the test stable on shared CI but slow enough that
     * "splash appears immediately" is a real claim. */
    const CHUNK_DELAY_MS = 800;
    await page.route('**/assets/**', async (route) => {
      await new Promise((r) => setTimeout(r, CHUNK_DELAY_MS));
      await route.continue();
    });

    const t0 = Date.now();
    await page.goto('/', { waitUntil: 'commit' });

    /* The splash should be in the DOM right after the HTML commits,
     * BEFORE any bundle loads. We don't wait for load — that's the
     * point. */
    const splash = page.locator('#initial-loader');
    await expect(splash).toBeVisible({ timeout: 1000 });
    const splashAt = Date.now() - t0;
    expect(
      splashAt,
      `splash visible at ${splashAt}ms; budget 1000ms (inline CSS should make this near-instant)`,
    ).toBeLessThan(1000);

    /* Wordmark text should be readable immediately (not serif
     * fallback — the inline CSS pins font-family). */
    await expect(page.locator('.alch-splash-wordmark')).toContainText(/alchohalt/i);

    /* Bundle eventually finishes; root content replaces splash. */
    await expect(splash).toBeHidden({ timeout: 10_000 });
    const totalLoadAt = Date.now() - t0;
    /* Generous total budget — proves we don't hang past 10s even
     * with 800ms-per-chunk throttling. Real budget is the
     * splash-visible-at assertion above. */
    expect(totalLoadAt).toBeLessThan(10_000);
  });

  test('FCP is dominated by the inline splash, not the bundle', async ({ page }) => {
    await page.route('**/assets/**', async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.continue();
    });

    /* Read FCP from PerformanceObserver. We snapshot it after the
     * splash is visible — the FCP entry should reference the
     * splash render time, not the bundle paint. */
    await page.goto('/', { waitUntil: 'commit' });
    await page.locator('#initial-loader').waitFor({ state: 'visible', timeout: 2000 });

    const fcp = await page.evaluate(() => {
      return new Promise<number | null>((resolve) => {
        const entries = performance.getEntriesByType('paint');
        const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');
        if (fcpEntry) {
          resolve(fcpEntry.startTime);
          return;
        }
        /* If FCP not yet recorded, observe for it. */
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              resolve(entry.startTime);
              return;
            }
          }
        }).observe({ type: 'paint', buffered: true });
        /* Cap the wait at 5s — far past the inline splash should
         * have rendered. */
        setTimeout(() => resolve(null), 5000);
      });
    });

    expect(fcp, 'no FCP recorded').not.toBeNull();
    /* FCP < 1500ms even with 800ms-per-chunk throttling — proves
     * the inline splash carries the FCP, not the bundle. */
    expect(fcp!).toBeLessThan(1500);
  });
});
