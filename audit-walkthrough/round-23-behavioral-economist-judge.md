# Round 23 — Behavioral economist judge (R23-5)

Date: 2026-05-03
Judge: 23rd judge — synthetic behavioral economist audit.
Question: are we using any cognitive bias *against* the user?

The first 22 judges audit voice, a11y, perf, copy, regression,
clinical accuracy, etc. R23-5 audits a different axis: where, in
the surfaces the user touches, are we doing things that exploit
cognitive biases for the app's benefit at the user's cost?

A recovery app especially has a duty here. Users are paying
attention to their behavior; they're vulnerable to nudges that
manufacture engagement instead of supporting recovery.

## Audit dimensions

- **Sunk-cost framing.** Does the app make slips feel like lost
  progress to drive guilt-engagement?
- **Loss aversion.** Do streak / goal surfaces use loss-of-X
  framing instead of presence-of-Y?
- **Default effect.** Are engagement features (notifications,
  AI, sync) opt-out by default — burdening the user with
  unsubscribing — or opt-in?
- **Social proof.** Does the app use "everyone else is doing X"
  to override the user's choice?
- **Anchoring.** Are pricing/goal anchors set against the user
  or in the user's favor?
- **Variable rewards.** Does the app gamify with randomized /
  intermittent reinforcement (the slot-machine pattern that
  drives compulsive checking)?
- **FOMO / urgency.** Are there "Limited time!" / "Only today!"
  urgency cues anywhere?

## Findings

### NONE — Sunk-cost framing is absent (intentional design)

The Milestones component (`src/features/milestones/Milestones.tsx`)
gives **lifetime credit**:

> "a 30-day milestone shows the date the user first ever passed
> 30 consecutive AF days, regardless of subsequent restarts"

A slip doesn't erase a past achievement. The opposite of
sunk-cost. Same posture in the LoggingTenure component (R17-1)
which counts days-since-first-entry rather than current-streak —
slips don't reset the tenure count. **Already correct.**

### NONE — Loss-aversion in goal surfaces is absent

`src/features/goals/goalNudge.ts` returns a Nudge object framed
as factual numbers + a question:

> "Voice contract: factual numbers + a question. The consuming
> banner names the average vs the goal, asks if the user wants to
> revisit the goal. No 'you're failing', no urgency, no
> streaks-broken framing."

The streak counter (R23-A `progressCards.tsx`
`StreakMilestoneCard`) shows the *current* count and the *next*
milestone — observation-framed. R16-1 already audited this and
removed the previous countdown-pressure framing
("{n} days to go!" → "{n} days from there"). **Already correct.**

### NONE — Default-effect is in the user's favor

Every engagement feature defaults off:

| Feature | File | Default |
|---|---|---|
| Reminders | `db.ts:304` | `enabled: false` |
| Goal nudges | `db.ts:154-160` | `goalNudgesEnabled` undefined === off |
| Crash reports | `db.ts:205-221` | `crashReportsEnabled` undefined === off |
| AI insights | `db.ts:122-126` (R7-A4) | `aiRecommendationsOptOut` defaults off the feature |
| Cloud sync | feature-gated, opt-in | off until configured |
| Drink-log mode (R23-D) | `db.ts` | undefined → 'detailed' (no surprise) |

The user opts INTO every feature that pings them. **Already
correct** — the opposite of the dark pattern.

### MEDIUM — Social-proof framing on the yearly tier (FIXED)

`src/features/subscription/subscriptionPlans.ts:6` (before fix):

```ts
premium_yearly: { label: 'Most popular', tone: 'primary' },
```

"Most popular" is a social-proof nudge: "others picked this; you
should too." It's informationally honest (the yearly tier is
genuinely the highest-converting per the SubscriptionManager spec
comment) but the *framing* asks the user to outsource their
decision to the crowd rather than evaluate the value claim
themselves.

**Fix landed:** "Best per-month value." Same yearly-vs-monthly
hint but anchored to objective math (the 48% per-month saving)
rather than implicit peer pressure. The same information, a
different cognitive route to the same insight.

The lifetime "No subscription trap" label was kept — that's a
**product claim** (no recurring billing) not a behavioral nudge.
Calling out a structural property of the product is different
from telling the user what others bought.

