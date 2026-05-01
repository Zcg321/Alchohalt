/**
 * Reproducible App Store + Play Store screenshot capture.
 *
 * Captures 5 surfaces × 2 platforms × 2 themes = 20 PNGs:
 *   public/marketing/screenshots/{ios,android}/{light,dark}/{today,track,goals,insights,crisis}.png
 *
 * iOS at 1290×2796 (iPhone 6.7" — App Store requirement)
 * Android at 1080×2400 (Pixel 6 viewport — Play Store requirement)
 *
 * State is seeded deterministically: a calm 7-day demo (one entry mid-streak,
 * not 366 days). The seed runs as a page init script before the app boots,
 * so the screenshots reflect a real run of the app, not a mock.
 *
 * Workflow:
 *   1. npm install -D playwright
 *   2. npx playwright install chromium
 *   3. npm run build
 *   4. (in another shell) npx vite preview --port 4173
 *   5. npx tsx tools/marketing/capture_screenshots.ts
 *
 * Override the target URL with DEV_URL=http://localhost:5173 if you'd rather
 * point at the live dev server. Pass --surfaces=today,crisis to subset.
 */

import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { Browser, Page } from 'playwright';

const REPO_ROOT = join(__dirname, '..', '..');
const OUT_ROOT = join(REPO_ROOT, 'public', 'marketing', 'screenshots');
const DEV_URL = process.env.DEV_URL ?? 'http://localhost:4173';

type Platform = 'ios' | 'android';
type Theme = 'light' | 'dark';
type SurfaceId = 'today' | 'track' | 'goals' | 'insights' | 'crisis';

interface Surface {
  id: SurfaceId;
  tab: 'today' | 'track' | 'goals' | 'insights';
  openCrisis?: boolean;
}

const SURFACES: Surface[] = [
  { id: 'today', tab: 'today' },
  { id: 'track', tab: 'track' },
  { id: 'goals', tab: 'goals' },
  { id: 'insights', tab: 'insights' },
  { id: 'crisis', tab: 'today', openCrisis: true },
];

const VIEWPORTS: Record<Platform, { width: number; height: number; deviceScaleFactor: number }> = {
  // App Store: iPhone 6.7" hero shots = 1290×2796
  ios: { width: 1290, height: 2796, deviceScaleFactor: 3 },
  // Play Store: Pixel 6 portrait viewport = 1080×2400
  android: { width: 1080, height: 2400, deviceScaleFactor: 3 },
};

const THEMES: Theme[] = ['light', 'dark'];

const DB_KEY = 'alchohalt:alchohalt.db';

/**
 * 7-day calm streak seed: a single early entry from 14 days ago,
 * then a clean week. Reads as "real recovery progress," not aspirational.
 */
function makeSeedPayload(now: number): string {
  const day = 24 * 60 * 60 * 1000;
  const entry = {
    id: 'demo-entry-1',
    ts: now - 14 * day,
    kind: 'beer' as const,
    stdDrinks: 1.5,
    cost: 7.5,
    intention: 'social' as const,
    craving: 3,
    halt: { H: false, A: false, L: false, T: false },
    notes: 'dinner with friends',
    mood: 'calm' as const,
  };
  const db = {
    version: 5,
    entries: [entry],
    trash: [],
    settings: {
      version: 1,
      language: 'en',
      theme: 'system',
      dailyGoalDrinks: 2,
      weeklyGoalDrinks: 7,
      monthlyBudget: 80,
      reminders: { enabled: false, times: [] },
      showBAC: false,
      hasCompletedOnboarding: true,
    },
    advancedGoals: [],
    presets: [],
    meta: {},
  };
  return JSON.stringify({ state: { db }, version: 5 });
}

async function captureOne(
  browser: Browser,
  platform: Platform,
  theme: Theme,
  surface: Surface,
): Promise<void> {
  const seedPayload = makeSeedPayload(Date.now());
  const ctx = await browser.newContext({
    viewport: VIEWPORTS[platform],
    deviceScaleFactor: VIEWPORTS[platform].deviceScaleFactor,
    colorScheme: theme,
    isMobile: true,
    hasTouch: true,
  });
  await ctx.addInitScript(
    ([key, value]: [string, string]) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* ignore — storage may be locked in some contexts */
      }
    },
    [DB_KEY, seedPayload],
  );

  const page: Page = await ctx.newPage();
  await page.goto(`${DEV_URL}/?tab=${surface.tab}`, { waitUntil: 'networkidle' });
  // Allow theme + initial render to settle
  await page.waitForTimeout(800);

  if (surface.openCrisis) {
    await page.click('button[aria-label="Open crisis resources"]');
    await page.waitForSelector('[role="dialog"], [aria-modal="true"]', { timeout: 5000 });
    await page.waitForTimeout(400);
  }

  const out = join(OUT_ROOT, platform, theme, `${surface.id}.png`);
  await mkdir(dirname(out), { recursive: true });
  await page.screenshot({ path: out, fullPage: false });
  // eslint-disable-next-line no-console
  console.log(`✓ ${platform}/${theme}/${surface.id}.png`);

  await ctx.close();
}

function parseSurfacesArg(): Surface[] {
  const arg = process.argv.find((a) => a.startsWith('--surfaces='));
  if (!arg) return SURFACES;
  const ids = arg.slice('--surfaces='.length).split(',') as SurfaceId[];
  return SURFACES.filter((s) => ids.includes(s.id));
}

async function main(): Promise<void> {
  // Lazy import so this file can be type-checked even when playwright
  // isn't installed yet (deliberate: keeps the script committable
  // without forcing the heavy dep on every dev).
  const { chromium } = (await import('playwright')) as typeof import('playwright');
  const browser = await chromium.launch();
  const surfaces = parseSurfacesArg();
  let captured = 0;
  let failed = 0;
  for (const platform of ['ios', 'android'] as Platform[]) {
    for (const theme of THEMES) {
      for (const surface of surfaces) {
        try {
          await captureOne(browser, platform, theme, surface);
          captured += 1;
        } catch (err) {
          failed += 1;
          // eslint-disable-next-line no-console
          console.error(`✗ ${platform}/${theme}/${surface.id}.png — ${(err as Error).message}`);
        }
      }
    }
  }
  await browser.close();
  // eslint-disable-next-line no-console
  console.log(`\n${captured} captured, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}
