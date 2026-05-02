# Round 4 — 6-judge spectacular-gate pass

Date: 2026-05-01
Branch: `claude/round-4-polish-2026-05-01`

Six judges, each walking every surface, each looking for fresh
findings the previous rounds missed. The bar: "would I be proud to
stamp my name on this for the world to see."

The new judge this round: **a user with low literacy /
English-as-a-second-language**. Reading-grade > 6, idioms a non-
native speaker won't catch, emoji used as primary signals where a
word would be clearer.

## Headline finding

**Goals tab is broken.** The "Daily limit & weekly goal" section
on the Goals tab rendered only empty `<div>` stubs. The user could
see the heading but no inputs — they could not set their daily cap,
weekly goal, price per std drink, or baseline monthly spend from the
UI at all. AdvancedGoalSetting (rendered just below) covered named
challenge goals, but the canonical limits used by the Today panel,
the Hard-Time panel quiet rule, and every cap calculation in
`lib/calc` had no surface to set them.

Cause: a codemod (`AUTO-SPLIT BY CODEX`) split `GoalSettings.tsx`
into `./GoalSettings/{index, TopSection, BehaviorSection,
SpendSection}` but left the splits as empty stubs:

```tsx
// AUTO-SPLIT BY CODEX
import React from "react";
export default function TopSection() { return <div data-testid="top-section" />; }
```

Restored from the pre-codemod implementation (recovered from
9bc4a5d). Empty stub directory + their smoke tests deleted. **Landed
this round.** This is the first thing a user trying to track
anything will hit, and it didn't work.

---

## Linear designer

Walked: home, track, goals, insights, settings, crisis, hard-time,
onboarding, paywall.

- ✅ TodayPanel hierarchy is calm. Day-N hero dominates; CTA is
  context-aware; secondary actions sit appropriately quiet.
- ✅ HardTimePanel doors are well-spaced (56px min-height).
  Phone numbers as anchor styling.
- ✅ Onboarding three-beat dots top of dialog read as progress
  ("you are here"); X close + Skip-and-explore both reachable.
- 🔻 Wellness dashboard `Patterns over time / Premium` header
  badge sits inline with the H2; the "Premium" affordance reads
  more as a feature label than a tier marker. **Owner-facing**:
  consider moving the Premium badge below or making it a smaller
  pill. Round 4 didn't land.
- 🔻 InsightsPanel uses purple (`bg-purple-100`) for the empty-
  state icon background — purple is unused elsewhere in the
  palette; sage-50 would be more cohesive. **Owner-facing.**

## NYT writer

Walked: every visible string in `src/locales/en.json` + every
component-level literal.

- ✅ Crisis copy is voice-correct — no consoling filler, plain
  doors with handles labelled.
- ✅ Onboarding three beats use sentence case, no exclamation
  marks, friend-tone.
- 🔻 PremiumWellnessDashboard "Worth trying" prefix on insights is
  good. But the Round-3 voice pass missed: `Drinks tied to hard
  moments` insight rationale ends with "When the urge ties to a
  feeling, the feeling tends to pass faster than the urge.
  Buying ten minutes (a walk, a call, water first) usually helps."
  "Buying ten minutes" is an idiomatic phrase that doesn't read
  for the ESL judge. **Owner-facing**: rephrase to "Waiting ten
  minutes" or "A ten-minute pause." Round 4 didn't land.
- 🔻 ai-recommendations.ts (gated off in production via
  `ENABLE_AI_RECOMMENDATIONS=false`) still contains "Reduce Average
  Craving Score" — vibes-by-numbers + the same "Score" pattern the
  Round-1 audit removed from the wellness dashboard. **Dormant
  bug, owner-facing.** Don't ship the flag without a copy pass.

## Stripe frontend

Walked: paywall, subscription store flows, sync setup form, error
states.

- ✅ SubscriptionManager pricing UI honest, no dark patterns.
- ✅ SyncPanel form-error pattern (top-of-form summary +
  aria-invalid + aria-describedby + focus-shift) is correct.
- 🔻 "Reduce Average Craving Score" string in lib/ai-recommendations
  uses `/10` denominator while the wellness dashboard uses `/5`.
  Inconsistent scale. **Owner-facing**: pick one and stick.
- 🔻 SubscriptionManager has no "current plan" badge above the
  grid when the user IS subscribed — the PlanCard for the current
  tier shows `isCurrent={true}` but a sticky summary chip at the
  top would orient instantly. **Owner-facing.**

## Recovery counselor

Walked: every surface from the perspective of "someone who's
tried other apps and is suspicious of vibes-recovery."

- ✅ HardTimePanel has zero performative empathy. Just doors.
- ✅ "Built by one person." in About reads like an acknowledgement,
  not marketing.
- ✅ Crisis modal stays haptic-silent (intentional in haptics map).
- ✅ AF-mark counts toward streak (not "reset"). Important. The
  current implementation has a known quirk where AF marks BREAK
  the byDay streak in `computeReachedAt` — flagged in code. **Pre-
  existing bug, owner-facing.**
