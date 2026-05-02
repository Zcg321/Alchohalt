# Changelog

Backwards-looking record of every polish round + initial release.
Each round merges as a single PR; the round-finalize script generates
the PR body. Listed newest-first.

The format is loosely inspired by [Keep a Changelog](https://keepachangelog.com/),
adapted for the rounds-of-polish workflow this app uses instead of a
semver release cycle.

---

## Round 8 — 2026-05-02 (in flight)

### Added

- **Trust Receipt** — opt-in provenance log of every storage write
  and outbound request. Sibling to PrivacyStatus. Off by default; on
  the same Settings → Privacy real estate.
  (`src/lib/trust/receipt.ts`, `src/features/settings/TrustReceipt.tsx`)
- **Component visual-regression rig** — 136-cell DOM-snapshot test
  suite for every UI primitive in every state. Catches class-name +
  ARIA churn at unit-test speed.
  (`src/components/__tests__/visual-regression.test.tsx`)
- Optional Playwright component-gallery (gated behind
  `GALLERY_SNAPSHOT=1`) for pixel-perfect baselines once Linux CI
  baselines are generated.
  (`e2e/component-gallery.spec.ts`, `src/styles/ComponentGallery.tsx`)
- **Eight-judge gate** with disagreement matrix — six explicit
  decisions where judges genuinely conflict, with rationale. Future
  rounds use the matrix as a precedent register.
  (`audit-walkthrough/round-8-eight-judges-2026-05-02.md`)
- **Continuous-iteration tooling** — `scripts/round-kickoff.sh`,
  `scripts/round-finalize.sh`, `audit-walkthrough/_template.md`.

### Changed

- `tsconfig.json` enables `exactOptionalPropertyTypes` +
  `verbatimModuleSyntax` + `isolatedModules` (round-7 strict-flag
  family extended).
- `src/lib/storage.ts` publishes set/get events through the Trust
  Receipt module.
- `src/main.tsx` installs the fetch wrap before any feature code runs.

### Deferred

- **App-store screenshot capture** at 5 device classes × 2 themes ×
  5 surfaces. The capture script
  (`tools/marketing/capture_store_screenshots.ts`) is shipped, but
  Playwright capture wedges on the SPA-hydration race for iPad and
  Android-landscape viewports. Documented in
  `audit-walkthrough/store-screenshots/README.md`.

## Round 7 — 2026-05-01 (PR #39, merged)

### Added

- App icon: replace AOSP placeholder with sage pause-stroke (R7-A2).
- Playwright persona walkthroughs wired to CI (R7-A3).
- AI recommendations: default-on + opt-out + proxy walkthrough (R7-A4).
- User-persona walkthroughs + log-success aria-live region (R7-B).
- Settings/privacy completeness audit + PrivacyStatus panel (R7-C).
- Voice-consistency 10-string scoring + 2 fixes (R7-D).
- A11y deep audit + heading-hierarchy regression test (R7-E).
- 8th judge: competitor PM moat analysis (R7-F).

### Changed

- TypeScript strict-flag family: explicit, plus
  `noImplicitReturns`, `noFallthroughCasesInSwitch`,
  `noImplicitOverride`, `noUncheckedIndexedAccess`.

## Round 6 — 2026-05-01 (PR #38, merged)

### Added

- Native-bundle audit: privacy lockdown for iOS + Android.
- i18n deepening: locale-aware date/number formatting.
- Honesty pass: rewrite over-claim privacy copy.
- Journalist judge as the 7th persona.

### Changed

- `noImplicitAny` enabled at the tsconfig level (was false-on-purpose).
- AI-recommendations copy softened.

### Removed

- Dead encryption module (round-3 misfire).

## Round 5 — 2026-05-01 (PR #37, merged)

### Added

- Six-judge gate refresh.
- Insight rationale rewrites ("totals" vs "numbers").
- Recovery-counselor strings (the "urge ties to a feeling" set).

### Removed

- `bounce-in` dead CSS class + keyframe.

## Round 4 — 2026-05-01 (PR #36, merged)

### Changed

- Crisis modal: `animate-slide-up` → `animate-fade-in` (Linear ask).

## Round 3 — 2026-05-01 (PR #35, merged)

### Added

- AppLock dialog semantics (focus trap, role=dialog, escape-to-close).
- Shared `lib/safeLinks.ts` for tel:/sms:/http handlers.

### Changed

- 7 long components decomposed (DrinkForm, MoodTracker,
  ProgressVisualization, TherapyResources, DrinkDiscovery,
  PersonalizedDashboard, SubscriptionManager).

## Round 2 — 2026-05-01 (PR #34, merged)

### Added

- Capacitor StatusBar + Haptics shims (gated, web no-op).
- `[A11Y-FOCUS-TRAP]` global hook.
- `aria-invalid` on SyncPanel inputs.

### Changed

- PWA manifest description rewritten.
- 17 decorative SVGs marked aria-hidden.

### Fixed

- Madge runtime cycle (`db ↔ notify`).

## v1.0.0 — initial release

- Reminders (native + web).
- Spending dashboard (budget vs actual, AF savings).
- Weekly/30-day charts.
- Unified Preferences DB with migrations.
- PWA polish (manifest, shortcuts, iOS tags).
- A11y skip link + dev cache clear.
- Tests for notifications, charts, spending, persistence.
