# AI Recommendations — flag flip + opt-out + proxy walkthrough (2026-05-01, R7-A4)

## What changed

- `FEATURE_FLAGS.ENABLE_AI_RECOMMENDATIONS` flipped from `false` (default
  off, opt-in via env var) to `true` (default on, opt-out via env var
  `VITE_ENABLE_AI_RECOMMENDATIONS=false`).
- New runtime resolver `isAIRecommendationsEnabled(optOut?: boolean)`
  in `src/config/features.ts`. Precedence: localStorage QA override →
  user opt-out → build default.
- New Settings toggle: AISettingsPanel now has a second sub-section
  "Local AI suggestions" with a switch that writes
  `db.settings.aiRecommendationsOptOut`.
- `GoalRecommendations` now mounts on the Goals tab, between "Daily
  limit & weekly goal" and "Advanced goals".
- `generateGoalRecommendations` no longer reads the build flag — the
  surface gates the call. The data layer is unconditional so direct
  invocations (export bundles, future surfaces, tests) work without
  toggling the global flag.
- Pluralization fix: drink-free-days rec now says "1 alcohol-free
  day" instead of "1 alcohol-free days" — surfaced by the Playwright
  proxy walkthrough on the day30 fixture.

## Why now

Round-7 §A4's bar:
1. **Regex audit** of the rendered text against medical-claim patterns
   (diagnosis, cure, treatment, "heal your liver", clinical, etc.).
2. **Different output for different input** — the engine must be
   data-driven, not random.

Both pass:

| Check | Where |
|---|---|
| Regex audit, all 4 fixture states | `src/lib/__tests__/ai-recommendations.audit.test.ts` (4 tests, 12 patterns each) |
| Cross-fixture uniqueness | same file, "is data-driven, not random" suite (2 tests) |
| Determinism for the same input | same suite |
| End-to-end DOM regex audit | `e2e/personas/ai-recommendations.spec.ts` (5 fixture states + uniqueness check, 6 Playwright tests) |

24/24 (vitest 6 + Playwright 6 = 12 new tests, all green; 624 → 630
total project tests).

## Why opt-out, not opt-in

The Round-7 prompt says: "If both pass, flip the flag in a
sovereign-locked override entry — but keep an opt-out toggle in
Settings."

The privacy contract for this feature is unusually strong:
- **No network calls.** Heuristic pattern math runs on device. No
  fetch, no telemetry, no LLM round-trip. Audit-grep-confirmed:
  `src/lib/ai-recommendations.ts` imports `Entry`, `Settings`,
  `HealthMetric` types and `computeStats`. That's it.
- **No PII surfaces.** Recommendations summarize the user's *own*
  data back to them; nothing flows out.
- **The user can disable it in two clicks.** AISettingsPanel sub-section
  with a switch.

Given those, opt-out is the right default. Opt-in would mean most
users never see the feature, which contradicts the rationale for
building it. The QA-override (`localStorage('alchohalt:ai-
recommendations-override')`) lets us proxy-test the on-state on
desktop without a rebuild.

## How to verify locally

```bash
# Unit-level audit (fast, no browser):
npx vitest run src/lib/__tests__/ai-recommendations.audit.test.ts

# Playwright proxy (renders 5 fixture states, screenshots, regex-audits
# the actual DOM, asserts cross-persona uniqueness):
npx playwright test e2e/personas/ai-recommendations.spec.ts

# Manual: open dev server, set the override, reload, walk to Goals tab:
#   localStorage.setItem('alchohalt:ai-recommendations-override', 'true')
# Or set the user opt-out via Settings → AI Insights → Local AI
# suggestions toggle.
```

## What this does NOT solve

- **Mobile rendering.** The proxy walkthrough is desktop-Chromium only.
  A real iOS / Android pass would require running the spec in mobile
  viewports — sequenced as a follow-up.
- **Long-tail copy review.** The regex audit covers the patterns
  Round-7 named. Subjective copy review (voice, reading-grade, tone)
  is §D's job.
- **Recommendation quality.** "Different output for different input"
  is necessary but not sufficient — a recommendation can be unique
  AND wrong. R6's 18 deep tests + R7's 6 audit tests don't measure
  whether the suggestions are actually *useful*. That requires real
  user testing, which we don't have access to.

## Sovereign lock

This decision is locked in three places so a future change has to
deliberately step over the lock:

1. The build default in `src/config/features.ts` (commented with
   "[R7-A4] Default-on as of 2026-05-02 …").
2. This audit doc (referenced from the decision-record index).
3. The opt-out toggle wired to `db.settings.aiRecommendationsOptOut`
   — removing the toggle without replacing it would silently strip
   user control, which the privacy contract above explicitly grants.

If a future round wants to flip back to opt-in, the rationale needs
to be explicit (e.g. an LLM dependency was added, or a privacy
regression was found). Don't roll it back as a quiet copy/feature
sweep.
