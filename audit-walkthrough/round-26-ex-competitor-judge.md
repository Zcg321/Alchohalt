# Round 26 — 26th judge: Ex-Reframe / ex-Sunnyside user

**Date:** 2026-05-04
**Persona:** A 38-year-old new parent who tried Reframe for ~5
weeks, then Sunnyside for ~3 weeks, then bounced. They're trying
Alchohalt because a friend (or a podcast, or a search result)
mentioned the privacy posture. They've already been onboarded into
two competitors recently — they know what they're "supposed" to
see, and what they're not going to find here.

This judge's job is to walk the app from that exact frame, surface
what confuses them, what features they expect that we don't have,
and what we do better.

## 1. First-run cold install (T+0 to T+90 seconds)

### What they expect (from Reframe / Sunnyside)

- A welcome video or animated intro
- A pre-onboarding survey (drinks per week? wake time? gender?)
- A goal-setting flow that ends with "great, you're aiming for X"
- A celebratory "you're all set!" screen
- A push-notification permission prompt
- An invitation to add their email / sign in

### What they actually see

- "Welcome to Alchohalt" headline
- "A private space to log what you drink and notice what's
  changing." — one sentence
- A 6-step onboarding (welcome → privacy → tracking → insights →
  goals → ready) they can skip at any step
- "Skip and explore" / "Just show me the app" first-class

**Judge reaction:** *"Wait, where's the survey? They didn't ask
me anything. Did I miss a step?"* Then: *"Actually, no — they
literally don't have anything to ask me yet."* Then: *"That's
kind of great."*

**Risk:** The user has been trained by competitors to expect a
"more engaged" onboarding. Our calm-first onboarding might
register as "thin" before it registers as "respectful." 

**Mitigation already in place:** The R23-C / R25-G pinned A/B
winner "first-person-trying" intent step gives the user one
meaningful question that doesn't feel like a survey. The R23-C
"Decide later" tertiary path explicitly accepts non-decisions.
The R25-2 funnel surfaces the 'Decide later' tap count so the
owner can monitor.

**No fix needed.** The voice is doing what it's supposed to do.

## 2. Privacy claim — believing it (T+2 to T+5 minutes)

### What they expect

- A privacy policy linked in the footer that they won't read
- A vague "we take your privacy seriously" page
- An ambiguous toggle for "share data with researchers" buried in
  Settings

### What they actually see

- "Nothing leaves your device." pinned at the top of Settings →
  Privacy & data (R26-B, this round)
- "How can I verify this?" expand with three concrete steps
- PrivacyStatus rows showing every optional network feature, what
  "active" vs "off" means, current state
- TrustReceipt panel they can read or print

**Judge reaction:** *"Wait, I can actually verify this myself? In
the browser devtools? They literally tell me how?"* Then opens
devtools. Then sees only static asset requests. Then: *"Holy
crap."*

**Risk:** Reading the verification steps requires technical
literacy a 38-year-old new parent might not have. The "open
devtools" step is the moat-y bit that distinguishes us, but it's
also the bit a non-technical user can't do.

**Mitigation already in place:** The TrustReceipt is a
print-ready summary of every claim that doesn't require devtools.
The PrivacyStatus row-by-row rendering shows the binary "active /
off" state for each feature without needing devtools.

**Possible R27 enhancement:** A "show me a video of the network
tab" link that demos what the user would see. Defer; not
blocking.

## 3. Logging the first drink (T+5 to T+8 minutes)

### What they expect

- Reframe: a chat-style "what did you drink?" with NLP parsing
- Sunnyside: a structured form with last-drink-as-default
- Both: a celebration/animation after submit

### What they actually see

- A Track tab with either the detailed form (default) or the
  R23-D quick-log chips (if the user opted in)
- Numerical inputs for volume + ABV
- Optional intent / craving / HALT fields, progressively
  disclosed
- A calm "Logged at HH:MM" confirmation, no celebration

**Judge reaction:** *"Volume in ml? I don't know what 12oz is in
ml."* Then: *"Wait, I can change to UK units?"* Then notices the
R26-A std-drink explainer. Then: *"OK, that's actually clearer
than what Reframe said. They just told me 'one drink' without
defining it."*

**Risk:** The detailed form's numerical inputs ARE more friction
than competitor "tap a button" workflows. The R23-D quick-log
mode addresses this; the user has to discover it.

**Mitigation already in place:** R24-FF1 surfaces the "quick-log
mode is available" hint after ≥7 logged detailed-mode drinks.
R26-A std-drink explainer makes the volume/ABV->std drinks math
legible.

**Recommendation:** Consider promoting the quick-log toggle to a
first-run option in onboarding (currently buried in Appearance
Settings). This is a meaningful R27 candidate. *Not blocking R26.*

## 4. The crisis surface (T+8 minutes, hypothetical bad day)

### What they expect

- A buried "support" link in some menu
- Maybe a vague "if you're struggling, see a doctor" message
- Reframe / Sunnyside: nothing first-class for crisis

