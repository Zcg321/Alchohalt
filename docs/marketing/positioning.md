# Positioning — Alchohalt

Canonical reference for what Alchohalt **leads with** in user-facing copy.
Future copy work — App Store description, paywall, hero, blog, ads —
references this doc.

## The wedge (in priority order)

1. **Calm, no gamification.** No streak leaderboards, no XP, no levels,
   no "rocket emoji" celebration. Recovery isn't a video game. The
   competitor set (Sunnyside, Reframe, I Am Sober) leans heavily on
   gamified streak language; that pattern works for habit-tracking
   neutral-stakes domains and actively backfires for substance recovery.
2. **Curated crisis lines on every screen.** 988, SAMHSA, AA, SMART
   Recovery, plus international (AU, UK, CA, IE) regional resources.
   Always reachable via the "Need help?" pill in the header. Never
   gated, never paid, never behind a paywall, never A/B tested off.
3. **Calm, trusted-friend voice.** No exclamation marks in product
   copy. No "Unlock!" or "Upgrade now!" CTAs. The voice the user hears
   is the voice they'd want from a calm friend at 11pm after a hard day.

## What's a footnote, not a headline

**Zero-knowledge encryption / "cryptographically can't read it" / local-first.**

Per Wend+Alchohalt competitive research 2026-04-27: ZK matters to ~5%
of TAM. For that 5% it's load-bearing — they will not download an app
that can read their drinking data. For the other 95% it reads as a
proof-point, not a hook. Leading with it costs the headline real estate
that should be doing the calm-no-gamification-real-crisis-resources job.

**Where the encryption story still lives:**

- Onboarding Beat 3 (`OnboardingFlow.tsx` `BeatThree`) — dedicated
  proof-point beat, after calm + tracking-style beats land.
- About / Settings — full data-flow page for users who tap through.
- Privacy policy + consumer-health-data policy — the legal home of the
  story.
- Paywall footer — one calm line, after the price grid.

**Where the encryption story does NOT lead:**

- Today panel hero (the first thing every user sees)
- Paywall / SoftPaywall hero copy
- App Store / Play Store description first 60 chars (the search snippet)
- Blog post / press / ad headlines

## Voice rules

- No exclamation marks except the one allowed instance: in user-typed
  journal entries. Product copy uses periods.
- No emojis in CTAs, paywall, headers. Mood emojis in journal are fine.
- No "Premium" or "Pro" framed as status; framed as "more insights"
  with the calm-is-still-the-default promise.
- No "you have 0 days" framing. Day 0 is "fresh start"; restart day is
  "you're back," not "you broke your streak."
- No leaderboard language ever. Never "top 10%," "ranked," "vs others."

## Competitive positioning, in plain language

Compared to **Sunnyside / Reframe / I Am Sober**, Alchohalt is the calm
one with real crisis support and no gamification. Compared to
**DrinkControl** (the closest direct competitor, $24.99 lifetime, 4.0★,
2,218 iOS reviews), Alchohalt is the modern one with a clean design,
encrypted backup, and AI Insights. Compared to **the system Health app**,
Alchohalt is the dedicated tool with crisis infrastructure and goal
nuance the system app doesn't try to provide.

## Hero copy reference (current)

| Surface                          | Hero copy                                                  |
|----------------------------------|------------------------------------------------------------|
| Today panel (day-0 starting)     | "Calm tracking. No leaderboards. Real help if you need it." |
| Today panel (mid-streak)         | "Days alcohol-free" + day count                            |
| Today panel (restart)            | "You're back" + days-in-record                             |
| Paywall header                   | "A simple price." / "More insights, same calm. Never gamified." |
| Onboarding Beat 1                | "Hi. What brings you here today?"                          |
| App Store description opener     | See `docs/launch/app-store-description.md`                 |

When changing hero copy, update this table. The paired-test
`src/__tests__/positioning.test.ts` enforces that none of the listed
hero copies leads with "encrypted," "cryptographically," "ZK," or
"your data never leaves" — those phrases stay allowed elsewhere in
the app and in legal/onboarding/about pages.
