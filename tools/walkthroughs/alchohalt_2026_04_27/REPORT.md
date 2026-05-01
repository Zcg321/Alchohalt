# Production-readiness audit — Alchohalt — 2026-04-27

**Baseline pre-audit:** `ab3031e` ([MARKETING-1] Reframe positioning)
**Baseline post-fix:** `a62470a` ([BUG-FOUC-SPLASH] Brand-styled cold-load splash)
**Audit driver:** `tools/walkthroughs/alchohalt_2026_04_27/run_walkthrough.ts`
(reuses the [SHIP-2] capture lib at `tools/marketing/capture_lib.ts`)
**Lighthouse driver:** `tools/walkthroughs/alchohalt_2026_04_27/run_lighthouse.mjs`
**Invariants driver:** `tools/walkthroughs/alchohalt_2026_04_27/verify_invariants.mjs`

The audit ran the unfixed code first, surfaced four P0/P1 bugs that were
fixed mid-audit (per owner mandate), then re-ran every measurement against
the fixed code. Both runs' artifacts are in this directory.

---

## VERDICT: **NEEDS-WORK**

Four P0s landed during the walk and are now fixed. Several P1s remain
that would embarrass the team at App Store review or first-thousand-user
volume. A11y is the largest gap — Lighthouse 76-86 across all five main
surfaces vs the 95 target.

---

## Phase 1 — Smoke

| Check       | Status           | Detail |
|-------------|------------------|--------|
| `npm run lint`        | **3 errors**, 45 warnings | Pre-existing from `d7f4a7c [IA-2]` — react/no-unescaped-entities in GoalsTab.tsx:36, TrackTab.tsx:68 (×2). Audit introduced no new lint errors. |
| `npm run typecheck`   | **6 errors**     | Pre-existing from SYNC-3 — `drinkType` ×4 in `src/lib/sync/__tests__/dbBridge.test.ts`, `crypto_hash_sha256` ×2 in `src/lib/sync/mnemonic.ts`. Audit introduced no new typecheck errors. |
| `npm test -- --run`   | **512 passed / 1 skipped / 0 failed** | Up from 480 baseline. Audit added 18 regression tests across 4 fix commits. |
| `npm run dev`         | **OK (~700 ms ready)** | Reachable at `localhost:5173/5174` once stale instance was cleared. |

---

## Fixes landed mid-audit (owner mandate, all on `origin/main`)

| Commit | Title |
|---|---|
| `19d5c6e` | `[BUG-DB-SERIALIZATION]` Stop persisting db as literal "[object Object]" |
| `a97b424` | `[BUG-PREFERENCES-SHIM-COVERAGE]` Route all Preferences via shim, guard with eslint |
| `be7d9a4` | `[BUG-DUPLICATE-REACT-ROOT]` Vite dedupe + replace isolation band-aid |
| `a62470a` | `[BUG-FOUC-SPLASH]` Brand-styled cold-load splash + MARKETING-1 meta description |

Each commit body has the root-cause analysis + the regression test that
locks the fix in.

---

## Phase 2 — Screenshots

84 captures (21 surfaces × 2 viewports × 2 themes). Stored under
`tools/walkthroughs/alchohalt_2026_04_27/screenshots/<surface>/<viewport>/<theme>.png`.

**Surfaces covered:**

| Surface | Notes |
|---|---|
| `onboarding-beat-1` | "Hi. What brings you here today?" — chip selector |
| `onboarding-beat-2` | "How would you like to track?" — rhythm selector |
| `onboarding-beat-3` | "Your data is yours." — encryption proof-point beat |
| `today-day0` | Day 0, "Calm tracking. No leaderboards. Real help if you need it." copy live ✓ |
| `today-checked-in` | Day count + milestone target |
| `today-logged` | (state seeded with same-day entry — Today shows logged variant) |
| `track-empty` | "No drinks logged yet" with calm ToDay's-a-fresh-start copy |
| `track-with-seed` | Drink history rendered |
| `track-form-collapsed` / `-add-detail` / `-more-with-halt` | Three progressive-disclosure levels |
| `goals-no-goals` / `-with-defaults` / `-active` | Three states |
| `insights-paywalled-free` / `insights-premium` | Free vs premium surfacing |
| `settings-full` / `settings-ai-off` | Full nav + AI section |
| `plan-and-billing-paywall` | (See P1-PAYWALL-NOT-MOUNTED below) |
| `crisis-modal` | Modal opened from header pill |
| `error-boundary` | Same as today (no actual error injected) |

