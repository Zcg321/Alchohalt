# Round 12 — 12th judge: Parent of a teenager

> Auditor persona: a parent whose 15-year-old just admitted to drinking
> at parties. They install Alchohalt looking for two things — a way to
> help their kid track honestly, and signals that would tell them if
> their kid's use is escalating beyond "occasional bad decisions."
> They are not the user; their kid is the user (or might be). The
> parent's job is to evaluate whether handing this app to their kid
> is helpful, harmful, or neutral.

## Decisions to make

### 1. Age-gate at install? — DECISION: NO

The App Store / Play Store age rating already filters discoverability
through parental controls. Adding an in-app age gate would:

  - Force every adult user to lie or click through a friction screen
    they don't need.
  - Push teens who lie at the gate into giving us a fake birthdate
    we then store on-device, which is worse than just letting them
    use the app honestly.
  - Not actually verify anything (date pickers don't validate; we'd
    be theater-of-compliance, not actual compliance).

Discoverability matters. A 17-year-old looking for a way to track
their own drinking honestly *is the audience we want to reach*.
Gating them out is the same paternalism that pushes teens to
under-the-radar tools.

The store rating + the existing crisis surface (988 serves all ages)
is enough.

### 2. Escalation signals if BAC / frequency / time-pattern suggests teen use? — DECISION: NO algorithmic escalation, YES inline help

Building a "teen detector" is a classification problem with two failure
modes:

  - **False positive**: an adult who drinks twice a week at 11pm gets
    treated as a teen and shown teen-specific content. This is
    condescending and breaks trust.
  - **False negative**: a teen who drinks like an adult (binge once a
    week, regular times) is not flagged and gets nothing.

Either way the app is making a guess about who the user is. Privacy-
first apps don't classify users. We don't have the data, the right,
or the calibration to do it well.

What we CAN do is make teen-relevant resources visible to everyone,
all the time. A teen who recognizes themselves in the resource
description finds what they need; an adult ignores it. Same surface,
different reader. No classification.

### 3. Crisis modal additions — DECISION: YES, land it

Adds to the US pack (the only pack that covers under-18-specific
hotlines today):

  - **Teen Line** — 1-800-852-8336 — peer-staffed (calls answered by
    other teens, supervised by counselors). Distinct from 988
    because the phone interaction is teen-to-teen, which lowers the
    friction for first-time callers who would freeze if a 50-year-old
    counselor answered.

  - **Crisis Text Line — TEEN keyword** — text TEEN to 741741.
    Routes the conversation to a teen-trained counselor instead of
    the general queue. Same number as the existing HOME keyword,
    different routing, distinct entry.

Both are added to the US pack `immediate` section. They render below
988 + SAMHSA + the existing Crisis Text Line so the primary adult
resources stay primary, with the teen-specific entries clearly
labeled in the description.

International packs (UK / AU / CA / IE) get a follow-up audit — each
country has its own youth crisis lines (Childline 0800 1111 in UK,
Kids Helpline 1800 55 1800 in AU, Kids Help Phone 1-800-668-6868 in
CA). Out of scope for this round; flagged for round 13.

## Other findings during the walk

### a. Crisis copy review — passes

The crisis page copy reads neutrally regardless of age. "Free help,
available right now" works for both a 16-year-old and a 50-year-old.
The "we never see who you call" note is honest in a way teens
particularly need (teens are highly attuned to surveillance because
adults often surveil them).

### b. Onboarding — passes

The 3-step onboarding doesn't ask age, doesn't claim "for adults only,"
doesn't condescend. The intent options ("cut back / quit / curious")
work for teens as written. A teen who picks "curious" and gets the
"day-by-day" track works the same as an adult who picks the same.

### c. BAC surface — borderline OK

BAC calculations use weight + sex inputs. A 14-year-old's BAC after
one beer hits a much higher peak than an adult's because of body
mass, and the BAC display is loud, which could be:

  - **Useful**: a teen who didn't know one beer puts them at .08
    learns it. Honest data → better decisions.
  - **Harmful**: a teen who finds "I'm at .08" *exciting* (status,
    being grown up, etc.) gets reinforcement.

The R11-B BAC first-enable disclaimer modal already covers the
medical-disclaimer floor. The "this is not safety advice" copy
applies to all ages.

Decision: leave BAC as-is. The disclaimer modal already does its job.

### d. Bulk drink-edit (R12-2) — passes

A teen using bulk-edit to mass-delete entries from a single bad
night to "hide" them from a future them is the same use case as an
adult doing the same. The R12-2 code does not interact with
parental-control surfaces (none exist).

### e. Backup verification (R12-3) — passes

Verifying a backup is age-agnostic. The "passphrase didn't unlock"
copy is friendly across ages.

## Soft escalations landed in this round

  - US `immediate` pack now includes Teen Line (us-teen-line) and
    the Crisis Text Line — TEEN keyword variant (us-crisis-text-teen).
  - Crisis page copy mentions these are "for callers under 18" so a
    user who isn't the target audience can skip past them quickly.
  - No new flag, no telemetry, no classifier. Same posture as 988:
    visible to everyone, all the time.

## Owner-blocking items (none)

Everything in this round is a soft escalation. The two harder calls
(age-gate, algorithmic teen-detector) were both DECIDED NO with
reasoning above. The owner can override either; if they do, the
decisions are localized in:

  - Age gate: would live in `src/features/onboarding/OnboardingFlow.tsx`
    (add a step before the intent picker).
  - Teen detector: would live in `src/features/insights/` (consume
    entries/settings, emit a signal).

## Round 13 follow-ups

  - International youth-crisis lines (UK Childline, AU Kids Helpline,
    CA Kids Help Phone, IE Childline).
  - Translate the new TEEN-routing description copy into es / fr /
    de.
