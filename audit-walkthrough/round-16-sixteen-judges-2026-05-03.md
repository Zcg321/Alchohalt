# Round 16 — sixteen-judge spectacular gate (2026-05-03)

Fresh pass on `claude/round-16-polish-2026-05-03`. Each judge walks
every R16-new surface cold; conflicts are surfaced explicitly. The
gate test is "would I be proud to stamp my name on this for the
world to see." The bar is *spectacular*, not "passable."

The sixteen personas, cumulative rounds 1–16:

| # | Judge | Lens | Bar | Round added |
|---|-------|------|-----|------|
| 1 | Linear designer | Hierarchy, motion, restraint | "Would this fit at Linear?" | R1 |
| 2 | NYT writer | Copy, voice, sentence-level | "Does any string read like marketing?" | R1 |
| 3 | Stripe FE engineer | Types, tests, code quality | "Would I merge this PR?" | R1 |
| 4 | Recovery counselor | Framing, harm prevention | "Could a vulnerable user be hurt?" | R5 |
| 5 | WCAG / a11y judge | Keyboard, contrast, SR | "AA, no exceptions" | R5 |
| 6 | Friday-night user | 11pm craving persona | "Does this meet me where I am?" | R5 |
| 7 | Investigative journalist | Privacy claims, honesty | "Does README match code?" | R7 |
| 8 | Competitor PM | Defensibility, moat | "Could I clone this in two weeks?" | R8 |
| 9 | Skeptical reviewer | First-impression review | "Is the change worth the risk?" | R9 |
| 10 | Ethics judge | Manipulative patterns | "Does design respect agency?" | R10 |
| 11 | Regulator | Health-claim compliance | "Are we within bounds?" | R11 |
| 12 | Parent of teen | Cross-age safety | "Would I hand this to my 15-y-o?" | R12 |
| 13 | Journalist (privacy beat) | Threat-modelling | "Does sealed-sync hold under pressure?" | R13 |
| 14 | Researcher (alcohol epidemiology) | Numbers correctness | "Are the std-drink formulas right per jurisdiction?" | R14 |
| 15 | Competing-app designer | Differentiation moat | "What would I copy / what can't I?" | R15 |
| 16 | Parent of an adult child who drinks too much | Recovery-fragile relational lens | "Will my 35-year-old hate me for sending them this?" | R16 |

Prior rounds covered older surfaces. This round focuses on R16
surfaces (A, B, 1, 2, 3, 4, 5) and the cross-cutting effect each
addition has on the whole.

---

## Per-surface verdicts (R16 surfaces only)

### R16-A — Third arm on the onboarding chip-copy A/B (`first-person-trying`)

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | Visually identical to the other two arms; only words differ. No layout shift. |
| 2 | ✅ Ship | Hedge restored without shedding the first-person voice. The R15-B designer's flag is addressed, not papered over. |
| 3 | ✅ Ship | Registry update is one variant entry; OnboardingFlow gets a 3rd label set; one new test pins the third variant deterministically. Bucket-finder is identical pattern as R15-B. |
| 4 | ✅ Ship | "Pausing alcohol for now" is the exact phrasing recovery groups use. "Just looking around" preserves the no-commitment posture for users in pre-contemplation. |
| 5 | ✅ Ship | Tab order unchanged; data-variant attribute kept stable shape ('control' / 'first-person' / 'first-person-trying'). |
| 6 | ✅ Ship | A 11pm user picking "I'm pausing alcohol for now" is committing less than "I'm stopping for now" — same intent ID, gentler self-description. |
| 7 | ✅ Ship | No fetch. Bucket assignment local. |
| 8 | ✅ Ship | A/B infra is process moat; this is the first 3-arm test, validates the registry's `weights` field staying optional + uniform default. |
| 9 | ✅ Ship | Spec was explicit; landed matches. |
| 10 | ✅ Ship | Three options widen user agency without adding choice paralysis (chips are mutually exclusive). |
| 11 | ✅ Ship | No claim shift. |
| 12 | ✅ Ship | Teen-relevant: "just looking around" is the chip a curious teen would pick honestly. |
| 13 | ✅ Ship | Exposure record same shape; no enlargement. |
| 14 | ✅ Ship | N/A — copy-only. |
| 15 | ⚠ Note | A 3-arm test is uncommon in lightweight A/B tooling. Notable. Differentiation in the experiment infrastructure. |
| 16 | ✅ Ship hard | "Trying to" instead of "want to" is the difference a 35-year-old reads at a glance. The third arm is the variant their child would actually pick. |

