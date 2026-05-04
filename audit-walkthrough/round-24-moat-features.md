# Round 24 — Unique-to-us moat features (2026-05-03)

Distilled from `round-24-competitive-matrix.md`. The features below
are ones a competitor can't ship without first changing their privacy
or business posture. They are the lines marketing should lead with —
not the lines that try to outdo Reframe's coach or Sunnyside's text
program at their own game.

The frame is "what would a competitor have to undo to copy this?",
not "what can we list on the App Store page?". A long feature list is
table-stakes for the niche; a list a competitor can't follow is a
moat.

---

## M1. Trust Receipt — `lib/trust/receipt.ts`

A cryptographic hash trail of every storage write and every network
call the app makes, exportable from Settings → Trust Receipt as a
single signed text file. The user (or their friend, journalist,
partner) can verify offline that the binary they're running matches
the audit they're reading.

**Why competitors can't follow without changing posture:**
- A SaaS app cannot truthfully say "no third-party calls" — they have
  Segment, Amplitude, Sentry, etc. wired in. Removing them shrinks
  their analytics-driven roadmap, which is how their PMs measure.
- A closed-source app can produce a "receipt" but a user has no way to
  verify it matches the running binary; you'd just be trusting the
  marketing claim. The whole point of the receipt is verification.

**Marketing line:** *"We give you the receipt, not just the promise."*

**State:** Shipped. Round 19 added the export button.

---

## M2. End-to-end encrypted backup — `src/features/backup`

The user's data is sealed with a key derived on-device. The cloud
holds an opaque blob. The maintainers cannot decrypt it. Restoring on
a new device requires the user's recovery phrase or password —
forgotten = unrecoverable, by design.

**Why competitors can't follow without changing posture:**
- Customer support cannot "look at your data to help" if the data is
  encrypted. Reframe / Sunnyside style support, where an agent walks
  you through a missing entry, depends on plaintext server-side
  storage. They've trained users to expect that.
- Adding E2E later means losing all existing analytics on user
  behavior — the entire personalization engine breaks.

**Marketing line:** *"Cloud backup that even we can't read."*

**State:** Shipped. R15 added auto-verification with a failure ribbon
(R15-3) so the user knows a backup is round-trip-verified.

---

## M3. No third-party analytics — structurally enforced

There is no Segment / Amplitude / Mixpanel / Heap / Sentry / etc. in
`package.json`. The opt-in crash reporter (R19-4, default OFF) is the
only network path that can leave the device, and it ships off. The
`capacitor.ts` shim plus a lint rule prevent silent re-introduction.

**Why competitors can't follow without changing posture:**
- Their PMs run on funnel dashboards. Removing analytics cuts off the
  feedback loop that justifies their roadmap. The org chart depends on
  the data.
- Their growth team A/B tests against engagement metrics they don't
  collect. The team would have to relearn the job.

**Marketing line:** *"There is no analytics SDK to remove. We never
added one."*

**State:** Shipped. The lack of dependency is the proof.

---

## M4. Always-on crisis surface — `crisis/CrisisResources.tsx`

A muted-indigo "Need help?" pill in the AppHeader, present on every
screen. One tap opens regional helpline packs (988 + SAMHSA for US,
plus UK / AU / CA / IE). No setting can disable it. No A/B test can
hide it. The user-installable line (R16-2) lets a user from a smaller
market pin a local-language hotline that surfaces above the
auto-detected pack.

**Why competitors can't follow without changing posture:**
- An app that monetizes engagement does not put a one-tap exit button
  on every screen. The exit button costs them their North-Star metric.
- The user-installable hotline requires shipping a regional fallback
  story that doesn't insult the global majority of users — most apps'
  default is "you're in the US, right?", which Alchohalt explicitly
  refuses.

**Marketing line:** *"If you need help, the help is one tap away — not
buried under three settings menus."*

**State:** Shipped. R13 + R16 + R20 + R22 hardened the surface.

---

## M5. On-device A/B testing — `features/experiments/`

A registry of experiments with deterministic device-bucket assignment
(`getDeviceBucket()`). Exposures are recorded locally and surfaced in
DiagnosticsAudit. Zero network telemetry. The owner can ship a
hypothesis and read on-device results from their own phone.

