# Cross-product patterns — Alchohalt → Wend (and beyond)

**Author:** Cowork Sprint
**Date:** 2026-05-03
**Scope:** R18-6. After 18 rounds of polish on Alchohalt, document what
worked here that should be ported to Wend (digital death-prep SaaS) and
any future product where the user is in a vulnerable, calm-decision
state.

The two products share a posture: **the user is showing up to a sensitive
domain at a sensitive time, with high stakes, and needs a calm, honest
tool — not a pushy growth product.** Recovery and end-of-life have
different specifics but the same posture. Patterns that worked here
generalize.

## Patterns to port directly

### 1. Calm voice as a positioning decision (not a copywriting choice)

What it means: every UI string is reviewed for whether it reads like
marketing, gamification, or a quiet helper tool. The bar is "would a
NYT writer flag this as marketing-speak."

Round 9-13 in Alchohalt rewrote 200+ strings to a single calm voice.
R18-3 caught fr/de drift back to wellness-marketing voice that **four
later rounds had missed**. The voice is a discipline, not a one-time
sweep.

**Wend takeaway:** end-of-life copy is even more sensitive than
recovery copy. The same calm-voice rule applies, harder. Strings like
"Plan your final wishes" need to read as quiet utility, never
"prepare your legacy journey."

**Port:** the NYT-writer judge persona. Apply it from round 1 of Wend
to every user-visible string.

### 2. Privacy posture as a moat (not just a checkbox)

What it works like in Alchohalt:
- All entries on-device by default
- Opt-in cloud sync uses end-to-end encryption with device-only key
- "Trust receipt" surface that lets the user verify the privacy claim
- AI features explicitly opt-in, with the data flow surfaced
- A `marketing.moatLine` of "We cryptographically cannot read what you
  log" — claim that holds up because the code doesn't have a path to
  read it

**Wend takeaway:** death-prep documents are even more sensitive
(financial, family, post-mortem instructions). Users won't trust a
SaaS that can technically read their will. Same E2E posture +
trust-receipt surface = unlock.

**Port:** the privacy judge persona ("does README match code?"). Apply
to every data flow in Wend from day 1.

### 3. Calm restart over reset (recovery / loss patterns)

What worked in Alchohalt: instead of "Day 0" / "you broke your streak,"
the app frames restart as **soft restart** — "You're back. {{total}}
alcohol-free days so far." The data still tracks the streak break; the
voice doesn't shame.

R12's StreakBreakPrompt and R10's HardTimePanel are the strongest
examples: both surfaces reach the user at their lowest moment with
calm framing, not motivational poster framing.

**Wend takeaway:** death-prep has analogous "didn't open the app in 6
months" / "haven't updated your will after a major life change"
moments. The framing should be calm-renewal, not nag.

**Port:** the recovery counselor judge persona generalizes to "could a
vulnerable user be hurt by this surface?" Apply to every reminder /
prompt / re-engagement nudge in Wend.

### 4. Consistency score over points

What changed in Alchohalt: round 16 stripped levels/points/badges
gamification entirely. The "consistency score" is a single number
without ranks or badges, calm and informative.

**Wend takeaway:** death-prep apps must NEVER gamify. No "Legacy
Score: 87/100." A single calm progress indicator (e.g. "You've
completed 4 of 7 essential documents") is enough.

**Port:** the ethics judge persona ("does design respect agency?")
applied to any progress/completion UI from round 1.

### 5. On-device telemetry only

What worked in Alchohalt: experiment exposure counts, onboarding
funnel data, A/B variant assignments — all collected, all surfaced to
the owner via DiagnosticsAudit. **None transmitted off-device.** R7's
investigative-journalist judge ("does the README match the code?") is
the verification.

**Wend takeaway:** same posture. If Wend wants to A/B test surfaces or
measure funnel completion, the data lives on-device and the user can
see it. Owner pulls aggregate stats by sampling consenting users, not
by tapping into an analytics fire-hose.

**Port:** the same A/B framework Alchohalt has in `src/lib/experiments/`
+ the DiagnosticsAudit panel that surfaces exposure counts.

### 6. Judge-based gate as final ship check

What it means: after all the technical checks (tests, lint, typecheck,
build, bundle budget, perf baseline), there's a final gate where
N personas walk every new surface cold. The bar is "spectacular," not
"passable."

The persona gallery grew over rounds: R1 (4 judges) → R5 (6) → R8 (8)
→ R12 (12) → R15 (15) → R16 (16) → R17 (17) → R18 (18). Each round
adds the judge that would have caught the bugs the previous rounds
missed.

**The R18 i18n specialist is the proof.** R9-13 all "passed" but the
fr/de voice drift was sitting there waiting to be caught. The right
specialist judge in the room finds it.

**Wend takeaway:** death-prep has its own specialist gallery —
estate lawyer, hospice nurse, grieving spouse, executor of complex
estate, financial advisor, identity-theft expert. Same gate shape,
different specialists.

**Port:** the gate format and the discipline of growing the persona
list one judge per round.

