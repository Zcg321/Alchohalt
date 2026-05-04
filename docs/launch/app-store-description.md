# App Store + Play Store description

Owner-action: paste these into App Store Connect and Play Console.

Positioning canon: `docs/marketing/positioning.md`. Round 25 (R25-D)
rewrites this around the top-5 moat rotation from
`audit-walkthrough/round-24-moat-features.md`:

1. **M3 No third-party analytics** — easiest to verify, hardest for
   competitors to match (most ship Firebase + Mixpanel by default).
2. **M2 End-to-end encrypted backup** — most concrete user benefit;
   the server only ever holds ciphertext.
3. **M4 Always-on crisis surface** — emotional differentiator;
   never feature-flagged, never paid, never behind a paywall.
4. **M1 Trust Receipt** — for the technically inclined; auditable
   log of every storage write and network call.
5. **M8 Plain-language copy** — meta-feature; reading-level
   ~grade 6, no clinical jargon, no recovery-program slang.

The pre-R25 version led with "calm voice + no gamification" — true
and good, but doesn't differentiate from competitors who also use a
calm voice. The moats are what nobody else can copy in a sprint.

## Search-snippet opener (first ~60 chars — what users see in search)

> No analytics. Encrypted backup. Crisis lines on every screen.

Cut to fit each store's snippet length cleanly:

- **App Store (subtitle, 30 chars):** "No ads. No analytics. Yours."
- **Play Store (short description, 80 chars):** "Alcohol tracker with zero analytics, encrypted backup, and crisis lines on every screen."

## Long description

```
Zero analytics. End-to-end encrypted backup. Crisis lines on every
screen. The alcohol tracker that doesn't track you.

WHY THIS APP IS DIFFERENT

→ No third-party analytics. None. Not Firebase, not Mixpanel, not
  Sentry-by-default. The app's network code is auditable on GitHub —
  every fetch is for a feature you opted into. We can't sell what we
  don't collect.

→ End-to-end encrypted backup. When you turn on cloud backup, your
  data is encrypted on your device with a key only your device holds.
  The server stores ciphertext. We could read your backup file the
  same way we could read a sealed envelope — we can't.

→ Crisis support is on every screen. Tap "Need help?" in the header
  from any tab and the breathing timer, 988, SAMHSA, and Crisis Text
  Line are one tap away. Never gated, never paid, never behind a
  feature flag. Region packs cover US, UK, AU, CA, IE; you can paste
  your local hotline if we don't have one.

→ Trust Receipt. The Settings panel includes a read-only "what is
  this app doing right now" view: which storage keys are written,
  which network calls fire, which notifications are scheduled, which
  experiment buckets you're in. The audit panel is the receipt.

→ Plain language. No "powerful insights." No "transformative
  journey." No clinical jargon. The copy is at a sixth-grade reading
  level so anyone reaches the doors that matter.

WHAT YOU GET FREE FOREVER

Drink log, history, AF-day streak, money saved, basic journal,
biometric lock, one reminder, full data export (JSON + CSV), and
every crisis resource. The free tier never moves features into paid.
Your data — including exports — stays free, always.

PREMIUM ADDS

Mood/drink correlations, multi-reminders, PDF report export, end-to-
end encrypted backup, custom drink presets, advanced visualizations,
icon themes, and opt-in AI Insights (off by default; processes only
anonymized summaries when explicitly enabled).

— Lifetime: $69 once. Pay once, yours forever, no subscription trap.

ON THE DIFFICULT DAYS

Recovery isn't a video game. We don't celebrate your streak with a
rocket emoji. We're a calm, useful tool — and on the days that
aren't easy, real support is one tap away. The "Need help?" pill in
the header opens the right-now panel: a 1-minute breathing timer,
direct dial to 988 / Crisis Text Line / SAMHSA, and a "stop tracking
until tomorrow" button that hides the dashboard until midnight with
nothing logged.

PRIVACY POSTURE

Your data stays on your phone. We cryptographically cannot read what
you log. The Settings → Diagnostics audit panel shows you what the
app is doing right now — which notifications are on, your
accessibility settings, your active locale, your A/B exposures — in
one read-only view. End-to-end encrypted backup is opt-in. AI
Insights is opt-in. Crisis resources work offline.

No ads. No analytics. Not now, not when we're profitable, not ever.
```

## What changed in R25-D (don't paste this section)

R24-2 produced the moat-features doc + recommended marketing rotation.
The pre-R25-D description led with "calm + no-gamification + real-
crisis-resources" — good differentiators against the gamified
competitors (Reframe, I Am Sober) but invisible against the calmer
ones (Wend, Sober Time). R25-D leads with M3 (no analytics) — the
single hardest moat for competitors to copy because they've already
shipped Firebase. Once a user reads "no third-party analytics," the
rest of the description sells itself.

Subtitle / short description guidance unchanged:
- App Store subtitle is 30 chars max.
- Play Store short description is 80 chars and shows above the long
  description.

## Sign-off

R25-D is shipped as a doc-only change. Owner-action: paste the
new long description into App Store Connect and Play Console at the
next listing update. The pre-R25-D version is preserved in git
history (`docs/launch/app-store-description.md@354b494`) if a
rollback is wanted.

— Round 25 audit, 2026-05-04
