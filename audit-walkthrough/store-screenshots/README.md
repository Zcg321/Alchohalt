# Store-screenshot capture

Round 8 lands the **capture script** (`tools/marketing/capture_store_screenshots.ts`)
across 5 device classes × 2 themes × 5 surfaces (50 PNGs). Actual capture is
**deferred** to a dedicated screenshot session — it ran for 60+ minutes against
a Playwright/preview-server combination that wedged on the crisis-resources
modal hydration step on iPad/Android landscape viewports.

## Why deferred, not "executed"

The wedge is on the runtime side, not the script side:
- 6.7" iPhone + Pixel 6 portrait already work in CI (round 7).
- 6.5" / 5.5" iPhone + iPad Pro + Android landscape add more devices, but the
  crisis-pill `waitForSelector` time-outs are inconsistent across viewport
  sizes and the preview-server's network-idle event fires before the SPA route
  resolves on the larger viewports.
- The fix is to either swap to a screenshot-only DOM-render approach (no
  Playwright), or to instrument the SPA with a `window.__APP_READY__` signal
  the script can wait on. Neither is one-line; both are out-of-scope for the
  rest of round 8.

## To run when the rendering issue is debugged

```bash
npx playwright install chromium
npm run build
# In one shell:
npx vite preview --port 4173
# In another:
npx tsx tools/marketing/capture_store_screenshots.ts
```

Subset by device or surface during debugging:

```bash
npx tsx tools/marketing/capture_store_screenshots.ts --devices=iphone-6-5
npx tsx tools/marketing/capture_store_screenshots.ts --surfaces=today,track
```

Output lands in `audit-walkthrough/store-screenshots/<device>/<theme>/<surface>.png`.
