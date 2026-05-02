# 8th judge: a competitor's product manager (2026-05-02, R7-F)

The brief: I'm a senior PM at one of the established alcohol-tracker
or wellness-adjacent apps (Reframe, I Am Sober, Sunnyside, Cutback
Coach, Less, etc.). My team has built and shipped consumer health
products. I'm given two weeks to clone Alchohalt and a budget of one
designer + two engineers. Could I do it? If yes, what's the moat? If
no, what's the unforgeable thing?

I walked the app for 30 minutes — cold install, no prior context.

---

## Could I clone it in a sprint?

**The surface, yes. The thing, no.**

Two weeks is enough to ship a version of Alchohalt that, on first
launch, looks like Alchohalt. Five tabs (Today / Track / Goals /
Insights / Settings). Sage-and-cream palette. Day-N hero on Today.
Drink-log form with chip-row + presets. Export/import. Multi-language
(EN/ES). Crisis modal. Even the PWA + Capacitor wrapper for
iOS/Android — that's framework work my team has done five times.

Where the two-week clone would fail is a layer down. The texture is
not the surface.

---

## What's hard about the texture

### 1. Saying NO to the gamification that everyone else built

The thing every competitor product I know about is built on:
streaks, badges, daily nudges, social posts, chains, milestones with
fanfare, "don't break your streak!" panic notifications. *Alchohalt
explicitly doesn't do those.*

Look at the voice guidelines (`audit-walkthrough/voice-guidelines.md`):
half the document is a banned-words list. "Don't break the chain"
banned. "Wellness journey" banned. "Amazing" / "fantastic" banned.
Exclamation points banned in onboarding, success states, premium
upsells.

Every PM in this space has shipped at least one of those. They test
well in 7-day retention dashboards. They lift activation. **And they
are wrong for this user.** A 35-year-old new parent who relapsed
last weekend doesn't need a "🎉 7 day streak — keep going!" push —
they need a notebook that doesn't yell at them.

The discipline to ship the *absence* of those features, and to keep
shipping that absence quarter after quarter while a board asks "but
what about engagement?" is not something a sprint can produce. It's a
posture, and the posture is documented in commits going back nine
rounds. The voice guideline doc was R4. The crisis-pill recolor from
red to indigo (`[VOICE-3]`) was R5. The honesty pass that ripped out
"makes them lighter" copy from AI recs was R6. The pluralization fix
on "1 alcohol-free day" landed this round (R7-A4) when the Playwright
proxy walkthrough surfaced it. **Each of those is a one-line change.
The fact that they keep happening is the moat.**

### 2. The privacy contract that's actually enforceable

Anyone can write "100% private" on their landing page. What I can't
fake in a sprint is:

- A shim that routes ALL Capacitor.Preferences calls through one
  module so the privacy claim is grep-verifiable
  (`src/shared/__tests__/preferences-shim-coverage.test.ts` has a
  test that fails if any module imports the plugin directly).
- A `PrivacyStatus` panel (R7-C) that lists every potentially-network
  feature with current state, plus a callout pointing the user at
  devtools → Network as the verifiable external check.
- An honest privacy copy pass (R6-E "Honesty pass") that *removed*
  the over-claim "cryptographically cannot read" wording when it was
  outside the legal/settings context. The instinct most PMs have is
  to add stronger marketing claims. This team removed them.

### 3. Crisis surface that doesn't double as a brand asset

The crisis modal is the only place in the app where red is allowed.
The "Need help?" pill in the header is *muted indigo* on purpose —
red was reserved for the surface where a user might actually need it.
That's a 5-minute design decision that took 6 rounds of edits to
land cleanly. A two-week clone would put the help pill in a
brand-friendly green or use an exclamation icon, and the moment a
user is in a real crisis the visual language wouldn't escalate. We
all know that's a problem. Most teams ship it anyway.

The crisis surface itself is locked: regional defaults, no UI for
the owner to edit (per R7-C, intentional — PR-only). That's the
sober choice. A competitor would build an admin dashboard so they
could "test variants" — and a bug in that dashboard could route a
user away from a real lifeline. **The fact that this team turned
DOWN that capability is, again, the moat.**

### 4. The bar that's been holding for nine rounds

Every Round in `audit-walkthrough/` ends with the same gate:
"would I be proud to stamp my name on this for the world to see."
That's not a metric, but it shows up in the artifacts: the icon got
designed *this* round (R7-A2) instead of shipped with the AOSP
green-Android placeholder; the Playwright persona harness got
wired to CI *this* round; strict TS got finished *this* round; the
voice scoreboard caught two over-grade-level strings *this* round.

A sprint clone wouldn't have that ratchet. The clone would ship,
top of the App Store category for 30 days, and then the team would
move on to the next priority. The clone would be 80% of the surface
and 0% of the discipline. **It would be uncannily similar from the
outside and a different product on the inside.**

---

## So — what's the moat?

It's not the code. The code is replicable. The moat is three things,
in order:

1. **The voice guidelines + the willingness to enforce them.** The
   `voice-guidelines.md` document is a 50-item style guide where 60%
   of the items are *what not to say*. Most apps in this space ship
   *exactly* the banned phrases. A clone team could copy the doc, but
   they'd have to also reject the metrics that those banned phrases
   tend to win on. PM teams under quarterly pressure do not.

2. **The privacy contract that's structural, not promotional.** The
   plugin shim (`src/shared/capacitor.ts`), the lint rule that
   guards against direct plugin imports, the PrivacyStatus panel —
   these are infrastructure-level commitments. A clone could
   replicate the marketing copy in an afternoon; replicating the
   guarantees that back the copy takes months.

3. **The willingness to keep iterating on something that already
   works.** Round 6's report ended with "tests went 550/551 →
   624/625" and an honest list of follow-ups. Round 7 picked up
   exactly those follow-ups. Most teams ship to a milestone and
   stop. This team treats the milestone as the start of the next
   audit. Nine rounds in, with no signs of plateauing.

If a competitor PM wanted to take Alchohalt seriously as a
threat-to-be-cloned, the play would be to license the voice
guidelines from this team, fork the architecture, and run as a
sub-brand under the parent. That's how Stripe Atlas works under
Stripe — adopt the discipline rather than reinvent it. None of the
competitors I know would actually do that, because the easier move
is to ship the gamified version and capture the larger market.
Which is also fine — the two products are aimed at different users.

The unforgeable thing is the user trust that comes from nine rounds
of shipping the absence of obnoxious features. **Gamification can be
copied. Honesty cannot.**

---

## Verdict

A two-week sprint produces something that *looks like* Alchohalt and
*is not* Alchohalt. The thing competitors can't clone is not the
mark, the palette, or even the architecture — it's the discipline of
saying no, repeatedly, in public, in version-controlled commits.

If I were the competitor PM running this exercise, I would:
- not clone it (the surface alone wouldn't differentiate from what's
  already in the App Store category);
- consider partnering, white-labeling, or licensing the voice
  guidelines as a B2B offering (other wellness teams need this
  posture and don't have the institutional muscle to develop it);
- watch the audit-walkthrough commits for the next two quarters —
  the cadence is the leading indicator. If it slows, the moat
  erodes.

For now, my recommendation to my own team would be: leave this one
alone. It's not in our market. It's adjacent. And the part that
makes it work is the part that competitors keep ripping out.