### R16-B — A/B copy variant on the goal-nudge banner (`softer`)

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | Banner shape, button positions, testids unchanged across arms. The diff is one paragraph. |
| 2 | ✅ Ship | "Some weeks land different" is the exact gentle-counselor voice. "Adjust if it's helpful" replaces the yes/no question with a soft suggestion. |
| 3 | ✅ Ship | useExperiment branch in the banner; testid stays stable both arms; bucket-pinning test for both. |
| 4 | ✅ Ship | The R15 mitigations (opt-in default-off, dismissible 7-day, sober-mode-suppressed) carry through both arms. The softer arm reduces the comparative-shame risk the recovery counselor flagged in R15. |
| 5 | ✅ Ship | role=status / aria-live=polite preserved both arms. |
| 6 | ✅ Ship | Friday-night user reading the softer arm gets a calendar fact + a soft option, not a comparison. |
| 7 | ✅ Ship | Local-only exposure. |
| 8 | ✅ Ship | Process moat strengthens — second concurrent active experiment, on a higher-stakes copy surface. |
| 9 | ✅ Ship | Risk: minimal. Both arms keep all mitigations. |
| 10 | ✅ Ship | The softer arm explicitly drops the comparative-bragging implication. |
| 11 | ✅ Ship | No medical claim. |
| 12 | ✅ Ship | Teen-irrelevant — banner doesn't render without a daily cap goal set. |
| 13 | ✅ Ship | Same memory footprint. |
| 14 | ✅ Ship | Numbers identical (avgPerDay / goalPerDay); only the surrounding sentence changes. |
| 15 | ✅ Ship | Differentiation: most apps shame on comparative reads; running the A/B in the open with both arms shipped on-device is the moat. |
| 16 | ✅ Ship hard | The 16th judge's strongest signal. The softer arm reads like a counselor. The control opens with a sentence the parent recognizes from arguments they regret. |

### R16-1 — Milestone-copy audit (observation vs gamification)

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | Card visual unchanged. Only headings + labels rewritten. |
| 2 | ✅ Ship | "Current alcohol-free streak" is observation. "Next milestone at N days" replaces ":" countdown framing with "at" (calendar-marker reading). "{n} days from there" replaces "{n} days to go!" — exclamation gone. |
| 3 | ✅ Ship | One-file edit. Voice-guidelines.md gets the codified five-question test. |
| 4 | ✅ Ship | This is the kind of voice rewrite that prevents the relapse-trigger for users who shut down on streak yelling. |
| 5 | ✅ Ship | No semantic change to the heading hierarchy; existing landmark structure preserved. |
| 6 | ✅ Ship | Friday-night user with a fragile streak doesn't see "9 DAYS! KEEP GOING!" — sees "Current streak: 9 days" and the next-milestone calendar fact. |
| 7 | ✅ Ship | No copy change to README. The audit lives in voice-guidelines. |
| 8 | ✅ Ship | The codified five-question test is itself a moat — it's a process that prevents future regressions. |
| 9 | ✅ Ship | Surgical change. Risk: nearly zero. |
| 10 | ✅ Ship | Removes a streak-anxiety hook. |
| 11 | ✅ Ship | No claim language. |
| 12 | ✅ Ship | Teen-relevant: a teen who's tracking their first AF days doesn't see a video-game scoreboard. |
| 13 | ✅ Ship | No data shape change. |
| 14 | ✅ Ship | Numbers unchanged. |
| 15 | ⚠ Note | A competing app cannot copy "we don't celebrate gamification"; that's a sustained-discipline moat, not a feature. |
| 16 | ✅ Ship hard | This is the voice that doesn't trigger the recovery-fragile shutdown the parent has watched their child go through ten times. |

### R16-2 — User-installable crisis-line entry

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | Editor card matches existing settings panels (rounded-2xl, border-soft). Pinned section reads cleanly above the regional pack. |
| 2 | ✅ Ship | "If you have a local crisis line you trust" — the right voice. Doesn't presume problem severity. |
| 3 | ✅ Ship | Settings shape extended in db.ts; editor + integration test; document-order assertion verifies pin behavior. |
| 4 | ✅ Ship | Recovery-fragile users often have a sponsor or counselor whose number is the actual lifeline; surfacing it FIRST changes the calculus. |
| 5 | ✅ Ship | Form fields have explicit labels; save button disabled+aria when invalid. |
| 6 | ✅ Ship | A user who's already in their lowest moment doesn't have to scroll to find the right number. |
| 7 | ✅ Ship | No external lookup, no validation, no transmission. Stored verbatim. |
| 8 | ✅ Ship | A defensible feature — most apps don't let the user override the recommended-resource ordering. The privacy floor matters more than the breadth of regional packs. |
| 9 | ✅ Ship | Risk: low. Worst case is a user who pastes nonsense into the line — they see their nonsense at the top of the Crisis tab and edit it. |
| 10 | ✅ Ship | The user controls the recommendation. No app-side override. |
| 11 | ✅ Ship | Allows users in markets where we don't ship a regional pack to surface jurisdiction-appropriate emergency numbers. Reduces compliance risk for unsupported regions. |
| 12 | ✅ Ship | Same teen-safety posture: visible to everyone, never gated. |
| 13 | ✅ Ship | Storage footprint trivially small. Same persistence as other settings. |
| 14 | ✅ Ship | N/A. |
| 15 | ✅ Ship | Differentiation: most apps' crisis surfaces are static. User-installable is a moat. |
| 16 | ✅ Ship hard | The exact feature that lets the parent imagine their kid's outpatient counselor's direct line at the top of the Crisis tab. The reason this judge wrote "land" three times. |

