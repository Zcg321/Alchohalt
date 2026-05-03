# Copy rewrite decisions (2026-05-01)

For each rewrite, candidates are listed with rationale and the chosen winner. Keep this doc near the diff so future-you can re-derive any line.

## A. Privacy claim — pick one canonical site, plain everywhere else

**Canonical site:** Settings → Data Management. Keep "We cryptographically cannot read it." here so security-minded users see the strong claim. Tighten the surrounding sentences.

**Plain replacement** (the line shown in onboarding, on Day 0, in the sync panel, in pricing): something a friend would say.

Candidates:
1. "Nobody else, including us, can see what you log."
2. "We can't read what you log. Nobody else can either."
3. "What you log stays on your device. We can't read it."
4. "Your data stays on your device. We don't see it."

Winner — **#1: "Nobody else, including us, can see what you log."** — exactly what the brief proposed; conversational, no jargon, parses on first read. Use this verbatim everywhere except the canonical site and the formal privacy policy.

For the **canonical Settings copy** (A7), tighten:
- Before: "Your data is yours. We cryptographically cannot read it. Opt-in AI features (off by default) are the only thing that can change this — see AI Insights below. Not medical advice."
- After: "Your data stays on your device, encrypted with a key only you control. We cryptographically cannot read it. Opt-in AI features can change this — see AI Insights below. Not medical advice."

For the **subscription footer (A9)** — even shorter:
- "Payments handled by Apple / Google. Cancel any time from your device's subscription settings. Your data stays on your device — we can't read it. AI Insights is opt-in (Settings → AI)."

For the **subscription subhead (A8)** — shortest:
- "On any plan, your data stays on your device — we can't read it. AI Insights is opt-in."

For the **sync panel (A10)** — sync-specific honesty:
- "Backups upload encrypted with a key only you have. Off by default."

For the **disclaimer locale (A1)** — used in the Today footer card; keep "Not medical advice" framing but drop the technical phrase:
- "Your logs stay on your device. We can't read them. Not medical advice."

## B. Onboarding chips

The brief flagged the chips as clinical/survey-form. The three modes we're trying to cover:
- They're trying to drink less but not stop.
- They want to stop.
- They're scoping the app without commitment.

### Beat 1: "Hi. What brings you here today?"

**Chip 1: "Cutting back"** — replacing.

Candidates:
1. "Cutting back" (original)
2. "Trying to drink less"
3. "Drinking less than I do now"
4. "Wanting to drink less"
5. "Slowing down"

Rationale: "Cutting back" is fine but reads like a survey option. "Trying to drink less" is what someone would actually say to a friend over coffee. "Slowing down" is good but vaguer. "Drinking less than I do now" is honest but too long.

Winner — **#2: "Trying to drink less"**.

**Chip 2: "Quitting"** — replacing.

Candidates:
1. "Quitting" (original)
2. "Stepping away from drinking"
3. "Trying to stop"
4. "Done with drinking"
5. "Taking a break"
6. "Stopping for now"

Rationale: "Quitting" is a hard binary. People who've tried multiple times don't describe themselves as "quitting" — that word implies the day-1-this-time-it-sticks fantasy. "Trying to stop" matches the chip-1 voice ("Trying to drink less") and respects that this is hard. "Stepping away" is gentler but feels euphemistic. "Done with drinking" is too final for someone exploring. "Taking a break" works but doesn't claim long-term intent.

Winner — **#3: "Trying to stop"**. Pairs with chip 1 in voice; honest about effort; not binary; works for both first-attempt and nth-attempt users.

**Chip 3: "Just curious"** — replacing.

Candidates:
1. "Just curious" (original)
2. "Just looking around"
3. "Not sure yet"
4. "Just checking it out"
5. "Looking for now"

Rationale: "Just curious" reads slightly dismissive — "I'm not really one of *those* people, I'm just curious." "Not sure yet" honors that someone might be in a real moment of uncertainty. "Just looking around" is what the brief suggested and is fine but flatter.

