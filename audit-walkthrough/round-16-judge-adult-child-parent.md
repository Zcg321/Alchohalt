# Round 16 — 16th judge: Parent of an adult child who drinks too much

> Auditor persona: A 62-year-old parent of a 35-year-old who has been
> struggling with alcohol for years. They're not the user. Their adult
> child is the user — except their adult child won't admit they need
> help. The parent installs Alchohalt because they want to understand:
> *if I send my kid this app, what will they actually see? Is this
> something I can hand them without making it worse?*
>
> Round 12's judge was the parent of a 15-year-old just experimenting.
> This judge has lived with this for a decade. They've watched their
> child cycle through "I'll cut back" promises, half-attempts at AA
> meetings, two outpatient programs. The relationship is fragile.
> They've seen their child read self-help apps as "you're a problem
> that needs fixing" and shut down for months.
>
> Their lens isn't "would I use this." It's "is this safer than
> nothing? Is it safer than the apps that already exist? Will my kid
> hate me for forwarding this link?"

## What they walk through

The parent installs Alchohalt on their own phone first. They want to
see Day 0 themselves before they suggest it to their child. They have
no intention of using it as a tracker — they want to scan every screen
their child would see.

### Day 0 — opening the app

**Onboarding beat 1.** "Hi. What brings you here today?"

The three chips. With the R16-A `first-person-trying` arm: "I'm trying
to drink less / I'm pausing alcohol for now / I'm just looking
around." The parent reads each one. Not one of them says "I have a
problem" or "I'm an alcoholic" or "I need help." Their child has spent
a decade refusing to use any of those words. The chip wording is the
first thing they look for, and **it lands**. The "I'm just looking
around" chip is the one their child would actually pick.

**The skip-explore link** at the bottom. The parent clicks it. They
get into the app without committing to any intent. Their child would
do the same — they'd want to scope this app before being asked to
declare anything. **It lands.**

**Beat 2: "How would you like to track?"** The middle chip — "A month
off — A 30-day window. Just the count." — gives the parent pause.
Their child has tried Dry January three times. The fact that the app
names a 30-day window without selling it as transformation lands as
respect for the user's existing experience.

**Beat 3: "Your data, your device."** The "Tell me how" disclosure.
The parent expands it. The line about cloud sync being end-to-end
encrypted with a key only their device knows — they read this twice.
**This is the line that decides it.** Their child has refused other
apps because they assumed any logged drink would end up in some
analytics dashboard their employer's wellness program could see. The
privacy claim has to be load-bearing, and this app's first words about
data are the load-bearing version.

### Today screen — first impression

The parent sees the Day-0 hero ("First drink → not yet today" or the
quiet equivalent). No streak counter scolding them. No "Welcome back!"
exclamation. No emoji parade.

What they're scanning for is anything that would make their kid feel
**watched**. They don't find it. The Today screen is a notebook page,
not a dashboard.

### The "log a drink" form

The HALT mood checkboxes — Hungry / Angry / Lonely / Tired — make
the parent stop and read. They've been to enough AlAnon meetings to
recognize HALT. Their child has too. **It lands.** Recovery-vocab,
but in a checkbox format that doesn't make the user say it out loud.

The Why dropdown (intention) — "social", "stress", "habit" etc. —
looks honest. Their child would read these and find one that fits.
None of them feel like a moral score.

The Craving 1-5 scale. The parent thinks: would my kid be honest with
this? They might. The fact that the scale is on the entry, not on the
home screen as a public-facing metric, helps.

### The Insights tab — what would their child see after a month?

They poke around InsightsPanel. Tag patterns, peak-hour card,
milestones. The R16-1 milestone copy rewrite — "Current alcohol-free
streak" instead of "Streak Milestone" — registers. The parent has
seen their child reject apps that yelled "9 DAYS! KEEP THE STREAK
ALIVE!" — that voice triggers shutdown. The new card title doesn't.

