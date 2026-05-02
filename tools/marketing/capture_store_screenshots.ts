/**
 * [R8-A3] Round-8 store-screenshot capture at every required dimension.
 *
 * App Store + Play Console accept different exact viewport pairs per
 * device class. Round-7 produced only iPhone 6.7" + Pixel 6 portrait.
 * Round-8 widens the matrix to the full required set:
 *
 *   iPhone 6.5"     1284×2778  (App Store fallback for 6.5" devices)
 *   iPhone 5.5"     1242×2208  (App Store legacy SE)
 *   iPad Pro 12.9"  2048×2732  (App Store iPad)
 *   Android phone   1080×1920  (Play Console portrait minimum)
 *   Android 16:9    1920×1080  (Play Console feature graphic landscape)
 *
 * 5 surfaces × 5 device classes × 2 themes = 50 PNGs.
 * Output: audit-walkthrough/store-screenshots/<device>/<theme>/<surface>.png
 *
 * Reuses tools/marketing/capture_lib.ts seed payload — same calm 7-day
 * demo, no fake numbers. The iPad and Android-landscape views shrink
 * the chrome differently; this script does NOT inject framing /
 * mockups (that's a marketing pass for whoever runs the App Store
 * upload).
 *
 * Workflow (same as the 6.7" script):
 *   npx playwright install chromium
 *   npm run build
 *   (in another shell) npx vite preview --port 4173
 *   npx tsx tools/marketing/capture_store_screenshots.ts
 *
 * Subset by device or surface:
 *   --devices=ipad,android-landscape
 *   --surfaces=today,crisis
 */

import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Browser, Page } from 'playwright';

import { DB_KEY, makeSeedPayload } from './capture_lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..', '..');
const OUT_ROOT = join(REPO_ROOT, 'audit-walkthrough', 'store-screenshots');
const DEV_URL = process.env.DEV_URL ?? 'http://localhost:4173';

type DeviceId =
  | 'iphone-6-5'
  | 'iphone-5-5'
  | 'ipad-pro-12-9'
  | 'android-portrait'
  | 'android-landscape';
type Theme = 'light' | 'dark';
type SurfaceId = 'today' | 'track' | 'goals' | 'insights' | 'crisis';

interface Surface {
  id: SurfaceId;
  tab: 'today' | 'track' | 'goals' | 'insights';
  openCrisis?: boolean;
}

interface DeviceProfile {
  id: DeviceId;
  width: number;
  height: number;
  scale: number;
  isMobile: boolean;
  hasTouch: boolean;
  /** Human-readable label for the report. */
  label: string;
}

const SURFACES: Surface[] = [
  { id: 'today', tab: 'today' },
  { id: 'track', tab: 'track' },
  { id: 'goals', tab: 'goals' },
  { id: 'insights', tab: 'insights' },
  { id: 'crisis', tab: 'today', openCrisis: true },
];

const DEVICES: DeviceProfile[] = [
  { id: 'iphone-6-5',       width: 1284, height: 2778, scale: 3, isMobile: true,  hasTouch: true,  label: 'iPhone 6.5" (1284×2778)' },
  { id: 'iphone-5-5',       width: 1242, height: 2208, scale: 3, isMobile: true,  hasTouch: true,  label: 'iPhone 5.5" (1242×2208)' },
  { id: 'ipad-pro-12-9',    width: 2048, height: 2732, scale: 2, isMobile: true,  hasTouch: true,  label: 'iPad Pro 12.9" (2048×2732)' },
  { id: 'android-portrait', width: 1080, height: 1920, scale: 3, isMobile: true,  hasTouch: true,  label: 'Android phone portrait (1080×1920)' },
  { id: 'android-landscape',width: 1920, height: 1080, scale: 2, isMobile: false, hasTouch: false, label: 'Android 16:9 landscape (1920×1080)' },
];

const THEMES: Theme[] = ['light', 'dark'];

