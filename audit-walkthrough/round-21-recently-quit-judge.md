# Round 21 — recently-quit-user judge

Date: 2026-05-03
Judge persona: 3 months sober. Quit drinking after a problem
period; uses Alchohalt for ongoing tracking and to confirm to
themselves that they're holding the line. Not a "cut-back" user
trying to drink less — a "stay-zero" user.

This is the 21st judge — a new persona for round 21. The earlier
20 judges covered design / engineering / privacy / product / etc.
This judge brings the lived-experience POV that catches what looks
fine on a design review but reads wrong when you're 90 days into
not drinking and just want the app to confirm you're OK.

## What the recently-quit user wants

- **Confirmation the streak isn't fragile.** The number going up
  feels good. The number going to zero after a slip feels awful;
  worse if the app comments on it.
- **Observation, not motivation.** "Day 90" is a fact. "Way to go,
  Day 90!" is a parade. The parade wears thin.
- **No assumed goal of moderation.** A user who quit doesn't have
  a "daily limit" to track progress against — their target is 0.
  Cards designed for cut-back users (Daily limit %, Weekly goal %)
  are less relevant.
- **No clinical pathologizing.** "Average craving level" pings as
  "the app sees me as a problem to solve." After 3 months of not
  drinking, the framing should shift toward "you're tracking
  patterns" not "you're tracking risk."

## Findings — by impact

### MEDIUM (fixed) — `Exceeded by X%` is math-shame

`src/features/insights/progressCards.tsx` GoalProgressCard:
> Daily limit · 200%
> Exceeded by 100%

For a user with a 1-drink/day cap who slips to 2 drinks (a real
scenario for someone in maintenance mode after 3 months), this
shows "200%" + "Exceeded by 100%" — the percentage framing makes
a single drink feel like a 100% catastrophic failure.

The number 100% is mathematically right (1 drink over a 1-drink
cap = 100%) but emotionally it's three times the slip. A user
reading "you went from 1 to 2 drinks" thinks "OK, slip"; reading
"100% over your limit" thinks "I doubled it. I failed."

**Fixed:** Convert the over-limit phrasing from percentage to
absolute drinks: "1.0 drinks over today's limit" instead of
"Exceeded by 100%". Same factual information, calendar-fact tone.
The percentage stays in the header (200%) for users who want the
ratio; the line below now reads as a count, not a verdict.

Applied to both Daily limit and Weekly goal rows.

### MEDIUM (fixed) — HealthInsightsCard trend arrow was hidden from screen readers

The "Overall trend" tile shows ↗ / → / ↘ as a 2xl colored arrow,
with the arrow marked `aria-hidden="true"` and only "Overall
trend" as the label. Screen-reader users got "Overall trend" with
no value — the arrow IS the value.

**Fixed:** Added `<span class="sr-only">{improvementTrend}</span>`
so SR users hear "improving" / "stable" / "declining" alongside
the "Overall trend" caption.

### LOW (kept, decision documented) — `Keep going` in soft-restart banner

`stats.softRestart.building`: "{count} days alcohol-free. Keep going."

For a 3-month-sober user, "Keep going" reads as external pressure
("don't quit on quitting") rather than internal observation. A
purely-observational alternative would be "{count} days alcohol-
free." (drop the "Keep going.") or "{count} days alcohol-free.
That's a fact." (which sounds weird).

**Decision: keep "Keep going."** It's a soft, encouraging note
that lands well for the building/early-recovery user and isn't
loud enough to feel coachy at 3 months. The soft-restart copy is
already R12 owner-locked language; changing it requires re-ratifying
across all 6 locales. Defer to R22 if the recently-quit judge
re-flags after a real-world walk.

### LOW (kept) — `Daily limit` framing assumes a limit > 0

For a user whose target is 0 drinks/day, the GoalProgressCard
empty hint ("Set a daily limit in Settings to track progress")
presumes they want a numeric cap. A "stay-zero" user might prefer
a different message — "You're at 0 drinks today. Logged or not."

**Decision: keep.** The empty-hint case fires when goalValue is
0 OR negative; the user has explicitly chosen to not set a goal,
so we leave them alone. A future "stay-zero mode" toggle would be
a feature, not a copy fix — defer.

### LOW (kept) — `Avg. craving level` label

For a user who has logged no recent drinks, "Avg. craving" reads
as if the app is monitoring them for relapse risk. But for a
user who DID log a slip recently, the average craving is exactly
the relevant number.

**Decision: keep.** The label is observation; the interpretation
is what makes it feel pathologizing. A "I'm 90 days in, hide
craving stats" toggle would be a feature.

### NONE — `Current alcohol-free streak` heading

R16-1 already migrated this from "Streak Milestone" + "{n} days
to go!" (gamification voice) to "Current alcohol-free streak" +
"{n} days from there" (observation). For a 3-month-sober user
this reads correctly: factual, no countdown framing, no scoreboard
language.

### NONE — Soft-restart banner

`stats.softRestart` is owner-locked language that already replaces
"Day 0" shame-framing with three observation messages. For a
recently-quit user who slips and re-logs, "You're back. {total}
alcohol-free days so far." reads exactly right — it acknowledges
the slip without dramatizing it, and it surfaces the cumulative
total (not just the current streak) which is what the user wants
to see when their streak resets.

### NONE — Milestone subtitles

`features/milestones/Milestones.tsx` subtitles were R16-1'd to
observation voice ("A year. Pause and let that land."). For a
3-month-sober user passing the 90-day milestone, the subtitle
reads as a peer noticing, not a coach cheering. Correct.

## Summary

5 findings:
- 2 MEDIUM (fixed): "Exceeded by X%" math-shame; trend-arrow SR
  silence.
- 3 LOW (kept, decisions documented): "Keep going" tone; daily-
  limit framing for stay-zero users; "Avg. craving" pathologizing
  read.

The app already does a remarkable amount right for the recently-
quit persona — R12-1 long-term activity ribbons, R16-1 milestone
voice, R10-2 retrospective prompt, the soft-restart banner, the
"alcohol-free" framing throughout. The two fixed items are real
edge-case wins; the three deferred items would each be feature
work, not copy edits.

## What this judge cares about that the other 20 don't

The R21 native French/Spanish judges catch translation issues. The
R20 designer judge catches visual inconsistencies. The recently-
quit judge catches **emotional load in the math**. A "200%" stat
isn't wrong — it's a correct percentage — but it lands like a
verdict for the user it's most likely to fire on. Other judges
would scan past "200%" as a normal stats display.

For R22, recommend a **real-world recently-quit user judge**: the
synthetic persona caught two issues; a real user with 6+ months
of sobriety using the app daily would catch more. The synthetic
walk has limits.
