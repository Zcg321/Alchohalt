# Round 22 — Cognitive-load judge walkthrough

Date: 2026-05-03
Judge persona: someone with executive-function impairment
(combination ADHD, post-COVID cognitive fatigue, decision overload).
The lens: every screen is a tax. Hidden defaults, multi-step
choices, and visual noise all compound. A single screen with 10
toggles is harder than 10 screens with 1 toggle each.

This persona is real and large: ~5-9% of adults have ADHD, ~10-30%
of post-COVID adults report measurable cognitive fatigue, and the
recovery population this app serves overlaps both. A user with
executive-function impairment is exactly the user who wants the
app to log a drink in three taps and then leave them alone.

## Method

1. Opened each tab, counted interactive elements above the fold,
   counted decisions before primary action.
2. Walked the onboarding flow; tracked decisions per screen.
3. Walked the drink-form modal; tracked required vs optional
   fields.
4. Walked Settings; tracked sections, controls, and whether the
   user can find the toggle they came for.
5. Inspected hidden defaults (off-by-default toggles): are they
   discoverable?

## Findings — by severity

### NONE — Today tab is exemplary

The Today tab has **2 interactive elements above the fold**:
- "How are you today?" (primary CTA)
- "Having a hard time?" (crisis quick-action)

Plus the bottom-nav and the Day-N hero. That's it. The user opens
the app, sees a single primary action, and the secondary is
clearly secondary.

For an executive-function-impaired user, this is the gold
standard: low decision count, clear hierarchy, primary action
visible without scrolling. **Don't change this.**

### NONE — Track tab respects empty state

Track tab on a fresh install: 3 total interactive elements
(filter / sort / add). No decision overload. The empty state
itself does the work of explaining the next step.

### MAJOR — Settings tab has no overview

Settings has **47 interactive elements across 14 H2 sections**,
all stacked vertically with no jump-nav, no TOC, no section
collapse. An exec-function-impaired user opening Settings to
toggle one specific thing has to:

1. Open Settings.
2. Scroll past unrelated sections.
3. Visually scan each section header.
4. Find the right one (or scroll past it).
5. Find the toggle within that section.
6. Toggle it.
7. Scroll back up to leave.

Steps 2-4 are the cognitive load. R21-3 added a jump-nav to the
Self-experiment dashboard inside Settings; that pattern needs
to be lifted to the Settings tab itself.

**Partial fix landed (R22-4):** added stable IDs to the 5 section
headings that were missing them (`appearance-heading`,
`reminders-heading`, `about-heading`, `dev-tools-heading`,
`legal-heading`, `pricing-heading`). All 14 H2s now have IDs.
This is the foundation a future jump-nav requires (deferred to
R23 — building the nav itself touches SettingsPanel layout,
needs design input on whether it's a sticky chip rail or an
expanding TOC).

The IDs alone are also useful: a power-user can deep-link
(`/?tab=settings#reminders-heading`) and the existing skip-link
keyboard contract gets richer targets.

### MEDIUM — Onboarding has 6 screens, 3+ decisions

The onboarding flow asks the user to:
1. Pick an intent ("Cutting back" / "Stopping for good" / "Just
   exploring") — 3-way decision.
2. Pick tracking style — 2-way decision.
3. Privacy intro (no decision, but a wall of text).
4. Goals intro (offers a default skip, good).
5. Ready (no decision).
6. Quick tips (no decision).

The "Skip and explore" button on every screen is the right
escape hatch — and the cognitive-load judge is grateful for it.
But screens 1-2 still demand commitment from the user before
they've seen the app. A "Decide later" option on screen 1 (vs.
just "Skip and explore" which exits the whole flow) would let
the exec-function-impaired user defer the choice without losing
the educational onboarding.

This is a content/UX decision, not a layout fix. **Filed for
R23**: add "I'll decide later" as a third option on the
intent-picker screen (not the same as Skip — the user still goes
through the rest of onboarding, just defers the intent
classification).

### MEDIUM — Drink-form required fields aren't visually distinguished

