# Round 25 — R25-G: Onboarding intent A/B winner pinned

**Date:** 2026-05-04
**Experiment key:** `onboarding-chip-copy-2026Q2`
**Status change:** active → archived
**Winner:** `first-person-trying`
**Round:** 25

## Background

R15-B activated the first on-device A/B test in this codebase: chip-
copy variants on Beat 1 of onboarding ("Hi. What brings you here
today?"). The test was widened to 3 arms by R16-A after the designer-
judge in the 15-judge gate flagged the original first-person variant
as overly declarative.

The three arms:

| Variant | cut-back | quit | curious |
|---|---|---|---|
| `control` | "Trying to drink less" | "Trying to stop" | "Not sure yet" |
| `first-person` | "I want to drink less" | "I'm stopping for now" | "I'm here to learn" |
| `first-person-trying` | "I'm trying to drink less" | "I'm pausing alcohol for now" | "I'm just looking around" |

Telemetry posture: per the R14-4 contract, exposure data lives only on
the device. There is no aggregate view of which variant performed
better. R25-G picks the winner the same way every other voice
decision in this app gets made — by the principles in
`audit-walkthrough/voice-guidelines.md`.

## Decision: ship `first-person-trying` for everyone

### Voice rationale

Three principles drove the choice:

**1. Observation over declaration.** The voice guidelines repeatedly
favor describing what is happening over claiming what someone is.
"I want to drink less" is a declaration of intent that the chip-tap
ratifies; "I'm trying to drink less" describes a present attempt. The
declaration version creates commitment-anxiety on first contact;
the trying version names a process the user can step into and out of
without abandoning anything.

**2. Owned, not third-person.** Between control and first-person-trying
the difference is who's the implicit subject. Control reads as
neutral observation ("Trying to drink less" — *is what?*). First-
person-trying anchors it: the user is the one trying. For a sobriety
tool this matters — the work is yours, the app is the surface.

**3. No commitment-anxiety on the first screen.** A user opening the
app for the first time, possibly hung over, possibly afraid, must
not feel they're signing a pledge. "I'm trying to" includes the
implicit "and it's ok if I don't get it right." The control's bare
gerund is colder; the first-person variant's "I want" makes it a
goal rather than a current attempt.

### Why not the other two

- **Control** wasn't bad — it's been in the build since the
  conversational-onboarding rewrite — but it's the least personal of
  the three. The chips read like form labels rather than answers a
  user is giving in their own voice. For a recovery surface where
  ownership is part of the work, that's a slight loss.

- **First-person** declarative tested a hypothesis that came from a
  product instinct: "users will pick a chip that sounds like a
  commitment." The R16-A judge correctly flagged this as inverting
  the voice rule. Even if it converted at a higher rate, the cost is
  a tone the rest of the app doesn't keep — the disconnect would
  show up on Day 2.

### What we're keeping

- The intent codes (`cut-back`, `quit`, `curious`, `undecided`) are
  unchanged. Storage is stable across the copy revision.
- Existing exposure history in `localStorage.exp.exposures` is
  preserved for audit purposes. New buckets are not assigned because
  the experiment is now archived.
- The `useExperiment` hook and the registry infrastructure stay
  intact for future tests. R25-G removes only the dead code in
  `OnboardingFlow.tsx` and `IntentRevisionModal.tsx` — the
  experiment plumbing remains.

## Code changes

### `src/features/onboarding/OnboardingFlow.tsx`

- Removed `CHIP_LABELS_CONTROL`, `CHIP_LABELS_FIRST_PERSON`,
  `chipLabelFor`. Single `CHIP_LABELS` table with the winning labels.
- Removed `useExperiment` import + call. `data-variant` attribute is
  hardcoded to `"first-person-trying"` so the existing markup
  contract is preserved.
- Removed the `chipVariant` prop from `BeatOne`.

### `src/features/onboarding/IntentRevisionModal.tsx`

- Updated the three intent labels to match the winner. The revision
  modal is the only other place in the app where these labels render.

### `src/features/experiments/registry.ts`

- `onboarding-chip-copy-2026Q2`: `status: 'active'` → `'archived'`.
- Description updated to record the winner + rationale.
- Variants list left intact for historical exposure-log replay.

### `src/features/onboarding/__tests__/OnboardingFlow.experiment.test.tsx`

- Replaced the 3-variant assertion suite with a pinned-winner suite
  that documents the new ground truth: regardless of bucket, every
  user sees the first-person-trying labels.

## Sign-off

R25-G is shipped. The onboarding chip copy is now stable across
every install. If a future experiment wants to retest, it should
register a NEW key (`onboarding-chip-copy-2026Q3` for example) so
the historical assignments don't carry.

— Round 25 audit, 2026-05-04
