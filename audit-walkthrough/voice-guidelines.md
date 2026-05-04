# Alchohalt voice & copy guidelines

**Date:** 2026-05-01
**Owner:** Whoever ships the next user-facing string.

## Who we're writing for

Someone who is trying to drink less. They might be cutting back, quitting, or just looking around. Read every line as if they're seeing it on a Friday night when they've already had two drinks and feel guilty. If a line sounds clinical, marketing-y, or fake-warm in that moment, it's not done.

## Tone

- **Warm, not chipper.** No exclamation points except for genuine emergencies and one or two earned moments.
- **Direct, not curt.** Short sentences are good. Cold sentences are not.
- **Honest about hard moments.** Don't pretend a relapse is a "reset." Don't pretend Day 1 is a win. Don't pretend curiosity is commitment.
- **Quiet by default.** The app should feel like a notebook, not a coach.

## Voice

- **Person:** Second-person ("you") for instructions and reflections. "We" sparingly — only when the brand is doing something for the user (e.g. "We don't see what you log"). Never "we're here for your journey."
- **Tense:** Present, mostly. Don't future-pace milestones we can't promise. "You've logged three days" beats "You're on your way to a healthier life."
- **Sentence case** for everything except proper nouns. "Log a drink." not "Log a Drink."
- **No emoji parade.** A single emoji can work in a high-stakes spot (📞 next to a crisis line). Never in regular UI copy. Definitely not in onboarding.
- **No exclamation marks** in onboarding, empty states, success toasts, or premium tiles. They sound desperate.

## Words we don't use

| Banned | Why | Use instead |
|---|---|---|
| "journey" / "wellness journey" | Marketing-speak. Presumes the goal. | The thing they're actually doing — "logging," "drinking less," "today" |
| "wellness companion" / "personal wellness" | Same. | Just describe what the app does |
| "mindfulness practice" | Clinical. | The specific action — "a moment to check in" |
| "your alcohol-free life" | Presumes commitment they haven't made | "today," "this week" |
| "Get Premium!" / "Upgrade now!" / "Unlock" + ✨ | Pushy, gamified | "Part of Premium." "See plans." Earn the click. |
| "We're here for you" | Empty | A specific thing we'll do |
| "Let's track your progress 🎯" | Coach voice | "Log your day if you'd like." |
| "Take a mindful moment" | Clinical | "Check in with yourself." |
| "amazing" / "fantastic" / "great job" | Hollow praise | The fact ("Three days.") |
| "Don't break the chain!" / "Keep your streak alive!" | Gamification panic | "Three days. Quiet wins count." |
| "cryptographically cannot read" (more than once) | Jargon when it appears 3+ times in 30 seconds | "Nobody else can see what you log." Save the technical version for legal/settings. |

## Words we do use

- **Small, real, observable nouns and verbs.** "Logged." "Three days." "Less than last week." "Beer." "Checked in."
- **"Log a drink"** as the default verb. Not "track," "record," "monitor."
- **"Today"** as the default time frame. Not "this period," "the current window."
- **"Drinks"** for drinks. Not "beverages," "consumption events," "drinking occasions" (except in legal/export).

## Specific copy areas

### Privacy claims

**Pick one site to say it loud, plain everywhere else.**

- Settings → Data Management is the canonical site for the technical claim. The legal pages can repeat it.
- Everywhere else (Day 0 hero, onboarding Beat 3, Today footer, sync panel, subscription footer) — use plain language. "Nobody else, including us, can see what you log." or shorter.

### Crisis

- Literal. Low-emotion. Action-first.
- Don't hedge. "If you need help right now: 988 (call or text)."
- Don't say "We're here for you" — point at someone who actually is.
- Crisis page is already strong; protect it from drift.

### Empty states

- Don't say nothing ("No data."). Don't sell ("Upgrade to see insights!").
- Earn the engagement: tell the user the smallest thing they can do, and what they'll see.
- Day 0 stats grid: "Log your first to see your week shape up." beats "0.0 std / 0.0 std / 0.0 std / $0."

### Errors

Every error message must answer:
1. **What happened** in plain words. Not "Error code 4xx." Not "An unexpected error occurred."
2. **What to try.** Not just "Try again." — what specifically? Reload? Check connection? Re-enter passphrase?
3. **How to reach help if it persists.** Link to the report path or crisis page if relevant.

### Onboarding chips

Chips are how we ask "what brings you here." They must:
- Sound like answers a person would actually give a friend, not a clinician.
- Avoid "Quitting" (too binary), "Just curious" (dismissive of intent), "Cutting back" (clinical).
- Cover the three modes: drinking less, stopping, looking around.

