# Hardware Screen-Reader Pass — Contractor Spec (Round 26-C)

**Date drafted:** 2026-05-04
**Estimated time:** 60 minutes (5 surfaces × 3 readers × 4 minutes
per pair, plus 10 minutes report write-up)
**Skill required:** prior NVDA / VoiceOver / TalkBack experience.
Familiarity with the WebAIM screen reader pass methodology preferred.
**Deliverable:** a filled-out copy of the table at the bottom of this
document, plus 1-2 sentences per cell when a Pass-with-notes or
Fail is observed.

## Why this spec exists

Round 25 verified WCAG 2.1 AA programmatically (axe-core, jest-axe,
manual `read_page` accessibility tree dumps) and via simulation in
the round-22 screen-reader-walk doc. What it didn't do — and what
neither CI nor a Claude session can do — is actually drive the app
with **real assistive technology** and confirm a user gets a clean
narration. This spec exists so a freelance contractor with the right
hardware can complete that pass in a single hour and we file the
result alongside our other audits.

The result is binary per surface × reader: either the user can do
the listed action without confusion, or they can't. Notes on every
failure plus on every "passed but felt rough" cell.

## Test environment

- Latest Chrome (mobile + desktop) — version at time of test in
  filed report
- Latest Safari on iOS for VoiceOver
- Latest Chrome on Android for TalkBack
- Latest Windows or macOS with NVDA / VoiceOver respectively
- Production build of the app (Vercel deploy URL — provided in the
  contractor onboarding email; do **not** test against localhost
  to avoid cache/source-map noise)
- Test data: empty install (the contractor should hit the onboarding
  flow first, then test the populated states using sample data via
  Settings → Diagnostics → Replay onboarding)

## The five surfaces

These are the five surfaces that drive 90% of daily use. If they
narrate cleanly, the rest of the app inherits the same component
library and is highly likely to as well.

1. **Onboarding intent step** (`/` cold-start, intent radio group)
2. **Drink form** (`/` Track tab, log a drink)
3. **Today panel + Hard-time header pill** (`/` Track tab, header)
4. **Insights tab** (after at least 3 drinks logged, sample preview
   if empty)
5. **Settings → Privacy & data** (especially the new R26-B headline
   + R7-C PrivacyStatus rows)

## The three screen readers

- **NVDA on Windows** (free, the most common SR after JAWS in the
  Windows enterprise space)