Winner — **#3: "Not sure yet"**. It treats the user's ambivalence as a real position, not a footnote. Pairs with the warm, no-pressure voice of the other two.

**Final Beat 1 chips:** Trying to drink less / Trying to stop / Not sure yet.

### Beat 2: "How would you like to track?"

Original: "One day at a time" / "30-day reset" / "Custom goal".

- **"One day at a time"** — keep. It's earned, it's how people in recovery actually talk, it works for non-recovery users too.
- **"30-day reset"** — feels gimmicky. A "reset" implies starting over from a thing they need to start over from, which presumes a story we don't know. Candidates:
  - "30-day reset" (original)
  - "30 days off"
  - "A month off"
  - "Try 30 days"
  - "30-day stretch"
  - Winner — **"A month off"**. Plain. Doesn't presume narrative. "30 days off" is close; "A month off" is warmer.
- **"Custom goal"** — fine but stilted. Candidates:
  - "Custom goal" (original)
  - "Set my own"
  - "My own pace"
  - "Set a goal myself"
  - Winner — **"Set my own"**. Conversational; matches the speaking-to-a-friend register of the other two.

**Final Beat 2 chips:** One day at a time / A month off / Set my own.

### Beat 3 body

Body before: "We cryptographically cannot read what you log. Cancel anytime. Optional AI features (off by default) are the only thing that can change this — you control them in Settings."

Body after: "Nobody else, including us, can see what you log. Cancel anytime. Optional AI features (off by default) are the only thing that can change this — you control them in Settings."

### Modal sr-only label

Before: "Welcome to Alchohalt"
After: "Quick intro" — neutral, doesn't pretend it's a marketing welcome.

### Legacy onboarding locale keys (en.json)

These keys still ship in the bundle even though the new flow doesn't render most of them. `welcome.title` is referenced from the modal sr-only label; the rest are dead unless someone re-enables the carousel. Rewriting them anyway because (a) translators see them, (b) one nonzero risk of accidental render.

| Key | Before | After |
|---|---|---|
| onboarding.welcome.title | Welcome to Alchohalt | Welcome to Alchohalt (kept — proper noun + neutral) |
| onboarding.welcome.description | Your personal, private wellness companion for building healthier drinking habits. | A private space to log what you drink and notice what's changing. |
| onboarding.privacy.title | Your Privacy Matters | Your data, your device |
| onboarding.privacy.description | Your data is yours. We cryptographically cannot read it. Optional AI features (off by default) are the only thing that can change this — you control them in Settings → AI. | Nobody else, including us, can see what you log. Optional AI features (off by default) are the only thing that can change this — you control them in Settings → AI. |
| onboarding.tracking.title | Smart Tracking | Log what you drink |
| onboarding.tracking.description | Log drinks with intentions, HALT triggers, and craving levels to understand your patterns. | Note the time, the type, why, and how it felt — only the parts you want to. |
| onboarding.insights.title | Personalized Insights | What changes over time |
| onboarding.insights.description | On-device pattern analytics by default. Optional AI Insights (off until you enable it) can generate written reflections from anonymized summaries. | Patterns surface as you log — on your device. Optional AI Insights (off until you enable it) can write a reflection from an anonymized summary. |
| onboarding.goals.title | Set Your Goals | Set a target if you want one |
| onboarding.goals.description | Create personalized goals and track your progress with motivating streak counters. | Pick a daily limit or a streak length. You can change either anytime, or skip this entirely. |
| onboarding.ready.title | You're All Set! | Ready when you are |
| onboarding.ready.description | Ready to start your wellness journey? Your first log is just a tap away. | Add your first entry whenever you'd like. Or just look around. |
| onboarding.quickTips.title | Quick Tips | A few notes |
| onboarding.quickTips.tip1 | Start with small, achievable goals | Start small. You can change the goal later. |
| onboarding.quickTips.tip2 | Log honestly for better insights | The patterns you see are only as honest as the entries. |
| onboarding.quickTips.tip3 | Check your progress regularly | Glance at the trends when you remember. There's no scoreboard. |
| onboarding.quickTips.tip4 | Export your data anytime for backup | You can export everything anytime. It's yours. |

