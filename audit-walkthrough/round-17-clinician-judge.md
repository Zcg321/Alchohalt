# Round 17 — clinician/researcher judge

**Persona:** Licensed clinical psychologist with 15 years in
substance-use treatment. Has worked in IOP, residential, and
outpatient settings. Currently runs a private practice and
consults for treatment programs on AUD intervention design.

**Brief:** Look at the app from a clinical perspective. Are we
accidentally implementing something that resembles a treatment
intervention? Should we add language that explicitly says we're
not a treatment? Clinical accuracy review.

**Distinct from R14 researcher judge** (audited std-drink
formulas). This is a different lens: not "is the math right" but
"is the *positioning* right."

## What the app currently is

After 16 rounds of polish, alchohalt is:

1. A drink-tracker (volumes, ABV, std-drink count by jurisdiction)
2. A streak/milestone surface (1d, 7d, 30d, 90d, 1yr, 2yr, 5yr —
   with R17-1 + R17-1 logging-tenure for long-term users)
3. A money-saved widget
4. A pattern-insights surface (HALT tags, peak hour, evening
   drinks, social drinks with alternatives noted)
5. Optional reminders (off by default), encrypted backup (off by
   default), AI insights (off by default, anonymized)
6. A crisis-resources page (988, SAMHSA, FindTreatment.gov)
7. The voice guidelines say: trusted-friend tone, observation
   over judgement, no "10 days till next reward" gamification

## Where the app gets close to treatment-resembling territory

I'll flag every surface where a clinical reader could legitimately
ask "is this intervention?"

### 🟡 Goal-nudge banner (R15-2 + R16-B)

The `GoalNudgeBanner` surfaces when the user is exceeding their
daily-cap goal across the trailing 7 days. The R15 designer judge
flagged shame-framing risk and approved ship-with-mitigation. R16
added a softer A/B arm.

**Clinical read:** "You've been at X std/day this week. Your goal
is Y/day. Want to revisit it?" is squarely in the *self-monitoring*
intervention category — one of the actual evidence-based components
of brief AUD interventions. The app is not a randomized intervention,
but it IS implementing a self-monitoring component.

**Recommendation:** the existing copy is fine — it doesn't claim
clinical efficacy. But the medical disclaimer should make clear that
self-monitoring features are *adjacent to* but not *equivalent to*
clinical brief interventions like motivational interviewing, FRAMES,
or SBIRT. A user shouldn't read "the app is doing motivational
interviewing on me." Add one line to the medical-disclaimer copy.

### 🟡 HALT-tag pattern insights

`PremiumWellnessDashboard` and `EnhancedMoodTracker` surface drinks
correlated with Hungry / Angry / Lonely / Tired. HALT is a real
relapse-prevention concept from the recovery community.

**Clinical read:** Showing patterns is fine — that's
self-monitoring data. The risk is the *recommendation copy*. R17
inherits text like "When the urge ties to a feeling, the feeling
often passes faster than the urge. Wait ten minutes first..."
That's coping-skill instruction. It's good general advice, but it's
*also* a urge-surfing technique that has a clinical literature.

**Recommendation:** the recommendation copy is reasonable for
educational purposes. But the surface should be honest that these
are general suggestions, not personalized clinical guidance. Add a
one-line disclaimer to `PremiumWellnessDashboard` insights:
"General suggestions, not personalized clinical guidance."

### 🟢 Crisis resources

Direct links to 988, SAMHSA, FindTreatment.gov. Footer says "not a
substitute for professional medical, mental health, or addiction
treatment."

**Clinical read:** Excellent. This is doing the right thing —
acknowledging limits and routing the user to actual care. The
`HardTimePanel` (R10-4) and the escalation-prompt (R10-5) are also
well-designed: 3+ opens in 24h surfaces the counselor-link prompt
without nagging.

### 🟢 Milestone copy

Round 16's milestone-copy update (observation over gamification)
correctly avoids treatment-progress framing. "A year. Pause and
let that land." reads as observation, not as "Phase 4 of 12-step
recovery."

R17-1 added 2yr/5yr tiers. The new copy ("Two years. This is who
you are now, not what you're trying to be.") is in the same
voice. Clinical read: appropriate.

### 🟢 LoggingTenure (R17-1, NEW)

The new continuity surface for long-term users frames itself as
"You've been showing up." Explicitly separate from streaks. The
subtitle "Some weeks land different; showing up to log is the
through-line" reads as observation.

**Clinical read:** This is the *right* surface for users in
long-term recovery. A 4-year-sober user who has wine at a wedding
shouldn't see their app reset to 0 with no acknowledgment of the
prior 4 years. The surface respects the lived reality of recovery
without pretending the app is part of the program.

### 🟡 The medical disclaimer itself

The current medical disclaimer in `About.tsx` reads:

> "Alchohalt is a personal tracking tool and does not provide
> medical advice, diagnosis, or treatment. This app is not a
> substitute for professional medical care."

**Clinical read:** This is good but not enough. It says "not
medical care" but doesn't address the *intervention-resembling*
features specifically. A clinically-trained reader (or a
plaintiff's attorney) would point out that self-monitoring,
goal-setting, and pattern-feedback ARE intervention components.

**Recommendation:** add one line clarifying that any features that
*resemble* clinical interventions (self-monitoring, goal-setting,
pattern feedback) are personal-use tools, not delivery of clinical
care. This addresses the most-likely critique without overhauling
the surface.

## Action items for R17-6

1. **Land** the disclaimer-language update in `About.tsx`
2. **Land** the one-line clarifier in `PremiumWellnessDashboard`
   insights ("General suggestions, not personalized clinical
   guidance.")
3. **Note** that the existing surfaces are well-positioned. The
   app is doing the right thing in 90% of cases. The remaining
   10% is positioning work, not feature changes.

## What I would NOT change

- The streaks/milestones surface. R12+ removed XP/levels and the
  current observation-voice is the right register.
- The crisis routing. Excellent.
- The privacy disclaimers. They're scrupulous, in the right places.
- The goal-nudge banner copy. The R15+R16 mitigation work was the
  right call.
- The HALT-tag insights themselves. Good data.

## Sign-off

If I were consulting on this app for a treatment program partner,
I'd recommend it as a *complement* to care, not a replacement. The
R17-6 disclaimer updates close the small gap between "we're not
medical care" and "here's how this differs from intervention
components you might encounter in care."

— clinician judge, R17
