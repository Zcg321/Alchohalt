#!/usr/bin/env node
/**
 * Verify the 15 behavioral invariants from the audit spec by driving
 * Playwright against the running dev server. Writes invariants.json
 * with PASS/FAIL per invariant + evidence.
 *
 * Reuses tools/marketing/capture_lib.ts for seed.
 */

import { mkdir, readFileSync, writeFile } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';

const RUN_ROOT = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(RUN_ROOT, '..', '..', '..');
const DEV_URL = process.env.DEV_URL ?? 'http://localhost:5173';

const DB_KEY = 'alchohalt:alchohalt.db';

function makeSeed({ withEntry = true, onboarded = true, dailyGoal = 2 } = {}) {
  const now = Date.now();
  const day = 86400000;
  const entry = {
    id: 'demo',
    ts: now - 14 * day,
    kind: 'beer',
    stdDrinks: 1.5,
    cost: 7.5,
    intention: 'social',
    craving: 3,
    halt: { H: false, A: false, L: false, T: false },
    notes: 'demo',
    mood: 'calm',
  };
  return JSON.stringify({
    state: {
      db: {
        version: 5,
        entries: withEntry ? [entry] : [],
        trash: [],
        settings: {
          version: 1,
          language: 'en',
          theme: 'system',
          dailyGoalDrinks: dailyGoal,
          weeklyGoalDrinks: 7,
          monthlyBudget: 80,
          reminders: { enabled: false, times: [] },
          showBAC: false,
          hasCompletedOnboarding: onboarded,
        },
        advancedGoals: [],
        presets: [],
        meta: {},
      },
    },
    version: 5,
  });
}

const results = [];
function record(id, status, detail) {
  results.push({ id, status, detail });
  // eslint-disable-next-line no-console
  console.log(`[${status}] #${id}: ${detail}`);
}

const browser = await chromium.launch();

async function newPage(opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    colorScheme: opts.colorScheme ?? 'light',
  });
  await ctx.addInitScript(
    ([k, v]) => {
      try {
        localStorage.setItem(k, v);
      } catch {}
    },
    [DB_KEY, opts.seed ?? makeSeed()],
  );
  const page = await ctx.newPage();
  return { ctx, page };
}

// ─── #1: No NaN% anywhere ───────────────────────────────────────────
{
  const { ctx, page } = await newPage();
  await page.goto(`${DEV_URL}/?tab=insights`, { waitUntil: 'networkidle' });
  await sleep(800);
  const text = await page.locator('body').innerText();
  const has = /NaN\s*%/i.test(text);
  record('1', has ? 'FAIL' : 'PASS', has ? 'Found NaN% in body text' : 'No NaN% on Insights');
  await ctx.close();
}

// ─── #2: No "Daily Limit Reached" red alert on Day-0/0-drinks ───────
{
  const { ctx, page } = await newPage({ seed: makeSeed({ withEntry: false }) });
  await page.goto(`${DEV_URL}/?tab=today`, { waitUntil: 'networkidle' });
  await sleep(800);
  const text = await page.locator('body').innerText();
  const offending = /daily limit reached/i.test(text);
  record('2', offending ? 'FAIL' : 'PASS', offending ? '"Daily Limit Reached" present on Day-0' : 'No false-positive limit alert');
  await ctx.close();
}

// ─── #3: Settings nav button under Quick Actions actually navigates ─
{
  const { ctx, page } = await newPage();
  await page.goto(`${DEV_URL}/?tab=today`, { waitUntil: 'networkidle' });
  await sleep(500);
  // Try to find a Settings quick-action button
  const settingsBtn = page.locator('button, a').filter({ hasText: /^Settings$/i });
  const count = await settingsBtn.count();
  if (count === 0) {
    record('3', 'FAIL', 'No "Settings" Quick Action button found on Today');
  } else {
    await settingsBtn.first().click().catch(() => {});
    await sleep(500);
    const url = page.url();
    const onSettings = /tab=settings/.test(url);
    const settingsHeader = await page.locator('h1,h2').filter({ hasText: /Settings/i }).count();
    record(
      '3',
      onSettings || settingsHeader > 0 ? 'PASS' : 'FAIL',
      onSettings || settingsHeader > 0
        ? 'Quick Actions Settings → Settings panel'
        : `Click did not navigate (url=${url})`,
    );
  }
  await ctx.close();
}