## C. Day 0 stats grid

Brief: replace the three "0.0 std" placeholders with copy that earns engagement.

Approach: when there are zero drinks logged ever, replace the three stat tiles with one quiet, honest line. Keep the layout but collapse the four-zero placeholder to one centered prompt.

Candidates:
1. "Log your first to see your week shape up."
2. "Add an entry and your trends start filling in here."
3. "Patterns show up here once you've logged a few."
4. "This is where today, your week, and your month show up — once there's something to count."

Winner — **#1** with a soft second line. "Log your first to see your week shape up." (full grid) followed by a smaller "Today, 7 days, and 30 days will fill in as you log."

Implementation: when `drinks.length === 0`, render a single full-width tile in place of the three Stat tiles, with the prompt copy and a primary-but-quiet visual. Otherwise show the existing three tiles.

## D. Subscription / paywall

### D6-D8: PremiumGate `UpgradePrompt`

- Title: "Upgrade to Premium" → "Part of Premium"
- Body: "This feature is available in our premium plan." → "Unlocks with any paid plan."
- CTA: "Learn More" → "See plans"

### D9-D10: drop sparkle ✨ on PremiumGate badge and prompt

`✨ Premium` → `Premium`.

### D13-D16: free fallback in PremiumDataExport / PremiumMoodTracking

- Title in `PremiumDataExport` (D14): "Premium Data Export" → "Data export & reports". (Premium framing already conveyed by the Part-of-Premium pill.)
- Body in `PremiumDataExport`: "Export your progress data in multiple formats for healthcare providers, personal records, or analysis." → "Export your logs as PDF, CSV, or JSON — for doctors, your own records, or another tool."
- CTA: "Upgrade to Premium" → "See plans"

- Title in `PremiumMoodTracking` (D15): "Premium Mood & Trigger Tracking" → "Mood & trigger patterns".
- Body: "Identify your drinking triggers and get personalized insights about mood patterns and correlations." → "Tag triggers and see which ones line up with the days you drank more."
- CTA: "Upgrade to Premium" → "See plans"

### D17-D20: PremiumWellnessDashboard premium gate

The whole "🏥 Premium Wellness Dashboard / Get comprehensive health insights, wellness tracking, and AI-powered recommendations to optimize your physical and mental wellbeing" tile is the most marketing-y surface in the app. Reframe it.

- Title: "Premium Wellness Dashboard" → "More patterns, longer view"
- Body: "Get comprehensive health insights, wellness tracking, and AI-powered recommendations to optimize your physical and mental wellbeing." → "A longer view of your trends — sleep timing, stress triggers, and how social situations show up. Not medical advice."
- CTA: "Upgrade to Access" → "See plans"
- Drop the 🏥 emoji
- Bullets: keep — they're already softened and honest. Just sentence-case "Long-term trend insights across months" → already sentence case, leave.
- Live (premium) header at line 314: "🏥 Wellness Dashboard" → "Patterns over time"
- Live subhead at line 318-320: "Comprehensive health and wellness insights powered by AI analysis" → "Patterns from your last 30 days. Not medical advice."

### D4: yearly highlight badge

- "Most Popular" → "Most popular" (sentence case, per voice rule)

## E. Crisis

No rewrites — protect from drift.

## F. Errors (ExportImport.tsx)

The (a) what (b) try (c) help bar. Replacing alert()s with structured messages.

