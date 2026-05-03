# Round 12 — twelve-judge gate refresh (2026-05-03)

Fresh pass on the merged state at `claude/round-12-polish-2026-05-03`
HEAD (post-cherry-pick of R12-2, plus R12-3..R12-6). Each judge walks
every R12-new surface cold; conflicts are surfaced explicitly and
decided with rationale, not papered over. Where two judges genuinely
want opposite things, we pick one, write down why, and move on.

The twelve personas, accumulated rounds 1–12:

| # | Judge | Lens | Bar | Round added |
|---|-------|------|-----|------|
| 1 | Linear designer | Hierarchy, motion, restraint | "Would this fit at Linear?" | R1 |
| 2 | NYT writer | Copy, voice, sentence-level | "Does any string read like marketing?" | R1 |
| 3 | Stripe FE engineer | Types, tests, code quality | "Would I merge this PR?" | R1 |
| 4 | Recovery counselor | Framing, harm prevention | "Could a vulnerable user be hurt by a string here?" | R5 |
| 5 | WCAG / a11y judge | Keyboard, contrast, SR | "AA, no exceptions" | R5 |
| 6 | Friday-night user | The 11pm-craving persona | "Does this meet me where I am?" | R5 |
| 7 | Investigative journalist | Privacy claims, honesty | "Does the README match the code?" | R7 |
| 8 | Competitor PM | Defensibility, moat | "Could I clone this in two weeks?" | R8 |
| 9 | Skeptical reviewer | First-impression / spec review | "Is the change worth the risk?" | R9 |
| 10 | Ethics judge | Manipulative patterns, dark UX | "Does the design respect agency?" | R10 |
| 11 | Regulator | Health-claim compliance, FDA-adjacent | "Are we within bounds?" | R11 |
| 12 | Parent of teen | Cross-age safety | "Would I hand this to my 15-year-old?" | R12 |

Prior rounds covered the older surfaces (TodayPanel, DrinkForm,
Goals, Insights, Settings, Crisis, Onboarding) — see
`round-8-eight-judges-2026-05-02.md` and
`round-11-2026-05-02.md`. This round focuses on what's new in R12.

---

## Per-surface verdicts (R12 surfaces only)

### Bulk drink-edit (R12-2)

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | Selection state visually clear; action bar appears at the top in bulk mode and disappears cleanly. |
| 2 | ✅ Ship | "Bulk edit", "Today", "This week", "Done" — plain verbs, no marketing. |
| 3 | ✅ Ship | BulkSelectionContext avoids 4-deep prop drilling; 18 tests pin behavior. |
| 4 | ⚠ Note | A user mass-deleting an "embarrassing" night could be hiding from themselves. The action is reversible (trash retains 30d) so this isn't a blocker, but the counselor lens prefers a confirm step on >5 deletions. **Filed for R13.** |
| 5 | ✅ Ship | Checkboxes have aria-labels; bulk actions reachable via Tab. |
| 6 | ✅ Ship | The whole point of this feature: Friday-night user who realized at midnight they forgot to log earlier doesn't need 8 swipes. |
| 7 | ✅ Ship | All ops local-only; no telemetry on bulk-edit usage. |
| 8 | ✅ Notable | The "select today/this week" quick-scope is the moat — bulk-delete is commodity. |
| 9 | ✅ Ship | Spec is well-scoped; one feature, one feature flag-free landing. |
| 10 | ⚠ Note | Bulk operations can be ethically loaded (see judge 4 note). The "Done" button to exit bulk mode is the agency-preserving affordance. |
| 11 | ✅ Ship | No health claims; no regulator concern. |
| 12 | ✅ Ship | A teen using this to hide drinks from their future self has the same recourse as an adult: trash retains 30d, undo possible. |

### Backup verification (R12-3)

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | Success card uses sage palette (calm); error card uses red palette. Visual hierarchy clear. |
| 2 | ✅ Ship | "Backup verified at 14:23. 247 entries readable. Passphrase works." — restrained, factual, no exclamation. |
| 3 | ✅ Ship | verifyBackup returns a discriminated union, not throws — caller can render specific failure modes. 17 tests. |
| 4 | ✅ Ship | "That passphrase didn't unlock the file. Check capitalization." — never blames the user. |
| 5 | ✅ Ship | Form labels associated; success/error use role="status" / role="alert". |
| 6 | ✅ Ship | A user who's anxious about losing data gets reassurance now, not after a phone wipe. |
| 7 | ✅ Ship | Verification is read-only; the doc is explicit that nothing on this device changed. |
| 8 | ✅ Notable | Verify-before-you-need-it is a privacy-first wedge that requires the encrypted-backup format. Competitors with cloud backup don't need it (the cloud verifies for them). |
| 9 | ✅ Ship | Spec was tight; landed with full test coverage. |
| 10 | ✅ Ship | The user controls the file, the passphrase, and when to verify. No coercion. |
| 11 | ✅ Ship | No medical claim; the "this is a read-only check" copy is honest about scope. |
| 12 | ✅ Ship | Verify is age-agnostic — same UX works for a teen who wants to back up their own data. |

