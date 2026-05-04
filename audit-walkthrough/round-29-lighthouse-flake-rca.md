# Round-29 — Lighthouse-CI repeated-flake root-cause analysis

[R29-B] Rounds 23, 24, 25, and 28 each surfaced the
`lighthouse-mobile` job flaking near the perf-score threshold. R29
finds the root cause and lands the fix.

## TL;DR

The mobile Lighthouse job tests `http://localhost/index.html` with
the **mobile preset** — Moto G Power-class CPU + 4G slow throttle.
The perf-score threshold is **0.75**. The eager initial-load JS for
the SPA was ~1 MB minified — the index chunk alone weighed
**773 KB** because all five tabs (`TodayHome`, `TrackTab`, `GoalsTab`,
`InsightsTab`, `SettingsTab`) were eagerly imported in
`src/app/AlcoholCoachApp.tsx`. SettingsTab was the dominant mass
(633 KB on its own once isolated).

Under mobile throttling, parsing+executing 773 KB of JS routinely
spent >2 s and slammed TTI past the 5000 ms ceiling, which dropped
the perf score into the 0.68–0.73 band. That's right at the
0.75 ± noise floor — some runs hit 0.76, some hit 0.73, hence the
"flake." The flake was a real perf regression hidden as variance.

## The fix

Lazy-load the four non-default tabs. `TodayHome` stays eager because
it is the default route a returning user lands on. `TrackTab`,
`GoalsTab`, `InsightsTab`, `SettingsTab` move behind
`React.lazy(() => import(...))` with a single shared `Suspense`
fallback (the standard Skeleton component already used elsewhere).

## Bundle deltas (verified locally)

| Chunk        | Before        | After         | Δ          |
|--------------|---------------|---------------|------------|
| index        | 773.33 KB     | 113.67 KB     | **−659.66 KB** |
| TrackTab     | (in index)    | 12.98 KB      | new chunk  |
| GoalsTab     | (in index)    | (small)       | new chunk  |
| InsightsTab  | (in index)    | (in InsightsPanel chunk) | new chunk |
| SettingsTab  | (in index)    | 632.89 KB     | new chunk  |

Initial JS (eager): index + react + vendor = **~349 KB** (was ~1009 KB).

That puts the eager Lighthouse-tested route at ~35% of the prior
weight. On the mobile profile the perf score should comfortably
land in the 0.85+ band, giving the 0.75 threshold ~10 points of
headroom.

The SettingsTab chunk is still 633 KB on its own — that's the
SubscriptionManager + SyncPanel + AI panel + TrustReceipt + the
data-management surface. None of that is on the critical path for
the App Store reviewer or the curious first-launch user, so it
loads on demand when the user taps Settings.

## Why the fix is durable

The four tabs are now isolated from the initial render path. Future
work that *adds* to those tabs no longer slows down the cold-load
LCP/TTI. Future work that adds to `TodayHome` *will* show up on
Lighthouse, which is the right signal — Today is the surface the
mobile-perf number protects.

## Why we didn't loosen the threshold

Loosening from 0.75 to 0.65 would silence the failing job without
fixing the underlying problem: mobile users were taking a real
perf hit. The judge gallery (R23+ contractor pass, R24+ ux researcher,
R26+ ex-competitor) all flagged the SPA's mobile responsiveness as
the weakest dimension; loosening the threshold would mask a
regression we have multiple judges on record asking us to fix.

## Verification path

1. Local build: `npm run build` — confirms the new chunk distribution.
2. Local typecheck: `npm run typecheck` — clean.
3. Local tests: 2013 passing (no regressions).
4. Lighthouse-CI on the next PR push: the mobile job should land
   the perf score above 0.85.

## What to do if this re-flakes

If a future round drops the eager-load weight back near 1 MB and
the mobile perf score returns to flaky:

1. Re-run `npm run build` and check the index chunk size.
2. If index > 300 KB, find what was newly imported into
   `AlcoholCoachApp.tsx` or `TodayHome.tsx` and lazy-load it.
3. If index is small but a route component is heavy, profile that
   route's chunk and identify what's been pulled in.
4. Last resort only: loosen the 0.75 threshold AND add a test
   case to the perf-baseline doc explaining why the regression is
   acceptable.

## How to reproduce locally without GitHub Actions

```sh
npm run build
npx http-server dist -p 8080 -s &
npx lighthouse http://localhost:8080/index.html \
  --only-categories=performance \
  --form-factor=mobile \
  --throttling-method=simulate \
  --output=html --output-path=./lh-mobile.html
```

Open `lh-mobile.html` and verify Performance is in the 0.85+ band.

## Relationship to prior R25-1 work

R25-1 lazy-loaded conditional surfaces (BackupAutoVerifyRibbon,
OnboardingFlow, OnboardingReentryBanner, DataRecoveryScreen,
CrisisResources, HardTimePanel). That fix was correct — those are
genuinely conditional. But R25-1 did not touch the *unconditional*
tab components, which were the dominant mass. R29-B closes that
remaining gap.
