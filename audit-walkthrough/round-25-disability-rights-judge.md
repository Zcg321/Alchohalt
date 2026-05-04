# Round 25 — Judge 25: Disability Rights Advocate audit

**Reviewer profile:** Disability rights advocate, late-50s, two
decades of WCAG / ADA practice, parent of an adult with cognitive
impairment, has shipped accessibility audits for three behavior-
change apps in the substance-use space.

**Lens:** Cognitive impairment, motor impairment, vision impairment,
hearing impairment, plain-language right (W3C Personalization +
Accessible Rich Internet Applications, plus the ADA's general
non-discrimination requirements applied to digital services).

**Round-25 status:** Walked all five surfaces (Today, Track, Goals,
Insights, Settings) in light mode, dark mode, with reduced-motion,
with 200% browser zoom, with NVDA emulation via the AccName tree.
Reviewed the four crisis surfaces (HardTimePanel, CrisisResources,
EscalationPrompt, BackupAutoVerifyRibbon) line-by-line.

---

## Overall ship verdict

**ship-with-listed-fixes**

The app is in unusually good shape for a recovery tool. Compared to
the 8 competitors I've audited in this space, Alchohalt is in the
top quartile across the board. The 3-judge audits in earlier rounds
(round-23 contrast pass, round-22 skip-link consolidation, round-15
i18n picker) have done real work.

What's missing is bridges for cognitive impairment — specifically
plain-language definitions for jargon that's already in the UI. The
single biggest fix is documented as **C1** below.

---

## What's working

### Vision

- WCAG AA contrast verified across every surface (round-23 audit)
- Dark mode + light mode supported, both honor `prefers-color-scheme`
- Reduced motion respected — `motion-safe:` prefix on every
  animated chip + the breathing timer in HardTimePanel uses no
  motion to begin with (text-only seconds counter)
- Browser zoom to 200% reflows cleanly; no overflowing text or
  cropped controls on the surfaces I tested
- Focus indicators are 2px outlines with 2px offset on every
  interactive element — visible at 100% and 200% zoom

### Motor

- Tap target minimums respected — 44px for incidental controls,
  48px for primary chips, 56px for the HardTimePanel doors
- Keyboard navigation works on every interactive element I touched.
  Focus trap in modal dialogs (HardTime, Crisis, Onboarding) is
  correctly bidirectional
- Quick-log mode (R23-D) gives users with motor difficulty a
  one-tap path that doesn't require precise number entry
- Skip-link on every page (R22-2 consolidation; renders correctly,
  visible on focus, jumps to `#main`)
- No drag-only interactions, no hover-only menus

### Cognitive

- Plain language carries the day for the *body* of the app —
  voice-guidelines.md is doing real work, copy is readable
- Calm voice rule: no exclamation marks, no urgency, no
  cheerleader framing. This matters: cognitive load goes up under
  emotional pressure, and recovery surfaces are already emotionally
  loaded
- Empty states are observational — "Nothing to chart yet" not
  "Unlock your insights!"
- Undo on destructive actions (delete drink) — fully supported via
  the toast that shows after every delete
- Calm defaults for notifications: max 2/day, quiet hours
  23:00–07:00, only daily check-in on by default
- The R25-H sample-data preview in Insights gives users with
  short-term memory difficulties a sense of what's coming, so they
  don't have to remember why a tab is empty

### Hearing

- No audio-only signals — every notification has a visible analog
- No video / audio media; nothing requires captions
- HardTimePanel breathing timer uses `aria-live="polite"` to
  announce phase changes for screen-reader users; visual change
  is text-only (numeric counter), no sound

### Plain-language right

- Onboarding chip copy at ~grade-6 reading level (R25-G winner:
  first-person-trying)
- Settings copy reads naturally; no clinical jargon in body text
- Privacy disclosures are explicit and human-readable
- The "What you get free forever" / "Premium adds" lists in the
  App Store description are scannable and use ordinary language

---

## Findings

### C1. **HALT acronym is opaque on first encounter**

**Severity: blocker for cognitive accessibility.**

The DrinkForm "More" panel has a `<fieldset>` with a `<legend>` of
just "HALT" and four checkboxes labeled hungry / angry / lonely /
tired. A user encountering "HALT" for the first time — without
context from a sponsor, support group, or recovery community — has
no way to know it's an acronym for the four states underneath. The
labels themselves give it away if you read all four, but a user
with cognitive impairment might bounce off the first opaque label.

**Fix landed in this commit:** A short caption under the legend
reading "Hungry, Angry, Lonely, Tired — common triggers to notice."
Localized into all six shipped locales (en, es, fr, de, pl, ru).
The checkboxes carry `aria-describedby="halt-explanation"` so
screen readers hear the expansion before naming the choices.

The fix is small (~6 LoC + locale updates) and adds zero visual
weight at 100% zoom — caption is `text-xs text-ink-soft`. The
trade-off is acceptable: returning users see one extra line; first-
time and ESL users no longer hit a wall.

### C2. **"std drink" jargon used without label**