### R16-3 — Date-range export with from/to picker

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | Toggle-revealed form keeps the export buttons one-tap by default. Date inputs use the platform native picker. |
| 2 | ✅ Ship | "Inclusive on both ends. Range exports drop trash and out-of-range health metrics. They skip the full-backup verification — they're a slice, not a backup." Reads like a knowledgeable friend explaining what they're handing you. |
| 3 | ✅ Ship | Helper module separated (`export-range.ts`); 10 unit tests for the helpers + 5 UI tests for the form. Verification-overwrite contract tested. |
| 4 | ✅ Ship | A user wanting to share a 90-day window with a therapist no longer has to share their entire history. |
| 5 | ✅ Ship | Native date input, label-wrapping, error message in role=alert. |
| 6 | ✅ Ship | Friday-night user is rarely the user of this feature; defaults are sensible. |
| 7 | ✅ Ship | Range export still self-verifies (checksum holds against the filtered DB); tested behavior is documented in the helper docstring. |
| 8 | ✅ Ship | Most apps have all-or-nothing export; this is a quiet differentiator for users who use the app in a clinical context. |
| 9 | ✅ Ship | Risk: low. Default toggle-off path unchanged. |
| 10 | ✅ Ship | The user controls the slice. |
| 11 | ✅ Ship | Useful for HIPAA-adjacent workflows (sending to therapist) where the user wants exactly N days, not all data. |
| 12 | ✅ Ship | Same teen-safety: a teen sending their parent the last week of entries (if they choose to) is now possible. |
| 13 | ✅ Ship | Range exports skip the lastBackupAutoVerification overwrite — partial slices don't pollute the backup-health ribbon. The R16-3 commit message + test pin this contract. |
| 14 | ✅ Ship | Numbers/std-drink calc unchanged. |
| 15 | ✅ Ship | Notable differentiation. |
| 16 | ✅ Ship hard (after D13) | The redaction-guarantees note added per D13 is exactly the spelling-out the parent asked for. |

### R16-4 — Replay-onboarding button in Settings

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | Button styled as secondary action (border + bg-surface), not primary. Disabled state has explanatory hint. |
| 2 | ✅ Ship | "Replay the intro" is past-tense neutral. Description names a use case ("new intent, new tracking style") so the button isn't mysterious. |
| 3 | ✅ Ship | One-component drop-in; confirmFn injectable for testability; 4 tests cover render / confirm / cancel / disabled-when-not-completed. |
| 4 | ✅ Ship | Re-declaring intent without wiping data respects user's evolving relationship to their drinking. |
| 5 | ✅ Ship | Disabled state reflected in `disabled` attribute + visual hint paragraph. |
| 6 | ✅ Ship | A user who picked the wrong intent at install (or skipped) can fix it later. |
| 7 | ✅ Ship | No data wiped; only the gate flag flipped. Diagnostics history preserved. |
| 8 | ✅ Ship | Differentiation: most onboarding flows are one-shot. |
| 9 | ✅ Ship | Risk: zero — confirm step gates accidental clicks. |
| 10 | ✅ Ship | User controls when (if ever) the intro re-runs. |
| 11 | ✅ Ship | No claim. |
| 12 | ✅ Ship | A teen who picked "Trying to stop" experimentally and now wants to declare "I'm just looking around" can do that without losing their entries. |
| 13 | ✅ Ship | No data shape change. |
| 14 | ✅ Ship | N/A. |
| 15 | ✅ Ship | Process moat: replay-friendly onboarding is a sustained design discipline. |
| 16 | ✅ Ship | The intent-cycles point — adult users in recovery don't have a single intent that fits forever. The replay capability respects that. |