async function captureOne(
  browser: Browser,
  device: DeviceProfile,
  theme: Theme,
  surface: Surface,
): Promise<void> {
  const seedPayload = makeSeedPayload();
  const ctx = await browser.newContext({
    viewport: { width: device.width, height: device.height },
    deviceScaleFactor: device.scale,
    colorScheme: theme,
    isMobile: device.isMobile,
    hasTouch: device.hasTouch,
  });
  await ctx.addInitScript(
    ([key, value]: [string, string]) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* storage may be locked — best-effort */
      }
    },
    [DB_KEY, seedPayload],
  );

  const page: Page = await ctx.newPage();
  await page.goto(`${DEV_URL}/?tab=${surface.tab}`, { waitUntil: 'domcontentloaded' });
  // [R10-E] Use the __APP_READY__ handshake from main.tsx instead of
  // racing networkidle. The handshake fires once first paint AND
  // zustand persist hydration finish — exactly the right moment to
  // shoot. 8s ceiling matches the 5s in-app cap plus headroom for
  // slow CI runners. Falls back to a brief sleep if the handshake
  // never fires (older builds).
  try {
    await page.waitForFunction(
      () => (window as unknown as { __APP_READY__?: boolean }).__APP_READY__ === true,
      undefined,
      { timeout: 8000 },
    );
  } catch {
    // eslint-disable-next-line no-console
    console.warn(`  ⚠ APP_READY handshake timed out for ${device.id}/${theme}/${surface.id} — falling back to fixed wait`);
    await page.waitForTimeout(1500);
  }
  // Small post-ready settle for animations + layout stabilization.
  await page.waitForTimeout(300);

  if (surface.openCrisis) {
    // Some viewports take longer for React to hydrate the AppHeader
    // pill — networkidle fires before the SPA route resolves. Wait
    // a bit more aggressively, then click via JS if the visibility
    // check times out (button may be off-screen but still clickable).
    const pillSel = 'button[aria-label="Open crisis resources"]';
    try {
      await page.waitForSelector(pillSel, { timeout: 12000, state: 'attached' });
      await page.evaluate((sel) => {
        const btn = document.querySelector(sel) as HTMLButtonElement | null;
        btn?.scrollIntoView({ block: 'start' });
        btn?.click();
      }, pillSel);
    } catch {
      // Last resort: navigate to a tab that surfaces the crisis card
      // directly. If even that fails, the per-surface try/catch in
      // main() records the failure and continues.
      await page.goto(`${DEV_URL}/?tab=settings`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      await page.click(pillSel);
    }
    await page.waitForSelector('[role="dialog"], [aria-modal="true"]', {
      timeout: 5000,
    });
    await page.waitForTimeout(400);
  }

  const out = join(OUT_ROOT, device.id, theme, `${surface.id}.png`);
  await mkdir(dirname(out), { recursive: true });
  await page.screenshot({ path: out, fullPage: false });
  // eslint-disable-next-line no-console
  console.log(`✓ ${device.id}/${theme}/${surface.id}.png`);

  await ctx.close();
}

function parseListArg<T extends string>(name: string, all: T[]): T[] {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!arg) return all;
  const ids = arg.slice(`--${name}=`.length).split(',') as T[];
  return all.filter((x) => ids.includes(x));
}

async function main(): Promise<void> {
  // Lazy import keeps the script type-checkable when playwright isn't
  // installed in the env doing typechecking.
  const { chromium } = (await import('playwright')) as typeof import('playwright');
  const browser = await chromium.launch();
  const surfaces = SURFACES.filter((s) =>
    parseListArg<SurfaceId>('surfaces', SURFACES.map((x) => x.id)).includes(s.id),
  );
  const devices = DEVICES.filter((d) =>
    parseListArg<DeviceId>('devices', DEVICES.map((x) => x.id)).includes(d.id),
  );
  let captured = 0;
  let failed = 0;
  for (const device of devices) {
    for (const theme of THEMES) {
      for (const surface of surfaces) {
        try {
          await captureOne(browser, device, theme, surface);
          captured += 1;
        } catch (err) {
          failed += 1;
          // eslint-disable-next-line no-console
          console.error(
            `✗ ${device.id}/${theme}/${surface.id}.png — ${(err as Error).message}`,
          );
        }
      }
    }
  }
  await browser.close();
  // eslint-disable-next-line no-console
  console.log(`\n${captured} captured, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
