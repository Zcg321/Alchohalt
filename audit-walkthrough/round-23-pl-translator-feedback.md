# Round 23 — Native Polish speaker judge feedback

Date: 2026-05-03
Judge: native Polish speaker (R23-1)
Locale audited: `src/locales/pl.json` (407 lines, 100% key-parity
with en.json after R22-A; pl-specific Slavic-plural keys exempted).

The R20-6 native French speaker, R21-A native Spanish speaker, and
R22-1 native German speaker each found 3-11 phrasing issues that
parity scans can't catch. R23-1 runs the same protocol on pl.json.
Polish completes 4/5 non-EN locales (only ru remains for round 24+);
it's structurally distinct from the Romance + Germanic languages
that came before:

- 3-form plurals (`one` / `few` / `many`) plus a CLDR `other` for
  fractional cases — wider plural surface than ES/FR/DE
- Robust case system — every noun has 7 forms; UI strings bake the
  case decision into the source
- Gender-marked past tense (`Wyrosłeś` vs `Wyrosłaś`) — a footgun
  for any UI string that addresses the user with past-tense verbs
- Less English borrowing in everyday tech vocabulary than DE — the
  `Trust-Receipt`/`Vertrauensbeleg` problem reappears in Polish but
  with a different translation trap (`pokwitowanie` reads as a
  paper banking receipt, not a privacy claim)

## Findings — by severity

### MAJOR — `pokwitowanie zaufania` reads as a banking receipt

`marketing.tagline` (line 259) and `settings.privacy.tagline`
(line 283):
> "Bez reklam. Bez analityki. Z dołączonym pokwitowaniem zaufania."