**Why competitors can't follow without changing posture:**
- Their A/B framework IS the analytics SDK. Removing the SDK means
  rebuilding the experimentation layer from scratch — which they
  won't, because their PMs depend on it.
- Without server-side aggregation, they can't auto-promote winners.
  Doing that would require accepting "the owner reads results
  manually," which is a step backward in their org.

**Marketing line:** *"We learn what works without watching you."*

**State:** Shipped, dormant. R14-4 + R17-B.

---

## M6. Open source — verifiable, not just stated

The repository is public. Every release tag corresponds to a buildable
commit. The Trust Receipt's hash trail can be cross-checked against
the open `lib/trust/` code.

**Why competitors can't follow without changing posture:**
- Their growth team's playbook (paywall A/B tests, dark-pattern
  retention loops, soft-blocked features) cannot survive public code
  review. The PR backlash would be immediate.
- Their pricing is opaque on purpose; opening the code would force a
  pricing rationale conversation they don't want to have.

**Marketing line:** *"Read the code that handles your data."*

**State:** Shipped — this is the repository.

---

## M7. NPS pulse stays on the device — R24-3

A 30-day on-device pulse asking "Would you tell a friend about
Alchohalt?" Stored locally only. Reasons (when given) are visible in
the user's exported data, not in any server log. The DiagnosticsAudit
NPS row shows score + bucket only; reasons are deliberately hidden
from the audit so a shoulder-surfer cannot read them.

**Why competitors can't follow without changing posture:**
- The whole point of NPS for them is to feed product analytics.
  Stored-only-locally NPS provides no signal to the org. They wouldn't
  ship it.
- A user-readable export of their own NPS history is unique. No app
  shows the user their own NPS responses back to them as data they
  own; competitors treat NPS as private-to-the-PM.

**Marketing line:** *"We ask once a month. Your answer stays on your
phone. You can read your own history."*

**State:** Shipped this round.

---

## M8. Plain-language copy at ~grade 6 reading level

Voice guidelines + per-round reading-grade gates (R7-A1, R20-B,
R22-A) keep the in-app and marketing copy at roughly Flesch-Kincaid
grade 6. Per the round-24 reading-grade comparison (§ E of
`round-24-competitive-matrix.md`), competitors land around grade 9-12
in their App Store descriptions.

**Why competitors can't follow without changing posture:**
- Their copy is grade 9-12 because their growth team values "premium
  feel" over comprehension. Lowering the grade reads as "downmarket"
  to them.
- Their legal review process won't approve plain-language disclaimers
  — they prefer the safer "consult a healthcare professional" framing
  that protects them at the cost of being useful to the person reading
  it on their worst day.

**Marketing line:** *"Written for the worst day, not the best."*

**State:** Continuous. Each round re-checks new copy.

---

## What this list deliberately omits

- **AI coach / chat.** A coach that talks to an LLM cannot make
  privacy or crisis-surface guarantees. Reframe has it; we don't, on
  purpose. Not a moat for them — a posture violation if we copied.
- **Community / cohorts.** I Am Sober's lineage. Adds moderation
  burden, abuse vectors, and a content-policy team. We have none.
  Same logic.
- **Streak fanfare.** "Don't break the chain" is banned (R8 voice).
  Fanfare drives engagement metrics that we don't track and don't
  want.
- **Standard-drink unit conversion across countries.** This IS a
  feature gap (cat 3 in the matrix). It's not a moat — it's an open
  cheap win, scoped in `round-24-competitive-matrix.md` § D.

---

## Recommended marketing rotation (top 5 to lead with)

The list above has 8 moats. Most marketing surfaces (App Store
description, homepage, README) can lead with 3-5 of them without
becoming a wall of text. The recommended rotation, in priority order:

1. **M3 No third-party analytics** — easiest claim to verify; proves
   the others.
2. **M2 E2E encrypted backup** — most concrete user benefit.
3. **M4 Always-on crisis surface** — emotional differentiator;
   reframes the category.
4. **M1 Trust Receipt** — for the technically inclined; establishes
   the "verifiable, not just stated" pattern.
5. **M8 Plain-language copy** — meta-feature; lands once the user
   reads even one paragraph of the rest.

M5 (on-device A/B), M6 (open source), and M7 (NPS-on-device) are
secondary — strong supporting evidence in a longer "About" or "How
this is built" page, but heavy lift for an App Store description.
