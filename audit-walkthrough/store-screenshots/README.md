# Store-screenshot capture

**Round 10:** ✅ all 50 captures successful, 0 failed.

The capture script (`tools/marketing/capture_store_screenshots.ts`) runs the
full required matrix:

- iPhone 6.5" (1284×2778)
- iPhone 5.5" (1242×2208)
- iPad Pro 12.9" (2048×2732)
- Android phone portrait (1080×1920)
- Android 16:9 landscape (1920×1080)

× 2 themes (light, dark) × 5 surfaces (today, track, goals, insights, crisis)
= 50 PNGs, ~40 MB total.

## Status by round

- **Round 7:** captured 6.7" iPhone + Pixel 6 only.
- **Round 8:** widened the matrix in code; runtime wedge prevented capture.
- **Round 9:** added the `window.__APP_READY__` handshake in `src/main.tsx`.
- **Round 10:** wired the handshake into the capture script + fixed a
  `@capacitor/core` bare-specifier bug that crashed lazy chunks at runtime.
  Full matrix now captures in **~75 seconds** with zero handshake timeouts.

The R10 fix to `vite.config.ts` (alias `@capacitor/core` to a web stub) was a
**latent production bug** uncovered by the screenshot work — the lazy chunks
on the live web build were throwing `Failed to resolve module specifier
"@capacitor/core"` whenever a user opened Goals / AdvancedGoalSetting /
DrinkForm / etc. Web-only smoke didn't catch it because the eager chunk
renders fine; only secondary tabs hit the broken lazy chunks.

## Why MANIFEST.md is committed but PNGs aren't

40+ MB of PNGs would triple the repo size for an artifact that regenerates
deterministically from the same seed. `MANIFEST.md` carries each file's size
+ sha256, so a reviewer can re-run the capture and `git diff MANIFEST.md` to
verify a fresh run matches an audited one.

## To regenerate

```bash
npm run build
# Terminal 1:
npx vite preview --port 4173
# Terminal 2:
node tools/marketing/verify_screenshot_plan.cjs   # pre-flight
npx tsx tools/marketing/capture_store_screenshots.ts
node tools/marketing/write_manifest.cjs           # refresh MANIFEST.md
```

Subset by device or surface during debugging:

```bash
npx tsx tools/marketing/capture_store_screenshots.ts --devices=iphone-6-5
npx tsx tools/marketing/capture_store_screenshots.ts --surfaces=today,track
```

Output lands in `audit-walkthrough/store-screenshots/<device>/<theme>/<surface>.png`.

## App Store upload

The 50 PNGs sit on the runner that captured them. App Store Connect / Play
Console accept these dimensions directly — no framing or mockup overlays are
required (the captures are real bundle screenshots, not marketing mocks).
