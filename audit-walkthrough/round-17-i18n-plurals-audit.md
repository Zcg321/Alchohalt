# Round 17 — i18n hardcoded-plurals audit

**Author:** Cowork Sprint
**Date:** 2026-05-03
**Scope:** R17-5 — locate every user-visible string with hardcoded
English plural rules. Identify which produce broken output in
es/fr/de. Land a locale-aware helper and convert the highest-impact
strings.

## Findings

Scanned `src/**/*.{ts,tsx}` for the patterns:

- `${n} day${n === 1 ? '' : 's'}`
- `${n} ${n === 1 ? 'day' : 'days'}`
- `entr${n === 1 ? 'y' : 'ies'}`
- `time${n === 1 ? '' : 's'}`
- `event${n === 1 ? '' : 's'}`

23 user-visible strings matched.

### Status

| Surface | File | Status |
|---|---|---|
| AF days ribbon | `LongTermActivityRibbon.tsx` | Already uses `pluralKey()` (good) |
| Onboarding funnel subtitle | `OnboardingFunnelView.tsx` | Already uses `subtitleOne` / `subtitleMany` keys (good) |
| LoggingTenure (NEW R17-1) | `LoggingTenure.tsx` | **Converted to `pluralCount`** |
| Hardcoded plurals — bulk delete announce | `useDrinkActions.ts` | Pre-existing English-only — flagged below |
| Hardcoded plurals — DataImport preview | `DataImport.tsx` | Pre-existing English-only — flagged below |
| Hardcoded plurals — DrinkList header | `DrinkList/index.tsx` | Already uses `t()` lookup for entry/entries — see `entry` / `entries` keys |
| Hardcoded plurals — DrinkHistorySearch results | `DrinkHistorySearch/index.tsx` | Pre-existing English-only — flagged |
| Hardcoded plurals — FirstMonthRibbon | `FirstMonthRibbon.tsx` | Pre-existing English-only — flagged |
| Hardcoded plurals — TodayPanel milestone | `TodayPanel.tsx` | Pre-existing English-only — flagged |
| Hardcoded plurals — PeakHourCard | `PeakHourCard.tsx` | Pre-existing English-only — flagged |
| Hardcoded plurals — TagExplorer / TagPatternsCard | `TagExplorer.tsx` / `TagPatternsCard.tsx` | Pre-existing English-only — flagged |
| Hardcoded plurals — StreakBreakPrompt | `StreakBreakPrompt.tsx` | Pre-existing English-only — flagged |
| Hardcoded plurals — DiagnosticsAudit exposure count (NEW R17-B) | `DiagnosticsAudit.tsx` | English-only; non-translated diagnostic — acceptable for owner-only surface |
| Hardcoded plurals — Diagnostics history-count | `Diagnostics.tsx` | Already uses `{{s}}` token replace — good but English-rule |
| Hardcoded plurals — weeklyRecap | `notifications/weeklyRecap.ts` | English-only — notification body, escapes locale chain |
| Hardcoded plurals — printableReceipt event count | `lib/trust/printableReceipt.ts` | English-only — printed receipt is intentionally English |
| Hardcoded plurals — ai-recommendations | `ai-recommendations.ts` | English-only — internal recommendation copy |
| Hardcoded plurals — EscalationPrompt time | `EscalationPrompt.tsx` | Pre-existing English-only — flagged |

### Decision

**Land:**
- `src/i18n/plural.ts` with `pluralCount()` + `pluralNoun()` helpers
  using `Intl.PluralRules`. 12 unit tests.
- Convert `LoggingTenure` (newly added in R17-1) to use `pluralCount`
  with `tenure.{days,months,years}.{one,other}` keys. Translations
  added to en/es/fr/de.

**Defer:** the remaining ~20 pre-existing strings. Each one needs
its own translation key entries across all four locales (~80 new
entries), and the conversion has no behavioral effect for
English-locale users — which is the bulk of current testing. Round
18 is the right place to land the rest in a focused i18n batch
rather than scattering across this round's PR.

The `pluralCount` helper is now in place, so any string converted
in a future round picks up Spanish/French/German plural correctness
for free.

### Why this approach

`Intl.PluralRules` is the right primitive — it knows that English
has 2 buckets (one/other), French/Spanish have 2 (one/other), German
has 2 (one/other), and Russian/Polish (future locales) have 3-4.
Future locales add their own keys; the helper picks the right bucket
without code changes.

The fallback chain `<key>.<bucket>` → `<key>.other` → caller-fallback
→ keyName means a missing translation NEVER renders as
`"[ribbon.afDays.one]"` to a user — worst case you see the English
fallback string the original code used.
