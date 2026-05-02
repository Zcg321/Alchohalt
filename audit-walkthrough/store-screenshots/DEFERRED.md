# [R8-A3] Store screenshots — deferred to a later round

## What's here

- `tools/marketing/capture_store_screenshots.ts` — Playwright driver for
  the full required device matrix:
  - iPhone 6.5" (1284×2778)
  - iPhone 5.5" (1242×2208)
  - iPad Pro 12.9" (2048×2732)
  - Android phone portrait (1080×1920)
  - Android 16:9 landscape (1920×1080)
- 5 surfaces × 5 devices × 2 themes = 50 PNGs intended.

## Why nothing is checked in

Two problems surfaced during the round-8 attempt:

1. **`networkidle` fires before React mounts.** The bundle splits and
   the splash overlay sits in front of `#root` until `window.load`,
   so `page.goto(..., { waitUntil: 'networkidle' })` returns while the
   SPA is still bootstrapping. Result: 40 of 50 captures came back as
   blank cream-colored splash screens, not real app content.

2. **The crisis-pill selector races hydration.** Even after the SPA
   mounts, the AppHeader pill button (`button[aria-label="Open crisis
   resources"]`) takes long enough to attach on the larger viewports
   that a 30-second click timeout still misses it. 10 of 50 captures
   failed with locator-not-found errors for that reason alone.

The right fix is a Playwright `wait_for` on a meaningful "app rendered"
sentinel — e.g. `await page.waitForSelector('header h1', { state:
'visible' })` instead of relying on `networkidle`. The component
visual-regression rig in §B will give us that pattern; once it's wired
and trusted, lifting it into this script is the right next step.

## How to re-run once §B's wait pattern is in place

```bash
npx playwright install chromium
npm run build
(in another shell) npx vite preview --port 4173
npx tsx tools/marketing/capture_store_screenshots.ts
```

Subsetting works:

```bash
npx tsx tools/marketing/capture_store_screenshots.ts \
  --devices=iphone-6-5,ipad-pro-12-9 \
  --surfaces=today,insights
```

Output lands in `audit-walkthrough/store-screenshots/<device>/<theme>/<surface>.png`.

## Marketing framing / mockup overlays

Out of scope for the capture pipeline. The PNGs this script produces
are the raw app frames. App Store / Play Console accept those directly
(no device-frame required since 2018), so the framing pass is optional
polish that whoever runs the marketing-asset upload can do in
Figma/Photoshop with a shipped device-mockup template.