### 7. Trust receipts (printable + verifiable)

What worked in Alchohalt: R6's TrustReceipt surface generates a
printable PDF showing the user's data flow — what's on device, what's
in cloud, what AI features are enabled, when each was last touched.
Auditable surface that backs the calm-voice marketing claim with code.

**Wend takeaway:** death-prep has stronger receipt needs (executors
need to verify the user's intent at a specific date). Wend's receipt
is even more important than Alchohalt's.

**Port:** the printableReceipt module + TrustReceipt UI with
death-prep-specific surfacing.

## Patterns to NOT port (or to handle differently)

### Streak-based engagement
Alchohalt has streaks because they map naturally to "consecutive
alcohol-free days," and even then the soft-restart framing is critical
to avoid streak-shame. Death-prep has no such natural streak —
"consecutive days you remembered to update your will" is absurd. Wend
should not have streaks.

### HALT-style mood tagging
Alchohalt's mood tagging (Hungry/Angry/Lonely/Tired) maps to recovery
psychology. Death-prep has different emotional context (grief,
ambivalence, family pressure) — needs a different framework, not a
direct port of HALT.

### Crisis surfaces (988 / SAMHSA)
Alchohalt's crisis links are domain-specific. Wend's analogous surface
links to grief support, hospice resources, identity-recovery hotlines
— different vocabulary, different referral paths.

## Architectural patterns worth porting (technical, not UX)

### A. Lazy-loaded panels with idle prefetch
Pattern: `React.lazy()` for heavyweight panels; `requestIdleCallback`
warms next-tab chunks after Today mounts. Bundle budget stays under
control while perceived navigation latency stays near-zero.
Implementation: `src/features/homepage/TodayHome.tsx` useIdlePrefetch.

### B. Locale-aware plural helper
Pattern: `pluralCount` / `pluralNoun` helpers using `Intl.PluralRules`
for correctness across Western European + Slavic languages. The helper
is in `src/i18n/plural.ts`. Tests `src/i18n/__tests__/plural-pl-ru.test.ts`
verify the irregular Polish/Russian buckets.

### C. Round-based development with audit walkthroughs
Pattern: `scripts/round-kickoff.sh` + `audit-walkthrough/round-N-*.md`
per round. Each round has a baseline measurement, a per-section commit
trail, an audit doc, a judge gate, and a finalize step. The discipline
made 18 rounds worth of polish feasible.

Implementation:
- `scripts/round-kickoff.sh`
- `scripts/round-finalize.sh`
- `audit-walkthrough/_template.md`
- One commit per `[R{N}-{SECTION}]` logical group
- Round walkthrough doc + judge gate doc per round

### D. Per-tier app icon themes (premium signal without paywall friction)
Pattern: free tier has one icon, paid tier unlocks more. R12 surfaced
the picker; calm visual differentiation, not gating.

### E. On-device A/B framework
Pattern: variant assignment is a hash-based deterministic function of
device-stable seed; exposures logged locally; DiagnosticsAudit
surfaces the data. No server needed.
Implementation: `src/lib/experiments/`.

## Round-shape lessons

**One round = one PR.** Alchohalt rounds are bundled into a single PR
with 5-10 commits. Reviewers see the full shape. Reduces back-and-forth
and prevents partial-merge regressions.

**Last 4 of N is the hardest.** Round 17 retired 11 of 15 long-fn
warnings; round 18 retired the last 4. The first 70% of any sweep is
easy; the last 20% takes a focused round of its own.

**Defer carefully and document.** R17-5 audit explicitly deferred 20
plural conversions to R18 with a written justification. R18 picked
them up cleanly because the deferred state was documented. Verbal
deferrals don't survive across rounds.

**Spectacular bar > passable bar.** The judges are gating on
"spectacular," not "passable." Passable would have shipped fr/de drift
across 4 rounds. Spectacular catches it on round 18. The bar matters.

## Suggested Wend round-1 plan (informed by Alchohalt R1)

1. R1-A: Calm-voice copy review, NYT-writer judge applied to every
   string from day one.
2. R1-B: Privacy posture set up — on-device storage default, E2E
   encryption for cloud sync, trust-receipt printable surface.
3. R1-C: A/B framework + DiagnosticsAudit pattern ported.
4. R1-D: i18n helper + plural correctness pattern ported (en + es +
   fr + de from day one; pl/ru can wait).
5. R1-E: Round-kickoff scripts + audit-walkthrough scaffolding.
6. R1 judge gate: 4 judges to start (Linear designer, NYT writer,
   Stripe FE, privacy journalist). Grow per round.

If Wend round 1 lands these, round 2-onwards can iterate on
domain-specific surfaces without re-litigating the foundation.

## Closing

The 18-round Alchohalt arc proves that polish-with-discipline beats
feature-velocity for a sensitive-domain product. Each round added one
judge or one polish pass and locked in the ground gained. The product
that ships at v1.0 is something I'd put my name on.

Wend should aim for the same discipline. The patterns above are the
distillation; the rest is execution.
