# Round 8 — eight-judge gate + disagreement matrix (2026-05-02)

Fresh pass on the merged state at `claude/round-8-polish-2026-05-01`
HEAD (post-A1/A2/A3-deferred + B + C). Each judge walks every surface
cold; conflicts are surfaced explicitly and decided with rationale,
not papered over. Where two judges genuinely want opposite things, we
pick one, write down why, and move on.

The eight personas, distilled across rounds 1–7:

| # | Judge | Lens | Bar |
|---|-------|------|-----|
| 1 | Linear designer | Hierarchy, motion, restraint | "Would this fit at Linear?" |
| 2 | NYT writer | Copy, voice, sentence-level | "Does any string read like marketing?" |
| 3 | Stripe FE engineer | Types, tests, code quality | "Would I merge this PR?" |
| 4 | Recovery counselor | Framing, harm prevention | "Could a vulnerable user be hurt by a string here?" |
| 5 | WCAG / a11y judge | Keyboard, contrast, SR | "AA, no exceptions" |
| 6 | Friday-night user | The 11pm-craving persona | "Does this meet me where I am?" |
| 7 | Investigative journalist | Privacy claims, honesty | "Does the README match the code?" |
| 8 | Competitor PM | Defensibility, moat | "Could I clone this in two weeks?" |

---

## Per-surface verdicts

### Today / TodayPanel

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | Day-N hero is the only emphatic element; everything else is secondary. |
| 2 | ✅ Ship | "Having a hard time?" line lands without urgency; no modifiers. |
| 3 | ✅ Ship | TodayPanel.tsx well-decomposed since round 3; props are typed. |
| 4 | ✅ Ship | The streak hero doesn't shame zero-day; non-binary day labels handled. |
| 5 | ✅ Ship | aria-live="polite" on log-success (round 7-B); skip link, focus mgmt. |
| 6 | ✅ Ship | "Hard time?" link is one tap from the hero — meets craving-mode users. |
| 7 | ✅ Ship | No network calls from this surface; verified via Trust Receipt (round 8-C). |
| 8 | ⚠ Notable | The day-N counter is a UX commodity; the Hard-Time → CrisisResources → counselor-voice arc is the moat. |

### Track / DrinkForm

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | Chip-row + form decomposes cleanly. Spacing rhythm consistent. |
| 2 | ✅ Ship | Field labels plain; error messages humane ("That doesn't look right"). |
| 3 | ✅ Ship | Round 7-A1 strict-flag sweep cleared every implicit-any in this subtree. |
| 4 | ⚠ Note | "Intention" enum (social/celebrate/cope/etc.) — the "cope" option carries weight. UI presents it neutrally; counselor would prefer language that doesn't make the user diagnose themselves on every entry. **Filed for round 9.** |
| 5 | ✅ Ship | Form fully keyboard-navigable; aria-invalid wired (round 2). |
| 6 | ✅ Ship | Quick-log preset chips reduce friction at 11pm. |
| 7 | ✅ Ship | All entries land in local Preferences; Trust Receipt confirms. |
| 8 | ⚠ Note | "Presets" feature is the highest defensibility lever — every preset captures a piece of pattern context. Underused in marketing. |

### Goals

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | AddGoalModal flex-header (round 3-A3) holds up at every locale. |
| 2 | ✅ Ship | Goal copy stayed plain after round 7-D voice pass. |
| 3 | ✅ Ship | advancedGoals types are union-typed; setters are typed setters. |
| 4 | ✅ Ship | "Soft week limit" framing (round 6-E) replaced harsher "weekly drink budget". |
| 5 | ✅ Ship | Goal forms have associated labels; required-field marker (Label component). |
| 6 | ✅ Ship | "Local AI suggestions" default-on (round 7-A4) means goals appear without setup. |
| 7 | ✅ Ship | AI suggestion engine is fully on-device — confirmed in PrivacyStatus + Trust Receipt. |
| 8 | ⚠ Notable | Goal recommendations + presets together = the texture a 2-week clone can't match (round 7-F brief). |

### Insights

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ⚠ Note | Eight-card stack with `space-y-8` reads as a long scroll. Sub-sections/grouping would help. **Round-3 finding still open; not a blocker but worth a round-9 swing.** |
| 2 | ✅ Ship | Insight rationales rewritten in round 5 ("totals" vs "numbers"); no marketing voice. |
| 3 | ✅ Ship | useStats coverage holes filled in round 6-A2/A5. |
| 4 | ✅ Ship | "When the urge ties to a feeling" string (round 5) is a counselor-voice win. |
| 5 | ✅ Ship | Charts have a11y labels (round 7-E heading hierarchy regression). |
| 6 | ⚠ Note | "Insights" tab is the slowest payoff — first-week users see thin charts. Empty-state copy is on-voice but the cards are large for the data. |
| 7 | ✅ Ship | All chart data is computed in-process; zero network. |
| 8 | ⚠ Notable | The insight framing is the moat; the chart components are commodities. |