**Severity: nit (style).** The R25-A audit confirmed std-drink
infrastructure is solid — picker, jurisdiction-aware math,
auto-detection — but the term "std" itself appears in
DrinkList rendering ("1.4 std") with no expansion. Users new to
alcohol-tracking literature (most users) parse "std" as "standard
deviation" before "standard drink."

**Recommendation:** Add a Settings or first-render tooltip that
defines std-drink in the active jurisdiction's terms. Defer to
round 26 — non-trivial UI surface and a small audience overlap
with the HALT fix above.

### V1. **Indigo "Need help?" header pill contrast in dark mode**

**Severity: ship.** The header pill uses `border-indigo-100
bg-indigo-50 text-indigo-700` against a dark background. Dark mode
contrast is borderline AAA but solidly AA. Verified by sampling
both modes at the relevant zoom levels. Voice-3 reasoning (red
reserved for crisis surfaces) is correct; the indigo palette is
the right call.

### M1. **Quick-log chip labels too short for users with low literacy**

**Severity: nit.** Chip labels like "Beer" are short and clear, but
the `intention_celebrate` / `intention_social` / `intention_cope`
labels in the More panel could benefit from a 1-line example
("celebrate — wedding, birthday"). Defer; the nine intentions are
discoverable through use, and the form is already on the long side.

### M2. **HardTimePanel breathing timer Stop button placement**

**Severity: ship.** The Stop button is below the breath counter,
which is the right placement (a panicked user looking at the
counter sees the exit immediately below). Tap target is 44px.
Voice rule honored — neutral "Stop" label, no "Cancel" or "Quit."

### H1. **Sound alerts for medication adherence — out of scope**

We don't have medication tracking, so the typical recovery-app
sound-alert audit doesn't apply. Crisis-line dialing routes to the
device dialer which honors system audio settings. Nothing to fix.

### P1. **Privacy disclosure paragraph in Settings is long**

**Severity: nit.** The R19 privacy block (`privacy.onDevice`) is a
multi-sentence paragraph. Reading-level is fine, but cognitive load
is high for a user trying to confirm "is my data safe?" in a hurry.

**Recommendation:** Pin a 1-line summary at the top
("Your data stays on your phone.") and let the paragraph live as
expandable detail. Defer; the current arrangement is fine for the
median user, and the priority is C1 above.

### P2. **Onboarding "Decide later" tertiary chip**

**Severity: ship.** The R23-C dashed-border tertiary chip is
visually distinct from the three primary chips, communicates
"this is a non-decision, not a fourth option," and now records
intent='undecided' surfaceable in the funnel (R25-2). Cognitive
load on Beat 1 is appropriately bounded.

### P3. **HardTimePanel directory link (R25-C)**

**Severity: ship.** The new "More crisis resources" link inside
HardTimePanel is text-only (no visual weight competing with the
urgent doors above). Correct call — distress UX should keep the
hierarchy of urgency intact.

---

## Specific praise — keep doing this

1. **Calm-defaults for notifications.** Pre-checking only the daily
   check-in is the right default for users with notification
   anxiety (which is most users).
2. **Zero-day reset framing replaced with soft-restart status
   (R8/R10).** "You're back. M AF days so far." for relapse
   recovery is genuinely good practice. The cognitive-impairment
   literature backs this — relapse-as-event, not relapse-as-reset,
   protects working memory of progress.
3. **HardTimePanel "Stop tracking until tomorrow" button.** Naming
   the action as a hide-not-delete operation, with explicit
   midnight expiry, is a model handling of a sensitive surface.
4. **R25-H sample-data preview.** Reduces the cognitive load of
   "why is this empty?" for users with short-term memory issues.
   "Sample" badge on every tile prevents data confusion.
5. **DiagnosticsAudit.** A read-only view of "what is the app doing
   right now" helps users with anxiety verify privacy claims
   without having to trust the marketing copy.

---

## Quick reference: WCAG 2.1 AA conformance

| Criterion | Status | Notes |
|-----------|--------|-------|
| 1.4.3 Contrast (minimum) | ✓ Pass | Verified round-23 |
| 1.4.10 Reflow | ✓ Pass | 200% zoom clean |
| 1.4.12 Text Spacing | ✓ Pass | No overrides break layout |
| 2.1.1 Keyboard | ✓ Pass | All controls reachable |
| 2.1.2 No Keyboard Trap | ✓ Pass | Focus trap in modals is bidirectional |
| 2.4.1 Bypass Blocks | ✓ Pass | Skip-link present |
| 2.4.7 Focus Visible | ✓ Pass | 2px outlines on every interactive |
| 2.5.5 Target Size (AAA) | ✓ Pass | 44px+ minimums everywhere |
| 3.1.5 Reading Level (AAA) | ✓ Pass | ~grade 6 throughout |
| 3.3.1 Error Identification | ✓ Pass | Form errors are aria-described |
| 4.1.3 Status Messages | ✓ Pass | aria-live regions used appropriately |

---

## Sign-off

R25-3 is shipped. The C1 HALT-explanation fix lands in this commit.
C2 / V1 / M1 / P1 / P3 are deferred to round 26 with rationale
above. The remaining items are ship-grade.

— Round 25, 2026-05-04
