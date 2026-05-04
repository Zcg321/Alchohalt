# Round 22 — Real screen-reader walkthrough (NVDA-emulation)

Date: 2026-05-03
Tooling: live page in Chrome at the dev server, JS-driven
accessibility-tree extraction (compute the accessible name + role
for each focusable element the way an AT computes it), heading-tree
shape, live-region count, image-alt audit, SVG-in-button audit.

NVDA wasn't available in this dev environment. The protocol here
emulates an AT user's "what does the screen reader announce?"
question by computing the accessible name + role per WAI-ARIA rules
and walking the tree; it doesn't replace a real NVDA / VoiceOver /
TalkBack pass on a physical device, but it catches the structural
issues a real screen reader would.

## Method

1. Loaded the app in Chrome, dismissed onboarding.
2. For each tab (Today, Settings) extracted every focusable element
   and computed its accessible name via the AccName algorithm
   shortcut: `aria-label` → `aria-labelledby` → text content. (The
   parent-`<label>` association is implicit per HTML5; the script
   undercounts named inputs by missing this — see false-positive
   note below.)
3. Counted heading levels, images-without-alt, live regions,
   button-SVGs without `aria-hidden`.

## Findings

### MAJOR — Duplicate skip-to-content links

`main.tsx:150` rendered `<A11ySkipLink />` (text: "Skip to content",
i18n via `t('skipToContent')`).

`AlcoholCoachApp.tsx:220` rendered an inline
`<a href="#main">Skip to main content</a>`.

Both pointed at `#main`. Both were visually-hidden (`.sr-only` /
`.skip-link`) and revealed on focus. A screen-reader user pressing
Tab on page load heard:
> "Skip to content, link" → "Skip to main content, link"

Two distinct skip targets that go to the same anchor. The user
either tabs past one (to the wrong-feeling label) or activates
either. Confusing — and the second link advertised the old text the
i18n component had already replaced.

**Fix landed:**
- Removed the inline `<a>` from `AlcoholCoachApp.tsx`.
- Moved `<A11ySkipLink />` from `main.tsx` into `AlcoholCoachApp.tsx`
  so it co-locates with the app render path. Tests render the app
  without booting `main.tsx` and still cover the skip-link.
- Updated `skip-link.test.tsx`: assert "Skip to content" (the
  i18n'd canonical text), and assert there is exactly **one**
  link to `#main` (regression guard for the duplicate returning).

### NONE — Tab/tabpanel naming is correct

The `[role="tab"]` and `[role="tabpanel"]` elements both expose
"Today" / "Track" / "Goals" / "Insights" / "Settings" as their
accessible names. The tabpanel name matches its tab via the
`aria-labelledby` wiring — that's the WAI-ARIA pattern, not
redundancy.

The dual rendering (`DesktopTablist` + `MobileTablist` both in DOM,
toggled by Tailwind `hidden lg:block` / `lg:hidden`) is fine for
production: at any viewport one of them is `display: none`, which
removes it from the AT tree per W3C spec. (Dev-mode JIT Tailwind
showed both as `display: block` in some tests, but the prod CSS
generates `.lg\:hidden{display:none}` correctly — verified in
`dist/assets/index-*.css`. Filed as a R23 finding to investigate
why dev-mode JIT didn't apply the rule to the existing element.)

### NONE — No unnamed inputs after parent-label association

The initial scan flagged 5 inputs with `<NO NAME>`:
1. Settings `Enable daily reminders` checkbox
2. ExportImport `Limit to a date range` checkbox
3. CrashReportsToggle checkbox
4. Two hidden file inputs (one Drink Form, one Settings backup)

All five are wrapped in `<label>` with sibling `<span>` text. The
HTML5 implicit-label-association rule gives them accessible names
via the surrounding label. NVDA / JAWS / VoiceOver all honor this.
The script's name() helper missed it (it only checked for
`aria-label` / `aria-labelledby` / `<label for=>` / placeholder).
The hidden file inputs are AT-skipped by virtue of being clicked
through visible buttons — fine.

### NONE — Heading hierarchy clean

37 headings on the Settings tab, levels 1-3 only. No skips, no
heading-level inversions. This was already covered by
`heading-hierarchy.test.tsx` from a prior round; R22-2 confirms
the live page matches the test expectation.

### NONE — Image alt + button-SVG profile clean

- 0 `<img>` tags on the audited pages — all visual elements are
  inline SVG.
- 0 `<button> <svg>` pairs without `aria-hidden` on the SVG. Every
  icon button has its accessible name on the button itself.
- 2 `aria-live="polite"` regions on Settings (status indicators).
  Polite is appropriate — neither is an alert.

### LOW (kept) — Dev-mode JIT Tailwind missed `lg:hidden`

The investigation surfaced a dev-mode-only quirk: when I created a
synthetic `<div class="lg:hidden">` at runtime in dev mode, the
computed display was `block` (not `none`). The class wasn't in the
HMR-injected stylesheet at that moment. Production build output
includes the rule. Not a user-facing bug — but worth filing as
R23-DEV: investigate whether Vite + Tailwind JIT misses
class-selector generation for elements added at runtime, since
that could mask AT issues during a11y testing.

## What this judge catches that the other 21 don't

The "what does the screen reader actually announce?" pass — most
prior judges (axe, Lighthouse, A11Y-1 contract) check that names
and roles **exist**. R22-2 walks the AT tree the same way an AT
user does: tab, tab, tab, listening to the announcement. The
duplicate skip-link finding is the kind of thing that's invisible
to "every input has a name" axe rules but loud to a real user
because they hear the same idea twice.

## What R22-2 didn't fix (deferred to R23)

- **Real NVDA + JAWS + VoiceOver pass on a physical device.** The
  JS-emulated AT walk catches structural issues but misses
  pronunciation problems (does the screen reader read "AF" as
  "ay-eff" or as "ahf"?), focus-order discrepancies between
  rendered DOM order and visual order, and announcement timing
  (rapid-fire toast updates can clobber each other in `polite`
  live regions). A physical-device pass is the next step.
- **Track tab + Goals tab + Insights tab walks.** R22-2 audited
  Today and Settings (the two highest-traffic tabs). The other
  three need the same scan; expected to be clean based on the
  consistent pattern (every interactive element comes from
  `Button` / `IconButton` / `FormField` which already enforce
  naming), but not verified.
- **Dev-mode JIT investigation.** Filed as R23-DEV.

## Tests added

`src/app/__tests__/skip-link.test.tsx`:
- Updated existing assertion to match the new canonical text
  ("Skip to content").
- New assertion: exactly one link to `#main` exists. This is the
  regression guard for the duplicate returning.

Net: tests +1 (1 → 2 in this file).

## Process notes

The R5 + R17 + R19 + R21 a11y rounds each found different classes
of issue (axe / Lighthouse / partial screen-reader / aria-live).
R22-2 added the AccName-walking lens. Recommend rotating these
lenses across rounds rather than running all every round —
diminishing returns on each individual lens once it's been clean
for 2+ rounds. The R23 deferral list above is a starting point.