### Premium / paywalls

- No countdown. No scarcity. No "limited time." No "only 3 spots left." We're not running a flash sale.
- "Part of Premium." is enough. The CTA is "See plans," not "Unlock now!"
- Pricing copy says what it costs and what's free, not what they're missing.
- The annual / lifetime "savings" framing is fine — that's a fact, not a pressure tactic.
- No "✨ Premium" — the sparkle emoji reads as an upsell ad.

### Reminders & notifications

- Calm. "Log your day?" is fine. "Your wellness journey matters! 🌟" is not.
- Don't force feeling. Don't ask "How are you?" if we'll never read the answer.
- Default reminder body: "Log your day?" Variants for variety, not for urgency.

### Money

- Don't moralize spending. "You spent $X" is a fact, not a judgment.
- "Saved this month" is okay only when there's a real comparison baseline.

## Checks before shipping a string

1. **Read it aloud** as the Friday-night user above. If it makes you cringe, rewrite.
2. **Does the WHAT and WHY come from a real person's experience, or a marketing brief?** If brief, rewrite.
3. **Could a sentence be cut?** Cut it.
4. **Is there an exclamation point?** Justify it. If you can't, drop it.
5. **Is there an emoji?** Same.
6. **Does it presume the user's goal or future?** Pull back.

## Milestones — observation vs gamification (R16-1)

The line between "we're noting that this happened" (observation) and "you earned this badge" (gamification) is easy to slip across. Test every milestone copy against:

- **Subject of the sentence.** Observation says "this is the streak" or "this is the next marker." Gamification says "you reached!" or "you unlocked!"
- **Punctuation.** No exclamation marks on milestone surfaces. If a fact is genuinely worth a moment ("A year. Pause and let that land.") let the period carry it.
- **Verbs.** Replace "earn / unlock / win / score / level up / complete / claim" with "reach / pass / mark / log."
- **Countdown framing.** "X to go!" reads as a finish line. "X days from there" reads as a calendar fact. Default to the latter.
- **Comparative bragging.** Avoid superlatives ("longest ever", "best streak"). State the number.

Surfaces audited 2026-05-03:

| Surface | Status | Notes |
|---|---|---|
| `features/milestones/Milestones.tsx` | ✓ observation | Subtitles like "A year. Pause and let that land." pass. |
| `features/homepage/FirstMonthRibbon.tsx` | ✓ observation | "next milestone in 2 days" — calendar fact, no exclamation. |
| `features/homepage/LongTermActivityRibbon.tsx` | ✓ observation | Round-12 R12-1 already shipped this with weekly-shape orientation, no badge framing. |
| `features/insights/progressCards.tsx` `StreakMilestoneCard` | **fixed R16-1** | Was "Streak Milestone" / "{n} days to go!". Now "Current alcohol-free streak" / "{n} days from there". |
| `features/backup/BackupAutoVerifyRibbon.tsx` | ✓ observation | Backup status, not milestone — N/A. |

If a future milestone surface is added, run the five-question test above before merging.

## Locale style guide — French (R21-B)

Pinned by the R20-6 native-French-speaker judge + R21-B follow-up.
Apply when adding/editing strings in `src/locales/fr.json`.

- **Address: vous, never tu.** Vous is the canonical brand voice for
  the wellness/recovery context. R20-6 unified all tu-form strings
  to vous; new strings must match.
- **`intention_*` keys are nouns, not verbs.** R21-B fixed
  `intention_celebrate` (fêter → fête) and `intention_cope`
  (décompresser → détente) to keep the selection list parallel.
  Future intention values must be noun-form (or accept-as-fact
  adjectives like `social`).
- **"standard" stays invariable as an adjective.** Académie française
  rule: borrowed adjectives don't agree in number. R21-B fixed the
  one instance of "verres standards" → "verres standard" so all
  fr.json uses the same form. Don't write "boissons standards" or
  "verres standards" in new strings.
- **Avoid "À vous." standalone.** R21-B replaced
  `marketing.shortTagline` "Aucune publicité. Aucune analyse. À
  vous." with "Aucune publicité. Aucune analyse. Vos données." —
  same possessive concept, idiomatic French. Future taglines should
  prefer "Vos données." or "C'est à vous." over standalone "À vous."
- **No anglicisms in calm-tone strings.** R20-6 fixed "Reset de 90
  jours" → "Réinitialisation 90 jours." Avoid Reset, Tracker,
  Streak (use Série), etc. when a French equivalent reads cleanly.
