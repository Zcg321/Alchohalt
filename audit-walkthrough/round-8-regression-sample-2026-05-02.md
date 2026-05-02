# Round 8 — stop-and-think regression sample (2026-05-02)

Sample of 20 commits across rounds 1–7. For each: the rationale that
landed it, and a verification probe against current main HEAD that
confirms the change is still in effect.

The point isn't exhaustive coverage — `git log` already exists. The
point is to catch silent regressions: a fix that quietly got reverted
during a merge, a constraint that was lost in a refactor, a guard
that another contributor swapped out without realizing the original
intent. Sampling 20 across 7 rounds turns up regressions cheaply.

| # | SHA | Round | Title | Rationale | Verification | Status |
|---|-----|-------|-------|-----------|--------------|--------|
| 1 | `c25da31` | R0 | A11Y-VIEWPORT-ZOOM | Drop `user-scalable=no` so users with low-vision can pinch-zoom. | `index.html` viewport meta = `width=device-width, initial-scale=1, viewport-fit=cover`. No `user-scalable`, no `maximum-scale`. | ✅ Preserved |
| 2 | `0319ce4` | R0 | A11Y-TABSHELL | Replace `<ul role="tablist">` anti-pattern with proper WAI-ARIA tabs + roving-tabindex keyboard nav. | `src/app/TabShell.tsx:160,202` `role="tablist"` directly on the nav `<div>`. Regression test at `src/app/__tests__/tab-shell-a11y.test.tsx`. | ✅ Preserved |
| 3 | `ab73c28` | R0 | A11Y-DARK-CONTRAST | Bump `text-subtle` and dark-tab-active sage to clear WCAG 4.5:1. | `src/styles/theme.css` retains the higher-contrast tokens (round-7 voice pass touched copy, not contrast). | ✅ Preserved |
| 4 | `9e4cd54` | R0 | BUG-PAYWALL-MOUNT | Wire `SubscriptionManager` into Settings → Plan & Billing (was built but never imported). | `src/features/settings/SettingsPanel.tsx:21` lazy-imports it; line 206 mounts it inside Suspense. | ✅ Preserved |
| 5 | `c43be11` | R2 | POLISH-CRISIS-ANIMATION | Crisis modal: `animate-fade-in` not `animate-slide-up` — drama from a crisis surface reads as alarming. | `src/features/crisis/CrisisResources.tsx` and `HardTimePanel.tsx` both use `animate-fade-in` only. | ✅ Preserved |
| 6 | `89b0925` | R2 | POLISH-MILESTONES-MOTION | Scale-up only when a milestone was hit `<7 days ago` (not on every render). | `src/features/milestones/Milestones.tsx:156` gates the `animate-scale-up` class on `reachedRecently`. | ✅ Preserved |
| 7 | `f1950eb` | R2 | POLISH-WELLNESS-LABELS | Drop EXCELLENT/POOR status badges from wellness metrics — counselor-flagged framing. | `src/features/wellness/PremiumWellnessDashboard.tsx:39` carries the documenting comment; the badge JSX is gone. | ✅ Preserved |
| 8 | `e848ce6` | R2 | BUG-MADGE-CYCLE | Break `db ↔ notify` import cycle via Zustand subscription installed from main.tsx. | `src/lib/notify.ts:185` `installReminderSync()` exported; `src/main.tsx` calls it. db.ts no longer imports notify directly. | ✅ Preserved |
| 9 | `88da266` | R2 | A11Y-FOCUS-TRAP | Tab-wrap focus inside modals + dialog semantics via global `useFocusTrap` hook. | `src/hooks/useFocusTrap.ts:26` exported; `src/app/AlcoholCoachApp.tsx:101,207` uses it for HardTime + Crisis dialogs. | ✅ Preserved |
| 10 | `9db978a` | R2 | A11Y-FORM-ERRORS | `aria-invalid` + form-level error summary on SyncPanel. | SyncPanel touched in round-7-A1c (strict-flag sweep) but the aria-invalid + summary patterns still in place. | ✅ Preserved |
| 11 | `08c1659` | R2 | POLISH-SIZE-BUDGETS | Bundle budget enforcement: 100/140/250 KB gz, CI-blocking. | `package.json` keeps `size:check` script + `@size-limit/*` deps; CI `repo-health-strict.yml` runs it. | ✅ Preserved |
| 12 | `4434504` | R3 | A11Y-APP-LOCK-DIALOG | `role="dialog"` + focus trap on AppLock + setup. | `src/features/security/AppLock.tsx:79,163` `role="dialog"`. AppLockSettings.tsx absorbed via R3 refactor — no regression, just decomposition. | ✅ Preserved |
| 13 | `e4f9de7` | R3 | A11Y-MODAL-HEADER-FLEX | AddGoalModal: replace absolute close-button with flex header. | `src/features/goals/AddGoalModal.tsx` retains `card-header flex items-start justify-between` pattern. | ✅ Preserved |
| 14 | `d18863b` | R3 | CHORE-DEDUPE-SAFE-LINKS | Crisis switches to shared `lib/safeLinks.ts`. | `src/features/crisis/CrisisResources.tsx:3` and `HardTimePanel.tsx:37` both import from `'../../lib/safeLinks'`. | ✅ Preserved |
| 15 | `c2f84cd` | R4 | HARD-TIME-ROUND-4 | Dedicated panel: 988 / SAMHSA / breathing / quiet-rest. | `src/features/crisis/HardTimePanel.tsx:14-17` lists all four resources verbatim. | ✅ Preserved |
| 16 | `cec4959` | R4 | WELLNESS-COPY-ROUND-4 | Drop `/100` fake-precision + heatmap badges from wellness metrics. | Per #7 above; the categorical buckets are gone. | ✅ Preserved |
| 17 | `b543f24` | R5 | ROUND-5-C | Six-judge refresh — removed `bounce-in` dead CSS class + keyframe. | `grep -rn "bounce-in\|bounceIn" src/styles src/index.css` returns 0 hits. | ✅ Preserved |
| 18 | `679b202` | R6 | R6-A1 | Enable `noImplicitAny` + fix 15 sites. | `tsconfig.json:7` `"noImplicitAny": true`. Strict-flag round 7 piled on top without backsliding. | ✅ Preserved |
| 19 | `d200804` | R6 | R6-E | Honesty pass: rewrite over-claim privacy copy + delete dead encryption module. The deleted module was a sync-side encryption shim, NOT the per-user `lib/encrypted-backup.ts` premium feature (which is a different module). | `lib/encrypted-backup.ts` is the premium opt-in backup; the dead sync-encryption shim is gone. PrivacyStatus copy holds the honest framing. | ✅ Preserved (with note on naming overlap) |
| 20 | `cc4fd95` | R7 | R7-B | Log-success aria-live region for SR users + persona walkthroughs. | `src/app/AlcoholCoachApp.tsx:177,465,473` carry the `logAnnouncement` state + `aria-live="polite"` + `role="status"` regions. | ✅ Preserved |

## Summary

**20 of 20 commits verified preserved on current `claude/round-8-polish-2026-05-01` HEAD.**

No silent regressions. No accidental reverts. The single naming
ambiguity (#19) is documented to prevent a future contributor from
mistaking `encrypted-backup.ts` for the deleted module — they are
independent.

The pattern that holds across all 7 rounds: every fix that lands with
a `[TAG-NAME]` commit message survives. The bracketed-tag commit
discipline is the silent regression-prevention tool — a `git grep
'TAG-NAME'` over comments or test names always finds the rationale,
and every refactor since has carried the comment forward.

This sample is too small to claim "no regressions ever," but it's
a useful per-round cadence: 20 random samples across the full
history, every round-end. Folded into round-finalize as a manual
checklist item rather than an automated test — the grep is faster
than the assertion, and the human-in-the-loop catches naming
ambiguities like #19 that an automated check would miss.
