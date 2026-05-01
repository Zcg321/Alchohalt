#!/usr/bin/env node
/**
 * Lighthouse audit for the five main surfaces × mobile/desktop.
 *
 * Reuses the same chromium that Playwright pulled down via
 * playwright install. We launch a fresh chrome via chrome-launcher.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import lighthouse from 'lighthouse';
import { chromium } from 'playwright';

const RUN_ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(RUN_ROOT, 'lighthouse');
await mkdir(OUT, { recursive: true });

const DEV_URL = process.env.DEV_URL ?? 'http://localhost:5173';

const SURFACES = [
  { id: 'today', path: '/?tab=today' },
  { id: 'track', path: '/?tab=track' },
  { id: 'goals', path: '/?tab=goals' },
  { id: 'insights', path: '/?tab=insights' },
  { id: 'settings', path: '/?tab=settings' },
];

const FORMS = [
  {
    id: 'mobile',
    cfg: {
      extends: 'lighthouse:default',
      settings: {
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 812,
          deviceScaleFactor: 2,
          disabled: false,
        },
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        },
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
      },
    },
  },
  {
    id: 'desktop',
    cfg: {
      extends: 'lighthouse:default',
      settings: {
        formFactor: 'desktop',
        screenEmulation: {
          mobile: false,
          width: 1440,
          height: 900,
          deviceScaleFactor: 1,
          disabled: false,
        },
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
  },
];

const summary = [];

// Reuse the Playwright-managed Chromium with a remote-debugging port so
// chrome-launcher's spawn issues on Windows don't matter. Pass the port
// straight to lighthouse.
const debuggingPort = 9222;
const browser = await chromium.launch({
  args: [`--remote-debugging-port=${debuggingPort}`],
});
const chrome = { port: debuggingPort, kill: () => browser.close() };

try {
  for (const form of FORMS) {
    for (const surface of SURFACES) {
      const url = `${DEV_URL}${surface.path}`;
      const tag = `${surface.id}__${form.id}`;
      process.stdout.write(`Running ${tag}... `);
      try {
        const result = await lighthouse(url, { port: chrome.port, output: 'json' }, form.cfg);
        const cats = result.lhr.categories;
        const out = {
          surface: surface.id,
          form: form.id,
          performance: Math.round((cats.performance?.score ?? 0) * 100),
          accessibility: Math.round((cats.accessibility?.score ?? 0) * 100),
          'best-practices': Math.round((cats['best-practices']?.score ?? 0) * 100),
          seo: Math.round((cats.seo?.score ?? 0) * 100),
          pwa: cats.pwa ? Math.round(cats.pwa.score * 100) : null,
          totalBlockingTime: result.lhr.audits['total-blocking-time']?.numericValue ?? null,
          totalByteWeight: result.lhr.audits['total-byte-weight']?.numericValue ?? null,
        };
        await writeFile(
          join(OUT, `${tag}.json`),
          JSON.stringify(out, null, 2),
        );
        summary.push(out);
        console.log(
          `perf=${out.performance} a11y=${out.accessibility} bp=${out['best-practices']} seo=${out.seo}` +
            (out.pwa !== null ? ` pwa=${out.pwa}` : ''),
        );
      } catch (e) {
        console.log(`FAILED: ${e.message}`);
        summary.push({ surface: surface.id, form: form.id, error: e.message });
      }
    }
  }
} finally {
  await chrome.kill();
}

await writeFile(join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(`\nWrote ${join(OUT, 'summary.json')}`);
