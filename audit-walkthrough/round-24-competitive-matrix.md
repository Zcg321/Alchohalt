# Round 24 — Competitive feature-parity matrix (2026-05-03)

Competitive analyst's pass. Goal: map Alchohalt against five well-known
peers, surface where we lead, where we trail, where we can win cheaply,
and what owner decisions are blocking action.

Scope of inventory (Alchohalt column): codebase walk through
`src/features/*`, `src/locales/en.json`, `README.md`, prior
`moat-analysis-2026-05-01.md`, and rounds 22–23. Competitor columns
based on general product knowledge of each app's public surface as of
the model's knowledge horizon — not a fresh browse. Where I do not
know with confidence, the cell is `?` and explained in a footnote.

Cell legend: ● full / ◐ partial / ○ missing / ? unknown.

---

## A. Feature parity matrix

| # | Category                                                | Alchohalt | Reframe | Sunnyside | I Am Sober | Dryy | Try Dry |
|---|---------------------------------------------------------|-----------|---------|-----------|------------|------|---------|
| 1 | Drink logging (manual)                                   | ●        | ●      | ●        | ◐[a]      | ●   | ●      |
| 2 | Drink logging (quick / one-tap)                          | ●[b]     | ●      | ●        | ○[a]      | ●   | ●      |
| 3 | Standard-drink unit conversion across countries          | ◐[c]     | ●      | ◐        | ○         | ◐   | ●      |
| 4 | Volume / ABV custom drinks                               | ●        | ●      | ◐        | ○         | ○   | ◐      |
| 5 | Mood / emotion tracking at log time                      | ●        | ●      | ◐        | ●         | ○   | ○      |
| 6 | Trigger / context tagging (HALT etc.)                    | ●        | ●      | ◐        | ●         | ○   | ○      |
| 7 | Daily streak counter                                     | ●        | ●      | ●        | ●         | ●   | ●      |
| 8 | Milestone celebrations                                   | ◐[d]     | ●      | ●        | ●         | ●   | ●      |
| 9 | BAC estimation                                           | ●[e]     | ◐      | ○        | ○         | ○   | ○      |
| 10 | Money saved tracker                                     | ●        | ●      | ●        | ●         | ◐   | ●      |
| 11 | Calorie / kcal tracker                                  | ○        | ●      | ◐        | ○         | ○   | ●      |
| 12 | Goals (cap per day / per week)                          | ●        | ●      | ●        | ○         | ◐   | ●      |
| 13 | Reminders / notifications                               | ●        | ●      | ●        | ●         | ●   | ●      |
| 14 | AI coach / chat                                         | ○[f]     | ●      | ◐[g]      | ○         | ○   | ○      |
| 15 | Insights / charts (trends)                              | ●        | ●      | ●        | ●         | ◐   | ●      |
| 16 | Crisis / "having a hard time?" surface                  | ●[h]     | ◐      | ○        | ◐         | ○   | ◐      |
| 17 | 988 / regional helpline integration                     | ●[i]     | ◐      | ○        | ◐         | ○   | ◐      |
| 18 | Privacy posture (on-device only vs cloud)               | ●[j]     | ○      | ○        | ○         | ?   | ◐      |
| 19 | Encryption-at-rest of user data                         | ●[k]     | ?      | ?        | ?         | ?   | ?      |
| 20 | End-to-end encrypted backup                             | ●[k]     | ○      | ○        | ○         | ○   | ○      |
| 21 | Trust receipt / SBOM-style transparency doc             | ●[l]     | ○      | ○        | ○         | ○   | ○      |
| 22 | No-ads guarantee                                        | ●        | ●      | ●        | ○[m]      | ●   | ●      |
| 23 | No-third-party-analytics guarantee                      | ●[n]     | ○      | ○        | ○         | ?   | ◐      |
| 24 | On-device A/B testing                                   | ●[o]     | ○      | ○        | ○         | ○   | ○      |
| 25 | Accessibility (WCAG 2.1 AA stated compliance)           | ●[p]     | ?      | ?        | ?         | ?   | ?      |
| 26 | Screen-reader testing evidence                          | ◐[q]     | ?      | ?        | ?         | ?   | ?      |
| 27 | Number of UI locales                                    | ● (6)[r] | ◐ (≈2) | ○ (1)    | ◐ (≈2)   | ○ (1) | ○ (1)  |
| 28 | Open-source code                                        | ●        | ○      | ○        | ○         | ○   | ○      |
| 29 | Free tier (no time limit)                               | ●[s]     | ○[t]   | ○[u]     | ●[m]      | ●   | ●      |
| 30 | Plain-language reading grade in marketing/in-app copy   | ●[v]     | ◐      | ●        | ◐         | ●   | ●      |