- F4 export error: `Export failed: ${msg}` → `Couldn't save your export — ${msg}. Try again, or report this if it keeps happening: https://github.com/Zcg321/Alchohalt/issues`
- F5 invalid JSON: `Invalid JSON file` → `That file isn't valid JSON. Make sure you picked an Alchohalt export, not a different file type.`
- F6 validation: `Import validation failed: ${msg}` → `Couldn't read the file: ${msg}. The export may be from an older version, or the file got modified.`
- F7 success: `Import completed successfully` → `Import complete.`
- F8 import error: `Import failed: ${msg}` → `Couldn't finish the import — ${msg}. Your existing data wasn't changed.`

## G. Notifications

`notify.ts` lines 121-124 — replace the four chipper messages.

Candidates:
1. ("How's your day going? Take a moment to check in 🌟") → "Log your day if you'd like."
2. ("Time for a mindful moment - how are you feeling? 💭") → "How's today going?"
3. ("Your wellness journey matters. Ready to log today's progress? 📊") → "A quiet moment to log."
4. ("Taking care of yourself today? Let's track your progress 🎯") → "Log when you're ready — no rush."

Winners as listed. All four kept (they rotate by index so they need to remain four), but voice flipped from coach to friend, no emoji.

## H. Buzzword cleanup

| Loc | Before | After |
|---|---|---|
| LegalLinks.tsx:16 | Alchohalt keeps wellness data on-device by default. Opt-in AI features can change this — see Settings → AI. Not medical advice. | Your logs stay on your device by default. Opt-in AI features can change this — see Settings → AI. Not medical advice. |
| HealthIntegrations.tsx:93 | Connect with health platforms to sync your wellness data. | Connect with health platforms to bring in steps, sleep, and heart-rate alongside your logs. |
| PrivacyPolicy.tsx:24 (`privacy.policy.overview.content`) | Alchohalt is designed with privacy as a core principle. We believe your personal wellness journey should remain completely private and under your control. | Alchohalt is designed with privacy as a core principle. What you log is personal, and we believe it should stay private and under your control. |

## I. Recommendations (`SmartRecommendations.tsx`)

| Loc | Before | After |
|---|---|---|
| 45 | Approaching daily limit | Close to your daily limit |
| 46 | "You've had ${todayStd} of your ${cap} daily limit. Consider an alcohol-free option for the rest of today." | "You've had ${todayStd} of ${cap} today. The rest of the day works fine without another." |
| 64 | Weekend Strategy Needed | Weekends tend to add up |
| 65 | "You tend to drink more on weekends. Consider planning alcohol-free activities or setting a specific weekend limit." | "Your weekend numbers run higher than weekdays. Worth picking one weekend activity that doesn't involve a drink — or setting a weekend limit." |
| 79 | Craving Management Tips | High cravings recently |
| 95 | Keep Your Streak Going! | ${currentStreak} days in |
| 97 | "You're ${currentStreak} days alcohol-free. You're doing great! Each day gets easier." | "${currentStreak} alcohol-free days. The hardest stretch is usually the first week — you're past it." |
| 105 | Try Alternative Activities | An alternative when the craving's there |
| 107 | "Consider planning enjoyable alternatives when you feel like drinking: go for a walk, call a friend, or try a new hobby." | "When the craving shows up: a walk, a call to someone, anything that buys you ten minutes." |
| 117 | Budget Alert | Over your monthly budget |
| 118 | "You've spent $${spent} on alcohol this month, which is over your $${budget} budget." | "You've spent $${spent} this month — past your $${budget} budget." |
| 161 | "Great job! No urgent recommendations right now. Keep up the good work!" | "Nothing flagging right now. The patterns you've built are doing the work." |
| 258 | Manage Hunger-Triggered Drinking | Hungry shows up a lot |
| 259 | "Keep healthy snacks ready and eat regular meals. Low blood sugar can trigger alcohol cravings." | "Eating regular meals takes the edge off — low blood sugar can mimic a craving." |
| 262 | Channel Your Anger Differently | Angry shows up a lot |
| 263 | "Try physical exercise, deep breathing, or journaling when you feel angry instead of reaching for alcohol." | "When the anger's loud, anything physical helps — a walk, push-ups, even just stepping outside." |
| 266 | Combat Loneliness Proactively | Lonely shows up a lot |
| 267 | "Schedule regular social activities or video calls with friends. Loneliness is a common drinking trigger." | "Reaching out to one person — even just a text — usually helps more than waiting for them to reach out first." |
| 270 | Address Fatigue First | Tired shows up a lot |
| 271 | "Prioritize sleep hygiene and rest. Being tired makes it harder to resist cravings." | "Tired makes everything harder to resist. Sleep is upstream of most of this." |