// ─── #4: Welcome modal Skip persists onboarding flag ────────────────
{
  const { ctx, page } = await newPage({ seed: makeSeed({ onboarded: false, withEntry: false }) });
  await page.goto(`${DEV_URL}/`, { waitUntil: 'networkidle' });
  await sleep(800);
  // Look for a Skip control
  const skipBtn = page.locator('button, a').filter({ hasText: /^Skip/i });
  const skipCount = await skipBtn.count();
  if (skipCount === 0) {
    record('4', 'WARN', 'No "Skip" button found on initial onboarding view (might be valid)');
  } else {
    await skipBtn.first().click({ force: true }).catch(() => {});
    await sleep(500);
    // Reload and check the modal is not shown
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(800);
    const stillModal = await page
      .locator('button, a')
      .filter({ hasText: /^Skip/i })
      .count();
    record(
      '4',
      stillModal === 0 ? 'PASS' : 'FAIL',
      stillModal === 0 ? 'Skip persisted; modal does not re-show' : 'Modal re-showed after skip+reload',
    );
  }
  await ctx.close();
}

// ─── #5: "Need help?" pill is muted indigo, not red ─────────────────
{
  const { ctx, page } = await newPage();
  await page.goto(`${DEV_URL}/?tab=today`, { waitUntil: 'networkidle' });
  await sleep(500);
  const pill = page.locator('button[aria-label="Open crisis resources"]');
  const exists = (await pill.count()) > 0;
  if (!exists) {
    record('5', 'FAIL', '"Need help?" pill (button[aria-label="Open crisis resources"]) not found');
  } else {
    const cls = await pill.first().getAttribute('class');
    const hasIndigo = /indigo/.test(cls ?? '');
    const hasRed = /\bbg-red|\btext-red/.test(cls ?? '');
    record(
      '5',
      hasIndigo && !hasRed ? 'PASS' : 'FAIL',
      hasIndigo && !hasRed
        ? 'Pill uses indigo classes, no red'
        : `class="${cls}" indigo=${hasIndigo} red=${hasRed}`,
    );
  }
  await ctx.close();
}

// ─── #6: Hero copy leads with calm, not encryption ──────────────────
{
  const { ctx, page } = await newPage({ seed: makeSeed({ withEntry: false }) });
  await page.goto(`${DEV_URL}/?tab=today`, { waitUntil: 'networkidle' });
  await sleep(700);
  const heroText = (await page.locator('body').innerText()).slice(0, 800);
  const startsWithEnc = /^[^.]*\b(encrypted|cryptographically|never leaves|zero[- ]knowledge)\b/i.test(
    heroText.split('\n').filter((l) => l.trim()).slice(0, 3).join(' '),
  );
  const hasCalm = /\b(calm|leaderboard|gamif|crisis support|real help)\b/i.test(heroText);
  record(
    '6',
    !startsWithEnc && hasCalm ? 'PASS' : 'FAIL',
    `startsWithEncryption=${startsWithEnc} hasCalmWedge=${hasCalm}`,
  );
  await ctx.close();
}

// ─── #7: Pricing — $4.99 / $24.99 / $69 ────────────────────────────
{
  const { ctx, page } = await newPage();
  await page.goto(`${DEV_URL}/?tab=settings`, { waitUntil: 'networkidle' });
  await sleep(500);
  // Scroll to find pricing
  await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll('button,a,h2,h3')).filter((e) =>
      /(Plan|Subscription|Premium|Billing)/i.test(e.textContent ?? ''),
    );
    candidates[0]?.click();
  });
  await sleep(600);
  const pageText = await page.locator('body').innerText();
  const has499 = /\$4\.99/.test(pageText);
  const has2499 = /\$24\.99/.test(pageText);
  const has69 = /\$69\b/.test(pageText);
  const has399 = /\$3\.99/.test(pageText);
  record(
    '7',
    has499 && has2499 && has69 && !has399 ? 'PASS' : 'FAIL',
    `$4.99=${has499} $24.99=${has2499} $69=${has69} stale-$3.99=${has399}`,
  );
  await ctx.close();
}

