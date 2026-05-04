# Round 22 — Native German speaker judge feedback

Date: 2026-05-03
Judge: native German speaker (R22-1)
Locale audited: `src/locales/de.json` (369 lines, 100% key-parity
with en.json after R22-A).

The R20-6 native French speaker judge and the R21-A native Spanish
speaker judge each found 4-11 phrasing issues that an i18n-parity
scan can't catch (the Spanish "trust receipt" / French "tu/vous" /
Spanish gender-marked "Bienvenido"). R22-1 runs the same protocol
on de.json. German is the third-largest non-EN market (DACH region:
Germany + Austria + German-speaking Switzerland) and has its own
versions of:
- the trust-receipt translation problem (English coined-phrase
  "Trust receipt" doesn't carry into German)
- the parts-of-speech parallelism issue the Spanish translator
  flagged for the intention list
- the abbreviation-ambiguity problem (German `Std` reads as
  "Stunden" / hours, not "Standardgetränke" / standard drinks)

## Findings — by severity

### MAJOR — `Trust-Receipt inklusive` doesn't translate

`marketing.tagline` (line 210) and `settings.privacy.tagline`
(line 232):
> "Keine Werbung. Keine Analytik. Trust-Receipt inklusive."

`Trust-Receipt` is the English coined-phrase the FR/ES translators
already flagged in their locales. In German the literal
`Vertrauensbeleg` reads as a banking document, not a privacy promise.
The hyphenated English "Trust-Receipt" mid-sentence reads as tech
jargon and breaks the rhythm of the three short German clauses
that precede it.

Better German equivalents (idea-based, not literal):
- `Vertrauen inklusive.` (trust included — punchy, three-word match
  to the English shortTagline pattern)
- `Datenschutz-Versprechen inklusive.` (privacy promise included)
- `Mit Vertrauenszusage.` (with commitment of trust)

**Fix landed:** "Vertrauen inklusive." Matches the cadence of
`shortTagline: "Keine Werbung. Keine Analytik. Deins."` (single
declarative German word doing the closing punch). Applied to both
the marketing tagline and the settings.privacy tagline so the
phrasing is consistent everywhere the user encounters it.

### MEDIUM — `Std anpassen…` is ambiguous

`bulk.scaleStd` (line 159):
> "Std anpassen…"

The English source is "Scale std…" (referring to standard drinks).
In German, `Std` is the canonical abbreviation for `Stunden`
(hours) — a German user reading `Std anpassen…` in a bulk-edit
menu would reasonably expect the action to scale the time value
on the selected entries, not their standard-drink count. This is
a real footgun: the user could press it expecting one thing and
silently mutate the wrong field.

**Fix landed:** "Standardgetränke anpassen…" (full word,
unambiguous). Loses the visual brevity of the English `std` but
gains correctness. Other surfaces using the abbreviation
(`stats.std: "std"`, `analytics.moodCorrelation.colMean: "Ø std"`)
are in tight stat-table columns where space is the binding
constraint and "std" is preceded by a dimensional context (a
column header, a stat number) — those stay as-is for now, with
the trade-off documented.

### MEDIUM — `intention_*` list mixes parts of speech

Lines 104-109:
- `intention_celebrate: "feiern"` (verb / infinitive)
- `intention_social: "gesellig"` (adjective)
- `intention_taste: "Geschmack"` (noun)
- `intention_bored: "Langeweile"` (noun)
- `intention_cope: "abschalten"` (verb / infinitive)
- `intention_other: "anderes"` (pronoun)

This is the same parts-of-speech parallelism issue R21-A
flagged for the Spanish locale. The user sees a six-item radio
group where each option reads as a different grammatical type;
the cognitive cost is small but real (the user has to re-parse
each option as a "kind of intention").

The English source has the same flaw ("celebrate, social, taste,
bored, cope, other" mixes verb/adj/noun/adj/verb/pronoun) but
that's a separate finding for an EN copy edit (deferred to R23
along with the FR/ES intention-list fix).

For the German fix specifically, two paths preserve meaning:
- All-noun (chosen): "Feier, Geselligkeit, Geschmack, Langeweile,
  Bewältigung, Anderes" — clean nominalization, reads as a
  paradigm of named occasions
- All-verb: "feiern, in Gesellschaft, schmecken, gegen Langeweile,
  bewältigen, anderes" — preserves action framing but introduces
  awkward prepositional phrases ("in Gesellschaft", "gegen
  Langeweile")

**Fix landed:** all-noun form. Reads naturally in a German UI
(German prefers nominal style for paradigms). `Bewältigung`
(coping) is the standard psychotherapy term — neutral register,
not pathologizing.

### MINOR (kept) — `goalEvolution.title` reads slightly clinical

`goalEvolution.title` (line 302):
> "Du bist über dieses Ziel hinausgewachsen"

Literal translation of "You've outgrown this goal." Reads
correctly but slightly textbook-formal — a German user might find
"Dieses Ziel hast du erreicht und überholt" or "Du bist diesem
Ziel entwachsen" softer. Coin-flip on register; native input
during a real-world walk would settle it. Not a blocker.

### MINOR (kept) — eraseConfirm vs bulk.deleteConfirm phrasing differ

`eraseConfirm` (line 6):
> "...Dieser Vorgang kann nicht rückgängig gemacht werden."

`bulk.deleteConfirm.one` (line 160):
> "...Lässt sich nicht rückgängig machen."

Two different "this can't be undone" phrasings. Both are
idiomatic; `Lässt sich nicht...` is conversational, `Dieser
Vorgang kann nicht...` is formal. Mixing them across two
adjacent destructive flows is a tiny consistency loss but no
user is going to misread. Worth pinning in a future style-guide
pass; deferred.

### MINOR (kept) — selfExperiment terms keep English borrowings

`selfExperiment.jumpDiagnostics` ("Onboarding-Diagnose"),
`selfExperiment.jumpFunnel` ("Onboarding-Funnel"),
`selfExperiment.jumpAudit` ("Einstellungs-Audit"),
`selfExperiment.jumpNav` ("Dashboard-Bereiche").

Each compound borrows the English head ("Funnel", "Audit",
"Dashboard", "Onboarding"). German equivalents exist
(`Trichter` / `Prüfung` / `Übersicht` / `Einführung`) but the
English forms are now standard in German tech UIs and the user
is more likely to recognize them. Keep — flagged here for the
record.

### NONE — what's already right

The German locale does many things well that I don't need to
fix:

- **du-form consistency.** Every imperative addresses the user
  with `du` (line 23 "Du bist zurück", line 28 "Lege in den
  Einstellungen", line 196 "Fang klein an"). No `Sie` leakage.
  Matches German recovery-app convention.
- **Cravings as `Verlangen`.** Neutral register, no clinical
  weight ("Suchtdruck" would be technically more accurate but
  pathologizes; `Verlangen` keeps the calendar-fact voice).
- **HALT preserved as acronym.** Unlike some German wellness
  translations that try to localize HALT as "HALT-MD" (Hungrig,
  Ärgerlich, Lonely…wait, no — HMEM doesn't work in German), the
  app keeps the English acronym + translates each word
  separately (`halt_hungry: "hungrig"`, `halt_angry: "wütend"`).
  Pragmatic — the four feelings are clear in either language.
- **Soft-restart voice.** Line 23 "Du bist zurück. Bislang
  {{total}} alkoholfreie Tage." reads as warm-but-factual,
  matching the EN. No drama, no apology framing, no minimization.
- **`bulk.deleteConfirm` plural.** The {{n}} placeholder is
  preserved correctly across the German one/many forms — easy to
  drop in a hand-written translation.

## What this judge catches that the other 21 don't

The DACH-region patterns: hyphenated English compounds inside
otherwise German UI strings (the "Trust-Receipt inklusive"
pattern). German UI conventions tolerate borrowed English but
draw the line where the borrowed term replaces a standard
German concept that the user already has (a "Beleg" is a
specific kind of document; "Trust-Receipt" doesn't map). This
class of issue is invisible to a fluent-but-not-native scan.

R23 recommendation: a real-world German user with 3+ months of
app use, walking through every screen on a German-locale phone.
Synthetic native-speaker walks have limits (this audit identified
3 fixes; a real user might find a 4th in the wild that I missed
because I knew what to look for).

## Process

3 fixes landed in R22-1; 3 minor findings deferred with
rationale. Same shape as R20-6 (4 fixes, 4 deferred) and R21-A
(10 fixes, 1 deferred). Total non-EN coverage now: fr (R20-6)
+ es (R21-A) + de (R22-1) = 3 of the 5 non-EN locales have
had a native-speaker pass. Remaining: pl + ru. Recommend pl in
R23 (Polish is structurally more different — 3-form plurals,
case system — and likely surfaces a different class of issue).
