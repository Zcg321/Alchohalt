# Store screenshot capture — manifest

Generated: 2026-05-02T19:17:58.175Z

- **Files:** 50
- **Total bytes:** 42,148,285 (40.2 MB)

## Why a manifest, not the binaries

40+ MB of PNGs would triple the repo footprint without earning their keep —
they regenerate deterministically from the same seed via
`tools/marketing/capture_store_screenshots.ts`. The manifest gives a
reviewer a way to verify a fresh capture matches an audited one:

```sh
npm run build
npx vite preview --port 4173 &
npx tsx tools/marketing/capture_store_screenshots.ts
node tools/marketing/write_manifest.cjs
git diff audit-walkthrough/store-screenshots/MANIFEST.md
```

## Files

| Path | Size (bytes) | SHA-256 |
| --- | ---: | --- |
| `android-landscape/dark/crisis.png` | 657,950 | `c1eb38760a23cbe2…` |
| `android-landscape/dark/goals.png` | 321,827 | `329b8248f5d517a3…` |
| `android-landscape/dark/insights.png` | 687,110 | `837875fefe0c11ba…` |
| `android-landscape/dark/today.png` | 231,057 | `cb992ff2428ec5e5…` |
| `android-landscape/dark/track.png` | 304,643 | `a1ebcec740f0ec9c…` |
| `android-landscape/light/crisis.png` | 285,299 | `938006465172561f…` |
| `android-landscape/light/goals.png` | 332,798 | `65830091f6a0eca4…` |
| `android-landscape/light/insights.png` | 157,708 | `d21ef21fbe3b3219…` |
| `android-landscape/light/today.png` | 114,427 | `fc13ef2ef31e51c7…` |
| `android-landscape/light/track.png` | 146,644 | `a974f13d40ecc65e…` |
| `android-portrait/dark/crisis.png` | 1,858,019 | `fcddc8b53b224823…` |
| `android-portrait/dark/goals.png` | 1,186,672 | `2a7a561d3e8e7e31…` |
| `android-portrait/dark/insights.png` | 2,467,820 | `a035d0dbdb490bbb…` |
| `android-portrait/dark/today.png` | 405,739 | `0d7993059ea89316…` |
| `android-portrait/dark/track.png` | 799,723 | `4748d4d08f263259…` |
| `android-portrait/light/crisis.png` | 668,043 | `66c7e0ce86adf1cc…` |
| `android-portrait/light/goals.png` | 1,017,854 | `0d87f00c2df88858…` |
| `android-portrait/light/insights.png` | 529,271 | `fe212d915b668e98…` |
| `android-portrait/light/today.png` | 199,140 | `5698425bf009d835…` |
| `android-portrait/light/track.png` | 507,794 | `2d3486b447d3cf2b…` |
| `ipad-pro-12-9/dark/crisis.png` | 1,137,855 | `76a908e8ac4f9c7a…` |
| `ipad-pro-12-9/dark/goals.png` | 779,717 | `0429ea49f0d9cda9…` |
| `ipad-pro-12-9/dark/insights.png` | 2,215,581 | `4886c6fca5bb959e…` |
| `ipad-pro-12-9/dark/today.png` | 280,884 | `7bcae7b3277e3b13…` |
| `ipad-pro-12-9/dark/track.png` | 531,376 | `6d5c948ea68fef56…` |
| `ipad-pro-12-9/light/crisis.png` | 482,454 | `dc86fe69ac9c4bb7…` |
| `ipad-pro-12-9/light/goals.png` | 682,159 | `047429ccfd262b6d…` |
| `ipad-pro-12-9/light/insights.png` | 507,244 | `dc54c5d2f89e0cdc…` |
| `ipad-pro-12-9/light/today.png` | 163,993 | `79a1a0e544fa9b77…` |
| `ipad-pro-12-9/light/track.png` | 370,667 | `ba340eabb9c5203b…` |
| `iphone-5-5/dark/crisis.png` | 1,894,235 | `bdd4c9cb38805554…` |
| `iphone-5-5/dark/goals.png` | 1,212,392 | `3a0de286b3ea32b4…` |
| `iphone-5-5/dark/insights.png` | 2,946,420 | `a3f97bfcde5a0ef8…` |
| `iphone-5-5/dark/today.png` | 431,980 | `60b16810c9212518…` |
| `iphone-5-5/dark/track.png` | 820,728 | `7177040a9b595321…` |
| `iphone-5-5/light/crisis.png` | 696,434 | `4ee3ad4bc8f68376…` |
| `iphone-5-5/light/goals.png` | 1,044,634 | `8611858d8b0341af…` |
| `iphone-5-5/light/insights.png` | 645,318 | `cbf45a6dde3d07a9…` |
| `iphone-5-5/light/today.png` | 219,015 | `509cf4b77d93b37e…` |
| `iphone-5-5/light/track.png` | 530,962 | `5bcc49701f2b77ee…` |
| `iphone-6-5/dark/crisis.png` | 1,921,448 | `9fe954f50533f42e…` |
| `iphone-6-5/dark/goals.png` | 1,242,002 | `a3deabff354f42fa…` |
| `iphone-6-5/dark/insights.png` | 3,819,806 | `ff03a974094abb09…` |
| `iphone-6-5/dark/today.png` | 456,034 | `974a9e37da4653fb…` |
| `iphone-6-5/dark/track.png` | 849,439 | `2fe06a18d9a7ba74…` |
| `iphone-6-5/light/crisis.png` | 721,109 | `9d192fbaefb953cc…` |
| `iphone-6-5/light/goals.png` | 1,071,200 | `1d28814d8db3bae9…` |
| `iphone-6-5/light/insights.png` | 794,989 | `5f3fe9d2b17693c9…` |
| `iphone-6-5/light/today.png` | 244,197 | `a2871ccda6850a1f…` |
| `iphone-6-5/light/track.png` | 554,475 | `d7294b5e952401dd…` |