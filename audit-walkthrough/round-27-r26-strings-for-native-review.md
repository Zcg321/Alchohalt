# Round 27-A — R26 strings: machine-translated baseline for native review

## Why this doc exists

Round 26 added three new clusters of user-visible strings:

1. **Std-drink jargon tooltip** (`settings.stdDrink.*`, 5 keys)
2. **Pinned privacy summary** (`settings.privacy.headline.*`, 8 keys)
3. **Per-surface satisfaction signal** (`satisfaction.*`, 5 keys)

These shipped with English-only fallbacks via the `t(key, default)` second-argument
pattern. Round 27-A adds machine-translated baselines for es/fr/de/pl/ru so
non-English users see localized strings on next reload, then queues them up for
native review by the same translator panel that audited prior rounds (R20-R24).

## Translator review priorities

Native reviewers, please flag any of:

- **Voice mismatch.** Alchohalt voice is calm, factual, no marketing. If a string
  reads as advertising or pressure, flag it.
- **Term consistency.** "Std drink" / "porcja standardowa" / "Standardglas" /
  "verre standard" / "стандартная порция" — make sure I matched what your
  prior round used.
- **Punctuation conventions.** German `„…“`, French `« … »` with non-breaking
  spaces, Polish `„…”`, Russian «…». I tried to match but a native eye catches
  what I miss.
- **Ellipsis vs three dots.** Use `…` (U+2026), not `...`.
- **Em-dash vs en-dash.** "—" before "helpful" / "nicht hilfreich" — German
  prefers a Halbgeviertstrich (–) with spaces, French prefers a non-breaking
  space then —. Flag if I picked wrong for your locale.

## Strings added per locale

### English (canonical)

```json
"settings.stdDrink.explainSummary": "What does \"1 std drink\" mean here?",
"settings.stdDrink.equalsLine": "Roughly equal to:",
"settings.stdDrink.sourcePrefix": "Source:",
"settings.stdDrink.changeHint": "Change the picker above to use a different definition.",
"settings.stdDrink.gramsSuffix": "g pure alcohol.",

"settings.privacy.headline.title": "Your data. On this device. Period.",
"settings.privacy.headline.claim": "Nothing leaves your device. Backup is end-to-end encrypted. No analytics, no ads.",
"settings.privacy.headline.expand": "How can I verify this?",
"settings.privacy.headline.verifyIntro": "Three checks anyone can run:",
"settings.privacy.headline.verify1": "Open browser devtools → Network tab → reload. With every optional feature off, only the static app bundle loads.",
"settings.privacy.headline.verify2": "Read the per-feature breakdown below: which optional things can call out, and whether they are on right now.",
"settings.privacy.headline.verify3": "Open the Trust Receipt at the bottom of this section: print-ready summary of every claim and the file that backs it up.",

"satisfaction.label": "Was this helpful?",
"satisfaction.up": "Thumb up — helpful",
"satisfaction.down": "Thumb down — not helpful",
"satisfaction.dismiss": "Dismiss helpful prompt",
"satisfaction.thanks": "Thanks. Stays on this device."
```

### Spanish (es)

Style notes I tried to apply: sentences end with full stops on the privacy
strings to match the punchy English tone, but the style elsewhere in es.json
varies — please align if needed.

### French (fr)

I used non-breaking spaces before `:`, `?`, `«`, `»` per French typography. If
the rendering shows literal characters, the file's saved as UTF-8 — check at
display time, not in the source.

### German (de)

Used `„…"` (U+201E ... U+201D) for embedded quotation. The compound noun
"Standardglas" rather than "Standardgetränk" matches what R22 translator
feedback selected.

### Polish (pl)

Used `„…”` (U+201E ... U+201D) for embedded quotation per Polish convention.
"porcja standardowa" rather than "standardowy drink" — feminine, no
anglicism. R23 translator feedback was strict on this.

### Russian (ru)

Used «…» for embedded quotation. "стандартная порция" (feminine), matches
R24 reviewer.

## Round of native review

Add review notes to:
`audit-walkthrough/round-{N}-{lang}-translator-feedback.md`

Owner reads them, applies fixes in a `[R{N}-FIX-{lang}]` commit, and the cycle
ends. Same workflow R20-R24 used.

## Why machine baseline first, not "wait for native"

Two reasons:
1. Non-English users today see English strings. A merely-okay translation now
   is better than fallback English for a month.
2. R20-R24 native reviewers preferred reviewing existing strings to writing
   from scratch — "tell me what I'd change" is faster than "tell me what to
   say."

So the policy: machine-translate to a publishable baseline, ship that, then
queue the native review pass. Review pass is a polish round, not a blocker.
