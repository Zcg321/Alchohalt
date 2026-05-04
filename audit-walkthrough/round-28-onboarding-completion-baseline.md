# Round-28 — synthetic onboarding completion-rate baseline

[R28-3] Pinned baseline for the regression gate. Compare future
rounds against the numbers below; the test suite enforces the
regression threshold automatically (see
`src/__tests__/onboarding-synthetic-walkthrough.test.ts`).

## Baseline numbers

Measured by `tools/onboarding/synthetic_walkthrough.ts` at HEAD
of round 28. The simulator runs deterministic mulberry32 PRNG
across plausible-action probability tables tuned per beat (see
the module's `ACTION_WEIGHTS_BEAT_*` constants).

### 100-journey funnel @ seed 42

```
journeys=100
completed=57 (57.0%)
skip-by-step=0:35 1:7 2:1
reached-pct=100/65/58
intent-distribution={cut-back: 30, quit: 14, curious: 13, undecided: 5, none: 38}
```

(Exact numbers may shift with seed; the regression gate runs against
the 1000-journey result for stability.)

### 1000-journey funnel @ seeds 42/1/7/100/200

| Seed | Completion % |
|------|--------------|
| 42   | 54.8         |
| 1    | 52.8         |
| 7    | 52.7         |
| 100  | 53.5         |
| 200  | 51.8         |
| **mean** | **53.12** |

**Pinned baseline: 53.0%.** Regression gate: fails if any future
round drops the 1000-journey completion rate by more than **5pp**
(i.e., < 48.0%).

## Dropoff funnel (1000-journey @ seed 42)

```
Beat 0  reached: 100%   skipped here: ~38%
Beat 1  reached: 62%    skipped here: ~7%
Beat 2  reached: 55%    skipped here: ~1%
Completed: 55%
```

The largest dropoff is at beat 0 — the user opens the app, sees
the intent question, and abandons before tapping any chip. This
is consistent with the cognitive-load (R22) judge's call: the
choose-your-intent ask is a real friction point.

Future rounds that change beat-0 friction (e.g., changing the
chip copy, adding a fourth chip, removing the intent question
entirely) should expect the baseline to move. Re-measure in the
same PR if the action-weight tables are re-tuned.

## How to interpret a regression

If `npm test` fails on the synthetic-walkthrough harness:

1. Re-run with `--seed=…` and a few different seeds to confirm
   it's not noise.
2. Run the funnel for 10000 journeys (`runFunnel(10000, seed)`)
   to tighten the confidence interval.
3. If the drop is real, check what the round changed:
   - Did onboarding copy change in a way that would affect
     beat-0 plausibility weights?
   - Did the diagnostic state-machine change shape?
   - Did a new beat get added or removed?
4. If the change is intentional, re-tune the
   `ACTION_WEIGHTS_BEAT_*` constants AND re-pin the baseline
   in the same PR. Document the why in this file.

If the change is unintentional, you found a regression. Roll
back the offending PR.

## Why a synthetic harness, not Playwright

Playwright would walk the actual rendered DOM. The capture
environment in which round-28 was prepared has neither Playwright
installed nor the dev server running (same constraint as the
marketing screenshot capture — see
`public/marketing/screenshots/PENDING_CAPTURE.md`). Rather than
gate the harness on a fragile env, this module models the same
state-machine as `OnboardingFlow.tsx` and exercises it with a
deterministic seeded RNG.

When/if Playwright lands as a baseline dev requirement (R29+),
the simulator can be swapped for a real page driver while keeping
the action vocabulary and probabilities unchanged. The baseline
number stays comparable.

## Files

- `tools/onboarding/synthetic_walkthrough.ts` — the simulator.
- `src/__tests__/onboarding-synthetic-walkthrough.test.ts` — the
  regression gate (12 tests; 1000-journey check enforces ±5pp).
- This document — the human-readable baseline + interpretation
  guide.