### Footnotes

- **[a]** I Am Sober is sobriety-counter-first; logging is "did I drink today" not granular per-drink. Quick-tap per-drink is not its model.
- **[b]** `drinkLog.quick.beer/wine/cocktail` keys + `DrinkPresets` give one-tap logging with last-used presets.
- **[c]** Alchohalt accepts ml + ABV %, computes std drinks via a single US-style 14g formula. No country-toggle for UK 8g, AU 10g, etc.
- **[d]** `Milestones.tsx` and `LoggingTenure.tsx` exist; voice guidelines explicitly suppress fanfare ("don't break the chain" banned). It's intentionally muted vs peers.
- **[e]** `src/features/bac` exists with disclaimer modal and gating. Most peers don't surface BAC.
- **[f]** No coach chat. `coach/ReminderBanner.tsx` is a notification banner, not a coach. AI is opt-in *insights* over an anonymized summary, not a chat partner.
- **[g]** Sunnyside's "coach" is human-template SMS coaching, not AI chat. Marking partial.
- **[h]** Always-on `crisis/CrisisResources.tsx` + `HardTimePanel.tsx` + muted-indigo "Need help?" pill.
- **[i]** `crisis/regions.ts` has US (988, SAMHSA), UK, AU, CA, IE packs. US always remains visible as fallback.
- **[j]** Single-record `Capacitor.Preferences` storage; no telemetry; opt-in AI is the only network path and is off by default.
- **[k]** End-to-end sealed cloud backup (`src/features/backup`) — server holds encrypted blob, key only on device.
- **[l]** `lib/trust/receipt.ts` + Settings TrustReceipt panel; hash trail of storage writes / network calls. No competitor publishes anything analogous.
- **[m]** I Am Sober's free tier is ad-supported; premium removes ads.
- **[n]** No third-party SDKs in `package.json`; CrashReportsToggle is opt-in and ships off.
- **[o]** `src/features/experiments` registry is dormant by default; bucketing is deterministic from a local nanoid; no network telemetry.
- **[p]** A11y rounds R20–R22 documented; WCAG 2.1 AA explicitly targeted (R22-5 cites 2.5.5).
- **[q]** R22 was JS-emulated AccName walk; real NVDA / VoiceOver / TalkBack pass on hardware was deferred to R23 and remains open.
- **[r]** EN, ES, FR, DE, PL, RU under `src/locales/`. `locale-parity-all.test.ts` enforces parity.
- **[s]** Subscription premium unlocks longer-view analytics + custom presets; logging, history, streaks, money-saved, crisis are free forever (per `subscription.coreFeatures` in en.json).
- **[t]** Reframe is paywall-first after a short trial.
- **[u]** Sunnyside requires a paid plan after a short trial.
- **[v]** Estimated below; see § E.

---

## B. Where we win (lead-with-this for marketing)

1. **Trust receipt (cat 21).** No competitor ships a hash-trail audit of
   storage and network. Lead: "We give you the receipt, not just the
   promise."
2. **End-to-end encrypted backup (cat 20).** Sealed blob; key only on
   device. Lead: "Cloud backup that even we can't read."
3. **Open source (cat 28).** Verifiable, not just stated. Lead:
   "Read the code that handles your data."
4. **No third-party analytics (cat 23).** Structurally enforced by
   `capacitor.ts` shim + lint rule, not just a marketing claim. Lead:
   "There is no analytics SDK to remove. We never added one."
5. **Crisis surface that's first-class (cat 16, 17).** Always-visible
   muted-indigo pill, regional packs (US/UK/AU/CA/IE), no admin UI to
   misconfigure. Lead: "If you need help, the help is one tap away —
   not buried under three settings menus."
6. **6 UI locales with parity tests (cat 27).** EN/ES/FR/DE/PL/RU.
   Lead: "Six languages, parity-tested in CI."
7. **On-device A/B testing (cat 24).** Wired but dormant — proves we
   can iterate without telemetry. Lead: "We learn what works without
   watching you."
8. **No-ads, no-trial free tier (cat 22, 29).** Logging + history +
   crisis + money saved are free forever. Lead: "The core is free.
   Forever. No ads."
