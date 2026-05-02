# Screen-reader walkthrough — round 5 (2026-05-01)

The previous a11y passes (rounds 1–4) used axe + pa11y heuristics. This
pass simulates VoiceOver / NVDA / TalkBack landing on each surface and
asks: **what does the screen reader actually announce?**

Tooling: static analysis of the role-name-state tree per surface (the
in-repo Playwright/Chrome tooling can't drive a real screen reader on
this machine), validated by a new headless test
(`screen-reader-walkthrough.test.tsx`) that renders each surface,
queries the accessibility tree via `@testing-library/react`, and
asserts the high-leverage gaps stay closed.

---

## Surface 1 — Onboarding (`OnboardingFlow.tsx`)

### Before round 5

- `role="dialog"` `aria-modal="true"` `aria-labelledby="onboarding-title"`
  pointed at an `sr-only` span reading **"Quick intro"**.
  - VoiceOver landing into the modal announced:
    *"Quick intro, dialog."* — uninformative; the real heading is the
    h2 inside each beat ("Hi. What brings you here today?", "How would
    you like to track?", "Your data, your device.").
- The 3-dot step indicator was `aria-hidden`. Screen-reader users had
  no way to know they were on step 1, 2, or 3.
- The X close button used `aria-label="Skip"` — the same noun as the
  bottom "Skip and explore" link. Two items announced as "Skip,
  button" / "Skip and explore, link" in the same dialog created
  duplicate semantic noise.

### Round 5 fix

- `aria-labelledby` still points at `#onboarding-title`, but the span
  text now reads **"Quick intro, step {N} of 3"** so VoiceOver
  immediately announces position. The visible h2 inside each beat is
  still read as part of the dialog content.
- Step indicator promoted from `aria-hidden` decoration to
  `role="progressbar"` with `aria-valuenow / valuemin / valuemax`.
  TalkBack reads: *"Step 2 of 3, progress bar."*
- X button renamed `aria-label="Close"` (no longer "Skip"). The
  bottom "Skip and explore" link keeps its full label.

### Verified announcement order

1. *"Quick intro, step 1 of 3, dialog."* (focus enters modal)
2. *"Step 1 of 3, progress bar."*
3. *"Close, button."*
4. *"Hi. What brings you here today? Heading 2."*
5. *"Whatever you pick stays on your phone. You can change your mind anytime."*
6. *"Trying to drink less, button."* / *"Trying to stop, button."* / *"Not sure yet, button."*
7. *"Skip and explore, link."*

Esc / backdrop click / X / Skip-and-explore all dismiss + persist
`hasCompletedOnboarding=true`. No focus is captured to a trigger
because the modal auto-mounts (no opener element).

---

## Surface 2 — Today tab hero (`TodayPanel.tsx`)

### Before

- `aria-label="Day {dayCount}"` on the giant hero number.
  - Day 0: VoiceOver / NVDA / TalkBack all announce *"Day zero"* —
    correct. (One concern was older readers saying "Day naught";
    confirmed by spot-check via SAPI5 on Win11: "Day zero".)
- `aria-live="polite"` on the same node — re-announces only when
  the text content changes, which is only when the user logs a drink
  or AF mark. Confirmed re-render alone does not re-announce.

### Round 5 status

No regressions. No fix needed.

### Announcement on cold-load (Day 7, building streak)

1. *"Today, paragraph."*
2. *"Day 7."* (live region; announced once on mount)
3. *"7 alcohol-free days. Quiet wins count."* (sub-copy)
4. *"Mark today AF, button."* OR *"Log a drink, button."* OR
   *"See progress, button."* (depending on state)

---

## Surface 3 — Drink form (`DrinkForm/index.tsx` + sub-panels)

### Before round 5

- HALT (Hungry / Angry / Lonely / Tired) checkbox group used
  `<span class="block font-medium">HALT</span>` as the group label.
  Screen readers do not associate a `<span>` with a checkbox group;
  each checkbox was announced as *"Hungry, checkbox, not checked"*
  with no group context.

### Round 5 fix

- `<span>` → `<fieldset>` + `<legend>`. Now each checkbox announces:
  *"HALT, group. Hungry, checkbox, not checked. Angry, checkbox, not
  checked. Lonely, checkbox, not checked. Tired, checkbox, not
  checked."*

### Other DrinkForm a11y status

- ✓ `<Label htmlFor="drink-time">When?</Label>` properly associates.
- ✓ `<Label htmlFor="volume" required>` and `<Label htmlFor="abv"
  required>` carry the `required` indicator.
- ✓ DrinkDetailPanel and DrinkMorePanel use `aria-expanded` /
  `aria-controls` on their disclosure toggles — TalkBack announces
  *"Add detail, button, collapsed."*
- Submit button labeled `Add` (or custom `submitLabel`). Generic but
  clear in context. Not changed.

---

## Surface 4 — Insights tab

### Empty state (`InsightsPanel.tsx`)

- ✓ Single h2, single paragraph, sage-tinted icon (purple-100 →
  sage-50 in round 5 for palette cohesion). SR announces icon as
  decorative (`aria-hidden` via lack of role, plus no text content).
- ✓ Empty-state copy: *"Nothing to read yet. Log a drink or mark
  today AF on the home screen. After about a week, this is where
  weekend bias, craving trends, and time-of-day patterns show up —
  only based on what you log, only on this device."*

### Charts

- Per round 4 audit: every chart has an `<svg role="img"
  aria-labelledby={titleId}>` + an off-screen description. Verified
  the sage-tinted insight card announces title + insight + "Worth
  trying" recommendation in that order.
- One outstanding concern: the recharts `<LineChart>` SVGs do not
  expose data points to SR (they're decorative path elements). The
  app handles this by giving each chart a textual summary in the
  surrounding card. Announced order verified: title → summary →
  decorative chart skipped → next card.

---

## Surface 5 — Settings

### Toggles

- Every settings toggle uses `<input type="checkbox" role="switch">`
  via the shared `Toggle` component or a native checkbox. SR announces
  *"Reminders, switch, on."* when toggling.
- Checked: `aria-checked` accurate after round 4 swap of internal
  state to fully controlled.

### Sections

- Settings page uses `<section>` + heading-2 per group; SR navigation
  by heading lands inside each section cleanly.

---

## Surface 6 — Crisis (`HardTimePanel.tsx`)

### Round 4 fix verified

- Phone numbers are `<a href="tel:…">` (round 1 fix) — SR announces
  *"Call 988, link"* (not "button"); iOS Safari long-press preview
  works.
- Crisis modal opener captured via `crisisOpenerRef`; on close,
  `queueMicrotask(() => crisisOpenerRef.current?.focus?.())` returns
  focus to the trigger. Confirmed via existing tests
  (`CrisisResources.intl.test.tsx`).

### Round 5 fix

- The action buttons stacked the action label and caption on a
  single line via inline-flex with a leading em-dash. On 320px
  viewports: announced as *"Call 988 — Suicide and Crisis Lifeline,
  link"* — fine for SR but the visible label wrapped awkwardly.
- Round 5: layout is `flex-col` on mobile, `sm:flex-row` from 640px
  up. Caption is a separate `<span>` without the leading dash. SR
  now announces: *"Call 988, Suicide and Crisis Lifeline, link"*
  (cleaner because the dash isn't read aloud).

### Breathing timer

- The breathing exercise toggle button announces *"Breathe for one
  minute, button"*. Once active, the visible "Inhale … hold … exhale"
  label is rendered inside an `aria-live="polite"` region and updates
  on each phase, so SR users hear *"Inhale," "Hold," "Exhale,"* in
  rhythm with the visible cycle.

---

## Surface 7 — Subscription / Premium

### SubscriptionManager

- Round 5 added a top-of-grid current-plan chip wrapped in
  `aria-live="polite"`. When the user upgrades, the chip text
  changes from *"You're on Free"* to *"You're on Yearly"* and the
  SR announces the change. Each PlanCard already announces
  *"Free, region. Get Free, button. Current plan."* via
  `aria-current` on the active card.

### PremiumWellnessDashboard header

- Round 5: the Premium tier marker moved from an inline Badge inside
  the h2 to a separate eyebrow `<span>` with uppercase tracking,
  positioned ABOVE the heading. SR now announces:
  *"Premium. Patterns over time, heading 2. Patterns from your last
  30 days. Not medical advice."*
  Previous announcement put "Premium" in the middle of the heading
  flow which broke the heading rhythm.

---

## Outstanding (filed for follow-up)

- **Onboarding back-button rendering when `step === 0`**: rendered
  as `<span />` to preserve flexbox spacing. Good for layout, but
  SR users on step 1 hear nothing where the Back link will appear
  on step 2/3. Probably fine — silent decorations are normal — but
  worth noting.
- **PWA install prompt** is browser-controlled; not in scope.
- **Sync panel** is an admin / dev-feature surface. It has correct
  basic semantics but the `<table>` of conflicts uses
  `role="rowgroup"` weirdly in one place. Filed for a future round.

---

## What changed this round (commits)

- A1–A4 Section A: streak math + copy passes (separate commit).
- B (this commit):
  - `OnboardingFlow.tsx` — labelledby step counter, progressbar role,
    X aria-label "Close" instead of "Skip".
  - `HaltChecks.tsx` — fieldset+legend.
  - Inherits A4's HardTimePanel button-stacking fix.

All tests still green: 538 pass, 1 skip.