### What they actually see

- A subtle "Need help?" pill in the global header on every tab
- One tap: HardTimePanel with concrete distress-options
- One more tap: regional crisis-line directory (US / UK / AU /
  CA / IE)
- HALT trigger card with the round-25-3 plain-language fix
  ("Hungry, Angry, Lonely, Tired — common drinking-urge triggers")

**Judge reaction:** *"Oh wow. This is the only one of these that
takes the bad-day case seriously. Reframe just keeps coaching me
toward 'reframing.' Sunnyside has nothing."* Then: *"And it's
not pushy — the pill is muted, not flashing red."*

**No risk.** This is the surface where we actively dominate. The
R25-3 plain-language fix is exactly what a non-technical user
needs.

## 5. Goals & retention (T+1 week)

### What they expect

- Reframe: daily push notifications with "your streak is at risk!"
- Sunnyside: SMS coaching messages, sometimes 3-5x/week
- Both: a points / level / badge system that nudges them to log

### What they actually see

- Optional reminder times the user opted into (off by default)
- No streak-anxiety messaging — voice guidelines explicitly
  banned "don't break the chain"
- Money-saved tile + AF-days tile, observational
- The R25-H sample-data preview if they haven't logged enough yet

**Judge reaction:** *"They're not nagging me. I haven't logged in
3 days and they haven't sent me a single push. Is the app even
working?"* Then: *"Actually, this is what I always wanted but
never said out loud. The streak anxiety from Reframe was making
me skip days because I'd rather feel nothing than feel guilty."*

**Risk:** A subset of users genuinely want the gamification nudge.
Without it, they may bounce in week 2 or 3 because the app feels
"cold." Our R24-3 NPS pulse and R26-1 satisfaction signal will
catch this in the local-only data the owner can review.

**Mitigation already in place:** The voice is *intentional*, not
accidental. Voice-guidelines.md spells out why. R25-D App Store
description leads with "Recovery isn't a video game" — pre-warns
people who want gamification that they're in the wrong app.

**No fix needed.** The user's bounce risk is the cost of holding
the voice line; R25-D self-selects in the right users at install
time.

## 6. Migration affordances — what makes switching painless

The judge's most actionable observation: nothing in the app
addresses "I'm coming from another tracker and have history I
want to bring over."

### What's missing

- No "import from Reframe" path
- No "import from Sunnyside" path
- No "I logged a few weeks ago, can I backdate?" flow guide
  beyond the R25-E quick-mode "yesterday" toggle

### Why we won't ship competitor importers

- Reframe / Sunnyside don't expose user-facing exports the user
  could even hand us
- A stealth scrape is privacy-hostile and brittle
- The user in scope (recent-bounce) has at most ~8 weeks of
  history, which they can recreate in detailed mode in <30 min

### What we *can* do, cheaply

1. **Add a "Coming from another tracker?" callout in onboarding
   step 3 (tracking).** One sentence: "If you have data from
   another app, the easiest path is to backdate the rough total
   for the last week — your trends start now, not from when you
   last drank."
2. **Add a generic CSV importer.** We have `data-bridge.ts`
   already. A small UI on Settings → Data Management: "Have a
   CSV from another app? Try our generic CSV importer." The
   round-23 importMapping.ts already accepts a {ts, volume_ml,
   abv_pct} shape; expose it.

Recommendation: defer (1) to R27 as a small copy add. The CSV
importer in (2) already exists infrastructurally — verify the
discoverability; if it's hidden, surface it. **Not blocking R26.**

## 7. Where the judge says we win, in their own words

(Composite of what someone in this persona would say after a
week, written in first person:)

> "I deleted Reframe because the chatbot felt like the AA
> equivalent of a marketing person trying to sell me on more
> coaching sessions. I deleted Sunnyside because the SMS coach
> sent me an 11pm 'how was the wedding?' that hit me weird. I
> have Alchohalt now. The thing I keep coming back to is that
> nobody is talking *at* me. The app just lets me notice what
> I'm doing without telling me how I should feel about it. The
> 'Need help?' pill being there but not flashing means it's
> there if I need it but it's not pretending I'm in crisis when
> I'm just having a Tuesday."

That paragraph contains four moats: voice ("notice what I'm doing
without telling me how I should feel"), no-coaching-bot, no-SMS,
calm crisis surface.

## 8. Verdict

**Ship.** The 26th judge gives this app a clean ship verdict for
the round-26 surface set, with two non-blocking recommendations
deferred to R27:

1. **R27-cand: Promote quick-log toggle into onboarding.** The
   detailed→quick discoverability is currently a hint that fires
   after the user already paid the friction cost.
2. **R27-cand: Surface the generic CSV importer more
   prominently.** It exists; it's not findable. Adding a one-
   liner in Settings → Data Management addresses the migration
   pain without privacy compromise.

Neither blocks R26. Both are voice-aligned. R27 should pick them
up.

— Round 26-4, 26th judge audit, 2026-05-04