Cold-load splash post-fix: `screenshots/_splash-cold/mobile.png` — sage
spinner + lowercase wordmark + "A calm alcohol tracker." on cream.

---

## Phase 3 — Behavioral invariants

`invariants.json` for full output. Pass/fail summary:

| # | Invariant | Status | Evidence |
|---|-----------|:---:|----------|
| 1 | No `NaN%` anywhere | ✅ PASS | Insights body text has no NaN% |
| 2 | No "Daily Limit Reached" red alert on Day-0/0-drinks | ✅ PASS | Today body text on day-0 doesn't contain the string |
| 3 | Settings nav button under Quick Actions actually navigates | ❌ FAIL | No "Settings" Quick Action button found on Today panel — see P1-SETTINGS-QUICK-ACTION |
| 4 | Welcome modal Skip persists | ⚠️ TEST-METHODOLOGY ISSUE | Playwright init script re-seeds `onboarded:false` on every page reload, so this can't be verified via that path. The unit-level `persistence-serialization.test.ts` proves the underlying serialization bug is fixed. Manual verification of full-load → skip → manual-refresh recommended. |
| 5 | "Need help?" pill is muted indigo, not red | ✅ PASS | `class` contains `indigo`, no `bg-red`/`text-red` |
| 6 | Hero copy leads with calm, not encryption | ✅ PASS | `startsWithEncryption=false hasCalmWedge=true` |
| 7 | Pricing — $4.99 / $24.99 / $69 visible | ⚠️ TEST-LIMITATION | The integration test couldn't navigate to the paywall surface — see P1-PAYWALL-NOT-MOUNTED. Unit-level `src/__tests__/pricing.test.ts` confirms PLANS source-of-truth has the right values. |
| 8 | App icon at `public/icons/icon-1024.png` is the new design | ✅ PASS | 56602 bytes |
| 9 | Dark mode WCAG AA contrast | ❌ FAIL | 7 nodes fail color-contrast in dark mode on Today — see P1-DARK-CONTRAST |
| 10 | 5-tab bottom nav on mobile | ✅ PASS | Today/Track/Goals/Insights/Settings all visible |
| 11 | 5-tab top nav on desktop | ✅ PASS | Same five labels found |
| 12 | No surprising browser-console log spam | ✅ PASS | 0 errors, 0 warnings, 5 info messages across all 5 tabs |
| 13 | GitHub Pages legal docs reachable from in-app | ❌ FAIL | All 6 URLs 404 — see **P0-PAGES-NOT-PUBLISHED** |
| 14 | AI Insights consent flow OFF→Review→Enable | ✅ PASS | AI Insights heading present, consent flow buttons rendered |
| 15 | Crisis modal reachable in ≤2 taps from every screen | ✅ PASS | "Open crisis resources" button on all 5 tabs |

**10 hard PASS / 3 hard FAIL / 2 test-methodology gaps**

---

## Phase 4 — Lighthouse + axe-core

### Lighthouse (post-fix run, against `vite dev` so perf is dev-build numbers — production numbers will be higher)

| Surface  | Mobile perf / a11y / bp / seo | Desktop |
|----------|-------------------------------|---------|
| Today    | 69 / **76** / 100 / 91        | 80 / **84** / 100 / 91 |
| Track    | 68 / **77** / 100 / 91        | 78 / **84** / 100 / 91 |
| Goals    | 66 / **76** / 100 / 91        | 79 / **84** / 100 / 91 |
| Insights | 70 / **76** / 100 / 91        | 80 / **84** / 100 / 91 |
| Settings | 71 / **78** / 100 / 82        | 80 / **86** / 100 / 82 |

**A11y target was 95.** Actual 76-86 across the board. Best-Practices
clean at 100. SEO 91 except Settings at 82 (probably a missing
description/title for that route).