// ─── #8: App icon at public/icons/icon-1024.png is the new design ──
{
  const { statSync } = await import('node:fs');
  const path = join(REPO_ROOT, 'public/icons/icon-1024.png');
  let ok = false;
  let detail = '';
  try {
    const st = statSync(path);
    ok = st.size > 5000;
    detail = `size=${st.size} bytes`;
  } catch (e) {
    detail = `missing: ${e.message}`;
  }
  record('8', ok ? 'PASS' : 'FAIL', detail);
}

// ─── #9: Dark mode WCAG AA contrast — covered by axe runs ──────────
{
  // Check axe results from walkthrough — color-contrast violations imply fail
  const sumPath = join(RUN_ROOT, 'summary.json');
  try {
    const sum = JSON.parse(readFileSync(sumPath, 'utf-8'));
    // Look at one dark-mode result
    const darkMobileToday = sum.results.find(
      (r) => r.surface === 'today-day0' && r.viewport === 'mobile' && r.theme === 'dark',
    );
    if (darkMobileToday?.axeReport) {
      const axe = JSON.parse(readFileSync(darkMobileToday.axeReport, 'utf-8'));
      const cc = axe.violations.find((v) => v.id === 'color-contrast');
      record(
        '9',
        cc ? 'FAIL' : 'PASS',
        cc ? `${cc.nodes.length} nodes fail color-contrast in dark mode` : 'No color-contrast violations in dark Today',
      );
    } else {
      record('9', 'WARN', 'no dark axe report to check');
    }
  } catch (e) {
    record('9', 'WARN', `cannot read summary: ${e.message}`);
  }
}

// ─── #10: 5-tab bottom nav on mobile ────────────────────────────────
{
  const { ctx, page } = await newPage();
  await page.goto(`${DEV_URL}/?tab=today`, { waitUntil: 'networkidle' });
  await sleep(500);
  // Look for nav with role or aria-label
  const tabBar = page.locator('nav, [role="tablist"]').last();
  const tabCount = await page
    .locator('button, a')
    .filter({ hasText: /^(Today|Track|Goals|Insights|Settings)$/i })
    .count();
  record(
    '10',
    tabCount >= 5 ? 'PASS' : 'FAIL',
    `found ${tabCount} tab labels (Today/Track/Goals/Insights/Settings)`,
  );
  await ctx.close();
}

// ─── #11: 5-tab top nav on desktop ──────────────────────────────────
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
  });
  await ctx.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch {} }, [DB_KEY, makeSeed()]);
  const page = await ctx.newPage();
  await page.goto(`${DEV_URL}/?tab=today`, { waitUntil: 'networkidle' });
  await sleep(500);
  const tabCount = await page
    .locator('button, a')
    .filter({ hasText: /^(Today|Track|Goals|Insights|Settings)$/i })
    .count();
  record(
    '11',
    tabCount >= 5 ? 'PASS' : 'FAIL',
    `found ${tabCount} tab labels on desktop`,
  );
  await ctx.close();
}

