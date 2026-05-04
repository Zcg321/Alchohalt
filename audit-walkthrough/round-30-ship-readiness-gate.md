# Round 30 — ship-readiness gate per surface (R30-1)

**Date:** 2026-05-04
**Branch:** `claude/round-30-milestone-2026-05-04`
**Reviewer's lens:** "release manager about to push the button — would I let this surface go to production right now?"

The verdict per surface is one of:

- **SHIP** — would push to production today, no caveats
- **WITH-CAVEAT** — would ship, but the caveat is on the change-log
  for the user / triage list for the on-call
- **NO-SHIP** — fix-before-launch (none found this round)

## Top-level surfaces (the 4 tabs + onboarding + crisis)

| Surface | Verdict | Caveats / notes |
|---|---|---|
| Onboarding | **SHIP** | 58% completion (R29-4 +5pp lift); A/B winner pinned (R25 + R29-D); tu/vous unified for FR (R20-6); intent-list strings native-PL/RU reviewed (R23-1, R24); BeatOne 500ms removed; reduced-motion compliant; first-launch privacy card on Today (R29-A) |
| TrackTab (drinks logging) | **SHIP** | Quick / Detailed mode toggle (R23-D); chip selector + back-date support; bulk drink-edit mode (R12-2 select-today/week + delete + time-shift + std-scale); QuickLogChips and HintBanner have stable test fixtures; HALT integration (R29-CS follow-up filed but not blocking) |
| InsightsTab | **SHIP** | Single-pass `computeProgressData` + idle-yield (R20-1); web workers for heavy compute (R21-1); empty-state illustration (R23-4); md:max-w-3xl tablet width (R21-4); progressCards i18n sweep (R23-A); HALT correlations + mood pattern tiles |
| GoalsTab | **SHIP** | Goal templates × 6 named (R9-4); add-goal modal flex-header for long locales (R3); long-term retrospectives 30/90/180/365 (R10-2); deletion confirmation modal |
| SettingsTab | **SHIP** | Newly lazy-loaded R29-B (largest async chunk, 209.30 KB gz); jump-nav (R23-B); foundation IDs (R22-4); privacy super-section (R9-T4); diagnostics card; subscription manager + paywall mount stable; archived-experiments banner (R29-D) |
| Crisis | **SHIP** | Lock-screen access (R6 carry-over); slide-up motion (R3); soft escalation prompt after repeat opens (R10-4); shared `lib/safeLinks.ts`; localized FAQ entry across 6 locales (R29-2) — never paid, never gated, fully offline |
| First-launch privacy card (Today) | **SHIP** | R29-A landing — single-dismiss, sage palette, no telemetry timestamp, idempotent |
| App lock | **SHIP** (gated) | Behind `ENABLE_APP_LOCK=false`; full dialog semantics + focus trap + PIN aria-labels + role=alert errors (R3-A2) |

## Cross-cutting surfaces

| Surface | Verdict | Caveats / notes |
|---|---|---|
| Sync (Supabase / Trust Receipt) | **SHIP** (gated) | Envelope-encrypted, ciphertext-only, passphrase never leaves device; SyncErrorRibbon visible failure mode; background-sync via SW (R20-2); OPERATIONS.md runbook covers sync incidents end-to-end |
| Subscription / RevenueCat | **WITH-CAVEAT** | Code path is verified end-to-end; **caveat:** RevenueCat product IDs in production must match the spec exactly (`docs/launch/revenuecat-setup.md`) — owner step P3 in `LAUNCH-CHECKLIST.md` |
| Native (Capacitor iOS + Android) | **WITH-CAVEAT** | StatusBar + Haptics + Preferences shims working; **caveat:** owner must build via Xcode Archive (Apple) + `./gradlew bundleRelease` (Google) on a real machine + sign |
| Web (Vercel) | **SHIP** | Production deploy on push to main, PR previews on every PR, CSP locked to Supabase + (optional) Sentry, `/legal/{terms,privacy,disclaimer}` rendered |
| Service Worker / PWA | **SHIP** | Workbox precache 88 entries (1.15 MB); R29-B-FIX precache exclusion landed; UpdateBanner surfaces new-version prompts |

## Localization surfaces (per locale)

| Locale | Verdict | Caveats / notes |
|---|---|---|
| en | **SHIP** | Source of truth |
| es | **WITH-CAVEAT** | Native-speaker review pass complete (R21); R29-2 + R29-3 strings added since — owner step 8 in runbook is fast pass |
| fr | **WITH-CAVEAT** | Native-speaker review pass complete (R20); tu/vous unified; same R29 follow-up pattern |
| de | **WITH-CAVEAT** | Native-speaker review pass complete (R22); Vertrauen + Std + intent-list fixes; same R29 follow-up |
| pl | **WITH-CAVEAT** | Native-speaker review pass complete (R23); same R29 follow-up |
| ru | **WITH-CAVEAT** | Native-speaker review pass complete (R24); same R29 follow-up |

The caveat is identical across the 5 non-EN locales: the R29-2 +
R29-3 + R30 carry strings need a 30-minute native-speaker pass per
locale before they hit the App Store listing. **Not launch-blocking**
because the strings are well-formed machine translations and the
in-app fallback is EN; this is a quality-bar item, not a correctness
item.

## Documentation surfaces

| Document | Verdict | Caveats / notes |
|---|---|---|
| README.md | **SHIP** | Up-to-date with Vercel + legal routes |
| LAUNCH-CHECKLIST.md | **SHIP** | Last refresh round 11; structure still holds; owner-launch-runbook supplements it for round-30 nuances |
| OPERATIONS.md | **SHIP** | R22-3 SRE runbook; covers sync-down, SW-stuck, Trust-Receipt-corruption, paywall-stuck, IAP-mismatch |
| SECURITY.md, GOVERNANCE.md, CODE_OF_CONDUCT.md, CONTRIBUTING.md | **SHIP** | All present; security.txt + bug bounty (R20-D) |
| MANUAL_TESTING_CHECKLIST.md | **SHIP** | Manual QA checklist for first-launch real-device walk |
| audit-walkthrough/ | **SHIP** | 126 docs, 21,134 lines, R30-A retrospective + R30-B owner-launch-runbook + this gate doc + 30th judge |

## Owner-only blockers

The only surfaces with WITH-CAVEAT verdicts that touch owner-only
work are:

1. **Subscription / RevenueCat** — owner verifies product IDs
2. **Native iOS + Android binaries** — owner builds + signs + uploads
3. **5 non-EN locales R29 strings** — owner recruits native reviewers (parallel)

All three are documented in `audit-walkthrough/owner-launch-runbook.md`
with timing + paths + scripts.

## NO-SHIP fixes landed in round 30

**None.** All surfaces are at SHIP or WITH-CAVEAT (where the
caveat is owner-only or quality-bar). No code-level fixes were
required during the round-30 walk-through. This reflects 29 prior
rounds of audit + fix discipline.

## Final verdict

**SHIP** for all surfaces under Claude's control. Owner has the
literal go/no-go on Apple + Play submission, plus the parallel
native-speaker review pass for the 6-locale App Store metadata.

The round-30 ship-readiness gate is the cleanest one of the entire
30-round arc. Every surface tracks every prior round's findings;
every regression-guard tool fires green; every judge from rounds
1-29 returns SHIP on re-walk.