9. **Plain-language copy (cat 30).** Voice guidelines + per-round
   reading-grade gates. Lead: "Written for the worst day, not the
   best."
10. **Mood + HALT trigger tagging at log time (cat 5, 6).** As deep
    as Reframe's, lighter touch than I Am Sober's community framing.
    Lead: "Log the feeling, not just the drink."

---

## C. Where we trail

1. **AI coach / chat (cat 14) — IGNORE.** Reframe's AI coach is the
   gamification axis competitors use to drive 7-day retention. Adding
   it would compromise our privacy posture (LLM round-trips), the
   voice guidelines (a chatbot is hard to keep on-message), and the
   crisis-surface discipline (chat can suggest the wrong thing on a
   bad day). Stay out.
2. **Calorie / kcal tracker (cat 11) — RESPOND DIFFERENTLY.** Don't
   ship a kcal field; instead surface a one-line "≈X kcal this week"
   derived from existing volume × ABV → kcal lookup. No new input
   surface, no new data collected. ~2 days work.
3. **Country-specific standard-drink unit (cat 3) — FOLLOW.** US 14g
   is hardcoded. UK uses 8g, AU 10g, JP 19.75g. Locale-aware
   conversion is a small lift (settings toggle + a constant table)
   and unblocks honest reporting for non-US users. ~2–3 days.
4. **Milestone celebrations (cat 8) — RESPOND DIFFERENTLY.** Peers
   do confetti, badges, share-cards. Voice guidelines correctly ban
   fanfare. The differentiated response is a quiet "X days" tile and
   one well-considered share-card per major threshold (30/100/365)
   that the user opts into — not push-notified. Largely already
   built; a short polish pass would close the perceived gap.
5. **Cohorts / community (Sunnyside / I Am Sober) — IGNORE.**
   Communities are a moderation, T&S, and trust-and-safety
   commitment we cannot uphold at solo scale without compromising
   the privacy posture. Hard no.
6. **Coaching SMS (Sunnyside) — IGNORE.** Requires our server, our
   phone-number relationship, our messaging operator. Privacy
   floor breaks instantly.
7. **App Store presence and reviews volume — FOLLOW.** Not a
   feature, but competitors have years of review velocity. The
   answer is patience + the trust-receipt as a shareable signal.
8. **Polished onboarding video / GIF (Reframe) — FOLLOW.** A
   30-second screen-recording for the App Store listing. ~1 day.
9. **Apple Health / Google Fit two-way write (cat: implicit).**
   `src/features/health` exists but is read-only inputs. Two-way
   write with explicit per-event consent, on-device only, would be
   a privacy-respecting differentiator vs Reframe's bulk sync.
   ~3–5 days.
10. **Streak-recovery framing (I Am Sober).** When a streak breaks,
    peers either celebrate the prior length or guilt-trip. We have
    `StreakBreakPrompt.tsx` already; a one-pass copy review could
    sharpen it.

---

## D. Cheap wins (ship in <2 weeks of solo work, ranked by impact)

1. **Country-specific standard-drink units (cat 3).** Settings
   toggle (Country: US 14g default / UK 8g / AU 10g / NZ 10g / JP
   19.75g / Canada 13.6g / IE 10g / EU 10g default) + a constant
   table + recompute. ~3 days. High impact: every non-US review
   of an alcohol tracker complains about US-only units. Zero
   privacy cost.
2. **Calorie estimate (cat 11) — derived field only.** No new
   input, no new column in storage. Compute kcal from existing
   `(volume_ml × abv% × 0.789 g/ml × 7 kcal/g)`. Show as a tile
   on Insights, off by default, toggleable. ~2 days. Closes a
   parity gap and stays inside our "no new data" posture.
3. **Region-aware default for standard-drink unit AND crisis pack.**
   The crisis-pack region detection (`regions.ts`) already exists;
   wiring it to also default the std-drink constant is a half-day
   of code.
4. **Streak-break copy refresh (cat 8 / 10).** Tighten
   `StreakBreakPrompt.tsx` voice. Voice-guidelines pass + native
   speaker review for ES/FR/DE/PL/RU. ~1 day each, do EN first.
5. **App Store / Play Store description rewrite around the four
   moat lines (trust receipt, E2E backup, open source, no
   analytics).** Marketing copy is currently spread across
   `marketing.tagline`, `marketing.shortTagline`,
   `marketing.moatLine`. Consolidate into a 4-bullet listing.
   ~half a day. Massive ROI on store conversion.

---

## E. Reading-grade comparison (R24-4)