The R15-2 goal nudge with the R16-B `softer` variant — "Your goal is
1.5/day. This week's been around 2.0/day. Some weeks land different —
adjust if it's helpful." — the parent reads this twice. The "some
weeks land different" line is the line a sponsor or counselor might
say. **It lands hard.** Their child has shut down on every app that
implied "you failed." This one explicitly says "weeks land different"
in passive voice and shifts the weight off the user.

### The Crisis tab

The 911 banner first. Then 988 / SAMHSA. The parent reads the SAMHSA
description — "Free, confidential treatment-referral service for
substance-use issues" — and notes it's the right line to surface. AA
+ SMART Recovery + the SAMHSA Treatment Locator below.

The R16-2 "Add your own crisis line" editor at the bottom catches
their eye. They have a counselor's direct line in their contacts —
the woman who runs the local outpatient program their kid finished
six months ago. They can imagine, if their kid agrees to install this
app, putting that direct line at the top so their kid sees it first
when they open the Crisis tab. That's not an angle the original
R13-A crisis pack supported. **It lands.** The voice — "If you have a
local crisis line you trust" — is the right voice; it doesn't presume
the user has problems severe enough to need a custom line, just that
they might trust someone specific.

### Settings

The R16-4 Replay-onboarding row. The parent sees this and thinks: my
kid just picked "I'm just looking around" three months ago. If they
move toward "I'm trying to drink less," they can re-run the intent
declaration without losing their data. **It lands.**

The "Clear all data" button at the bottom. WIPE confirm. The parent
notes this — their kid would notice it too. The fact that the parent
can't see what their kid is logging (no cloud, no admin view) is the
**other** load-bearing piece. The parent has to be okay with not
knowing. The app has to make that "you can't know" feel intentional,
not a missing feature.

## Findings — what would the parent flag?

### What lands

| # | What | Why |
|---|---|---|
| 1 | The R16-A `first-person-trying` chip variant | Their child has spent ten years refusing the words "alcoholic" / "addict" / "problem." The hedged "trying / pausing / looking" voice meets a person where they are without naming what they are. |
| 2 | The R16-B `softer` goal-nudge copy | "Some weeks land different — adjust if it's helpful." Reads like something their child's counselor would say. The R15-2 control opens with "you've been at X" — a sentence the parent can hear in their own voice from arguments they regret. |
| 3 | The R16-1 milestone-copy rewrite | "Current alcohol-free streak" / "from there" / no exclamation marks. Their child's relapse history would shred any app that yelled "DON'T BREAK THE STREAK!" — and they have. |
| 4 | The R16-2 user-installable crisis line | They imagine adding their kid's outpatient counselor's direct line. That's the relationship they want their kid to lean on, not a stranger at 988. The user-installable slot makes that possible without the app inserting itself in the recommendation. |
| 5 | The R16-4 Replay onboarding | Their kid's intent shifts in cycles. Being able to re-declare "I'm trying to drink less" without wiping the entry log is the right shape. |
| 6 | The HALT moods on the entry | Recovery-vocab in a checkbox. Their kid has been to enough meetings to recognize it; the parent has too. The app meets them with vocabulary they share without making the user say it out loud. |
| 7 | The privacy claim being load-bearing | "Nobody else, including us, can see what you log." Their kid's first concern. |

### What would offend