Total byte weight ~3.3 MB per surface (dev bundle, not minified —
production figure will be much smaller).

### axe-core (every surface, both viewports)

Stable global violations:

| Rule | Severity | Occurrences | Where |
|---|---|---:|---|
| `aria-required-children` | critical | 1 | `<ul>` (the bottom-tab nav `<ul>` is missing required `<li role="...">` children with the right ARIA) |
| `aria-required-parent` | critical | 5 (mobile) / 3 (desktop) | tab nav items not enclosed in correct ARIA parent |
| `listitem` | serious | 5 (mobile) / 3 (desktop) | `<li>` not contained in `<ul>` / `<ol>` |
| `color-contrast` | serious | 12 (mobile) / 7 (dark) | various low-contrast text — see P1-DARK-CONTRAST |
| `meta-viewport` | moderate | 1 | `user-scalable=no` blocks zoom — accessibility users need to be able to zoom (P1-VIEWPORT-NO-ZOOM) |

axe reports per surface saved to
`tools/walkthroughs/alchohalt_2026_04_27/axe/<surface>__<viewport>__<theme>.json`.

---

## Phase 5 — Empty / loading / error states

| State | Surface | Captured |
|---|---|---|
| Empty | `track-empty`, `goals-no-goals`, `insights-paywalled-free` | ✓ in screenshots dir |
| Loading | `_splash-cold/mobile.png` (cold-load splash, post-fix) | ✓ |
| Error | `error-boundary/<viewport>/<theme>.png` | ✓ but bomb wasn't actually injected — see P3-ERROR-BOUNDARY-DRILL |

---

# Findings table — every issue surfaced

## P0 — production-blocking

### P0-PAGES-NOT-PUBLISHED — GitHub Pages legal docs return 404

**Verified:** 0 of 6 URLs reachable. Every route under
`https://zcg321.github.io/alchohalt/...` returns 404.

```
404 https://zcg321.github.io/alchohalt/
404 https://zcg321.github.io/alchohalt/privacy-policy.html
404 https://zcg321.github.io/alchohalt/terms-of-service.html
404 https://zcg321.github.io/alchohalt/eula.html
404 https://zcg321.github.io/alchohalt/subscription-terms.html
404 https://zcg321.github.io/alchohalt/consumer-health-data-policy.html
```

**Why this is P0:** App Store + Play Store submissions REQUIRE a publicly
accessible Privacy Policy URL. The submission cannot proceed until these
URLs return 200.

**Likely causes (per the gate flagged in `docs/launch/LISTING_NOTES.md`):**
1. Repo is currently private — GitHub Pages on a free account requires
   public visibility. Owner must flip the alchohalt repo to public OR
   upgrade to GitHub Pro.
2. Pages workflow has not been run. After visibility is fixed, the
   `pages.yml` workflow needs to either run on next push to `main` (any
   change under `docs/legal/**` triggers it) or be triggered manually
   via `workflow_dispatch`.
3. Pages is not enabled in repo settings. Once the workflow runs:
   Settings → Pages → Source: GitHub Actions.

**Fix:** owner-action — flip repo public (or upgrade), enable Pages,
trigger workflow. Confirm URLs return 200, then App Store / Play Store
submission can proceed.

---

(All four other P0s — `[BUG-DB-SERIALIZATION]`, `[BUG-PREFERENCES-SHIM-COVERAGE]`,
`[BUG-DUPLICATE-REACT-ROOT]`, `[BUG-FOUC-SPLASH]` — landed during the audit
walk and are on `origin/main`. Listed in "Fixes landed mid-audit" above.)

---

## P1 — would-embarrass-team

### P1-A11Y-TARGET-MISS — Accessibility 76-86 vs 95 target

Every Lighthouse a11y category for every surface is below the 95 target.
Mobile sits 76-78, desktop 84-86. The systemic axe-core findings
(aria-required-children, aria-required-parent, listitem) are all
**bottom-tab-nav structural problems**, replicated across every surface.

**File:** `src/app/TabShell.tsx` — the tab nav structure. Likely fix:
ensure the `<ul role="tablist">` contains `<li role="presentation">` /
`<button role="tab">` children with the right ARIA wiring per WAI-ARIA
1.2 tabs pattern.

