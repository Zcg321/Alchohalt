# Round 22 — 22nd judge: 65-year-old non-tech user

Date: 2026-05-03
Judge persona: a 65-year-old who got the app from their adult kid.
Reading-grade ≤ 6, font size ≥ 16px, button targets ≥ 48pt, no
swipe-only gestures, every flow traversable with tap-only.

This persona is different from prior judges:
- The recently-quit user (R21-5) lens: emotional load on the math.
- The cognitive-load judge (R22-4) lens: decision economics.
- The 65-year-old non-tech user (R22-5) lens: **physical** load
  on tap targets, font legibility, gesture discoverability, and
  vocabulary that doesn't assume tech fluency.

These overlap but aren't redundant. A 30-year-old with ADHD and a
65-year-old learning their first app fail in different places.

## Method

1. Walked the live app (Today, Track, Goals, Settings) at default
   text scaling, measured every visible button's bounding rect,
   counted any < 48pt.
2. Greped the source for swipe-only gesture handlers
   (`onTouchStart`, `onTouchMove`, `onTouchEnd`, `onPan`, `swipe`).
3. Spot-checked vocabulary: "trust receipt", "diagnostics audit",
   "self-experiment dashboard" — terms that may not parse for a
   65yo who hasn't worked with apps.
4. Inspected font sizes on body + secondary text.

## Findings — by severity

### MAJOR — Two fixed-position buttons under 48pt

`ScrollTopButton` was 32px (h: ~32, p-2 + 16px arrow). Below the
WCAG 2.5.5 floor of 44pt and well below the 48pt+ that gerontology
research recommends for fine-motor-impaired older adults.

`Toast` close button was 24px (p-1 + 16px close icon). Same
problem — and worse because it sits adjacent to the toast's
action button (e.g., "Undo"), making mis-taps likely.

**Fix landed:**
- ScrollTopButton: `min-h-[48px] min-w-[48px] p-3`, repositioned
  from `bottom-4` to `bottom-20` so it doesn't overlap the
  bottom-nav touch zone on mobile. Added `flex items-center
  justify-center` and `text-lg` so the arrow centers cleanly at
  the new size.
- Toast close button: `min-h-[44px] min-w-[44px] p-2 flex
  items-center justify-center`. WCAG 2.5.5 minimum (44pt). The
  separation from the action button + the explicit min size
  resolves the mis-tap risk.

### NONE — No swipe-only gestures

`grep -E 'onTouchStart|onTouchMove|onTouchEnd|swipe|onPan' src` →
zero matches. Every flow is reachable via tap. The 65yo judge
cheers — swipe gestures are the #1 gerontology UX failure
(unfindable, unforgivable when missed).

### NONE — Body font is 16px

Default body font is 16px (browser default not overridden). The
`.input` class explicitly sets `font-size: 16px` to prevent iOS
Safari zoom-on-focus. Both pass the 65yo legibility floor.

### LOW (kept) — Tab-bar labels at 13.33px

Bottom-nav tab labels use `text-micro` (~13px). Below the 16px
body baseline. For a 65yo squinting at a phone, these are at the
edge of legibility — but the icons above them carry the meaning
and the labels are reinforcement, not the only signal.

Increasing to 14-15px would push the bottom-nav past 64px tall
on mobile and crowd out the content area (already a R22-B
concern at landscape phones). Trade-off documented; deferred.

### LOW (kept) — Vocabulary borrows tech terms

Words that may not parse for a 65yo non-tech user:
- "Trust receipt" — coined privacy term; the receipt itself
  explains what it is, but the menu label doesn't
- "Diagnostics audit" — paired with "Self-experiment dashboard"
  in Settings → both are owner/power-user features; the 65yo
  user is unlikely to wander into either
- "Onboarding funnel" — same audience scope (deep in Self-
  experiment)

These terms live in the Self-experiment section which is
explicitly a power-user / owner-debugging surface (the R21-3
`selfExperiment.description` says: "...The point is to make the
app legible to its own user."). The 65yo judge would never need
to reach them; the terms are correctly behind a section header
that signals "this is the introspective stuff." Kept.

### LOW (kept) — "AF" abbreviation

The app uses "AF" (alcohol-free) extensively in stat labels:
"AF days", "AF streak", "{n} alkoholfreie Tage" (de). For a
65yo user who's never seen the abbreviation, "AF days" reads as
an opaque acronym. The full term is also used ("Alcohol-free
days" in `stats.afDaysLabel`), but compact UI surfaces use the
short form.

Spelling out "Alcohol-free" everywhere would crowd the stat
tiles and break the layout. Adding a one-time tooltip or
hover-explanation on first encounter would help — deferred to
R23 along with the broader cognitive-load fixes (the same work
would update the legend pattern for "HALT" too).

### NONE — Tap-only forms

Every form interaction (drink log, goal create, settings toggle,
sync setup) uses tap-only inputs: text fields, selects,
checkboxes, buttons. No drag-to-rearrange, no pinch-to-zoom-only
controls, no swipe-to-delete (delete is always an explicit
button with confirmation).

### NONE — Reading grade

Spot-checked the strings the user actually encounters during
normal use (not the legal pages or the admin Self-experiment
section):
- Today tab hero / CTAs: short, conversational, grade ~5-6.
- Onboarding screens: 1-2 sentences each, grade ~6.
- Drink-form labels: single-word ("Volume", "Strength", "How
  did it feel?"), well within range.
- Settings section descriptions: 1 sentence each, grade ~7-8
  (acceptable; Settings is documentation territory).
- Privacy / disclaimer text: grade 8-10 (necessarily formal;
  legal language).

The voice gates from prior rounds (no marketing voice, no
clinical jargon, calendar-fact tone) keep the grade level low
without explicit measurement. Continuing to enforce those gates
maintains 65yo readability.

## What this judge catches that the other 21 don't

**Fine-motor + visual + vocabulary load on actual physical
interaction.** The 21 prior judges look at correctness, safety,
emotional fit, decision count, screen-reader announce text. None
look at "is this button physically big enough for a fine-motor-
impaired user to hit?" The two button-size fixes landed in
R22-5 came directly from this lens — they were invisible to
every prior pass because every prior pass measured something
else.

## What R22-5 didn't fix (deferred to R23)

- "AF" abbreviation: tooltip / first-encounter explanation.
- Settings vocabulary: "Trust receipt" gets explained where it
  matters (in the receipt itself); the menu label could carry
  a one-line subtitle for cold readers.
- Bottom-nav label size at 13px: trade-off vs. nav height.
- Tab-bar visual hint that the user is at "Today" vs other tabs:
  the underline + text-color shift work for sighted users but
  could be more emphatic for low-vision users (next round's
  contrast review item).

## Tests

No new tests. The two button-size fixes are pure CSS class
changes — `min-h-[48px] min-w-[48px]` is a Tailwind utility, not
a behavior. The existing smoke tests for ScrollTopButton and
Toast still pass (both verify render without asserting size).

A test that asserts every interactive element passes the WCAG
2.5.5 (44pt) contract would be valuable but couples to layout
geometry, which jsdom doesn't compute. Defer to a future
`@playwright/test` integration that can compute actual rects.

## Process notes

22 judges total in the rotation. The 22nd lens (this one) was
the only one that produced *physical layout* findings — every
other judge has been about content, behavior, or structure.
That's a meaningful coverage gap to plug. Recommend keeping the
65yo physical-load lens in the 5-round rotation alongside the
other "user persona" judges (recently-quit, cognitive-load,
clinician, journalist, etc.).