`Pokwitowanie zaufania` is a literal calque of "trust receipt." In
Polish, `pokwitowanie` overwhelmingly means a paper receipt for a
delivered package or money — the kind of word a bank teller hands
you. Pairing it with `zaufania` ("of trust") reads as a strange
legal-banking compound, not a privacy promise. The cadence also
breaks: the EN tagline is three short clauses ("No ads. No
analytics. Trust receipt included.") but `Z dołączonym
pokwitowaniem zaufania` is five-word, multi-syllable, and lands
heavier than the two short denials before it.

Better Polish equivalents (idea-based, not literal):
- `Zaufanie wliczone.` (trust included — punchy two-word match)
- `Z gwarancją zaufania.` (with trust guarantee — adds a verb-noun
  feel that a Polish reader expects in marketing copy)
- `Twoje wpisy są tylko Twoje.` (your entries are only yours —
  rephrases without the receipt metaphor)

**Fix landed:** "Zaufanie wliczone." Mirrors the German fix from
R22-1 (`Vertrauen inklusive.`) and the cadence of the existing
`shortTagline: "Bez reklam. Bez analityki. Twoje."` (single
declarative Polish word/phrase doing the closing punch). Applied
to both `marketing.tagline` and `settings.privacy.tagline` so the
phrasing is consistent everywhere the user sees it.

### MEDIUM — `Skaluj std…` is opaque

`bulk.scaleStd` (line 201):
> "Skaluj std…"

The English source is "Scale std…" (referring to standard drinks).
In Polish, `std` is not a known abbreviation — it doesn't shorten
anything in the language. Polish readers see it as a foreign tech
acronym with no anchor. Worse, in the bulk-edit menu it sits next
to other clearly-named actions (`Usuń wybrane` "Delete selected",
`Przesuń czas…` "Shift time…") so the contrast highlights the
opacity.

Unlike German (where `Std` collides with `Stunden`/hours), Polish
doesn't have a competing meaning — the issue is pure unfamiliarity.

**Fix landed:** "Skaluj liczbę std…" (scale the *count of* std).
Adding `liczbę` (number/count) gives the abbreviation a noun
anchor — Polish readers understand "the std count" even if `std`
itself is opaque, the same way `liczba pikseli` works for an
imperfectly-known unit. Other surfaces that use `std` in Polish
(`stats.std: "std"`, `analytics.moodCorrelation.colMean: "Śr. std"`,
`history.stdDrinks: "Std drinki"`) sit in tight column headers
where space is the binding constraint and the surrounding context
disambiguates — those stay as-is, with the trade-off documented.

### MEDIUM — `intention_*` list mixes parts of speech

Lines 144-149 (before the fix):
- `intention_celebrate: "świętowanie"` (gerund / noun)
- `intention_social: "towarzyski"` (adjective)
- `intention_taste: "smak"` (noun)
- `intention_bored: "z nudów"` (prepositional phrase)
- `intention_cope: "odprężenie"` (noun)
- `intention_other: "inne"` (pronoun / adjective)

This is the same parts-of-speech parallelism issue R21-A flagged
for Spanish and R22-1 flagged for German. The Polish form is
arguably the most jarring of the three because Polish nominal
style is so dominant in UI lists — switching to an adjective
(`towarzyski`) or a prepositional phrase (`z nudów`) reads as a
typo or a missed translation rather than a deliberate variation.

For the Polish fix specifically, all-noun is the only path that
reads naturally. All-verb would have introduced awkward infinitives
(`świętować, z towarzystwem, smakować, z powodu nudy, radzić sobie,
inne`) — Polish infinitives in a radio group don't carry the same
"label of an occasion" feel that German infinitives do.

**Fix landed:** all-noun form:
- `intention_celebrate: "świętowanie"` (kept — already noun)
- `intention_social: "towarzystwo"` (was `towarzyski` adj →
  `towarzystwo` noun, "company / socializing")
- `intention_taste: "smak"` (kept — already noun)
- `intention_bored: "nuda"` (was `z nudów` prep phrase → `nuda`
  noun, "boredom")
- `intention_cope: "odprężenie"` (kept — already noun)
- `intention_other: "inne"` (kept — works as substantivized adj
  in this context, matches the pattern)

### MEDIUM — `Wyrosłeś` is gender-marked

`goalEvolution.title` (line 358):
> "Wyrosłeś z tego celu"

Polish past tense distinguishes male / female / neuter at the
verb. `Wyrosłeś` is masculine 2nd-person past ("you-male grew out
of"); a female user reading this sees an immediate misgender. This
is a recurring Polish UI footgun — any string that uses past-tense
verbs has to either:
1. Pick a gender (alienates ~half the users)
2. Use an explicit slash (`Wyrosłeś/aś`) — common but visually
   noisy
3. Rephrase to sidestep the gendered verb

**Fix landed:** "Czas na nowy cel" ("Time for a new goal").
Completely sidesteps the gendered past tense by switching to an
impersonal time-phrase. Conveys the same idea (the user has
outgrown the goal and it's time to move on) without forcing a
gender or splash-slashing. The subtitle (`Dzień {{n}} bez
alkoholu. Co dalej?`) carries the count-of-days context, so the
title doesn't need to do the work of saying "you've outgrown" —
"time for a new goal" is plenty.

### MINOR (kept) — `Zaczynamy` for "Get started"

`onboarding.getStarted` (line 255):
> "Zaczynamy"

Literal translation would be "Zacznij" ("start" imperative) or
"Zaczynaj" ("be starting"). The current `Zaczynamy` is 1st person
plural ("we're starting"), which is warmer and more
collaborative — common in Polish onboarding flows where the app
wants to feel like a partner, not a drill sergeant. Kept.

### MINOR (kept) — `funnel.title: "Lejek wprowadzający"`

`funnel.title` (line 335):
> "Lejek wprowadzający"

Direct calque of "onboarding funnel." `Lejek` (literally "funnel")
in Polish is well-understood in marketing/analytics contexts but
reads slightly engineering-y for a Diagnostics view. Alternatives
(`Ścieżka wprowadzająca` "onboarding path", `Rejestrator
wprowadzenia` "onboarding tracker") aren't clearly better. Kept;
flagged for a future style-guide pass.

### MINOR (kept) — `Pomiń i odkrywaj` voicing

`onboarding.skipExplore` (line 251):
> "Pomiń i odkrywaj"

Literal "skip and explore." `Odkrywaj` is 2nd-person imperative
"explore" (continuous aspect). Reads correctly but slightly
adventurous — a recovery-app user who's hesitant about committing
might find an imperative `Odkrywaj!` energy disorienting. The
matched text in the EN copy ("Skip and explore") has the same
issue and the R8 voice gates accepted it; Polish doesn't make it
worse but doesn't improve it either. Coin-flip; kept for now.

### NONE — what's already right

The Polish locale does many things well that I don't need to fix:

- **Informal address (ty-form) consistency.** Every imperative
  and 2nd-person reference uses the informal `ty` form
  (line 23 "Wracasz", line 121 "Twoje wpisy", line 252 "Po prostu
  pokaż mi aplikację"). No `Pan/Pani` formal-address leakage.
  Matches Polish recovery-app convention.
- **HALT preserved as acronym + per-word translation.** Same as
  the German strategy — keeps the English acronym (which the user
  may already know from external recovery resources) and
  translates each word separately (`halt_hungry: "głodny"`,
  `halt_angry: "zły"`). Pragmatic.
- **3-form plurals correctly populated.** `bulk.deleteConfirm.one`
  / `.few` / `.many` and `ribbon.afDays.*` and `tenure.days.*` all
  populate every Slavic plural form with the right
  `{{n}}`-placeholder grammar. No drift to "one / many" only —
  Polish rejects that fallback in display.
- **Soft-restart voice.** Line 23 "Wracasz. {{total}} dni bez
  alkoholu jak dotąd." reads as warm-but-factual, matching the
  EN soft-restart voice. No drama, no apology framing.
- **Crisis-line / disclaimer voice.** `medicalDisclaimer.content`
  (line 377) reads as direct-but-calm, no panic, no jargon. The
  emergency line (`emergency`) names the action in plain Polish.

## What this judge catches that the other 22 don't

The Polish-specific patterns:

1. **Gender-marked past tense as a footgun.** Polish UI strings
   that address the user with past-tense verbs hit half the user
   base with a misgender by default. Native Polish translators
   internalize this; non-native helpers (and machine translators)
   don't. Flagged once in R23-1; future translations should
   prefer impersonal/time-phrase rephrasings.

2. **Receipt-metaphor failure.** `Pokwitowanie zaufania` is a
   plausible-sounding Polish phrase that reads completely wrong
   in context — the kind of thing only a native speaker
   immediately flags. The German judge found the parallel issue
   with `Vertrauensbeleg`; both languages share a culture of
   formal paper receipts that doesn't map to a privacy promise.

3. **Opaque English abbreviations.** `std` doesn't mean anything
   in Polish (German has `Stunden`, French has nothing strong,
   Spanish has nothing strong) — but Polish readers treat unknown
   abbreviations as more alien than DE/ES readers do. A noun
   anchor (`liczbę std`) is enough to make it work.

## Process

4 fixes landed in R23-1; 3 minor findings deferred with
rationale. Same shape as R20-6 (4 fixes, 4 deferred), R21-A
(10 fixes, 1 deferred), and R22-1 (3 fixes, 3 deferred). Total
non-EN coverage now: fr (R20-6) + es (R21-A) + de (R22-1) +
pl (R23-1) = **4 of the 5 non-EN locales** have had a
native-speaker pass. Remaining: ru. Recommend ru in R24 (Russian
shares Slavic plural complexity with pl but has its own grammar
traps — animacy, case after numerals — that pl-style fixes won't
catch automatically).

R24+ recommendation: a real-world Polish user with 3+ months of
app use, walking through every screen on a Polish-locale phone.
Synthetic native-speaker walks have limits (this audit identified
4 fixes; a real user might find a 5th in the wild that I missed
because I knew what to look for).