## J. Misc

| Loc | Before | After |
|---|---|---|
| en.json:148 (onboarding.welcome.description — covered in B) | (covered) | (covered) |
| en.json:202 (subscription.coreFeatures) | Core habit tracking features remain free forever. Premium features enhance your experience with advanced analytics and insights. | The core — logging, history, streaks, money saved, crisis resources — is free forever. Premium adds longer-view analytics, custom presets, and more. |
| en.json:203 (subscription.cancellation) | Subscriptions can be cancelled anytime through your device's subscription settings. No data is lost when downgrading. | You can cancel anytime from your device's subscription settings. Nothing's lost when you downgrade. |
| en.json:186 (medicalDisclaimer.emergency) | If you are experiencing a medical emergency or need immediate help with substance use, please contact emergency services or a healthcare professional immediately. | If you're in a medical emergency or need urgent help with substance use, contact emergency services or a healthcare professional right now. The Crisis tab has direct numbers. |

## K. Spanish locale (es.json)

For every key changed in en.json, update es.json with a faithful translation. The voice rules apply in Spanish too — no "viaje de bienestar" / "compañero de bienestar" / "experiencia."

| Key | en (after) | es (after) |
|---|---|---|
| disclaimer | Your logs stay on your device. We can't read them. Not medical advice. | Tus registros se guardan en tu dispositivo. No podemos leerlos. No es consejo médico. |
| onboarding.welcome.description | A private space to log what you drink and notice what's changing. | Un espacio privado para registrar lo que bebes y ver qué va cambiando. |
| onboarding.privacy.title | Your data, your device | Tus datos, tu dispositivo |
| onboarding.privacy.description | Nobody else, including us, can see what you log. Optional AI features (off by default) are the only thing that can change this — you control them in Settings → AI. | Nadie más, ni nosotros, puede ver lo que registras. Las funciones de IA opcionales (desactivadas por defecto) son lo único que puede cambiar esto — tú las controlas en Configuración → IA. |
| onboarding.tracking.title | Log what you drink | Registra lo que bebes |
| onboarding.tracking.description | Note the time, the type, why, and how it felt — only the parts you want to. | Anota la hora, el tipo, el porqué y cómo te sentiste — solo lo que quieras. |
| onboarding.insights.title | What changes over time | Lo que cambia con el tiempo |
| onboarding.insights.description | Patterns surface as you log — on your device. Optional AI Insights (off until you enable it) can write a reflection from an anonymized summary. | Los patrones aparecen a medida que registras — en tu dispositivo. Las Perspectivas con IA opcionales (desactivadas hasta que las habilites) pueden escribir una reflexión a partir de un resumen anonimizado. |
| onboarding.goals.title | Set a target if you want one | Pon una meta si quieres |
| onboarding.goals.description | Pick a daily limit or a streak length. You can change either anytime, or skip this entirely. | Elige un límite diario o la duración de una racha. Puedes cambiar cualquiera en cualquier momento, o saltarte esto. |
| onboarding.ready.title | Ready when you are | Cuando quieras |
| onboarding.ready.description | Add your first entry whenever you'd like. Or just look around. | Añade tu primer registro cuando te apetezca. O simplemente mira por aquí. |
| onboarding.quickTips.title | A few notes | Unas notas |
| onboarding.quickTips.tip1 | Start small. You can change the goal later. | Empieza con poco. Puedes cambiar la meta luego. |
| onboarding.quickTips.tip2 | The patterns you see are only as honest as the entries. | Los patrones son tan sinceros como los registros. |
| onboarding.quickTips.tip3 | Glance at the trends when you remember. There's no scoreboard. | Mira las tendencias cuando te acuerdes. No hay marcador. |
| onboarding.quickTips.tip4 | You can export everything anytime. It's yours. | Puedes exportar todo en cualquier momento. Es tuyo. |
| privacy.onDevice (canonical) | Your data stays on your device, encrypted with a key only you control. We cryptographically cannot read it. Opt-in AI features can change this — see Settings → AI for the full data flow. | Tus datos están en tu dispositivo, cifrados con una clave que solo tú controlas. Criptográficamente no podemos leerlos. Las funciones de IA opcionales pueden cambiar esto — consulta Configuración → IA para ver el flujo completo de datos. |
| privacy.dataControl | (kept — already plain) | (kept) |
| support.description | We read your feedback ourselves. It shapes what gets built. | Leemos tus comentarios nosotros mismos. Dan forma a lo que se construye. |
| subscription.coreFeatures | The core — logging, history, streaks, money saved, crisis resources — is free forever. Premium adds longer-view analytics, custom presets, and more. | Lo esencial — registros, historial, rachas, ahorros, recursos de crisis — es gratis para siempre. Premium añade análisis a largo plazo, presets personalizados y más. |
| subscription.cancellation | You can cancel anytime from your device's subscription settings. Nothing's lost when you downgrade. | Puedes cancelar cuando quieras desde la configuración de suscripciones de tu dispositivo. No se pierde nada al cambiar a un plan menor. |
| medicalDisclaimer.emergency | If you're in a medical emergency or need urgent help with substance use, contact emergency services or a healthcare professional right now. The Crisis tab has direct numbers. | Si tienes una emergencia médica o necesitas ayuda urgente con el uso de sustancias, contacta con servicios de emergencia o un profesional de la salud ahora mismo. La pestaña de Crisis tiene números directos. |