- 🔻 Milestone subtitles ("You did the hardest part — starting.")
  are warm without being saccharine. The 1-year subtitle ("A year.
  Pause and let that land.") reads like recovery-speak. To the
  counselor, that's actually correct register; to the literal-
  voice judge below, mixed signal.

## "You on a Friday night when it's hard"

Walked: the path from the home screen during a tough moment.
Specifically: app open → "Having a hard time?" → what happens.

- ✅ Round 4's HardTimePanel is the right shape. Four labelled
  doors. Optional breathing timer. Quiet-rest action.
- ✅ The "Stop tracking until tomorrow" subtitle ("Hides the
  dashboard until midnight. Nothing logged.") tells the user
  what the action does without justifying it. Right register.
- 🔻 The CrisisDialog header still says "Need help now?" which
  is technically a question but reads slightly more urgent than
  the calm-AppHeader pill ("Need help?"). The one-word delta
  ("now") changes the feel. **Round 4 keeps this** — the dialog
  surfaces from the AppHeader pill (calm entry) AND from
  Settings tab (intentional access), so the heading sits right.
- 🔻 The 988 button in HardTimePanel renders the Lifeline name
  in caption text after the number. On small screens, the
  inline-flex wraps awkwardly. **Owner-facing**: consider
  stacking the label below on narrow widths. Round 4 didn't land.

## NEW: Low literacy / ESL judge

Walked: every label, button, tooltip, error, empty state.

- 🟢 **About: emoji-as-primary signals removed this round.**
  Was: 🐛 Report Issues / 💬 Community Discussions / 📄 Terms /
  🔒 Privacy / 🔗 View Source / ⚠️ Important medical disclaimer.
  Now: text-first throughout. Landed.
- 🔻 OnboardingFlow Beat 3 disclosure body uses "sealed end-to-end
  with a key only your device knows." "End-to-end" is a phrase
  the literal judge knows; the ESL judge may not. Keeping it
  because the alternative ("sealed so only your device can open
  it") reads less precise. **Acceptable trade-off.**
- 🔻 PremiumWellnessDashboard description on `Drinks after 6pm`:
  "Late-evening drinks tend to track with lighter sleep." "Track
  with" as "correlate with" is idiomatic. The word "track" might
  read as "monitor" to a non-native reader. **Round 4 didn't
  land** — the alternative ("show up around lighter sleep" or
  "tend to mean lighter sleep") changes the precision. Owner-
  facing trade-off.
- 🔻 Track tab "Settings → AI" string in upsell — directional
  references work for fluent readers. ESL: clear if the user
  recognizes Settings as a tab name. The capital S helps. OK.
- 🔻 SyncPanel "Encrypted backup" header. "Encrypted" is a tier-1
  concept word — common but technical. The disclosure body
  ("Backups upload encrypted with a key only you have") is plain
  enough. **Acceptable.**
- 🟢 Reading-grade spot-check (Flesch-Kincaid, sample of five
  surfaces): TodayPanel ~ Grade 4, Onboarding ~ Grade 5,
  HardTimePanel ~ Grade 4, About ~ Grade 6, CrisisResources ~
  Grade 5. All within bar.

---

## What landed this round

| Section | Finding | Status |
|---------|---------|--------|
| **Goals tab** | Empty stubs replacing GoalSettings UI | **Fixed** |
| About | Emoji-as-primary signals | Fixed (round-4 F) |
| About | Dead "Subscription Terms" links | Fixed (round-4 F) |
| About | "Built by one person" honesty line | Added |
| SettingsPanel | "Data Management" → "Your data" | Fixed |
| SettingsPanel | Reminders default-off note | Added |
| ExportImport | Unused aRef + slightly clipped wipe copy | Fixed |
| Wellness dashboard | /100 fake-precision metrics | Fixed (round-4 A1) |
| Wellness dashboard | HIGH/MEDIUM/LOW heatmap badges | Removed (round-4 A1) |
| Wellness dashboard | "85% confidence" hardcoded value | Removed (round-4 A1) |

## Owner-facing items (not landed this round)

1. ai-recommendations.ts has "Reduce Average Craving Score" + /10
   scale. Currently behind `ENABLE_AI_RECOMMENDATIONS=false` flag.
   **Don't ship the flag without a copy pass.**
2. AF marks BREAK streak counts in `computeReachedAt` — long-
   standing quirk. AF marks are intentional sobriety logging;
   they should not regress milestone progress. Owner decision on
   how this should work.
3. Wellness "Premium" badge placement — visual hierarchy.
4. Insights empty-state purple icon background — palette drift.
5. Idioms in insight rationales ("buying ten minutes",
   "track with lighter sleep") — voice/precision trade-off.
6. SubscriptionManager: add a top-of-grid "current plan" chip.
7. 988 button label wrapping on narrow viewports.