- **VoiceOver on iOS** (the only SR Apple supports; iOS 17 default)
- **TalkBack on Android** (Google default; v14+ has the new "Reading
  controls" gesture model)

(Skipping JAWS for cost reasons. Skipping desktop VoiceOver because
mobile VoiceOver covers the same engine + the app's primary surface
is mobile.)

## What "Pass" means per surface

For each surface × reader, the contractor confirms each of these in
order:

1. **Landmark navigation works.** Pressing the SR's "next region"
   gesture (D in NVDA, Rotor → Landmarks in VoiceOver, swipe-up-
   then-right in TalkBack) lands on a meaningful region. The user
   should hear the heading text, not a generic "region" label.
2. **Heading hierarchy is clean.** Pressing the "next heading"
   gesture lists every visible heading in DOM order without
   skipping levels (H1 → H2 → H3, no H1 → H4 jumps).
3. **Form labels are announced.** Every input on the surface
   announces a label as the focus lands; no "edit text, blank"
   readouts.
4. **State changes are announced.** When the user picks an option
   that changes the UI (an intent radio, a checkbox toggle, a
   form submission), the SR announces the new state without the
   user re-querying.
5. **Live regions don't barge.** Hard-time header pill, success
   toasts, soft-restart banner — these should announce when they
   first appear and **not** repeat. Polite, not assertive, unless
   the user actively triggered them.
6. **Action buttons are discoverable.** Pressing the "next button"
   gesture finds every action without the user resorting to spatial
   exploration.

A surface that fails any of those for any reader is a Fail with a
1-2 sentence note.

## Surface-specific scripts

The contractor follows these scripts to cover each surface in 4
minutes per reader.

### 1. Onboarding intent step

1. Cold-start the app (clear cookies + localStorage, or use
   incognito).
2. SR users get the intent radio group on first render.
3. Confirm:
   - Heading "What brings you here?" announces
   - All four radio options announce their labels
   - Selecting one announces "selected" state
   - "Continue" button is reachable via next-button gesture

### 2. Drink form

1. With at least one onboarding answer recorded, land on the Track
   tab.
2. Locate the "Log drink" form.
3. Confirm:
   - Form has an accessible name ("Log a drink" or similar)
   - Volume / ABV / kind / intent inputs all announce labels
   - Pressing the submit button while form is invalid surfaces
     a validation message via aria-live (the SR reads it without
     re-querying)
   - Submitting a valid drink fires a polite success
     announcement

### 3. Today panel + Hard-time header pill

1. From Track tab, navigate via landmarks/headings.
2. The HardTimePanel header pill ("Need help?") should sit in the
   global header.
3. Confirm:
   - Pill is reachable as a button via next-button gesture
   - Activating it expands the urgency panel
   - Inside the panel, regional crisis lines list is reachable
     via landmark navigation
   - HALT trigger card (round-25-3 plain-language fix) reads as
     "Hungry, Angry, Lonely, Tired — common drinking-urge triggers"
     without a "HALT" abbreviation barrier

### 4. Insights tab

1. With at least 3 drinks logged, switch to Insights tab.
2. If empty, the round-25-H sample-data preview should render with
   "Sample" badges.
3. Confirm:
   - Each tile has a heading
   - Tile values are announced (numbers + units)
   - Sample badges announce as "Sample" and aren't muted/decorative
   - Calorie tile (round-25-B, opt-in via Settings) is not present
     by default

### 5. Settings → Privacy & data

1. Settings tab → scroll to Privacy & data section.
2. Confirm:
   - The pinned 1-line privacy headline (R26-B) reads first when
     entering the section by landmark
   - Each PrivacyStatus row announces feature + status (Active /
     Off) without a user having to scrub character-by-character
   - The "How can I verify this?" `<details>` element announces
     as expandable; expanding it surfaces the three verification
     steps as a list
   - The std-drink explainer in Appearance (R26-A) similarly
     announces as expandable, and its equivalences list reads as a
     list to the SR

## The deliverable: filled-in pass/fail table

Copy this table into the contractor's report. Replace ✓ / ✗ / ⚠ as
appropriate. ⚠ = passed but with a note worth recording.

| Surface | NVDA | VoiceOver iOS | TalkBack | Notes |
|---------|------|---------------|----------|-------|
| 1. Onboarding intent step       | _ | _ | _ | _ |
| 2. Drink form                   | _ | _ | _ | _ |
| 3. Today panel + Hard-time pill | _ | _ | _ | _ |
| 4. Insights tab                 | _ | _ | _ | _ |
| 5. Settings → Privacy & data    | _ | _ | _ | _ |

For every ⚠ or ✗ cell:

- 1-2 sentences on what the user heard (or didn't hear)
- The reproducer (which gesture, which region, what was expected)
- Severity: blocker / annoyance / nice-to-have

## Estimated cost

At a standard a11y contractor rate of $150-$250 / hour, a 60-minute
pass is $150-$250. The deliverable is a 1-page report plus the
filled-in table. We expect to repeat this pass once per major
release (every 2-3 months in steady state).

## Reasoning trail (for the auditor record)

This spec was generated as part of the Round 26 (2026-05-04) Round-25
carry-forward set. The Disability Rights Advocate judge audit (R25-3)
explicitly recommended a hardware-SR pass as the next correctness
verification step beyond programmatic axe checks. CI cannot drive
real assistive tech; this spec lets a freelance contractor close
that gap in one hour without the contractor needing to read a single
line of our source code.

The 5-surfaces × 3-readers × 4-minutes-per-pair scope was chosen so
the whole pass fits in 60 minutes — small enough that we can afford
to repeat it per release without it becoming a budget item we
postpone. Any larger scope risks the pass being skipped.

— Round 26-C, 2026-05-04
