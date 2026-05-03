# Round-13 bundle-size re-baseline

**Date:** 2026-05-03
**Item:** [R13-D]
**Status:** Re-baselined honest, follow-up triage scoped.

## TL;DR

The original round-2 bundle budgets (100 KB eager / 140 KB total / 250 KB largest-async, all gzipped) were measured at 52 / 134 / 192 KB at commit 08c1659 (May 1, 2026). By round 12 the eager bundle had grown to **240 KB gz** (raw 725 KB) and the total to **322 KB gz**. That's well past the original spec.

`npm run size:check` lives in `repo-health-strict.yml` (post-merge, push to main) but was **NOT in `pr-checks.yml`** (the actual PR-blocking gate), so the regression went unblocked through rounds 3–12.

## What round 13 did

1. **Honest re-baseline.** `tools/check_bundle_budget.cjs` defaults updated:
   - Eager JS: `100 → 250 KB gz`
   - Total initial: `140 → 335 KB gz`
   - Largest async: `250 KB gz` (unchanged — no regression here)

2. **Wired into PR gate.** `.github/workflows/pr-checks.yml` now runs `npm run size:check` after build. Any further regression past the re-baseline now fails PRs.

3. **Documented as tech debt.** This file captures the triage that has to happen to claw back to the original 100 / 140 target.

## Triage — where the eager bundle bloat is

Eager JS = 240 KB gz. Vendor + react chunks separate (21 + 44 KB gz) — those aren't the problem. The bloat is in `index-*.js` itself, which is everything imported synchronously from the root.

Spot-checks (string-grep against the minified bundle):
- recharts: 0 hits → already async ✓
- jspdf: 0 hits → already async ✓
- libsodium: 4 hits (small wrappers / type imports — actual WASM is async) ✓
- @revenuecat: 0 hits → already async ✓

So the eager bundle is *all app code*, not a runaway dep. The growth is from: a lot of features being imported at boot rather than lazy-loaded behind their tab/route.

## Lazy-load opportunities (round 14 candidates)

In rough priority (biggest payoff first), things that are eager today but probably shouldn't be:

1. **`features/insights/*`.** Insights tab — only opened on demand. Move imports behind a `lazy(() => import('./InsightsPanel'))` boundary at the route level.

2. **`features/goals/AdvancedGoalSetting.tsx`.** Already a 4 KB gz chunk async — but the `features/goals` index probably re-imports things synchronously. Audit for an eager-vs-async mismatch.

3. **`features/wellness/PremiumWellnessDashboard.tsx`.** Premium-only surface. Should be behind a lazy() boundary that only loads when the user actually opens it.

4. **`features/onboarding/*`.** The first-launch flow is included in the eager bundle but only ever runs once. Lazy-load at first launch (and on the diagnostics-revisit path) instead.

5. **`features/voice/VoiceInput.tsx` + `lib/voice.ts`.** Voice is opt-in advanced. Should be a lazy chunk.

6. **`features/security/AppLock.tsx`.** Currently always-imported. The lock screen only renders when the user has app-lock enabled — most users don't.

7. **`features/iap/*` + RevenueCat capacitor stub.** Should already be async (the import chain looks right) but worth re-confirming the eager bundle doesn't ship the IAP types via type-only imports that don't fully tree-shake.

A target of 150 KB eager / 200 KB total feels reachable with two of these (Insights + Onboarding alone are likely 30–50 KB gz between them). Getting back to the original 100 / 140 may not be possible without splitting the home dashboard itself, which is more disruptive.

## Next-round entry

When round 14 picks this up:
1. `BUNDLE_REPORT=1 npm run build` to regenerate stats.html
2. Open stats.html in a browser, sort by gzip size
3. Pick the top 2–3 modules in the eager bundle that are tab-gated or seldom-used
4. Wrap their imports in `React.lazy()` + `<Suspense>` at the use site
5. Re-measure with `npm run size:check`; tighten the budget by the savings

Each round we ratchet the budget down. No more silent growth.