| # | What | Why |
|---|---|---|
| 1 | If the app ever surfaced "Your child" / "Loved one" / "Family member" copy | This isn't an app for the parent. The parent isn't the user. Any copy that shifts to talking *about* the user as someone else's problem would shut their kid down instantly. **CHECKED**: the app does not have copy in this register. None of the existing strings address the user as "your loved one" or imply a family-perspective frame. ✓ |
| 2 | If the streak-break framing implied moral weight | Round 13 R13-3 added a streak-break reflective prompt. The parent re-reads the copy: "Your streak ended yesterday. Days reset, not effort." The "effort" line is doing the work — it stays observation, not judgment. ✓ |
| 3 | If the AI-recommendations surface ever asserted what the user "should" do | The parent checks SmartRecommendations. The R10 / R11 voice rewrites pulled the moralizing out — "Eating regular meals takes the edge off — low blood sugar can mimic a craving" instead of "Try eating regularly to avoid cravings." The voice is medical-neighbor, not coach. ✓ |
| 4 | A daily-cap nag system pushing "you exceeded your goal!" notifications | The R12-4 calm-config gates this — `goalMilestone` and `dailyCap` notifications are off by default. ✓ |
| 5 | Any moment where the app implied being-on-the-app was the goal | Engagement-bait copy. The parent flips through and doesn't find it. The R10 retrospective prompt gates itself behind a 30-day suppress. The R15-2 goal nudges are opt-in. ✓ |

### What would NOT land

| # | What | Why |
|---|---|---|
| 1 | The pricing surface | Their kid would see "Premium adds longer-view analytics" and immediately assume the app's primary goal is monetization. The R10 pricing rewrite ("The core — logging, history, streaks, money saved, crisis resources — is free forever") helps, but the parent still cringes at the framing. They'd want to verify on-device that crisis resources stay free regardless. **(NOT BLOCKING — the test exists in CrisisResources.smoke.test.tsx that asserts no FEATURE_FLAGS / subscriptionStore imports. Verified.)** |
| 2 | The fact that the parent can't see what the kid logs | This isn't the app's failure — it's the design point. The parent has to accept this. They might still want to see a "your kid's last log was 3 days ago" signal. **The app correctly refuses to give them this.** Non-issue from the app's perspective; tension lives in the parent's relationship to their kid, where it belongs. |

## One implementation finding worth landing this round

**The Trust Receipt panel (R15-4) currently lists categories like "Entries", "Settings", "Trash" with their current counts and notes which surfaces redact them.** The parent reads the receipt and asks: *but does this tell me what an export would look like?* They can't quite tell whether the listing means "what's stored" or "what's exported."

The R16-3 date-range export adds a new export shape. The Trust Receipt should mention that **range exports drop the trash and out-of-range health metrics** — that's a redaction property worth surfacing, since a user who wants to send a 90-day slice to a third party should know that what's IN the slice is everything-except-trash within the window.

**Land or defer?** The Trust Receipt is the panel where redaction guarantees are catalogued. Adding one line for "Date-range export drops out-of-range entries, all trash, and out-of-range health metrics" is a one-line append + one test. **LAND inline.**

(Implementation under the audit table.)

## What the parent says, walking out

> "It's not a referral, but I could see her using it. The chip copy
> doesn't push her into a label. The crisis tab has somewhere I could
> add Dr. Alvarez's number. The privacy claim is the first thing it
> tells you. I'm going to send her the App Store link. If she opens
> it, she opens it. That's all this kind of app should do."

## Decisions log

- **D11 (R16-A confirmation):** The `first-person-trying` arm reads as
  "trying to" instead of "want to." A 35-year-old who has tried and
  failed multiple times reads the difference at a glance. The 16th
  judge's lens validates the third arm: it preserves voice without the
  declarative weight of `first-person`. Keep the 3-way split.
- **D12 (R16-B confirmation):** The `softer` arm of the goal-nudge
  copy is the right instinct. The 16th judge specifically flagged the
  control's "you've been at X" opener as a sentence they recognize
  from arguments they regret. The softer arm decouples the comparative
  read from the user's behavior. Keep the A/B running.
- **D13 (NEW — Trust Receipt mentions range export):** Add one line
  to the Trust Receipt panel under the redaction-guarantees section
  noting that range exports drop trash and out-of-range entries. Cost:
  one line + one test. Value: closes a gap a privacy-conscious user
  (or the parent of one) would notice.