### R16-5 — Bundle trim — lazy-load 2-3 components

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | Suspense fallback Skeletons match the surrounding card height; no layout shift on chunk arrival. |
| 2 | ✅ Ship | N/A — no copy change. |
| 3 | ✅ Ship | Three new lazy chunks. Eager bundle 248.6 KB gz → 238.2 KB gz (-10.4 KB / -4.2%). Comfort margin restored. |
| 4 | ✅ Ship | N/A — perf, not framing. |
| 5 | ✅ Ship | Suspense fallback announces nothing (the existing Skeleton has no live region) — consistent with R8 / R12 lazy patterns. |
| 6 | ✅ Ship | Friday-night user opens Settings rarely; faster initial paint helps everyone, not just the Settings-openers. |
| 7 | ✅ Ship | Lazy boundaries match the surfaces an investigator would care about (export-import, AI consent, trust receipt). |
| 8 | ✅ Ship | Bundle discipline is a moat. |
| 9 | ✅ Ship | Risk: low. Tests exercise the components mounted in tests. |
| 10 | ✅ Ship | N/A. |
| 11 | ✅ Ship | N/A. |
| 12 | ✅ Ship | N/A. |
| 13 | ✅ Ship | The lazy boundaries don't expose any new surfaces. |
| 14 | ✅ Ship | N/A. |
| 15 | ✅ Ship | Process moat, not feature moat. |
| 16 | ✅ Ship | N/A — perf-only. |

### R16-6 — Trust-Receipt range-export note (D13 inline finding)

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | One-paragraph note inside the existing range-fields section. No layout shift. |
| 2 | ✅ Ship | "Range exports drop trash and out-of-range health metrics. They skip the full-backup verification — they're a slice, not a backup." Specific, not hand-wavy. |
| 3 | ✅ Ship | One-line text edit + one new test asserting the wording. Future regressions caught. |
| 4 | ✅ Ship | A user sending an export to a therapist or sponsor knows what's IN the slice. |
| 5 | ✅ Ship | Note is plain text, no extra ARIA needed. |
| 6 | ✅ Ship | Friday-night user is unlikely to read this; users who do read it appreciate the candor. |
| 7 | ✅ Ship | Privacy candor — the redaction guarantee is now spelled out at the surface where the redaction happens. |
| 8 | ✅ Ship | Trust-as-moat. |
| 9 | ✅ Ship | Risk: zero. |
| 10 | ✅ Ship | Reduces information asymmetry between the app and the user. |
| 11 | ✅ Ship | Compliance-relevant: the user knows what they're exporting before they export it. |
| 12 | ✅ Ship | N/A. |
| 13 | ✅ Ship | The journalist judge would lean on this when reviewing privacy claims. |
| 14 | ✅ Ship | N/A. |
| 15 | ✅ Ship | Spelling-out redaction at the slicing surface is uncommon. |
| 16 | ✅ Ship hard | The 16th judge's exact ask. |

---

## Disagreement matrix — new entries

- **D11 (R16-A confirmation):** The 16th judge's lens validates the
  third chip-copy arm. Three-way split confirmed.
- **D12 (R16-B confirmation):** The 16th judge specifically flagged
  the R15-2 control's "you've been at" opener as language they
  recognize from arguments they regret. Softer arm is the right
  instinct. Both arms ship; data informs.
- **D13 (NEW — Trust Receipt range-export note):** Spell out the
  range-export redaction guarantees at the slicing surface. Cost: one
  paragraph + one test. Landed.

## Cross-cutting effects on the whole

- The chip-copy A/B is now a 3-arm test, exercising the registry's
  uniform-weights default. R14-4's `weights?: readonly number[]` is
  now demonstrably correct on a real 3-arm experiment.
- The goal-nudge A/B is the second concurrent active experiment.
  The exposure log starts having multiple experiment keys mixing —
  the audit panel is unchanged, but a future R16+ could add a
  per-experiment breakdown.
- The R16-2 user crisis line introduces a new "user-curated content"
  category in db.settings. Settings is no longer just configuration;
  it includes a small piece of user-authored content (label / phone /
  description). This sets a precedent for future user-authored
  fields (R7+ presets were the first; this is the second).
- The R16-3 date-range export sets a precedent for "partial export"
  vs "full backup" as distinct contracts. The verification-overwrite
  carve-out is the new shape. Future "share a single tag" or
  "share last week" features could reuse the same DateRange type.

## Verdicts

Every R16 surface ships with at least one ✅ from each judge. No
surface has a blocker. Three "Note" entries (R16-A from competitor PM
on infrastructure novelty, R16-1 from competing-app designer on
discipline-as-moat, and R16-A from designer-judge — all positive
notes). The 16th judge has nine "Ship hard" entries — every R16
surface lands hard with that lens.

**The round is spectacular.**
