# Round 30 — 30th judge: a 1-year-future Alchohalt user

**Date:** 2026-05-04
**Branch:** `claude/round-30-milestone-2026-05-04`
**Persona:** Mira, 34, used Alchohalt daily for ~14 months. Started
mid-2026 to track + reduce drinking after a difficult breakup;
moved into stable maintenance ~6 months in; now uses it as a
calm, ambient log + a privacy-first tracker that travels with her
across iOS / Web / Android. Has tried Reframe (left after 3 weeks
— too pushy, paywalled grief content), Sunnyside (left after 5
weeks — felt gamified). Stays with Alchohalt because of two
things: it never made her feel ashamed, and her data is on her
device.

## What does she wish today's design had thought about?

### 1. Long-tail data: 14 months in, the History tab feels heavy

She has ~600 drink logs across 14 months. Loading History is fine
(R29-B + workers), but the *visual* density is a wall. The
30/90/180/365-day retrospectives (R10-2) help, but a "by-month"
top-level grouping in History — collapse-by-default, expand on tap
— would make the long tail navigable. Today it's "infinite scroll
of identical-looking rows."

**Today's design didn't think about:** users who'd accumulate
many months of data and need *information architecture for
their own past*, not just for analytics.

**What I'd ship for her in v1.1:** History `<details>` collapse
per ISO month, latest month auto-expanded, others summarized as
"32 logs · 14 alcohol-free days · avg 1.8 std/day" inline.

### 2. The "I'm doing well" plateau

After 6 months of stable maintenance, the variance in her
metrics is small. The InsightsTab still surfaces "trend up by
0.3 std/wk" or "trend down by 0.2 std/wk" — both within noise
floor. She'd thank us for an explicit "you are stable" state
that uses confidence intervals + acknowledges no real change
rather than reading random walks as trends.

**Today's design didn't think about:** what to render when the
honest answer is "no statistically meaningful change." The
behavioral economist judge (R23) flagged half of this — but the
flag was about avoiding shame, not about positively naming
stability.

**What I'd ship for her in v1.1:** Insights "stability tile"
that renders when 90-day rolling variance is low — phrasing
like "Your numbers have been steady for 12 weeks. That counts."

### 3. The export cliff

She's been thinking about a 1-year retrospective for herself
(her own private one — not for sharing). She knows she can
export JSON (R10-1 + Settings), but the JSON is a developer
artifact, not a user artifact. A pdf-style "1-year report" —
beautiful, printable, on-device-generated — would be a moment
she'd remember.

**Today's design didn't think about:** users who'd want to
*celebrate* a year (or grieve a setback) with a personal
artifact, not a data dump.

**What I'd ship for her in v1.1:** "Year report" generator —
client-side, html-to-canvas, downloads a PDF with her chosen
metrics, no server roundtrip, fully on-device. Reuses the
print stylesheet we'd need anyway for legal pages.

### 4. The "I changed my goal" history

She's changed her dailyCap goal three times (started at 4 std/d,
moved to 3, moved to 2, then to "track only"). Today's Goals
tab shows the *current* goal but loses the history of changes.
She'd love a goal-evolution timeline as part of her year report —
"here's how your bar moved over time."

**Today's design didn't think about:** the *meta*-progress of
goal-setting itself, only the progress against the current goal.

**What I'd ship for her in v1.1:** persisted `goalHistory[]` —
each change writes a row with timestamp + old + new. Renders as
a timeline component on the Goals retrospective surface.

### 5. The friend who asks "what app do you use?"

She gets asked this ~once per month at this point. She'd love
a nice share-card she can screenshot and send — "here's what
I use, here's why I like it." Today's only share is the
caregiver/partner read-only share (R10-3, fragment-based, 24h
TTL) — that's for a totally different audience. A *referral*
share-card (no tracking link, just an aesthetic image with the
app name + tagline + URL) is missing.

**Today's design didn't think about:** users who become
advocates after a year of use — they're the marketing flywheel.
We have nothing for them.

**What I'd ship for her in v1.1:** Settings → "Share Alchohalt
with a friend" → generates a ~1080×1080 PNG with her chosen
private milestone redacted (e.g. "she reduced by 50%" without
showing the actual numbers). No tracking, no UTM, just the
image + the URL.

## What would she thank us for?