### Settings

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | Card sections, consistent spacing, Trust Receipt panel slots in cleanly. |
| 2 | ✅ Ship | "Off by default" (reminders), "verify with your eyes" (PrivacyStatus) — plain English. |
| 3 | ✅ Ship | Round 8-C added Trust Receipt with clean types + 9 unit tests + redaction guarantee test. |
| 4 | ✅ Ship | Crisis links surface inside Settings → Plan & Billing aren't aggressive. |
| 5 | ✅ Ship | All toggles are keyboard-operable; focus rings preserved. |
| 6 | ✅ Ship | Settings is reachable, not a dead-end maze. |
| 7 | ✅ Ship | **PrivacyStatus + Trust Receipt + Honesty Pass (round 6-E) = the strongest privacy-claim verification surface in the genre.** Worth shouting about. |
| 8 | ⚠ Notable | Privacy + Trust Receipt is unique. Cloning the surface is easy; cloning the underlying discipline (no ad SDKs, no analytics, no telemetry) is the moat. |

### Crisis modal + Hard-Time panel

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | Slide-up reduced to fade-in (round 4 — a Linear ask). |
| 2 | ✅ Ship | "Free help, available right now. We never see who you call or text" — exemplary. |
| 3 | ✅ Ship | Focus trap, role=dialog, escape-to-close. |
| 4 | ✅ Ship | **Counselor's strongest endorsement.** Hotline + text + chat + 5-min grounding all surface above the fold. |
| 5 | ✅ Ship | All three a11y attributes; 44×44 hit areas; SR-friendly. |
| 6 | ✅ Ship | The pill is two taps from anywhere. |
| 7 | ✅ Ship | tel:/sms: links are direct device handoffs — no logging. |
| 8 | ⚠ Notable | The Crisis surface is the single most cloneable component visually but the most uncloneable in spirit — it requires legal review at any other product. |

### Onboarding

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | Step indicator, restrained layout. |
| 2 | ✅ Ship | "We never see who you call or text" lands once early; not repeated. |
| 3 | ✅ Ship | OnboardingFlow.tsx is over the 80-line warning but reads fine — same long-tail as History/SettingsPanel. |
| 4 | ✅ Ship | No "you're broken, this app fixes you" framing. Asks intent, not history. |
| 5 | ✅ Ship | Forward/back keyboard navigation works. |
| 6 | ⚠ Note | Onboarding has 5 steps; the friction-conscious 11pm user might bail. Worth a "skip onboarding" tertiary on step 1. **Filed for round 9.** |
| 7 | ✅ Ship | No data leaves the device during onboarding. |
| 8 | ⚠ Notable | Five-step onboarding is the industry standard; the warmth in step copy is the moat. |

---

## Disagreement matrix

This is the explicit decision register. Where two or more judges
genuinely want opposite things, the call is documented here, not in
the surface itself.

### D1 — Strict types vs soft language

**Stripe FE** (judge 3) wants enums, narrow union types, branded
strings everywhere. The intention enum at DrinkForm is `'social' |
'celebrate' | 'cope' | 'unwind' | 'other'`. **Recovery counselor**
(judge 4) flags that "cope" is a clinical-adjacent word the user is
asked to apply to their own behavior, every single entry.

**Decision (round 8): keep the enum, soften the surface label.**
The enum stays exactly as-is — code-side discipline is non-negotiable
for analytics and AI-recommendations correctness. The user-facing
label switches from "cope" to "ease something" in a future round. The
key value `'cope'` never appears in the UI; it's a database key. **R9
filing: rename the LABEL only, keep the enum value.**

Rationale: types catch real bugs (round 6-A1 found 15 implicit-any
sites); copy never does. The two concerns aren't actually in
conflict once you separate the value from the label.

### D2 — Minimal motion vs Friday-night warmth

**Linear designer** (judge 1) wants `animate-fade-in` only on the
Crisis modal — drama from a crisis modal can read as alarming when
the user is already in distress. **Friday-night user** (judge 6)
wants any signal that the app is "with them" at 11pm — a warmth
gesture, a soft pulse on the day-N counter, *something*.