### Calm notifications (R12-4)

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | Settings card matches existing card pattern. Quiet-hours fieldset reads as one decision unit. |
| 2 | ✅ Ship | "Off by default. The checkbox below turns daily check-in notifications on." — direct, no marketing. |
| 3 | ✅ Ship | Pure rule functions in `lib/notifications/calmConfig.ts` — no I/O, fully unit-tested. 35 tests. |
| 4 | ✅ Ship | Quiet-hours floor (23:00 - 07:00) is the recovery-counselor instinct: don't wake a user. |
| 5 | ✅ Ship | Each toggle has a label association; quiet-hours selectors have aria-labels. |
| 6 | ✅ Ship | The 11pm user gets ZERO notifications by default. The opt-in path is a single checkbox. |
| 7 | ✅ Ship | Notifications never leave the device; OS scheduler is the only consumer. |
| 8 | ⚠ Notable | "Calm by default" is the wedge. Most habit apps gamify with notification spam; the absence is the differentiator. |
| 9 | ✅ Ship | Spec was clear; the original spec asked for Playwright e2e but vitest is the testable surface (notifications can't be programmatically granted in headless browsers). |
| 10 | ✅ Ship | "Toggle off is permanent" — no re-engagement nudge to flip it back on. The user's choice sticks. |
| 11 | ✅ Ship | No claim that notifications support cessation; just "log if you'd like." Compliant. |
| 12 | ✅ Ship | A teen on a school night who set a 22:00 reminder gets it; the app won't fire at 03:00 regardless of any setting. |

### RTL prep (R12-5)

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | Visual rendering in LTR is unchanged (logical properties resolve to the same physical direction). |
| 2 | ✅ Ship | No copy change. |
| 3 | ✅ Ship | Codemod is idempotent + has a guardrail test that fails the suite if a future PR re-introduces a physical-direction class. |
| 4 | n/a | No counselor surface touched. |
| 5 | ✅ Ship | RTL support is itself an a11y / inclusion concern. The prep makes future RTL flip a single `dir="rtl"` change. |
| 6 | n/a | No user-facing copy or behavior change. |
| 7 | ✅ Ship | No new claim. |
| 8 | ✅ Notable | The competitor with hardcoded margin-left/right rules will have a 2-week porting cycle the day they hit Arabic users. |
| 9 | ✅ Ship | One-shot codemod with a regression-guard test is the right shape. |
| 10 | n/a | No agency surface touched. |
| 11 | n/a | No claim surface touched. |
| 12 | n/a | No teen-relevant surface touched. |

### Teen-specific crisis resources (R12-6)

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | Teen Line + TEEN-keyword Crisis Text render as standard ImmediateCard entries; no special styling. |
| 2 | ✅ Ship | "For callers under 18. Calls answered by trained teens, supervised by counselors." — descriptive, factual. |
| 3 | ✅ Ship | New entries use the existing Resource type; render path unchanged. 6 tests pin behavior. |
| 4 | ✅ Ship | Peer-staffed teen line lowers friction for first-time callers — counselor-tested approach. |
| 5 | ✅ Ship | Same a11y posture as 988 entries. |
| 6 | n/a | Crisis surface, not a Friday-night surface. |
| 7 | ✅ Ship | New phone numbers + SMS keywords verified against real services. |
| 8 | ✅ Notable | Visible-to-everyone teen resources without classification is the privacy-first wedge again — competitors that classify users for "personalized" content can't do this. |
| 9 | ✅ Ship | Decision doc explicit about NO age-gate, NO algorithmic teen detector. |
| 10 | ✅ Ship | No classifier means no ethical risk of false-positive condescension. |
| 11 | ✅ Ship | Teen Line + Crisis Text Line are public-service hotlines; pointing to them is an information service, not a health claim. |
| 12 | ✅ Ship | The judge that asked for this in the first place. |

---

## Cross-cutting findings (R12)

### Bundle size after R12

R12 added libsodium-only paths (BackupVerifier reuses the existing
sodium chunk via `encrypted-backup.ts`), pure rule functions
(calmConfig.ts ~150 lines), one new settings panel (~250 lines),
and class-name-only sweeps (no new code). Net bundle delta: small.
A formal `size-limit` re-baseline can run as part of R12 finalize.

### Test coverage delta (R12)

| Suite | Pre-R12 | Post-R12 |
|-------|---------|----------|
| Total tests | 966 | 1025 |
| Test files | 178 | 185 |

+59 new tests across R12-3 (17), R12-4 (35), R12-5 (1), R12-6 (6).
R12-2 contributed 18 tests via cherry-pick.

### Voice-and-framing checklist

Per round-8 disagreement-matrix D5, every R12 string ran through:

- ✅ No marketing voice (no exclamation, no empty modifiers)
- ✅ No "you're broken, this app fixes you" framing
- ✅ No clinical jargon the user is asked to apply to themselves
- ✅ No false certainty ("always", "never", "guaranteed")
- ✅ No second-person commands without context

R12-3 came closest to violating: "Backup verified at HH:MM" is a
factual claim — but the time is correct because we set it from
`Date.now()` at the moment of verification, and the count matches
what's in the file. Both verifiable.

### Disagreements requiring decision (R12)

**D12-1 — counselor vs. friday-night user on bulk-delete confirm**

  - Recovery counselor (judge 4): a user mass-deleting >5 entries
    might be hiding an embarrassing night from themselves; suggest
    a confirm step on big batches.
  - Friday-night user (judge 6): the whole point of bulk-edit was
    to remove friction; an interstitial confirm undoes the win.

  **Decision**: keep current behavior (no extra confirm). Reason:
  the trash bin keeps deleted entries 30 days, and undo is one
  swipe away. The counselor concern is mitigated by the technical
  recourse path; adding a confirm dialog penalizes the legitimate
  use case (logged 8 entries in the wrong day, just delete them
  all) for a hypothetical risk that has a 30-day grace period.

  **Filed for R13**: review whether the trash UI is discoverable
  enough for a user who deleted-by-mistake to find it.

**D12-2 — playwright e2e for notifications (R12-4)**

  - Original spec: "Test: vitest + Playwright."
  - What we found: Playwright cannot programmatically grant
    Notification.permission across browsers. The vitest suite
    covers the testable surface (pure rule logic, UI persistence
    of toggle state).

  **Decision**: ship without Playwright e2e for notifications;
  document the constraint in the R12-4 commit. Adding Playwright
  scaffolding that "tests" notifications without actually
  triggering OS notifications would be theater.

---

## Owner-blocking items

None. R12 is shippable as-is.

## R13 follow-ups

  - International youth-crisis lines (UK Childline, AU Kids Helpline,
    CA Kids Help Phone, IE Childline) — counterpart to R12-6 US.
  - Translate R12 new copy into es / fr / de (NotificationsSettings,
    BackupVerifier, the new TEEN routing description).
  - Counselor's bulk-delete-confirm question (D12-1 R13 follow-up).
  - Trash UI discoverability review (D12-1 R13 follow-up).
  - `size-limit` re-baseline post-R12 to record bundle delta in the
    audit doc.

## Round summary

### What landed

  - R12-2 (cherry-pick): bulk drink-edit mode (18 tests)
  - R12-3: backup verification + Settings card (17 tests)
  - R12-4: LocalNotifications calm defaults — quiet hours, daily
    cap, per-type toggles (35 tests)
  - R12-5: RTL prep — 90 directional Tailwind classes converted
    to logical properties across 43 files; regression-guard test
    pins it
  - R12-6: teen-specific crisis resources (Teen Line +
    TEEN-keyword Crisis Text) + age-gate / detector decision doc
    (6 tests + 2 disambiguated)
  - R12-7: this 12-judge gate refresh

### What didn't

  - International youth-crisis lines — out of round 12 scope, R13.
  - Translation of new R12 copy — R13.
  - Bulk-delete confirm UX (D12-1) — decision was no, with
    rationale.

### Tests at end of round

1025 passing (was 966 pre-R12), 1 skipped, 0 failing.

### Baseline diff

(Populated by the round-finalize script at merge time.)
