# Round 18 — i18n specialist judge findings

**Author:** Cowork Sprint
**Date:** 2026-05-03
**Persona:** A localization engineer with 8+ years of multilingual product
launches across en/es/fr/de/pl/ru. Knows Intl.PluralRules, knows that
machine translation drifts when the source copy is rewritten, knows that
French and German have habitual marketing tones that bleed into product
copy unless aggressively edited.

## Verdict

**Pass with corrected drift.** The 18th-judge audit surfaced two
categories of real bugs that R9 + R12 + R13 + R17 missed:

1. **Voice drift** in fr/de onboarding + support copy
2. **Missing `.other` plural buckets** in pl/ru (fractional count
   safety hole)

Neither was caught by typecheck, lint, or the existing test suite — they
required a side-by-side diff of translation values against current English
copy by someone fluent enough to feel the tone.

Both are now fixed in this round.

## Method

I scripted three audits:

1. **Key coverage** — every locale's flat key set vs en.json
2. **Interpolation consistency** — `{{token}}` placeholders preserved
   across translations
3. **English-leak detection** — values containing English-grammar
   artifacts in non-English locales
4. **Length variance** — flag translations 1.6× longer than English
5. **Plural bucket completeness** — every `.one/.other/.few/.many/.zero`
   set across locales

Then I diff'd the actual translation values against current English
for the most user-visible surfaces (onboarding + privacy copy).

## Findings

### Bug 1: French + German onboarding copy drift (HIGH)

The French and German `onboarding.*` and `support.*` strings were written
when English copy still had **wellness-marketing voice** — language like
"Your private wellness companion for healthier drinking habits" and
"Track progress with motivating streak counters." 

That voice was deliberately rewritten across rounds 9-13 to the current
**calm-voice** baseline:
- "A private space to log what you drink and notice what's changing."
- "Pick a daily limit or a streak length. You can change either anytime,
   or skip this entirely."

Rounds 9, 12, 13, and 17 all passed without anyone re-reading the
fr/de translations to see if they still matched. They didn't.

**Concrete drift examples (before fix):**

| Key | EN (current) | FR (drifted) | DE (drifted) |
|---|---|---|---|
| `onboarding.welcome.description` | A private space to log what you drink and notice what's changing. | Your personal private wellness companion for healthier drinking habits. | Your personal, private wellness companion for healthier drinking habits. |
| `onboarding.tracking.title` | Log what you drink | Smart tracking | Smart Tracking |
| `onboarding.tracking.description` | Note the time, the type, why, and how it felt — only the parts you want to. | Record drinks with intention, HALT triggers, and craving values to understand your patterns. | Track drinks with intention, HALT triggers, and craving values to understand your patterns. |
| `onboarding.insights.title` | What changes over time | Personalized analyses | Personal insights |
| `onboarding.goals.description` | Pick a daily limit or a streak length. You can change either anytime, or skip this entirely. | Create personalized goals and track your progress with motivating streak counters. | Create personal goals and track progress with motivating streak counters. |
| `onboarding.ready.title` | Ready when you are | All set! | All ready! |
| `onboarding.quickTips.title` | A few notes | Quick tips | Quick tips |
| `support.description` | We read your feedback ourselves. It shapes what gets built. | We're here to support you on your wellness journey. Your feedback helps us improve the app. | We help you on your wellness journey. Your feedback helps to improve the app. |

Spanish escaped this — `es.json` matches the calm voice throughout.
Probably the Spanish translator had an updated source brief; fr/de did
not.

**Why this matters:** the calm voice was the primary positioning
decision in the rounds that nailed this app's tone. A French user reads
"Smart tracking" and "Create personalized goals with motivating streak
counters" and gets a *different product*: a gamified habit tracker
making aspirational promises. The English app says "log what you drink
and notice what's changing" and means it. Voice drift this severe is a
**localization disaster** for the calm-voice positioning.

**Fix:** rewrote 13 strings across fr.json + de.json to match current
English calm voice. Verified each translation honors the original tone:
no aspirational framing, no "wellness journey" jargon, no streak
counter motivation, no "we help you" patronizing voice.

### Bug 2: pl/ru missing `.other` plural buckets (LOW)

Polish and Russian both have three plural buckets via `Intl.PluralRules`:
`one`, `few`, `many`. But for **fractional counts** (1.5, 2.5, etc.),
both languages select bucket `other`.

The R18-1 / R18-2 locale files I shipped only had one/few/many — fine
for integer counts (which is all the app actually passes today), but
the `pluralCount` helper would fall through to the English fallback
string for any future fractional count. That's a latent bug.

**Fix:** added `.other` bucket to all 12 plural keys in pl/ru.json,
using the genitive case form (which is how Polish and Russian inflect
fractional quantities — "0.5 dnia" / "0.5 дня"). Future code that ships
fractional counts now produces grammatically correct output without
needing to update locales.

### Non-findings (audited and clean)

- **Interpolation consistency**: every `{{token}}` placeholder appears
   in every locale that translates the corresponding key. Zero mismatches.
- **Whitespace**: no trailing or double-space artifacts.
- **Length variance**: 4 strings are 1.6× longer in fr/de — all
   legitimate (German verbosity for "Erase all saved data?" → "Alle
   gespeicherten Daten löschen?"). UI containers handle the variance.
- **Cyrillic / Latin script mixing**: ru.json renders cleanly; no Latin
   leakage into Cyrillic strings.
- **Idiom-free check**: no English idioms ("rough night", "AF day"
   loanword) inappropriately surfaced; the app's recovery vocabulary
   (HALT, AF) is intentionally preserved across all locales as a
   product-vocabulary decision.

## Tests

The existing plural-pl-ru.test.ts (20 tests) verifies the bucket math
for Polish and Russian. The voice-drift fixes are not test-covered
because translation tone isn't testable — that's why this judge exists.

## What R18+ should add

- A periodic re-audit when English source copy changes meaningfully:
   diff each non-en locale value against last-known matched English to
   detect future drift. Could be a CI script if it's worth automating.
- A native-speaker review pass for pl/ru/fr/de before any production
   release where European users are a primary audience. Machine
   translation gets you 80% — the last 20% (idiom, register, cultural
   resonance) is human work.
