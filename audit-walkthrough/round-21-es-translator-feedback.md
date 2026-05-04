# Round 21 — Spanish native-speaker judge feedback

Date: 2026-05-03
Judge: native Spanish speaker (R21-A)
Locale audited: `src/locales/es.json` (361 lines, 100% key-parity with en.json)

The R20-6 native French speaker found 11 phrasing issues that an
i18n-parity scan wouldn't catch. R21-A runs the same protocol on the
es locale. Spain + LATAM is the second-largest non-EN market and
has its own version of the tu/usted question, the "trust receipt"
translation problem, and the standard-vs-Académie style coin-flips
French had.

## Findings — by severity

### MAJOR — `Configuración` vs `Ajustes` inconsistency

The settings tab is labeled `Configuración` (line 3,
`"settings": "Configuración"`). Inline references to "in Settings"
across the app are split:

- `money.setBudgetHint` → `"Configura un presupuesto mensual en Ajustes ..."`
- `onboarding.privacy.description` → `"... en Configuración → IA."`
- `onboarding.insights.description` → `"... Las Perspectivas con IA opcionales ..."` (no Settings ref)
- `medicalDisclaimer.emergency` → contains "La pestaña de Crisis"

A user reading "Configura un presupuesto mensual en Ajustes" but
seeing the tab labeled "Configuración" has to pause to confirm
they're looking at the right place. Spain often uses "Ajustes"
conversationally, LATAM often uses "Configuración" — but a single
app should pick one and use it everywhere it references the
settings tab.

**Recommendation:** unify on `Configuración` (matches the tab label).
Update `money.setBudgetHint` to "... en Configuración".

### MAJOR — `Recibo de confianza` doesn't translate

`marketing.tagline` (line 215), `disclaimer` (line 81 indirectly),
`settings.privacy.tagline` (line 237):
> "Sin anuncios. Sin análisis. Recibo de confianza incluido."

In Spanish, "recibo" means a cash receipt (the slip from a shop or
a tax document). "Recibo de confianza" reads literally as "trust
receipt" — a transactional receipt of trust, which is gibberish.
Same problem the French translator surfaced; same fix shape: the
English "trust receipt" is itself a coined phrase, the Spanish
needs its own coined phrase.

Better Spanish equivalents:
- `Compromiso de confianza` (commitment of trust — closest in tone)
- `Garantía de transparencia`
- `Promesa de privacidad`

**Recommendation:** "Compromiso de confianza incluido."

### MEDIUM — `Bienvenido a Alchohalt` is gender-marked

`onboarding.welcome.title` (line 176):
> "Bienvenido a Alchohalt"

Gender-marked masculine. Spanish has well-established gender-neutral
welcome alternatives that don't trigger the inclusive-language debate:

- `Te damos la bienvenida a Alchohalt` (most natural; verb-led)
- `Bienvenida a Alchohalt` (the noun form; reads slightly formal)

For a wellness/recovery app where users may be in a vulnerable
state, the welcome surface is the worst place to assume gender.

**Recommendation:** "Te damos la bienvenida a Alchohalt".

### MEDIUM — `intention_*` list mixes parts of speech

Lines 104-109:
- `celebrar` (verb) ← inconsistent
- `social` (adjective)
- `degustar` (verb) ← inconsistent
- `aburrimiento` (noun)
- `relajarse` (reflexive verb) ← inconsistent
- `otro` (adjective)

Same shape as the French finding. Mixing verb-form ("celebrar",
"degustar", "relajarse") with noun-form ("aburrimiento") in the
same selection list reads as poorly-edited copy.

**Recommendation:** unify as nouns:
- `celebración`
- `social` (works as noun in this context)
- `sabor` (or `gusto`)
- `aburrimiento`
- `relajación`
- `otro`

### MEDIUM — `30 días limpios` is recovery-loaded language

`goalTemplates.monthOff.title` (line 245):
> "30 días limpios"

In recovery contexts, "limpio/a" (clean) implies its opposite:
"sucio/a" (dirty). This is loaded language that mirrors the
"clean and sober" → "dirty and using" framing. Modern recovery
literature and clinical practice avoid it because it pathologizes
the user.

The rest of the goal templates use "sin alcohol" framing
("Semana sin alcohol", "Sin alcohol hasta el jueves") — observation
language, no judgement. Line 245 is the only outlier.

**Recommendation:** "30 días sin alcohol" (matches the rest of the
goalTemplates set).