The drink-form has many fields (volume, ABV, intention, craving,
HALT, alternative action, notes, tags). Most are optional — the
user can log a drink with just volume + ABV. But the form
doesn't visually distinguish "log this and stop" from "fill all
of this in for richer data later."

For the cognitive-load judge: every field looks equally
demanding. The user sees 8 fields, doesn't know 6 are optional,
and either over-fills (cognitive cost) or bounces (data lost).

**Filed for R23**: add a clearer visual distinction:
- A "Quick log" / "Detailed log" toggle at the top of the form
- Or a `(optional)` suffix on optional field labels
- Or a collapsible "More details" section below the required two

Not landing in R22 because it touches every form caller and
needs a design pass.

### LOW — Hidden defaults are correctly OFF, but undiscoverable

The app gets the privacy default-off pattern right:
- AI features (`Settings → AI`) — off by default
- Crash reports (`CrashReportsToggle`) — off by default
- Reminders — off by default
- Sync — off by default

But the user has no top-of-screen "Here's what's currently OFF /
ON" summary. An exec-function-impaired user wondering "did I
accidentally enable analytics?" has to scroll to each setting
individually.

The R21-3 SelfExperimentDashboard adjacent surfaces some of
this for the owner ("what the app measures about itself"). A
parallel "what the app does for you" summary card at the top of
Settings would help the cognitive-load judge.

**Filed for R23**: a one-card "current toggle state" summary at
top of Settings that lists the 4-6 user-facing toggles with
their current state. Read-only — clicking a row jumps to that
section (depends on the jump-nav landing).

### LOW — Some sections nest too deeply

Settings → Privacy & data → Trust receipt (3 levels) is fine.
But within Trust receipt there are 5 sub-headings + a print
button + an export button. For an exec-function-impaired user
who landed there to "see the privacy proof," 5 sub-sections
without a one-line summary at the top is overwhelming.

The fix is small: add a one-line summary above the sub-sections
(e.g., "What this is: a snapshot of what the app stores about
you and what it can prove about not sharing it."). Not landing
in R22 — needs a Trust-Receipt-component refactor and the copy
should be reviewed by the privacy lens.

## What this judge catches that the other 21 don't

**Decision economics.** Most prior judges look at correctness
("does the toggle work?") or safety ("is the default right?").
The cognitive-load judge looks at *cost* — how many decisions
must the user make to do what they came to do? On the Today tab
the answer is "1 plus 1 fallback"; on Settings the answer is
"scan 14 sections to find the one I want." Both can be
correct-and-safe but only one is usable for this persona.

## What R22-4 didn't fix (deferred to R23)

- Settings jump-nav (the foundation IDs landed; the nav UI is
  a R23 design + build).
- Onboarding "Decide later" intent option.
- Drink-form Quick / Detailed toggle.
- Settings top-of-page "current toggle state" summary card.
- Trust-receipt one-line summary above sub-sections.

## Tests added

None — the changes are pure ID additions to H2 elements with no
behavior change. The `heading-hierarchy.test.tsx` from a prior
round already validates that no level is skipped; the new IDs
don't change the tree shape. A test specifically asserting
"every Settings H2 has an ID" would be valuable but couples to
the section list, which is fragile. Will add it as part of the
R23 jump-nav work, where the test naturally falls out of the nav
implementation (the nav reads the IDs and the test asserts the
nav is non-empty).

## Process notes

This is the 22nd judge lens added to the rotation. The decision-
economics framing is genuinely new — none of the 21 prior judges
look at it directly. Recommend keeping it in the standard rotation
(every 4-5 rounds) since it surfaces a different class of issue
(scope, density, layout) from the other 21 (correctness, safety,
voice, locale, performance).

The persona overlaps the recently-quit-user (R21-5) and 65-year-
old-non-tech (R22-5, this round) judges, but the lenses differ:
the recently-quit judge looks at *emotional* load on the math; the
65-year-old-non-tech judge looks at *physical* and discoverability
load (button size, gestures); the cognitive-load judge looks at
*decision* load. All three are valuable; none is redundant.
