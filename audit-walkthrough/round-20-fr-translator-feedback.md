# Round 20 — French native-speaker judge feedback

Date: 2026-05-03
Judge: native French speaker (R20-6)
Locale audited: `src/locales/fr.json` (361 lines, 100% key-parity with en.json)

The R18 i18n specialist judge fixed brand-voice drift across all
non-EN locales. R20 brings in a native-speaker judge to catch
subtle phrasing that machine translation got close-but-wrong. This
is the kind of "your French is correct but a French person would
phrase it differently" review.

## Findings — by severity

### MAJOR — tu/vous addressing inconsistency

The product mixes **tu** (informal "you") and **vous** (formal "you")
within the same UI. French is strict about this: switching between
the two in one product is jarring and reads as either careless or
two different writers in conflict.

Examples of **vous** form (formal, the dominant voice across
onboarding + marketing):
- `eraseConfirm.subtitle` — "Toutes les entrées ... seront supprimés"
- `onboarding.privacy.description` — "Vos données vous appartiennent"
- `onboarding.tracking.description` — "Notez l'heure ... seulement ce que vous voulez"
- `medicalDisclaimer.content` — "Si vous êtes en situation"
- `support.description` — "Nous lisons nous-mêmes vos retours"

Examples of **tu** form (informal, scattered through inline UI):
- `eraseConfirm.typePrompt` — "Tape EFFACER pour confirmer" ← TU
- `reminder.prompt` — "Rappel : enregistrer **ta** journée ?" ← TU
- `ribbon.heading` — "**Tes** sept derniers jours en un coup d'œil" ← TU
- `ribbon.overCap` — "{{n}} au-dessus de **ta** limite quotidienne" ← TU
- `funnel.empty` — "**Efface** les données et **refais** l'accueil" ← TU
- `retrospective.promptBody` — "**Tu** veux voir ce qui a changé" ← TU

**Recommendation:** pick **vous** as the canonical brand voice (it
matches the calm, respectful onboarding tone and is appropriate for
a wellness/recovery app). Migrate all tu-form strings.

### MAJOR — "Reçu de confiance" doesn't land

`marketing.tagline` (line 210), `disclaimer` (line 81), `settings.privacy.tagline` (line 232):
> "Reçu de confiance inclus."

In French, "reçu" implies a transactional receipt (the slip of paper
from a shop). "Reçu de confiance" reads literally as "receipt of
trust" — sounds like buying trust at a checkout.

Better French equivalents:
- `Attestation de confiance` (closest in tone — formal, certificate-like)
- `Certificat de transparence`
- `Engagement de confiance`

The English "trust receipt" is itself a coined phrase; the French
needs its own coined phrase, not a calque.

### MEDIUM — "Bienvenue dans Alchohalt"

`onboarding.welcome.title`:
> "Bienvenue dans Alchohalt"

In French, apps/sites take **sur** ("Bienvenue sur Twitter",
"Bienvenue sur LinkedIn"), not **dans**. **Dans** suggests entering
a physical place ("Bienvenue dans le café"). For a digital product
**sur** or **chez** is idiomatic.

**Recommendation:** "Bienvenue sur Alchohalt" or "Bienvenue dans
l'application Alchohalt".

### MEDIUM — "Reset de 90 jours" is anglicism

`goalTemplates.ninetyDayReset.title`:
> "Reset de 90 jours"

"Reset" is an English borrowing. French has perfectly good native
equivalents: **Réinitialisation** or **Remise à zéro**. The English
usage is acceptable in startup-tech jargon but doesn't fit a calm
wellness app's tone — and it stands out as the only anglicism in
the goals list (the others are all in French: "30 jours sans",
"Réduire à 7 verres", "Semaine sans alcool", etc.).

**Recommendation:** "Réinitialisation 90 jours" or "Pause de 90 jours".

### MEDIUM — `intention_*` list mixes parts of speech

Lines 104-109 — the user picks an "intention":
- `fêter` (verb) ← inconsistent
- `social` (adjective)
- `goût` (noun)
- `ennui` (noun)
- `décompresser` (verb) ← inconsistent
- `autre` (adjective)

Mixing verb-form ("fêter", "décompresser") with noun-form ("goût",
"ennui") in the same selection list reads as poorly-edited copy. A
French speaker scanning a list expects parallelism.

**Recommendation:** unify as nouns:
- `fête` (or `célébration`)
- `social` (works as noun in this context)
- `goût`
- `ennui`
- `détente` (or `gestion du stress`)
- `autre`

### MINOR — "À vous." standalone reads slightly off

`marketing.shortTagline`:
> "Aucune publicité. Aucune analyse. À vous."

The English is "Yours." — short and possessive. French "À vous"
exists ("Le tour est à vous", "À vous de jouer") but standalone-as-
a-sentence is unusual. Native readers parse it for a beat.

**Recommendation:** "Aucune publicité. Aucune analyse. Tout est à
vous." or simply "Aucune publicité. Aucune analyse. Vos données."

### MINOR — `Tape EFFACER` is too casual + tu-form

`eraseConfirm.typePrompt`:
> "Tape EFFACER pour confirmer"

For a destructive irreversible action (erase ALL data), the prompt
should be deferential, not casual. Combined with the tu/vous issue
above, this should be `Tapez EFFACER pour confirmer`.

### MINOR — `boissons standards` plural agreement

`goalTemplates.cutToSeven.description`:
> "Ramener le total hebdomadaire à sept boissons standard."

Académie française rules: borrowed adjectives ("standard") are
invariable. Common usage often pluralizes them. This is a coin-flip
that even native speakers disagree on. Not a bug, just a stylistic
choice. Recommend pinning the choice (either invariable or
pluralized) consistently across all fr.json — currently mixed.

### MINOR — abbreviated `30 j préc.`

`stats.vsPrev30d`:
> "vs 30 j préc."

Tight UI context. "j" for "jour" and "préc." for "précédents" both
read OK in dense data displays, but native speakers prefer
"30 jours" written out when space allows. Keep if real estate is
tight; expand if not.

## Summary

11 findings: 2 MAJOR, 4 MEDIUM, 5 MINOR.

**Fixed in R20-6 commit:** the 4 highest-impact (tu/vous unification
to **vous**, "Reçu" → "Attestation", "Bienvenue dans" → "Bienvenue
sur", "Reset" → "Réinitialisation").

**Deferred** (recommend a R21 follow-up): the intention-list
parallelism (touches the corresponding `intention_celebrate` /
`intention_cope` keys in en.json + downstream display logic — bigger
than a string swap), the "À vous." marketing tagline (low-risk but
needs marketing-team sign-off on wording), and the boissons standards
plural-agreement style guide pin.

## Process notes

The R18 i18n specialist judge produced voice-consistency-across-
locales (e.g., the Russian formality drift from R17). The R20
native-speaker judge produces in-locale phrasing wins that an
i18n specialist scanning for parity wouldn't catch. Both passes
are valuable; neither replaces the other.

For R21, recommend running the same native-speaker pass on **es**
(second-largest non-EN market). The Spanish locale likely has
similar tu/usted issues plus translation-quality wins on the
trust-receipt concept (which doesn't translate cleanly to any
Romance language as far as I can tell).