## L. R16-A — third arm on the chip-copy A/B (2026-05-03)

The 15-judge designer-judge in `round-15-fifteen-judges-2026-05-03.md` flagged the R15-B `first-person` variant ("I want to drink less") as more declarative than the control's hedged "Trying to drink less." Both shipped; both gather exposures locally. Round 16 widens the test to three arms so the data shows whether a gentler first-person form lands closer to control or to first-person.

| Arm | cut-back | quit | curious |
|---|---|---|---|
| `control` (since R15-B) | Trying to drink less | Trying to stop | Not sure yet |
| `first-person` (since R15-B) | I want to drink less | I'm stopping for now | I'm here to learn |
| `first-person-trying` (R16-A) | I'm trying to drink less | I'm pausing alcohol for now | I'm just looking around |

Why this third arm and not just two: the existing two arms test third-person-vs-first-person AND hedged-vs-declarative as a single change. `first-person-trying` decouples them. If first-person-trying outperforms first-person, the lift is from voice (first-person feels owned). If first-person beats first-person-trying, the lift is from declaration (commitment language matters more than hedging). Without this arm, R15-B's data conflated the two.

Voice gates checked:
- No marketing voice. ✓
- "Pausing alcohol for now" instead of "stopping" — alcohol-specific, present-continuous, defuses finality. ✓
- "Just looking around" instead of "here to learn" — drops any teacher/student framing; matches the bottom skip-explore link voice. ✓

Variant assignment is uniform 1/3 (no weights). Existing buckets keep their R15-B assignment when possible; users newly hashing into the third arm see the new copy. Determinism: stable per device, per the R14-4 contract.