### MEDIUM — `Disparador HALT` "más frecuente" vs "más común"

Line 15: `stats.mostFrequentHalt` → "Disparador HALT más frecuente"
Line 35: `analytics.moodCorrelation.topHalt` → "Disparador HALT más común"

Same concept, two phrasings. Pick one and use it everywhere.

**Recommendation:** unify on "más común" (more colloquial, fits
the calm/observation voice better than the data-y "más frecuente").

Side note on "Disparador" itself: the word means "trigger" but
leans toward gun-trigger / mechanical-trigger. Spanish recovery
literature often uses "detonante" (detonator → emotional trigger)
or "factor desencadenante" (triggering factor). "Disparador" is
acceptable but feels harsh in a wellness context. **Defer to R22**
(would touch a half-dozen strings + needs cross-checking with
recovery-counselor convention).

### MEDIUM — `¿qué ha cambiado?` peninsular vs neutral Spanish

`retrospective.promptBody` (line 273):
> "¿Quieres ver qué ha cambiado en la última ventana de {{label}}?"

Peninsular Spanish uses pretérito perfecto compuesto ("ha cambiado")
for recent past. Neutral / LATAM Spanish prefers pretérito indefinido
("cambió"). For an app targeting both Spain and LATAM markets,
"qué cambió" reads cleaner in both registers; "ha cambiado" reads
slightly formal in LATAM.

The rest of the file is mostly neutral or LATAM-leaning (line 282:
"se desbloquea", line 314: "Permite hasta 4 bebidas estándar"), so
line 273 is the outlier.

**Recommendation:** "¿Quieres ver qué cambió en la última ventana
de {{label}}?".

### MINOR — `Conteos en el dispositivo` (anglicism-ish)

`funnel.subtitleOne` / `subtitleMany` (lines 288-289):
> "Conteos en el dispositivo a partir de {{n}} intento. ..."

"Conteo" is grammatically valid Spanish but is a calque from
English "count". Idiomatic Spanish prefers "recuento" (re-counting,
in the sense of tallying) for this kind of statistical context.
"Recuentos en el dispositivo" reads more natural.

**Recommendation:** "Recuentos en el dispositivo a partir de ..."

### MINOR — `Bebidas est.` vs `beb est.` abbreviation inconsistency

Line 76: `stats.std` → "beb est."
Line 137: `history.stdDrinks` → "Bebidas est."

Two different abbreviations of "bebidas estándar" depending on
context (table column vs share-card label). Pick one form. The
shorter "beb. est." (with the abbreviation period on each word)
is the convention if real estate is tight; "Bebidas est." otherwise.

**Recommendation:** "Bebidas est." in both places — the share-card
context isn't space-constrained.

### MINOR — `Es tuyo.` reads slightly flat

`onboarding.quickTips.tip4` (line 204):
> "Puedes exportar todo en cualquier momento. Es tuyo."

"Es tuyo" is grammatical but flat. Spanish often uses possessive
intensifiers ("Tu información, tuya", "Tus datos, tuyos") for this
"all of this is yours" emphasis.

**Recommendation:** "Puedes exportar todo en cualquier momento.
Es todo tuyo." (small adjustment, same length, more emphasis).

## Summary

10 findings: 2 MAJOR, 5 MEDIUM, 3 MINOR.

**Fixed in R21-A commit (mechanical):**
- #1 Configuración / Ajustes consistency
- #2 Recibo → Compromiso de confianza
- #3 Bienvenido → Te damos la bienvenida
- #4 intention_* parallelism (nouns)
- #5 30 días limpios → 30 días sin alcohol
- #6 más frecuente / más común consistency
- #7 ha cambiado → cambió (LATAM-friendly neutral)
- #8 Conteos → Recuentos
- #9 abbreviation consistency
- #10 Es tuyo → Es todo tuyo

**Deferred to R22:** the Disparador → Detonante migration (touches
~6 strings, needs cross-checking with recovery-counselor convention).

## Process notes

The Spanish locale is closer to English in literal translation
quality than French was — fewer "the words are correct but a native
speaker would phrase it differently" issues. The interesting
findings cluster around:

1. Inclusive-language pitfalls (Bienvenido)
2. Recovery-loaded vocabulary (limpios)
3. Spain-vs-LATAM register decisions (peninsular vs neutral)

For R22, recommend running the same pass on **de** (German). German
has its own version of the tu/Sie question (du/Sie) and a hard
preference for compound nouns where English uses phrases — both
likely to surface in any wellness app.