Pinned by `subscriptionPlans.behavioral.test.ts` so a future
change can't quietly regress to social-proof framing.

### NONE — Variable rewards / slot-machine reinforcement absent

The streak counter increments by exactly 1 per AF day. Milestones
fire at fixed thresholds (1d, 7d, 30d, 90d, 1y, 2y, 5y) that the
user can predict. There are no badges, levels, points, surprise
rewards, daily login bonuses, or randomized celebrations.

Sprint `[IA-5]` explicitly stripped the Levels/Points framework
(see Milestones.tsx top comment). The current shape is:
> "No XP, no leaderboard, no progress-bar-to-next-level. Just the
> user's actual milestones (1 week, 30 days, 90 days, 1 year)
> shown as gentle dated entries."

**Already correct** — and explicitly designed against the
slot-machine pattern.

### NONE — FOMO / urgency absent

Grep for `limited time`, `hurry`, `expires`, `act now`, `don't
miss`, `countdown` returns 0 marketing-side hits across the
source tree. (The matches that appear are tests and an
intentionally-named "milestone countdown" in
`FirstMonthRibbon.tsx` that is itself audited — see below.)

`FirstMonthRibbon.tsx` mentions a "countdown" but the comment
deliberately notes:

> "Building-pattern intentionally drops the milestone countdown:
> [building feels] grindy when surfaced as a countdown."

The component's voice was already audited in R8 / R16 and the
countdown framing was deliberately removed for days 8-29.
**Already correct.**

### NONE — Anchoring in goal templates is in the user's favor

`goalTemplates` (the templates surfaced in Goals — "30 days
clean", "Cut to 7 drinks/week", etc.) don't anchor to a high
number to make the user's actual choice feel small. The presets
span both restrictive ("30 days clean") and permissive
("Maintenance: weekly check-in") so a user picking from the
list has options on both ends. The defaults *assume* the user
wants to change behavior — which is the right anchor for an app
the user installed to track their drinking.

### MINOR (kept) — "You're on Free" status pill could lean dark

`SubscriptionManager.tsx:71`:
> "You're on {currentPlanName}"

For Free users this reads as factual. It *could* be tuned to a
loss-frame ("You're missing X premium feature") to drive
upsell — and isn't. Kept; flagged here to memorialize the
intentionally-non-dark design.

## What R23-5 catches that the other 22 don't

The "what is the app *quietly* asking the user to do, beyond what
the user explicitly chose to do?" lens. Most prior judges check
the surfaces in isolation: voice, a11y, perf. R23-5 checks the
*motivation* embedded in the framing — whose interest is the
nudge serving?

The single MEDIUM finding (social-proof on the yearly tier) is
the kind of thing that's invisible to voice audits (the words
themselves are calm) and invisible to a11y audits (the label
renders correctly) but visible to a behavioral economist because
the *route to the decision* matters.

## What R23-5 didn't catch

This is a synthetic audit, not a real behavioral-economics
review. A real economist would also check:

- **Choice architecture in the goal-setting flow.** Does the
  default daily cap value anchor the user toward a number they
  wouldn't have picked? (R8 audit established the defaults are
  null until the user picks — already correct.)
- **The Insights tab's order.** Are the tiles ordered to drive
  the user toward a specific conclusion? (R23-3 stress test
  walked the order and found it neutral.)
- **The crisis prompt's escalation cadence.** Does
  HardTimePanel's 3-opens-in-24h rule (R10-4) cross into
  manipulation, or is it just-in-time support? (R10 audit
  established it's the latter.)

These are deeper questions for R24+ if the round dedicates a
real behavioral-economics review.

## Tests added

- `src/features/subscription/__tests__/subscriptionPlans.behavioral
  .test.ts` — 2 assertions pin the new highlight labels and
  guard against regressing to social-proof framing.

## Process notes

The behavioral-economist judge is the 23rd to round-audit this
codebase. The thinness of findings (1 MEDIUM, 0 MAJOR) is itself
a finding: the design discipline established across R1-R22
(particularly R8 voice gates, R16 milestone-language audit,
R17 lifetime-credit milestones, the IA-5 levels/points strip)
already aligned the surfaces against the behavioral biases R23-5
is looking for. The single fix lands; the rest is documentation
of pre-existing correctness.
