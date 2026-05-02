# Translator instructions — Alchohalt fr / de native review

> **TL;DR for the translator:** Read this page (5 min). Then open `review-{date}.md` and work top-down — onboarding first, settings last. Leave the English source unchanged. Mark concerns in the **Notes** column. Variables in `{{ ... }}` must survive translation literally.

---

## What Alchohalt is

Alchohalt is a private alcohol-tracking app. Users log drinks, see patterns over time, and work toward a personal goal (cut back, stop entirely, or just stay aware). The product position is:

- **Privacy-first.** Logs live on the user's device. The company cannot read them.
- **No gamification.** No "XP", no "levels", no scoreboards — round 11 explicitly removed those framings. Progress is shown through neutral metrics ("alcohol-free streak", "consistency score").
- **Crisis-aware.** When a user opens the Crisis tab repeatedly, the app surfaces a soft counselor prompt. The voice in those moments is calm and direct, not alarmed.

The translator should hold this position in mind. A translation that makes the app sound enthusiastic, sales-y, or paternalistic breaks the brand even if every word is correct.

---

## Voice baseline

### Default register
- **Calm, trusted-friend.** Not a therapist, not a coach, not a marketing voice. Imagine a friend who's been through this and knows when to speak and when to leave you alone.
- **Sentence-case headers.** Avoid Title Case. "Track your drinks" not "Track Your Drinks".
- **Periods on full sentences. No periods on labels** ("AF streak" — no period; "You logged 3 drinks today." — period).
- **No exclamation marks.** Anywhere. Including milestones.
- **No emoji-as-tone.** A "✓" or "—" glyph is fine where it carries data; "🎉" or "💪" never.

### Pronoun choice
- **French: tu / ton / ta.** This is a personal-care app, not a corporate product. Vous would feel cold and bureaucratic. The intimacy is intentional.
- **German: du / dein / deine.** Same reasoning. Sie creates distance the product specifically tries to avoid.
- The medical disclaimer is the **one exception** where slightly more formal phrasing reads better — but still tu/du, just less colloquial.

### What to translate, what to leave
- **Translate:** every UI string the user reads.
- **Leave verbatim:** "alchohalt" (brand), "988" / "SAMHSA" / "AA" / "SMART" (proper nouns), "AF" if the source uses it (it stands for "alcohol-free" — translate to "sans alcool" / "alkoholfrei" but keep "AF" as the abbreviation when it appears as a label).
- **Variables `{{n}}` `{{count}}` `{{label}}`:** preserve literally. You can move them inside the sentence but never remove or pluralize them away. Bad: "il y a 5 jours" hardcodes the number. Good: "il y a {{n}} jours".

---

## Per-surface tone (priority order — review in this sequence)

The surfaces below appear in the order they should be reviewed. The full machine pass for each surface is in `review-{date}.md`; this page just sets context so the table makes sense.

### 1. `onboarding` (HIGHEST PRIORITY)
The first 30 seconds of the user's relationship with the app. Every word here is over-weighted in the user's first impression.
- **Tone:** warm, low-pressure, no urgency. The app is patient.
- **Common mistake:** sounding like a sales funnel ("Get started today!"). Strip excitement.

### 2. `marketing`
Tagline + short description. Marketing copy is allowed to be slightly sharper than the in-app voice.
- **Voice:** confident, factual. The product position is the product. "No ads. No analytics." reads exactly the same in fr/de.

### 3. `goals` / `goalTemplates` / `goalEvolution` / `goal`
Goal-setting language. The user is making a personal commitment — so the voice respects that.
- **No streak-pressure.** Don't translate "Keep your streak alive!" — that wording was deliberately removed in round 8.
- **Compact.** These are template names; many appear in cards.

### 4. `stats` / `monthlyDelta` / `retrospective` / `analytics` / `money` / `history`
Tabular labels and chart legends. Short, sentence-case, no period.
- **Numbers report; they don't editorialize.** "Down 26%" is right; "Great job, down 26%!" is wrong.
- **Round 11 rename:** "Points" was renamed to "Consistency score" in English / "Score de régularité" in French / "Konstanz-Wert" in German. If you find any leftover "Points" references, flag them.

### 5. `iconThemes`
Settings-section voice: helpful, neutral.

### 6. `privacy` / `medicalDisclaimer`
Required disclosures. Tone is direct without alarm.
- The medical disclaimer is the one place slightly more formal phrasing reads better — but still tu/du.
- **Avoid jargon.** Privacy claims should be readable by a non-technical user.

### 7. `paywall` / `subscription`
Soft transactional. The product never pressures upgrades.
- **Cancellation phrasing reassures, not threatens.** "You can cancel anytime, nothing's lost when you downgrade" reads correctly. "Cancel before you're charged!" does not.

### 8. `diagnostics` / `settings` / `support` / `openSource`
Lowest-priority surfaces.
- **Diagnostics:** clinical neutral. The user is reading their own audit-trail data.
- **Support:** warm without being corporate. "We read your feedback ourselves" is the canonical line.
- **Open source:** matter-of-fact. The fact of being open-source is an artifact, not a brag.

---

## Workflow

1. Open `review-{date}.md` in any Markdown editor. The table is rendered side-by-side: English | Spanish (reference) | French | German | Notes.
2. Work top-down through surfaces. The order is the priority order above.
3. For each row, read English first. Read the Spanish row as a sanity check (Spanish has been native-reviewed).
4. Compare the French / German cells to the English source.
5. If correct → leave row alone.
6. If a tone or accuracy concern → write your suggestion in the **Notes** column. Be concrete: write the new translation, not "this needs work".
7. **Do not edit the English column.** Source of truth.
8. Save the file. Send it back.

The owner will diff your version against the original and merge your changes into `src/locales/fr.json` and `src/locales/de.json` using the keys in the leftmost column.

---

## Spanish reference

Spanish has been through native review. If you're unsure how a phrase should sound, the Spanish row is often a useful tone check — it has the right register for a Romance language and was reviewed by a native speaker in round 4. It's not authoritative for word choice (each language has its own idioms), but it's reliable for register.

---

## Round-11 changes worth knowing

- **"Points" → "Consistency score":** the only label change in round 11. New wording in en/es/fr/de is in the locale files; if the doc still shows "Points" anywhere, that's a regeneration bug, please flag.
- **CSV / JSON export are now free** (data ownership wedge). The subscription card copy was updated to "JSON + CSV export — your data is always yours." If French or German subscription card copy still implies CSV is premium, please update.
- **BAC disclaimer modal text** (`features/bac/BACDisclaimerModal.tsx`) is currently English-only. Translation is a future round; the modal isn't user-visible yet (the BAC feature itself isn't shipped). When it is, the disclaimer will need fr/de copies — the brief specifies the wording exactly.

---

## Questions or ambiguity

If you find a string where the English itself is ambiguous, leave a note in the row and flag it at the top of your returned file. The owner can fix the source rather than asking you to guess.

Thank you for reviewing — the app is meaningfully better with native fr/de copy.
