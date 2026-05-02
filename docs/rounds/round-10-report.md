# Round 10 — polish, longitudinal surfaces, sharing, ethics gate

Branch: `claude/round-10-polish-2026-05-01`
Base: `main` (`f494c60`, after round-9 PR #41 merged)
Date: 2026-05-02

## Per-section status

| ID    | Item                                              | Status               |
| ----- | ------------------------------------------------- | -------------------- |
| R10-A | Templates evolve past 30 days                     | ✅ done               |
| R10-B | Longitudinal vs prior-month delta panel           | ✅ done               |
| R10-C | Diagnostics revisable (Update my intent)          | ✅ done               |
| R10-D | Native fr/de translation review doc               | ✅ done               |
| R10-E | App Store screenshot capture                      | ✅ done — 50/50       |
| R10-F | Lighthouse-CI triage + fix                        | ✅ done — runner debt |
| R10-1 | User-data import (CSV/JSON)                       | ✅ done               |
| R10-2 | Long-term retrospectives                          | ✅ done               |
| R10-3 | Caregiver/partner read-only sharing               | ✅ done               |
| R10-4 | Crisis escalation soft prompt                     | ✅ done               |
| R10-5 | 10th judge — ethics review                        | ✅ done               |
| R10-6 | 10-judge gate refresh                             | ✅ this document      |

## Verification

| Check       | Baseline (origin/main) | Round 10 | Δ      |
| ----------- | ---------------------: | -------: | ------ |
| Typecheck   |                  clean |    clean | 0      |
| Lint errors |                      0 |        0 | 0      |
| Lint warnings |                   44 |       35 | -9     |
| Test files  |                    164 |      171 | +7     |
| Tests       |               798 + 1s |  869 + 1s | +71   |
| Build       |                  clean |    clean | 0      |
| Bundle (precache) |              1379 KiB | 1406 KiB | +27 KiB |

The lint-warning drop is incidental — pre-existing function-length
warnings cleared on a few touched files. None of the new files
introduce lint errors.

The bundle delta (+27 KiB) is mostly the new lazy chunks for
DataImport (R10-1), RetrospectivePanel (R10-2), SharingPanel (R10-3),
ShareViewer (R10-3), and EscalationPrompt (R10-4). Each loads only
when its surface mounts — TodayHome's eager chunk is unchanged.

## Carry-over fixes uncovered along the way

### Latent prod bug — `@capacitor/core` bare specifier

Found while debugging the R10-E handshake timeout. The vite config's
`external: [/^@capacitor\//]` rule was leaving bare-specifier
`import "@capacitor/core"` statements in lazy chunks (Goals,
DrinkForm, AIInsightsTile, etc.). The browser cannot resolve those —
`pageerror "Failed to resolve module specifier"`. Web users hitting
those tabs would have been silently failing.

R10-E aliases `@capacitor/core` to a new web stub
(`src/shared/capacitor-web-stub.ts`) that exports `Capacitor`,
`registerPlugin`, and `WebPlugin` — covering the @revenuecat/
purchases-capacitor static-import path that broke the build when I
narrowed the externalization regex. Capacitor plugins like
`@capacitor/preferences` and `@capacitor/local-notifications` stay
externalized via `/^@capacitor\/(?!core$)/`.

The eager Today/Track chunks rendered fine because they don't import
`@capacitor/core` directly — that's why smoke didn't catch it.
Discovered + fixed under R10-E.

### Typosquat note

`npx lhci` (without `@lhci/cli` package scope) installs a typosquat
package that prints `Hello, this is AnupamAS01!` on run. The
Lighthouse CI workflow correctly uses `@lhci/cli@0.14.4` so it's
not at risk, but worth flagging — anyone running lighthouse
manually should `npx --package=@lhci/cli@0.14.x lhci autorun`.

## 10-judge gate refresh

Round 9 ran 9 judges. Round 10 adds an ethics/medical-perspective
judge (judge #10) — full audit at
`docs/rounds/round-10-ethics-judge.md`. Re-running judges 1-9 with
this round's deltas:

### 1. Voice / tone

> ✅ Pass. The new surfaces (R10-A evolution prompt, R10-B monthly
> delta, R10-2 retrospective) all hold the established calm voice.
> "You've outgrown this goal" lands the right register —
> congratulatory without exuberance. The retrospective view shows
> numbers without editorial framing.

### 2. Visual / layout

> ✅ Pass. New cards reuse the existing `.card` + `.card-header` +
> `.card-content` system. No new design tokens introduced. The
> escalation prompt uses the amber-warning palette already
> established in earlier rounds for non-error cautionary states.

### 3. Privacy / on-device claim

> ✅ Pass with one nuance. R10-3 sharing puts the payload in the
> URL fragment, never on a server — that's the right architecture
> for the constraint. The sharing posture is opt-in per field with
> 24h TTL. The trust-receipt fetch wrap remains untouched.
> Nuance: when the user generates a share link, the URL is shown
> on-screen — no fetch is made (the audit log won't show
> anything). The prior privacy claim continues to hold.

### 4. Localization native speaker

> ⚠️ Pass with action item. R10-D generates a 230-key, 68-surface
> review doc with tone notes per surface. Spanish remains the only
> reviewed locale; fr/de still ship as machine translations. The
> review doc is the round-10 deliverable; native review remains
> owner-blocking for launch.

### 5. Mobile UX reviewer

> ✅ Pass. Confirmed via R10-E full screenshot matrix — all 50
> captures (5 devices × 2 themes × 5 surfaces) render without
> overflow or hydration glitches. The crisis pill clicks correctly
> across iPad and Android-landscape — handshake replaced the
> previous networkidle race.

### 6. Lighthouse / Core Web Vitals

> ⚠️ Conditional pass. The R10-F workflow hardening should fix the
> CI flake — pinned ubuntu-22.04, pinned @lhci/cli@0.14.4, npm
> rebuild step for rollup-optional-deps. Cannot run actual scores
> from this branch (no Chrome locally), but bundle size is only
> +27 KiB and all new code is lazy-loaded.

### 7. Test coverage

> ✅ Pass. +71 tests in this round across 7 new files: 13 for
> goal evolution (R10-A), 7 for monthly delta (R10-B), 4 for
> diagnostics revise (R10-C), 14 for import mapping (R10-1), 11
> for retrospectives (R10-2), 11 for share payload (R10-3), 11
> for crisis escalation (R10-4). All pass.

### 8. PM / strategy

> ✅ Pass. R10-1 import is a meaningful moat — switching INTO the
> app from a competitor is now low-friction. R10-3 sharing opens
> the partner/therapist use case without compromising privacy. The
> escalation prompt at 3 opens / 24h is the right product instinct
> — distress patterns matter more than count.

### 9. Long-term user, day 90

> ✅ Pass with frustrations addressed. R9 judge #9 named three
> day-90 frustrations: templates feeling front-loaded for day 1
> (R10-A fixes), insights repeating same headings forever (R10-B
> + R10-2 fix), Diagnostics frozen on original onboarding intent
> (R10-C fixes). All three round-9 action items are landed.
>
> New friction this round noticed: a long-term user who imports
> 6 months of history from another tracker (R10-1) might find the
> retrospective prompt fires immediately — "It's been a month"
> isn't quite right when the data was just imported. Round-11
> action: tag entries with `importedAt` and gate the retrospective
> prompt on time-since-app-install, not time-since-data.

### 10. Ethics / medical-perspective (NEW)

> ⚠️ Pass with three deferred owner decisions. Full review at
> `docs/rounds/round-10-ethics-judge.md`. Summary:
>
> - **Points display gamification.** `computePoints` produces a
>   running scalar with no real-world meaning. Recommend renaming
>   to "consistency score" with soft-restart semantics. R11
>   candidate, not a launch blocker.
> - **BAC clinical-confidence framing.** When enabled, the BAC
>   number reads as fact. It's a Widmark-style estimate. Recommend
>   first-enable disclaimer modal + ±0.02 confidence interval on
>   display. Owner decision pre-launch.
> - **CSV export behind paywall.** JSON export is free (correct
>   portability baseline) but CSV — the format spreadsheets eat —
>   is Premium. Friction for users trying to leave or audit.
>   Recommend moving CSV to free, keeping PDF on Premium.
>
> Reviewed and explicitly NOT a concern: onboarding pressure,
> reminder cadence, trust receipt (exemplary), crisis line
> accuracy (cross-checked all 5 region packs), R10-3 sharing
> privacy posture, R10-1 import behavior, R10-4 escalation design.

## Owner-blocking items

Three from the ethics judge (all deferred decisions, none
implementation-blocking):

1. **Points display:** keep, soften, or remove? Recommend rename to
   "consistency score" with soft-restart semantics.
2. **BAC framing:** add a first-enable disclaimer modal + display
   confidence interval?
3. **CSV export tier:** move to free, keeping PDF on Premium?

Plus three carrying forward from round 9:

4. **Native fr/de review.** R10-D generates the deliverable; owner
   hands to a translator before launch.
5. **R10-4 counselor provider.** The escalation prompt ships with
   placeholder URLs for BetterHelp / Talkspace / Modern Health.
   Owner picks a curated list (or just SAMHSA-only) before launch.
6. **App Store upload.** R10-E captures 50/50 PNGs deterministically.
   Owner uploads to App Store Connect / Play Console at launch.

## Commits in this round

```
7717c34 [R10-5] Ethics judge — 10th judge in the gate
35218a7 [R10-4] Crisis escalation — soft counselor prompt after repeat opens
717d804 [R10-3] Caregiver/partner read-only sharing — fragment-based, 24h TTL
e68c45d [R10-2] Long-term retrospectives — 30/90/180/365-day windows
0cd6500 [R10-1] User-data import — CSV/JSON from foreign trackers
e2974fa [R10-F] Lighthouse-CI hardening — pinned runner + rollup-optional-deps fix
4953a7e [R10-E] App Store screenshot capture — 50/50 working + Capacitor web stub
5b98d84 [R10-D] Native fr/de translation review document generator
7a252af [R10-C] Diagnostics revisable — Update my intent flow
e9bdb64 [R10-B] Monthly delta panel — vs prior month surface
a8eee6a [R10-A] Goal templates evolve past 30 days
```

11 logical groups, one commit per group. Each lints / typechecks /
tests / builds clean before the next.

Final commit lands this report + the 10-judge gate refresh.