**Recommended fix:** one PR retargeting `TabShell.tsx` to the WAI-ARIA
tabs pattern. Single fix, surfaces a11y back into the 90s across all
five main routes.

### P1-DARK-CONTRAST — 7 nodes fail color-contrast in dark mode

The audit's axe scan found 7 dark-mode color-contrast failures on the
Today panel (and similar counts on Track/Goals/Insights — same surfaces
share components). Specifically: `.hover:text-neutral-700` and
similarly-faded muted-text classes don't pass 4.5:1 against the
warm-charcoal dark background.

**File:** `tailwind.config.cjs` — review the `--ink-soft` / `--ink-muted`
token in dark mode; bump the lightness.

**Recommended fix:** sweep all `text-neutral-{500,600,700}` usages in dark
mode and replace with the design-system muted-ink token; verify the token
itself meets 4.5:1.

### P1-PAYWALL-NOT-MOUNTED — `<SubscriptionManager />` is built but never rendered

`grep -r "import .*SubscriptionManager"` finds two callers — both import
the named export `PremiumFeatureGate`, neither imports the default export.
The full pricing UI (the four-tier card grid, the `$4.99 / $24.99 / $69`
display) is dead code in the running app. Users can hit the
`PremiumFeatureGate` (which gates a feature with an "Upgrade" CTA) but
have no path to a screen that shows the price grid.

This is why invariant #7 couldn't verify `$4.99` rendered: the page
that would render it isn't mounted.

**Recommended fix:** wire `<SubscriptionManager />` into Settings →
Plan & Billing as a panel, or as a route. The component is finished;
it just needs a mount point. Until then no paid conversion is possible
even with RevenueCat configured.

### P1-VIEWPORT-NO-ZOOM — `user-scalable=no` blocks accessibility zoom

`index.html` line 5: `<meta name="viewport" content="width=device-width,
initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />`

Blocks pinch-zoom. Users with low vision rely on browser zoom to read
small text. WCAG 1.4.4 requires support for 200% zoom.

**Recommended fix:** drop `maximum-scale=1, user-scalable=no` from the
viewport meta. The Capacitor app on iOS uses a system zoom independent
of this; on web/PWA the absence allows zoom.

### P1-MANIFEST-DESC-STALE — `manifest.webmanifest` description still says "100% on-device"

`manifest.webmanifest` line 4: `"description": "Offline-first alcohol
tracker & coach. 100% on-device."` — leads with the encryption claim
that [MARKETING-1] explicitly demoted. The PWA install prompt + the
Chrome / Edge "Add to home screen" sheet read this string.

**Recommended fix:** match the index.html meta description — "A calm
alcohol tracker. No streaks-leaderboards. Real crisis support when
you need it."

### P1-VITE-CONFIG-DUPLICATE-PWA-PUSH — `visualizer` plugin pushed twice

`vite.config.ts:107-112` — the `if (visualizer)` block exists twice in
sequence, so when `BUNDLE_REPORT=1` the visualizer is registered twice,
producing two `stats.html` overwrites and (depending on PWA strategy)
double-bundling. Pure copy-paste artifact.

**Recommended fix:** delete the second `if (visualizer) { plugins.push(...) }`
block.

---

## P2 — polish

### P2-LINT-3-ERRORS — Pre-existing react/no-unescaped-entities

Three lint errors in the baseline, none introduced by this audit:

```
src/app/tabs/GoalsTab.tsx:36   "you'd"
src/app/tabs/TrackTab.tsx:68   "Today's" + "you'd"
```

Wrap the apostrophe in `&apos;` or change to a regular ASCII apostrophe-
escaped equivalent. Trivial 5-min fix.

### P2-TYPECHECK-6-ERRORS — Pre-existing SYNC-3 errors

```
src/lib/sync/__tests__/dbBridge.test.ts:35,61,88,115  drinkType
src/lib/sync/mnemonic.ts:72,158                       crypto_hash_sha256
```

The `drinkType` field in tests doesn't exist on the Entry shape — likely
a left-over field from a Sprint 3a/3b refactor that didn't land in src.
The `crypto_hash_sha256` reference points at a missing libsodium typing.

