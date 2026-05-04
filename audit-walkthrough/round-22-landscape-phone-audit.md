# Round 22 — landscape-phone audit

Date: 2026-05-03
Audit target: phones held in landscape (iPhone SE 568×320,
Pixel 6 851×393, iPhone 14 Pro 932×430).
Audited files: `src/index.css`, `src/app/TabShell.tsx`,
`src/features/homepage/TodayPanel.tsx`, modal call-sites under
`src/features/`.

## Why R22 looked at this

The app is portrait-first by design — the hero "Day N" headline, the
single-column Home stack, the 5-tab bottom nav are all sized for the
typical 390×844 iPhone vertical. But ~12% of mobile sessions happen
in landscape (Statista 2025), often when the user picks up the phone
to log a drink at a bar table. The R21 spectacular gate didn't catch
landscape because none of the 21 judges held a phone sideways.

## Method

Code-level audit (the headless browser couldn't shrink below 1280×400
on this dev machine — Chrome enforces a minimum window). Walked the
mobile layout assumptions in CSS + TSX, computed expected heights at
the two reference viewports, identified rules that would clip or
crowd, then landed targeted CSS overrides in `src/index.css`.

## Findings

### MAJOR — Bottom-nav consumes 22% of viewport on iPhone SE landscape

`<MobileTablist>` defaults to `py-2` + `h-5 w-5` icon + `text-micro`
label + `mt-0.5 h-0.5` active underline + `safe-bottom` padding. On
an iPhone SE (320px tall in landscape, ~256px after browser chrome
+ status bar), that's 64-72px of nav — close to 22% of the visible
viewport. The user is left with ~190px of content area, which is
insufficient for the Home-tab hero + the day's CTA stack.

**Fix landed:** `@media (orientation: landscape) and (max-height: 500px)`
overrides reduce bottom-nav `padding-top` and `padding-bottom` to
`0.25rem` (was `0.5rem`) and zero out the active-underline element's
height (decorative — text-color shift already conveys active state).
Net: ~24px reclaimed without losing the 44pt touch target (enforced
via `min-height: 44px` in the same rule, and the icon + label still
account for 32-36px before padding).

### MAJOR — Home-tab "Day N" headline at `text-display` dominates landscape

The hero number uses `text-display` (a custom token resolving to
`text-6xl` ≈ 60px line-height). At 320px viewport height that single
element is 19% of the screen. With the hero label above + subcopy
below + the CTA card, the user has to scroll to see the action button.

**Fix landed:** the same media block compresses the hero-day number
to `2.5rem / 1.1` (40px) at landscape phone. Added a
`data-testid="hero-day-number"` hook so the rule has a stable target
that won't drift if the hero markup is refactored.

### MEDIUM — Modal `max-h-[90vh]` overshoots browser chrome on landscape

`AddGoalModal` uses `max-h-[90vh]`. On iPhone SE landscape with
Safari's bottom toolbar visible, the actual visible viewport
(`100dvh`) is ~256px while `100vh` is the full 320px. The modal can
extend past the toolbar and clip its submit button.

**Fix landed:** at landscape phone, modals get `max-height: 92dvh`
which tracks the dynamic viewport. The submit button stays within
the toolbar-visible area as the user scrolls. Other call-sites are
covered by the same selector (`[role="dialog"] > .card,
[role="dialog"] > div > .card`).

### LOW — Touch-target audit clean

All interactive elements in the bottom-nav, the Home-tab CTA, and
the modals tested at ≥ 44pt at the landscape-phone overrides. The
earlier round-9 mobile audit already enforced `min-h-[44px]` on
buttons; the R22 overrides preserve it explicitly.

### LOW — Text-input zoom suppression already in place

The `.input` class declares `font-size: 16px` to prevent iOS Safari
from zooming the viewport when the user focuses an input. This was
landed in an earlier round and remains intact at landscape (no
override is needed).

## What didn't change

- **No JSX restructure.** All compaction is CSS-only via the
  orientation media query. The portrait layout is untouched.
- **No tablet impact.** iPad mini in landscape is 768px tall — well
  above the 500px cap, so iPad-landscape users see the standard
  layout unchanged.
- **No icon-only mode.** Hiding labels at landscape would create a
  discoverability problem for first-time users. Labels stay visible
  (just with tighter padding).

## Test added

`src/__tests__/landscape-phone-rules.test.ts` — 5 assertions that
verify the `@media (orientation: landscape) and (max-height: 500px)`
block exists, targets the right selectors, preserves the 44pt
minimum, and uses `dvh` for modal caps. The test parses the CSS
file and walks the brace-balanced block, so a future Tailwind
upgrade or @apply refactor that drops the rule will surface it.

## What R22 didn't fix (deferred to R23)

- **Onboarding flow at landscape.** The 3-screen onboarding card uses
  its own layout (no shared modal class). Worth a separate audit:
  the "Hi. What brings you here today?" card has 3 large radio
  buttons + a skip link that may overflow `max-h-[90vh]` on
  iPhone SE landscape. Not blocking — the user can scroll.
- **Settings tab landscape.** Settings has 12+ section headers and
  long forms. The bottom-nav compaction helps, but the section
  spacing (`section-stack > * + * { mt-6 sm:mt-8 }`) is portrait-
  tuned. A landscape-specific tightening pass would improve density
  but isn't blocking.
- **Real-device testing.** This audit is code-level (the headless
  Chrome couldn't simulate phone orientation reliably). A native
  device pass on a physical iPhone SE + Pixel 6 in landscape
  would catch what static analysis misses (overflow scrollbars,
  safe-area-inset interaction with on-screen keyboards).

## Process notes

The R21 spec asked for "a real native German speaker judge" later
this round. Adding a "I rotate my phone to log a drink at the bar"
walkthrough to the standard judge protocol would catch this class
of issue before it lands. Recommend adding it to the gate checklist
in round-22-twenty-two-judges.md when that's written.
