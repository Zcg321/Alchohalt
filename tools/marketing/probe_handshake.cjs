#!/usr/bin/env node
/**
 * Quick probe: does the bundled app actually fire __APP_READY__ within
 * 10s? Helps diagnose whether the handshake timeout in the capture
 * script is a real bug or a script-side problem.
 */
const { chromium } = require('playwright');

const URL = process.env.DEV_URL || 'http://localhost:4173';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const consoleMessages = [];
  page.on('console', (msg) => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => consoleMessages.push(`[pageerror] ${err.message}`));

  await page.goto(URL, { waitUntil: 'domcontentloaded' });

  const ready = await page.evaluate(async () => {
    const start = Date.now();
    while (Date.now() - start < 10000) {
      if (window.__APP_READY__ === true) {
        return { ready: true, elapsedMs: Date.now() - start };
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    return { ready: false, elapsedMs: Date.now() - start };
  });

  const flag = await page.evaluate(() => ({
    flag: window.__APP_READY__,
    persist: typeof (window.useDB && window.useDB.persist),
  }));

  console.log('handshake result:', ready);
  console.log('window state:    ', flag);
  console.log('console output:');
  for (const m of consoleMessages.slice(0, 30)) console.log('  ', m);
  await browser.close();
})();
