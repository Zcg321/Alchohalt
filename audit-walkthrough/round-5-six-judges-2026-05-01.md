# Round 5 — six-judge refresh (2026-05-01)

Refresh of the round-4 6-judge gate. Each judge focuses on one
specific theme this time per scope C.

## 1. Linear designer — motion polish

### What was found

- A `bounce-in` animation class with `cubic-bezier(0.68, -0.55, 0.265,
  1.55)` (overshoot bounce) was defined but never used. Dead CSS, and
  the overshoot easing reads as toy-y and inconsistent with the rest
  of the app, which uses smooth ease-out and Material-style
  `cubic-bezier(0.4, 0, 0.2, 1)` for slides.
- Easing curves overall: ease-out for hover/focus state, the Material
  curve for slide-up / slide-down. Toggle component uses
  `ease-in-out`. All three are visually subtle; consistent enough to
  read as one motion language. No-change for now.
- Durations all fall in 150–500ms; no rogue 800ms or 100ms outliers.
- Reduced-motion `@media` block correctly nukes everything to 0.01ms
  + zeros out animation on the named classes. Verified.

### Round 5 fix

Removed the dead `bounce-in` class + `bounceIn` keyframe + its
reduced-motion override. -22 lines of dead CSS. No visual change
because it wasn't used.

## 2. NYT writer — sentence-level scrutiny

### What was found

A copy-editor pass on the major insight rationales. Most strings
already passed (sentence case, present tense, no marketing voice,
no jargon). Two phrasings tightened:

- "Your weekend numbers run higher than weekdays" → "Your weekend
  totals run higher than weekday totals." ("numbers" was vague;
  "totals" matches the app's vocabulary.) "Worth picking" was
  conversational filler; replaced with a direct "Pick…"
- (Other rewrites already landed in section A2/A3.)

Strings sampled and approved by the NYT pass:
- "Past the first week. The hardest stretch is usually behind you now."
- "When the urge ties to a feeling, the feeling often passes faster
  than the urge."
- "When the anger's loud, anything physical helps — a walk,
  push-ups, even just stepping outside."

These survive as written.

### Round 5 fix

One string in `SmartRecommendations.tsx` sharpened.

## 3. Stripe frontend — error boundaries

### What was found

- ✓ Top-level `<ErrorBoundary>` wraps the app in `main.tsx`.
- ✓ Per-tile `<ErrorBoundary isolate>` wraps the Insights mood
  patterns tile and the home Mood check-in tile (round 4 work).
- ✓ Custom `fallback` prop, `reset()` button, support-link mailto
  fallback. Privacy-respecting: the fallback discloses no PII.
- ✗ No global `window.unhandledrejection` / `window.onerror` handler.
  Async errors in event handlers and unhandled promise rejections
  go silently to the console in production. Users see nothing.

### Round 5 status

Filed for Section E ("Sentry / error reporting — write a no-op shim
that the native build can flip on"). The boundaries themselves are
solid; the gap is global handlers.

## 4. Recovery counselor — clinically defensible?

### What was found

- ✓ "Not medical advice" disclaimer surfaces on Today, Insights/
  Rewards, Crisis page, PremiumWellnessDashboard. Verified all four.
- ✓ No diagnostic language (no "you have / you are / you should").
  Recommendations are "try X" / "consider X" / "X often helps."
- ✓ The HALT model is named (Hungry, Angry, Lonely, Tired) but never
  presented as a clinical assessment — just as four optional checks.
- ✓ Crisis page links to professional services; doesn't substitute
  for them. "Alchohalt is not a substitute for professional medical,
  mental health, or addiction treatment." sits at the foot.
- ✓ AI insights are off by default and gated by a consent screen
  that names the cloud provider explicitly.
- ✓ The "ten-minute wait" practice is described as "often helps,"
  not "is proven to" — accurate and defensible. (Backed by general
  CBT literature on craving urge-surfing; phrased without pretending
  clinical evidence we don't cite.)

### Round 5 status

No regressions. No fix needed.

## 5. Friday-night-having-a-hard-time — 2 taps to crisis

### What was found

- ✓ AppHeader carries a persistent crisis chip on every tab. Tap 1
  = chip, tap 2 = "Call 988" link. Confirmed via the existing
  `CrisisResources.intl.test.tsx`.
- ✓ The `/crisis` deep-link works from any URL bar.
- ✗ PWA manifest had three shortcuts (Quick log, History, AF
  Streak) — none for crisis. From the PWA home-screen icon, the
  user could not get to crisis support without opening the app and
  navigating.

### Round 5 fix

Added a "Right now" shortcut to `manifest.webmanifest`, ordered
FIRST in the shortcuts array. PWA-installed users get a long-press
home-screen menu where the first item lands them directly on the
crisis page. Lock-screen integration would require native widgets
which are out of scope for this PWA build, but documented as a
follow-up for the App Store / Play Store native build.

## 6. ESL judge — reading-grade ≤ 6

### What was found

Round 4 left two idioms behind: "buying ten minutes" and "track
with lighter sleep." Round 5 swept them. Found one more in
`premiumInsights.ts` ("Cravings track with bigger nights" + the
ten-minute rule parenthetical) — same rewrite pattern.

Sample reading-grade pulls (Flesch-Kincaid via spot-check):
- TodayPanel hero copy: ≤ 5
- Crisis dialog: ≤ 4
- Onboarding Beat 1 question: ≤ 5
- Insights empty state: ≤ 6
- PremiumWellnessDashboard "Patterns over time" intro: ≤ 6
- Subscription footer (legal): ≤ 8 — acceptable in legal context.

### Round 5 fix

`premiumInsights.ts` rewritten ("Cravings track with…" → "Stronger
cravings, bigger nights" with the explainer rephrased). All other
voice rewrites landed in A2/A3.

---

## Summary

| Judge | Findings | Round 5 fix |
|---|---|---|
| Linear designer | Dead bouncy CSS class | Deleted; -22 lines |
| NYT writer | Vague "numbers" + filler "Worth" | Tightened |
| Stripe frontend | No global error handlers | Filed for Section E |
| Recovery counselor | Clean | No-op |
| Friday-night | No PWA shortcut to crisis | Added "Right now" shortcut |
| ESL | Idioms + one in premiumInsights | Rewrote |

Net code/CSS delta: small. Net surface improvement: meaningful — a
PWA-installed user with a hard-time moment now gets crisis support
in one tap from the home screen.