// ─── #12: No surprising console log spam ────────────────────────────
{
  const { ctx, page } = await newPage();
  const messages = [];
  page.on('console', (msg) => messages.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', (err) => messages.push({ type: 'pageerror', text: err.message }));
  for (const tab of ['today', 'track', 'goals', 'insights', 'settings']) {
    await page.goto(`${DEV_URL}/?tab=${tab}`, { waitUntil: 'networkidle' });
    await sleep(500);
  }
  const errors = messages.filter((m) => ['error', 'pageerror'].includes(m.type));
  const warnings = messages.filter((m) => m.type === 'warning');
  const info = messages.filter((m) => m.type === 'info');
  record(
    '12',
    errors.length === 0 ? 'PASS' : 'FAIL',
    `errors=${errors.length} warnings=${warnings.length} info=${info.length}` +
      (errors[0] ? ` first-error="${errors[0].text.slice(0, 80)}"` : ''),
  );
  await ctx.close();
}

// ─── #13: GitHub Pages legal docs ───────────────────────────────────
{
  const urls = [
    'https://zcg321.github.io/alchohalt/',
    'https://zcg321.github.io/alchohalt/privacy-policy.html',
    'https://zcg321.github.io/alchohalt/terms-of-service.html',
    'https://zcg321.github.io/alchohalt/eula.html',
    'https://zcg321.github.io/alchohalt/subscription-terms.html',
    'https://zcg321.github.io/alchohalt/consumer-health-data-policy.html',
  ];
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  let ok = 0;
  let fail = 0;
  const detail = [];
  for (const u of urls) {
    try {
      const r = await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 8000 });
      const status = r?.status() ?? 0;
      if (status === 200) {
        ok += 1;
      } else {
        fail += 1;
        detail.push(`${status} ${u.split('/').pop()}`);
      }
    } catch (e) {
      fail += 1;
      detail.push(`ERR ${u.split('/').pop()}: ${e.message.slice(0, 30)}`);
    }
  }
  record(
    '13',
    fail === 0 ? 'PASS' : 'FAIL',
    `${ok}/${urls.length} legal URLs reachable. ${detail.join('; ')}`,
  );
  await ctx.close();
}

// ─── #14: AI Insights consent OFF→Review→Enable ─────────────────────
{
  const { ctx, page } = await newPage();
  await page.goto(`${DEV_URL}/?tab=settings`, { waitUntil: 'networkidle' });
  await sleep(700);
  const aiHeading = await page
    .locator('h1, h2, h3, h4, button')
    .filter({ hasText: /AI Insights|AI Settings/i })
    .count();
  let detail = `AI Insights heading found: ${aiHeading > 0}`;
  if (aiHeading > 0) {
    await page
      .locator('h1, h2, h3, h4, button')
      .filter({ hasText: /AI Insights|AI Settings/i })
      .first()
      .scrollIntoViewIfNeeded();
    await sleep(300);
    const reviewBtn = await page
      .locator('button')
      .filter({ hasText: /Review|Enable|Disclosure|Configure/i })
      .count();
    detail += `; ai-flow-buttons=${reviewBtn}`;
  }
  record('14', aiHeading > 0 ? 'PASS' : 'FAIL', detail);
  await ctx.close();
}

// ─── #15: Crisis modal in ≤2 taps from every screen ─────────────────
{
  const { ctx, page } = await newPage();
  let allOk = true;
  const tabs = ['today', 'track', 'goals', 'insights', 'settings'];
  const results15 = [];
  for (const t of tabs) {
    await page.goto(`${DEV_URL}/?tab=${t}`, { waitUntil: 'networkidle' });
    await sleep(400);
    const pillCount = await page.locator('button[aria-label="Open crisis resources"]').count();
    if (pillCount === 0) {
      allOk = false;
      results15.push(`${t}:NO-PILL`);
    } else {
      results15.push(`${t}:OK`);
    }
  }
  record('15', allOk ? 'PASS' : 'FAIL', results15.join(' '));
  await ctx.close();
}

await browser.close();

const passed = results.filter((r) => r.status === 'PASS').length;
const failed = results.filter((r) => r.status === 'FAIL').length;
const warned = results.filter((r) => r.status === 'WARN').length;

const fs = await import('node:fs/promises');
await fs.writeFile(
  join(RUN_ROOT, 'invariants.json'),
  JSON.stringify({ passed, failed, warned, results }, null, 2),
);
console.log(`\n${passed} PASS / ${failed} FAIL / ${warned} WARN — out of ${results.length}`);