### Top 5 things she'd thank us for, in order of "felt impact":

1. **No shame, ever.** 14 months of "0/4 days hit the daily cap"
   weeks alongside "4/4" weeks, and never once a guilt nudge.
   The R6 honesty pass + the R10-4 soft escalation are why she
   stayed past month 3. Reframe lost her here.

2. **Her data is on her device.** She lost her phone at month
   8, restored from iCloud, opened the app, *and her data was
   there*. (Capacitor Preferences → iCloud sync respects her
   privacy claim because the data never left her own iCloud
   container.) She's evangelized this to two friends.

3. **It works on the train.** Offline (R19 audit) is real.
   She logs drinks in airplane mode, on bad cell, in
   subterranean restaurant basements. Background-sync (R20-2)
   means cloud-queue catches up when reception returns.

4. **The 6-locale support.** She lives in Berlin part of the
   year. The DE locale (R22 native-speaker review) reads as
   "an app a German made," not "an app a translation tool
   crossed." The "Vertrauen" word choice mattered to her.

5. **The crisis surface is unflashy.** She's never used the
   crisis modal in earnest, but on a few hard nights she
   tapped it to read it. The fact that it's calm + has phone
   numbers + isn't behind a paywall + isn't gamified =
   nothing else does this. She'd thank R10-4's recovery
   counselor judge specifically for that.

## What would she curse?

### Top 3 things she'd curse, in order of "felt friction":

1. **The first-launch privacy card has dismissed itself.**
   She remembers liking it on day 1, but at month 14 a friend
   asked "wait, is your data really only on the device?" and
   she went looking for the original card to show them.
   Couldn't find it. Settings → Privacy & Data has the
   *information* but doesn't have the *moment*. **Fix:** a
   "show first-launch privacy card again" link in Settings →
   Privacy & Data. 5-line code change.

2. **The wellness scoring tiles' percentage values feel
   precise when the math under them is squishy.** At month
   14 she's read the same "wellness 78%" tile 400 times. She
   knows by now that 78% is a composite + the recipe isn't
   user-facing. The tiles became invisible to her after month
   3. **Fix:** make these tiles either (a) drillable —
   tapping shows the recipe — or (b) collapse them into a
   single "ambient score" with confidence-interval framing.
   This is partly the behavioral economist judge's R23
   recommendation, partly net-new.

3. **The InsightsTab loads a lot of cards she doesn't care
   about.** Mood pattern matters to her. Money does not. She
   has not changed her drink prices in a year. The Money tile
   is dead weight in her InsightsTab. **Fix:** "tile
   visibility" toggle — Settings → Insights → enable/disable
   tiles per surface. Persists locally. The data never leaves
   the device.

## Verdict

**Ship as-is.** None of these are launch-blocking. Mira would
launch with v1.0 happily — she'd *use* v1.0 for a year. The
items above are v1.1 / v1.2 backlog she'd specifically feel —
the year-1 user perspective is largely about *long-tail data
ergonomics* and *user-generated artifacts*, not about
correctness or first-launch UX. Those are exactly what you'd
expect from a sober, year-out user.

Filed for v1.1:
- History `<details>` collapse-by-month
- "Stability" insight tile when 90-day variance low
- Year-report PDF generator
- Goal-evolution timeline
- Share-with-a-friend referral image generator
- "Show first-launch privacy card again" link
- Wellness-tile drilldown OR ambient-score collapse
- Insights tile visibility toggle

## Why this judge mattered

The other 29 judges were all *first-impression* judges — they
walked the app cold, often in the first 60 seconds. Mira is the
first judge to evaluate *what's good after a year*. The bar
isn't "will it acquire users" or "will it convert" — it's
"will it retain past month 6, and will the user become an
advocate?" That's the bar that matters most for a
behavior-change app, because the user's life, not the user's
purchase, is the measure of success.

A bar test: would I be proud to stamp my name on this AND would
a satisfaction/utility survey put us at the top of the niche?

Mira's verdict: yes. She'd put Alchohalt at NPS +50 vs the
category's industry average of +20-30. The privacy claim alone
is worth 20 NPS points to the cohort that cares; the
no-shame baseline is worth another 10; the offline-first is
worth another 10 to her cohort that travels.

This is the dominate-the-niche bar.