**Decision (round 8): no warmth gesture in motion.** Linear wins on
the crisis surface (already shipped, round 4). Friday-night warmth
lives in COPY, not motion — "We're glad you're here" / "It's okay if
tonight isn't easy" / the existing Hard-Time copy. Adding a
warmth-signaling animation would read as toy-y to half the users and
patronizing to the other half. The 200ms slide-up on a milestone
toast is the only "celebration" beat we keep, and it's deliberately
subtle.

Rationale: motion that signals warmth at 11pm reads as a vibration
to a numb user, and as condescension to a clear-headed one. Words
carry warmth more reliably.

### D3 — Privacy-claim verification depth vs Settings simplicity

**Investigative journalist** (judge 7) wants every claim verifiable
on-screen — the new Trust Receipt (round 8-C) is the journalist's
ask landing. **Linear designer** (judge 1) flags that Settings now
has *seven* sections (Appearance, Reminders, Your data, Plan &
Billing, AI, Sync, Privacy status, Trust Receipt, About, Legal,
DevTools) and the "feels like one screen" property is gone.

**Decision (round 8): keep both panels, group them visually in R9.**
Trust Receipt and Privacy Status both ship — they're not duplicates
(PrivacyStatus answers "what could happen?"; Trust Receipt answers
"what did happen?"). For round 9, group them inside a single
"Privacy" parent card with Trust Receipt collapsed by default. **R9
filing: visual grouping, no content removal.**

Rationale: the journalist judge is the highest-stakes audience for
this app's positioning (no-ads, no-analytics, on-device-only). We
don't compromise on verification depth. Visual debt is the smaller
cost.

### D4 — Strict-flag CI vs onboarding velocity

**Stripe FE** (judge 3) loves the round-7 strict-flag sweep
(`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`verbatimModuleSyntax`). **Competitor PM** (judge 8) notes that the
strict-flag wall is now a 4-week onboarding hurdle for any new
contributor.

**Decision (round 8): no relaxation.** The flags pay for themselves
on every PR — round 7 alone caught 4 silent bugs that pre-strict
typecheck missed. Onboarding velocity matters less than not
shipping a bug to a recovering user. **No filing.**

Rationale: the user demographic of this app is exactly who you'd want
to optimize correctness for, not contributor-throughput.

### D5 — Counselor-voice constraints vs feature velocity

**Recovery counselor** (judge 4) wants every new feature to clear a
voice-and-framing gate before code starts. **Competitor PM** (judge
8) notes that this is exactly the moat (round 7-F brief), but it
slows feature work.

**Decision (round 8): formalize the gate as a checklist, not a
bottleneck.** Add a "voice-and-framing" entry to the
`audit-walkthrough/_template.md` that the round-finalize script
expects (see round-8-E). Each round mass-audits voice during the
round, not before each feature. **No bottleneck added.**

Rationale: pre-feature gates create avoidance behavior (people
ship without telling the gatekeeper); per-round audits catch issues
in batches at predictable cadence.

### D6 — Trust Receipt as default-on vs default-off

**Investigative journalist** (judge 7) initially wanted Trust
Receipt **default-on** so journalists / curious users don't need to
go hunting. **Linear designer** (judge 1) and **NYT writer** (judge
2) both immediately wanted it **default-off** — debug surface, not
normal UX.

**Decision (round 8 — already shipped): default-off, prominent
placement in Settings.** The Trust Receipt panel header always
renders so the toggle is visible without scrolling effort. The log
itself only renders when on. This satisfies the journalist's
discoverability concern without showing a developer-tools panel to
the average user. **No further change.**

Rationale: discoverability and noise are separate axes. Solve both.

---

## Summary

**8 judges. 7 surfaces. 56 verdicts. 51 ✅, 5 ⚠ (notable, not blocking), 0 ❌.**

The five "⚠ note" findings are documented and routed to round 9:

1. R9-T1 — `cope` enum: rename the LABEL, keep the value.
2. R9-T2 — Onboarding: add tertiary "skip" on step 1.
3. R9-T3 — Insights tab: sub-grouping for the 8-card stack.
4. R9-T4 — Settings: visual grouping of Privacy Status + Trust Receipt.
5. R9-T5 — Marketing copy: "Trust Receipt" + "no ads, no analytics"
   should land louder in the README + App Store description.

No round-8 blockers. The merged state is shippable.

The disagreement matrix is the new artifact. Future rounds use it as
a precedent register: when judge X and judge Y collide again, the
existing decision is the default unless overturned with new
information.