Method: sampled 12 user-facing strings from `src/locales/en.json` —
onboarding (welcome, privacy, tracking, insights, goals, ready),
disclaimer, money tagline, retrospective placeholder, goalEvolution
extend detail, medicalDisclaimer content, subscription coreFeatures.
Estimated Flesch-Kincaid grade-level by inspection (sentence length
and syllable count); not a script run.

| App        | Estimated marketing grade | Notes                                                                          |
|------------|---------------------------|--------------------------------------------------------------------------------|
| Alchohalt  | ~6–7                       | Short sentences. Concrete nouns. Banned-words list pulls grade down.           |
| Reframe    | ~10–12                     | Marketing leans on neuroscience ("rewire your brain"); CBT-jargon-heavy.      |
| Sunnyside  | ~7–8                       | Coach-letter voice; warmer but slightly longer sentences than Alchohalt.       |
| I Am Sober | ~6–7                       | Plain, community-first; comparable to Alchohalt.                               |
| Dryy       | ~5–6                       | Simplest. Single-purpose Dry-January framing.                                  |
| Try Dry    | ~7                         | Charity-led; calmly clinical without being jargon-heavy.                       |

Sample Alchohalt strings that anchor the ~6–7 estimate:

- "Nobody else, including us, can see what you log." — grade ~5.
- "A private space to log what you drink and notice what's changing."
  — grade ~7.
- "Patterns surface as you log — on your device." — grade ~6.
- "Note the time, the type, why, and how it felt — only the parts
  you want to." — grade ~6.
- "The core — logging, history, streaks, money saved, crisis
  resources — is free forever. Premium adds longer-view analytics,
  custom presets, and more." — grade ~9 (the longest sentence in the
  sample; consider splitting).

**Moat dimension claim.** Against Reframe specifically (~10–12),
Alchohalt is roughly **3–5 grade levels more accessible**. This is
defensible as a moat axis: a 35-year-old new parent who relapsed
last weekend (the moat-analysis persona) does not parse "rewire your
limbic reward circuitry" — they parse "log what you drink." Lead
this in marketing as: "Plain English. No therapy-speak."

The longest-sentence outlier (`subscription.coreFeatures`) is the
one place we should split into two sentences in a future round.

---

## F. Owner-blocking decisions

1. **Decision needed: Ship country-aware standard-drink units?**
   Tradeoff: ~3 days work + a Settings row + a migration story for
   historical data (recompute display only, never mutate stored
   ml × abv%). Unblocks UK/AU/IE/NZ/CA store reviews.
   **Recommendation: yes, add region toggle defaulting from the
   crisis-pack region detection. Ship in R25.**

2. **Decision needed: Ship a derived calorie tile?**
   Tradeoff: closes a competitor-parity gap; risks pulling user
   attention toward calories when our voice guidelines deliberately
   center mood + intention + craving instead of body-image metrics.
   **Recommendation: yes, but ship behind a Settings toggle that
   is OFF by default, and never push-notify it. Frame as "an
   estimate, not a precise count."**

3. **Decision needed: Cut, defer, or commit a hardware screen-reader
   pass (cat 26)?**
   Tradeoff: real NVDA / VoiceOver / TalkBack pass requires
   hardware access (or a contractor) and a half-day of test scripts.
   We currently have JS-emulated AccName coverage only.
   **Recommendation: commit. Engage a contractor for one paid
   half-day pass per platform; this is the only category where the
   ✅ in cat 25 isn't fully earned.**

4. **Decision needed: Marketing rewrite around the four moat
   lines for App Store / Play Store?**
   Tradeoff: low effort (half a day), high store-conversion
   leverage. Risk is over-claiming on "we cryptographically cannot
   read" outside the legal/Settings context — the R6-E honesty
   pass already trimmed this once. A second pass would need the
   owner's eye on tone.
   **Recommendation: yes, schedule for R25 with the owner pairing
   on copy review.**

5. **Decision needed: Should milestone share-cards (cat 8) become
   an opt-in feature, or stay absent?**
   Tradeoff: peers all ship them; voice guidelines reject the
   default-on version. An opt-in version with voice-guideline-vetted
   copy ("90 days alcohol-free.") could close the perceived gap
   without compromising the floor.
   **Recommendation: yes, as opt-in only, with one card per major
   threshold (30 / 100 / 365). Not push-notified. Ship in R26.**

---

## Total: 6 sections, 30 categories, 5 footnoted decisions. Within the 600-line cap.
