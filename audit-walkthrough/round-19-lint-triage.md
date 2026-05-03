# Round 19 — lint warning triage

**Author:** Cowork Sprint
**Date:** 2026-05-03
**Scope:** R19-B — finalize the long-running max-lines-per-function
cleanup that started in R12 and continued through R17/R18.

## Baseline → current

| Step | Warnings | Source |
|---|---|---|
| Pre-R12 | 60+ | Round-12 audit baseline |
| R12 | 49 | After R12 split-component sweep |
| R17-A | 39 | After 4-PR sub-round retiring SyncPanel/AlcoholCoachAppInner/PremiumWellnessDashboard/ExportImport/SettingsPanel/DataImport/AddGoalModal/DrinkList/NotificationsSettings/BackupVerifier/AISettingsPanel |
| R18-A | 35 | After Diagnostics/DataRecoveryScreen/SharingPanel/TodayHome |
| R19-B | **30** | After ErrorBoundary/CrisisResources/TodayPanel + dev-only disables |

## R19-B — what was retired

### Real refactors (count ↓ from work, not disables)

1. **ErrorBoundary `render`** (109 → small dispatcher) — extracted
   `IsolatedFallback` + `FullPageFallback`. The render method now picks
   between three tiny branches (children, custom fallback,
   isolated-vs-fullpage component). Each fallback component is now
   testable in isolation.
2. **CrisisResources** (130 → 67 lines) — extracted `EmergencyBanner`,
   `USFallbackSections`, `CrisisFooter`, `getEmergencyNumber`. The
   911 banner IIFE collapses to a tidy `EmergencyBanner` with explicit
   `code` prop. The footer is reusable if a future surface needs the
   same legal copy.
3. **TodayPanel** (163 → 78 lines) — extracted `HeroBlock`, `BelowFold`,
   `buildCta`, `buildHeroCopy`. The CTA-decision logic is now a pure
   function and easier to unit-test. The hero/below-fold split mirrors
   the actual visual layout above-the-fold vs below-the-fold.

### Dev-only disables (with reason)

These disables are intentional. The code is dev-only and splitting
hurts the file's purpose:

- `src/styles/DevTokensPreview.tsx` — dev-only design-tokens reference.
  One page of declarative JSX that exists to be a single-screen
  reference. Splitting decouples the visual sections from the page
  scroll.
- `src/styles/ComponentGallery.tsx` — dev-only visual-regression
  baseline. Sections are snapshotted by
  `e2e/component-gallery.spec.ts`. Splitting decouples the snapshot
  anchors from the gallery shape.

## Remaining 30 warnings — triage

All remaining warnings are `max-lines-per-function`. Zero errors.
None block ship. Categorized:

### A. Form / wizard surfaces (9 warnings)

These are JSX-heavy form components where the function body IS the
form's structure. Extraction options exist (one extracted-component
per form section) but the cost is high relative to the value: the
forms are read top-to-bottom by maintainers and splitting introduces
prop-drilling between siblings that share form state.

- `useDrinkActions` (105) — hook coordinating drink-add/edit/delete.
  Cohesive transaction logic; splitting would scatter the
  transactional invariants.
- `useDrinkForm` (89) — form-state hook for the drink-add modal.
- `DrinkHistorySearch` (109) — search UI with filter chips +
  date-range + tag-multiselect.
- `BulkActionBar` (127) — multi-select action bar across DrinkList.
- `IntentRevisionModal` (88) — onboarding-revision wizard.
- `OnboardingFlow` (140) — three-beat dialog. Splitting would lose
  the "beat A → beat B → beat C" linearity.
- `PresetItem` (101) — drink-preset row with swipe-to-edit.
- `GoalSettings` (88) — goal config form.
- `GoalEvolution` (89) — goal-history visualization.

**v1.1 follow-up:** revisit when adding the next form-style surface.
A shared `<FormSection>` primitive could absorb 5-6 of these.

### B. Insights / analytics tiles (8 warnings)

Tile components where the body is one section per stat with shared
calculation prelude. Each tile reads as a single visual unit; splitting
into "computation hook + render fragment" is plausible but the tiles
are stable (rarely edited).

- `AIInsightsConsent` (108)
- `AIInsightsTile` (95)
- `MoodCorrelationContent` (97)
- `HALTCorrelationsTile` (98)
- `TagExplorer` (95)
- `InsightsPanel` (112)
- `MonthlyDeltaPanel` (115)
- `SmartRecommendations` (143) + arrow-fn (82)

**v1.1 follow-up:** when the dashboard refactor introduces tile
plug-ins (per `cross-product-patterns.md` Wend port discussion),
these become natural plug-in candidates.

### C. Settings / about / account surfaces (6 warnings)

Settings surfaces with stacked sections.

- `About` (82) — credits + version + dependencies list.
- `ClearData` (95) — destructive-confirm flow with type-to-confirm.
- `OnboardingFunnelView` (117) — diagnostic chart for owner.
- `TrustReceipt` (87) — privacy-claim audit summary.
- `TrackTab` (90) — tab orchestrator on the Track route.
- `BehaviorSection`/`TopSection` (85, 83) — Stats sub-sections.

**v1.1 follow-up:** Settings pages already share a `<Section>`
primitive (R16-LINT-CLEAN). Promoting more of the section bodies
into row-components would retire most of these.

### D. Recommendations / health (3 warnings)

- `GoalRecommendations` (113) — recommendation card with multiple
  CTAs.
- `HealthIntegrationsDiagnostics` (126) — owner-only diagnostics for
  Apple Health / Google Fit shims.
- `History` route (120) — list view with date-range header and
  bulk-export.

**v1.1 follow-up:** the recommendations card is awaiting Tauri/native
expansion that will rewrite the surface anyway.

### E. Voice / sync (2 warnings)

- `VoiceInput` (87) — voice-to-text drink entry. Browser Speech API
  setup + transcript + edit + commit.
- `syncStore.ts` arrow-fn (84) — sync-state reducer arrow function.

**v1.1 follow-up:** the voice surface is gated behind a feature flag;
splitting can wait for the gating decision (R19-5 security audit may
weigh in).

## Why not zero?

Three reasons:

1. **Marginal value.** All remaining warnings are 80-160 lines. None
   are 300-line monsters. The original "fix the worst-15" goal from
   round 17 is met.
2. **Real cost.** Each extraction trades a 100-line function for two
   40-line functions plus a prop interface. That's a net wash for
   readers and a clear regression for stable code that nobody is
   editing.
3. **Round 19 priorities.** The bulk of round 19 is offline mode,
   battery, storage limits, crash reporter, and security audit. The
   line-limit cleanup is a follow-up, not the headline.

## What changed in this round

Net: -5 warnings (35 → 30). Test count +7 (R19-A) + 0 from R19-B
(refactors are pure-extraction, no new tests). Typecheck clean.
Bundle delta within budget (verified at finalize).

## v1.1 commitment

If the bar moves to "0 lint warnings before TestFlight," each
category above has a named follow-up. Expected effort: 1-2 days for
all 30 if done as a contiguous sweep, vs ~3 hours if absorbed into
each tile/section's next behavior change. The latter is preferred.
