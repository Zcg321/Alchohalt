# Round 18 — Final QA pass: ready-to-ship walkthrough

**Author:** Cowork Sprint
**Date:** 2026-05-03
**Scope:** R18-4. Walk every surface as a brand-new user with 18 rounds
of work behind it. Find anything that doesn't fit. Document what's left.

## Verdict

**Ready to ship as v1.0.** After 18 rounds the app holds together as a
coherent product with one calm voice, six locales (en/es/fr/de/pl/ru),
defensible privacy posture, no analytics, no leaderboards, no
gamification — and the technical foundation (1440 tests, 0 errors, +0.07%
bundle growth across this round) to support a maintained release.

The only items the audit surfaces are minor polish — flagged below as
"won't ship in v1, ticket for v1.x".

## Walkthrough — first-launch user

### App load → Today panel
- Day-N hero renders (Day 0 for new users with calm "Today is a fresh
  start" framing). ✓ R12 calm-voice baseline holds.
- Disclaimer footer present, not pathologizing. ✓
- Idle prefetch warms next-tab chunks. ✓ R18-A useIdlePrefetch hook
  cleanly extracted.
- "Having a hard time?" pill discoverable but not pushy. ✓ R10 voice.
- Quiet mode visibly different (Resting until midnight). ✓ R4.

### Onboarding (re-runnable from Settings)
- Welcome → Privacy → Tracking → Insights → Goals → Ready: 6 steps. ✓
- Each card matches calm voice in EN; **fr/de now match calm voice
  after R18-3 fixes**. ✓
- Skip button always available; skip-path tracked locally only. ✓ R9.
- Onboarding-skip re-entry banner offers gentle re-entry. ✓ R17-4.
- Replay-onboarding from Settings → re-runs flow. ✓ R16-4.

### Crisis surface
- Always reachable from header pill. ✓
- 988, SAMHSA, Trevor Project listed with descriptions. ✓
- Free badge on free providers. ✓
- 3+ opens in 24h surfaces EscalationPrompt with counselor list. ✓
  R10-4 voice ("this option exists if it would help"). ✓ R18-B
  pluralized "X time/times" correctly across locales.

### Track / Drink history
- Drink list with bulk-select + bulk-edit. ✓ R3.
- Search + advanced filter (date range, std-drink range). ✓ R15-1.
- "X of Y entry/entries match" — R18-B locale-aware plurals. ✓
- Bulk announce screen-reader strings still hardcoded English (deferred
  in R18-B; v1.x ticket).

### Insights
- Mood IQ multi-step. ✓
- Tag patterns card with tappable tags + tag explorer. ✓ R14-3 / R15-A.
- Peak-hour insight (R14-5 factual voice) with R18-B plurals. ✓
- Smart Recommendations ribbon. ✓
- Long-term activity ribbon (30d+) and FirstMonthRibbon (under-30d)
  mutual-exclusive by phase. ✓ R12-A / R14-1.
- LoggingTenure surface (1y, 2y, 5y milestones). ✓ R17-1.
- All time-period strings now pluralize correctly across all 6 locales.

### Goals
- Templates: 30-day clean, cut-to-7, dry weekdays, dry-til-Thursday,
  half-my-usual, 90-day reset. ✓ R7.
- Custom builder. ✓
- Goal evolution prompt at threshold ("you've outgrown this goal"). ✓
  R14-2.
- AdvancedGoals model with isActive flag. ✓

### Settings
- Plan & Billing surfaces SubscriptionManager (paywall with $4.99/$24.99/
  $69 tiers). ✓ R5 BUG-PAYWALL-MOUNT regression test still green.
- Privacy heading groups three controls into one decision surface. ✓
- Reset preferences (R17-3): per-category checklist. ✓
- Replay onboarding button. ✓
- Language picker now offers en/es/fr/de/**pl/ru**. ✓ R18-1 / R18-2.
- Std-drink jurisdiction picker. ✓ R14-6 / R15-C.

### Diagnostics
- Onboarding state, intent history, jurisdiction callout. ✓
- A/B exposure surfacing. ✓ R17-B.
- Prior answers history (now uses R18-B locale-aware plural for "X prior
  answer/answers"). ✓
- Update-my-intent button → IntentRevisionModal. ✓ R10-C.

### Sharing
- Caregiver/partner read-only link panel. ✓ R10-3 strict opt-in.
- Selection fields, message field, generated link block (R18-A
  componentized). ✓
- 24h expiry, message capped at MAX_MESSAGE_LEN. ✓

### Data flow
- Export to JSON. ✓
- Import from CSV/JSON with column mapping + preview. ✓
- DataImport preview now uses R18-B locale-aware "X entry/entries
  ready", "X row/rows skipped". ✓
- Trust receipt (printable). ✓ R6.
- Backup verifier panel. ✓ R8.
- Sync panel (Capacitor secure storage). ✓
- DataRecoveryScreen for corrupted-DB hydration. ✓ R11-2 / R18-A
  componentized.

### Recovery / soft restart framing
- StreakBreakPrompt with longest-streak preserved (R18-B locale-aware
  plurals). ✓
- 2yr / 5yr milestones. ✓ R17-1.
- Crisis link always available — never replaces a calm option, only
  augments. ✓

### Observability (on-device only)
- onboarding diagnostics + history.
- A/B experiment exposure counts.
- Onboarding funnel view.
- Trust receipt audit trail.
- All on-device. None transmitted anywhere by default.

### What does NOT ship in v1 (deferred to v1.x)
- Screen-reader announce strings in useDrinkActions (still hardcoded
  English). Hook plumbing surgery deferred.
- weeklyRecap, printableReceipt, ai-recommendations: intentionally
  English (per R17-5 audit decision).
- DiagnosticsAudit exposure count: owner-only diagnostic, low priority.
- Polish + Russian native-speaker review pass (machine-translated
  baseline ships; native review is a v1.1 ticket).
- 4 length-variance strings >1.6× English in fr/de — UI containers
  handle the variance today, but small-screen edge cases worth a pass.

## Test counts at ship

```
Test Files: 227 passed
Tests: 1440 passed (1 skipped)
Lint: 35 warnings (0 errors)
Typecheck: clean
Build: passes
Bundle budget: PASS (eager 242kb / 250kb budget; +0.07% from baseline)
Perf baseline: PASS (largest async +0.00%)
```

## Across-rounds technical health

| Round | Tests | Lint warnings | Bundle eager (gz) | Notes |
|---|---|---|---|---|
| R12 baseline | ~950 | 60+ | ~245kb | Pre-calm-voice rewrite |
| R15 | 1180 | 50 | 244kb | A/B framework, std-drink jurisdiction |
| R16 | 1280 | 49 | 243kb | Bundle trim (lazy ExportImport/TrustReceipt) |
| R17 | 1420 | 39 | 242kb | Long-fn refactor sweep, plurals helper, settings reset |
| **R18** | **1440** | **35** | **242kb** | pl/ru locales, voice-drift fixes, last 4 long-fns |

## Confidence to ship

I'd put my name on this. The 18-round shape (calm voice, on-device data,
sharp privacy posture, no gamification, no analytics, locale plurals
correct in 6 languages, judges-cleared user-flow tone) is what a
maintained recovery-tracking app should look like. The technical
foundation (typecheck clean, 1440 tests, +0% perf regression, bundle
under budget) supports a maintained release.

The known v1.x deferred items are minor polish, not user-blocking gaps.