Both pre-existed origin/main before the audit; verified by stashing
audit work and re-running typecheck.

### P2-LINT-MAX-LINES-PER-FN — 11 functions over the 80-line cap

Most of the file-level lint warnings are functions over 80 lines:
PremiumWellnessDashboard (350), SyncPanel (345), PremiumDataExport (196),
PremiumMoodTracking (183), SubscriptionManager (153), History (120),
DevTokensPreview (104), VoiceInput (86), syncStore arrow function (84),
SubscriptionManager arrow (82). Tactical decomposition into sub-components
would surface pieces that look dev-built today.

### P2-NPM-AUDIT-WARNINGS — Audit dev deps brought 22 vulnerabilities

`npm install --save-dev playwright @axe-core/playwright lighthouse chrome-launcher tsx`
introduced "22 vulnerabilities (1 low, 7 moderate, 14 high)". These are
TRANSITIVE through dev deps; production bundle is unaffected. Worth
running `npm audit` and assessing whether to pin alternative versions.

### P2-MANUAL-CHUNKS-VENDOR-LARGE — `vendor` chunk gets everything else

`vite.config.ts` `manualChunks` returns `'vendor'` for any node_modules
not matched by react/capacitor/recharts/etc. The fallback chunk likely
holds the bulk of byte weight. Bundle Visualizer (BUNDLE_REPORT=1)
would surface what's actually in there.

---

## P3 — nice-to-have

### P3-ERROR-BOUNDARY-DRILL

The `error-boundary` walkthrough surface didn't actually inject a
runtime error to verify the ErrorBoundary chrome (sage Try Again,
Reload app, Report this — verified visually as good in the live walk).
Adding a `?__forceError=1` query handler that the App reads + throws
synchronously would make the error chrome reproducible in CI without
hot-patching React internals.

### P3-LIGHTHOUSE-PWA-NULL — PWA category disabled in Lighthouse 12

Lighthouse 12 dropped the PWA category from default audits. Worth
running the standalone `pwa-mobile-friendly-test` separately to lock
in PWA audit coverage.

### P3-AUDIT-RUN-LIVE-DOMAIN — Audit ran against `vite dev`

All Lighthouse + axe scores reflect the unminified, source-mapped dev
bundle. A second pass against `npm run build && npm run preview` would
report production-realistic numbers. Likely 10-20 perf-points higher,
similar a11y/bp/seo.

---

## A11Y SCORES (Lighthouse, post-fix, mobile)

| Today | Track | Goals | Insights | Settings |
|:---:|:---:|:---:|:---:|:---:|
| 76 | 77 | 76 | 76 | 78 |

Desktop add ~8 points. Target was 95. Single biggest lever: WAI-ARIA
tabs pattern in `TabShell.tsx`.

---

## What's NOT in scope for this audit

- **Capacitor native build** (`npm run build:android`, `build:ios`) —
  not exercised. Tab-nav crash, FOUC splash, dedupe fix all exercise
  the shared web layer that ships into the native app, but native-only
  surfaces (in-app subscription purchase via StoreKit, push token
  registration, biometric lock entry) require sandbox testing on
  simulators.
- **Premium IAP flow** — RevenueCat client wired; dashboard side is
  owner-action per `docs/launch/revenuecat-setup.md`. Mock provider
  was active during this audit.
- **Sync flow** — SYNC-3a/3b crypto + edge-function path landed
  pre-audit. Sync is opt-in and gated behind onboarding completion;
  exercising it requires a Supabase project the audit doesn't have
  credentials for.
- **i18n / non-English** — only English surfaces verified.

---

## Re-running this audit

```bash
# Prereqs: dev deps installed + dev server running
npm install
npx playwright install chromium
npm run dev &

# Walk + capture
npx tsx tools/walkthroughs/alchohalt_2026_04_27/run_walkthrough.ts
node tools/walkthroughs/alchohalt_2026_04_27/run_lighthouse.mjs
node tools/walkthroughs/alchohalt_2026_04_27/verify_invariants.mjs
```

Override the dev URL with `DEV_URL=http://localhost:5174 ...` if a stale
instance is on 5173.

The summary JSONs are committed alongside this report so a future audit
can diff against today's baseline.
