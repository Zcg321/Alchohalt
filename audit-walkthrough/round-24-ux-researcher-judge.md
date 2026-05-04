# Round 24 — Freelance UX-researcher judge

Date: 2026-05-03
Judge persona: freelance UX researcher, decades of experience,
$0 software budget. Asked to plan a 1-week unmoderated usability
study, n=10, for Alchohalt — a privacy-first alcohol-tracking PWA.

This judge's contribution is twofold: (1) a pre-emptive audit of
issues a real study would surface, so the owner can pre-fix the
ones that would otherwise dominate findings, and (2) a complete
study guide the owner can hand to a researcher tomorrow.

---

## Part 1 — Pre-emptive judge audit

Read targets: `src/locales/en.json`, `src/features/onboarding/`,
`src/app/AlcoholCoachApp.tsx`, `src/features/drinks/DrinkForm/`,
`src/features/crisis/HardTimePanel.tsx`,
`src/features/milestones/Milestones.tsx`,
`src/features/drinks/ExportImport.tsx`, plus rounds 22-23 reports.

Issues are ranked by what a real n=10 unmoderated study (Loom
recordings + post-task forms) would actually catch — i.e. things
the user would visibly hesitate, miss, or mis-explain.

### Issue 1 — Quick-mode locks time to "now"; backdating drops to detailed-form

**Severity: major.** R23 stress-test already named this. In a
1-week study, ~30% of sessions in real life are "just had one,
forgot to log" → user wants quick-log but can't backdate.

**What the study catches.** Tasks 2 and 3 (quick-log + log-from-
yesterday) will produce two visible behaviors: (a) the user taps
quick-log and then says "wait, that's the wrong time" in the
think-aloud track, or (b) they go fishing in the History list to
edit the just-logged entry. Both will appear in 4-6 of 10 Loom
recordings.

**Fix to hand engineering.** Add a small "earlier today?" link
underneath the QuickLogChips group (`QuickLogChips.tsx`). Tap
opens a single-field datetime sheet, defaults to 1 hour ago, then
calls the same `onLog` with adjusted `ts`. No need to expand the
detailed form. Maps directly to R24-FF2 from R23-3.

### Issue 2 — Onboarding chip A/B test labels are inconsistent across builds

**Severity: minor.** `OnboardingFlow.tsx` runs the
`onboarding-chip-copy-2026Q2` experiment with three variants
("control", "first-person", "first-person-trying"). Different
participants will see different chip labels.

**What the study catches.** Cross-participant quotes in synthesis
will read like contradictions: P3 quotes "Trying to drink less";
P5 quotes "I'm trying to drink less"; P7 quotes "I want to drink
less". The synthesist will spend 30 minutes wondering if these are
the same screen.

**Fix to hand engineering.** Either pin the experiment to a single
variant for the duration of the study (set the env flag), or have
the moderator note variant per participant in the screening form
(read from `data-variant` attribute on `[data-testid="onboarding-
chip-row"]`). Pinning is cheaper.

### Issue 3 — "AF" abbreviation everywhere; 65yo + low-tech users won't decode it

**Severity: major** for the 65+ participant; minor for others.
R22-5 already kept this as a low-but-known issue. Stats tiles use
"AF days", "AF streak". The full form ("Alcohol-free days") only
appears in `stats.afDaysLabel`.

**What the study catches.** The 65+ participant will pause on the
Today tile in their first session and ask, in Loom, "what does AF
mean?" If the share-progress task hits, they'll also ask whether
"AF streak: 4" is good or bad.

**Fix to hand engineering.** First-encounter tooltip on "AF" the
first time it appears on Today. One-line glossary: "AF =
alcohol-free." Same lift solves "HALT" — pair them.

### Issue 4 — "Having a hard time?" panel only opens via the Today-tab "Rough night?" tile

**Severity: major.** `HardTimePanel` is mounted via
`useCrisisDialogs.openHardTime` and triggered from `TodayHome`'s
`onRoughNight` prop. There is no global entry point — no toolbar
button, no menu item. A participant in week 1 who's having a hard
moment but is on the Track or Settings tab won't find it.

**What the study catches.** The "find help when you're struggling"
task (Task 4) will produce 5+ of 10 participants who can't find
the panel from any non-Today tab without explicit nudging.

**Fix to hand engineering.** Add a small persistent "Need a
moment?" link in `AppHeader` (next to the existing crisis link if
present, or as a sibling). Routes to the same
`crisis.openHardTime`. One-line addition. The crisis-resources
dialog already has a header entry — mirror that pattern.

### Issue 5 — Export flow is buried in Settings with no progressive disclosure

**Severity: minor.** `ExportImport.tsx` lives in the Settings tab
under a section header. The first thing the user sees is two
buttons (Export to JSON, Export to CSV) and a "Limit to a date
range" checkbox. No explanation of when to use which format until
after the user reads the body paragraph.

**What the study catches.** Task 6 (export your data) will surface
hesitation around format choice. ~4 of 10 will ask "what's
JSON?" The CSV vs JSON copy is in the body paragraph but reads
after the buttons in the visual scan.

**Fix to hand engineering.** Reorder the buttons so each has a
1-line subhead: "JSON — for backup and re-import" / "CSV — for
spreadsheets". Same pattern used by the BeatTwo tracking-style
chips in `OnboardingFlow.tsx`. ~5 lines of JSX.

### Issue 6 — Milestone celebration is a quiet entry, not a moment

**Severity: minor.** `Milestones.tsx` is intentionally minimal
(`[IA-5]` reasoning: no XP, no leaderboard). When a user crosses
day 7 / 30 / 90, the milestone gets a check + date in the list.
There is no in-app moment — no toast, no ribbon, no haptic — at
the moment of crossing.

**What the study catches.** Task 5 (find your milestones / talk
about progress) will surface a split. Some participants will say
"I love that it's quiet, the streak apps make me feel watched."
Others will say "wait, I hit a week and the app didn't say
anything?" Both will be quoted.

**Fix to hand engineering.** This is a deliberate design choice;
the study confirms or refutes it. No code change pre-study —
let the data drive whether to add a one-time gentle ribbon at
milestone crossing. (The haptic hook `useMilestoneHaptics` already
exists in `useAppEffects.ts` — visual moment is the only gap.)

### Issue 7 — `<details>` "Tell me how" in BeatThree onboarding hides the privacy claim

**Severity: minor.** `OnboardingFlow.tsx` BeatThree hides the
storage-mechanism explanation behind a native `<details>` element.
For privacy-anxious users — the audience this app explicitly
targets — that's the load-bearing claim and it's collapsed by
default.

**What the study catches.** Post-task survey question on trust
("did you trust the privacy claim?") will produce a bimodal
response: people who clicked "Tell me how" trust it (5/10
expected), people who didn't, didn't notice the claim was
substantiated (3/10). The 2 remaining are screen-reader / AT
users who heard the disclosure exists and may or may not have
expanded it.

**Fix to hand engineering.** Either expand the `<details>` by
default on first run, or hoist the first sentence ("Entries live
in your phone's local storage") into the always-visible body and
keep the rest behind the disclosure.

---

## Part 2 — Ready-to-run usability study guide

Hand this to a freelance researcher tomorrow. Everything below
fits inside Google Forms + Loom + Calendly free tier + Stripe
or Wise for payment.

### 1. Study goals

1. Time-to-first-drink-logged (TTFDL) on a fresh install. Target:
   median ≤ 20 seconds, P95 ≤ 60 seconds. Measured from app open
   on Loom.
2. Quick-log mode discovery rate. Target: ≥ 6 of 10 participants
   discover and use it within Day 2 without prompting.
3. "Having a hard time?" panel findability. Target: ≥ 7 of 10 can
   reach it from any tab in ≤ 3 taps when prompted ("you're
   struggling — what would you do in this app?").
4. Export comprehension. Target: ≥ 7 of 10 can articulate the
   difference between JSON and CSV exports after using one.
5. Trust signal recall. Target: ≥ 8 of 10 can answer "where does
   your data live?" correctly without re-opening the app.

### 2. Participant recruitment criteria

n=10. Mix:
- Age: 4× 25-39, 4× 40-64, 2× 65+ (the 65+ pair gives statistical
  noise but covers the tap-target / vocab gap R22-5 surfaced).
- Drinking pattern: 3× currently cutting back, 3× currently
  abstaining (≤ 90 days), 2× sober ≥ 1 year, 2× curious /
  reflective drinker not actively changing.
- Device: 6× iOS Safari, 3× Android Chrome, 1× desktop Chrome
  (the 1 desktop catches PWA-on-desktop edge cases).
- Accessibility: 1× screen-reader user (NVDA, JAWS, VoiceOver, or
  TalkBack — let them pick), 1× user with system text scaling
  ≥ 130% (visual but not AT). At least 1 participant in the 65+
  pair should also be the text-scaling user (overlap is fine and
  cheaper than recruiting separately).

Exclude:
- Anyone in active alcohol-use crisis (the study is not a
  treatment context).
- Software developers (they'll over-rationalize the UX).
- Anyone who has used Alchohalt before.

### 3. Recruitment script

> We're looking for 10 people to try a new privacy-first
> alcohol-tracking app for one week and tell us what worked and
> what didn't. The app stores everything on your phone — nothing
> goes to a server unless you turn on cloud sync.
>
> What's involved: install a web app (no app store), use it
> however you want for 7 days, log at least 3 sessions of 10
> minutes (in your own time, on your own device), record those
> sessions with Loom (free, we'll send you the link), and fill in
> a short form before and after the week. Total time: about 90
> minutes spread across 7 days. We pay $50 by Wise or Stripe on
> completion.
>
> You don't need to be a tech person. You don't need to be trying
> to quit drinking. We're testing the app, not you — there are
> no wrong answers. If you have a screen reader, use a large
> font, or are over 65, we especially want to hear from you (we
> have 2 spots reserved for each).
>
> Reply with your age range, what kind of phone you use, your
> current relationship with alcohol (one sentence is fine), and
> any accessibility needs. We'll get back to you within 48 hours.

### 4. Compensation guidance

- $50 USD per participant on completion. This is the customary
  rate for a 90-minute spread-across-7-days unmoderated study in
  US/EU markets in 2026. UserTesting equivalent rate: $60-80;
  freelance market: $40-50; below $40 you skew toward
  unrepresentative respondents.
- Bonus $25 for the screen-reader participant and the 65+
  participants — not because their time is worth more, but
  because (a) they're harder to recruit, (b) the AT walk requires
  more setup time on their end, and (c) bonus signals the
  research team values the population.
- Pay on completion (post-task survey submitted), not on signup.
  Pay within 48 hours via Wise (cheapest cross-border) or Stripe
  Connect (US-only, instant).
- Total budget: 10 × $50 + 3 × $25 bonus = **$575**.

### 5. Task scenarios (with success criteria)

Each task is run by the participant in their own session, on
their own device. The Loom recording captures screen + voice;
post-task they answer 1-2 questions in the Google Form.

**Task 1 — First-run install and onboarding (Day 1, 8 min).**
Install the PWA from the URL we send. Walk through whatever
appears on first open. Talk out loud about what you see, what you
expect, and what surprises you. Stop when you reach the main app.
- Success: completes onboarding (skip-and-explore counts) without
  asking for help. Records intent OR says out loud what they would
  pick.
- Watch for: Beat 1 chip-label confusion (Issue 2), Beat 3
  privacy claim recall (Issue 7), time spent on each beat.

**Task 2 — Log your first drink the easy way (Day 1, 3 min).**
Pretend you just had a drink (any kind). Log it in the app the
fastest way you can find. Talk out loud about the choice you
made and any decisions you had to think about.
- Success: drink appears in the History list within 60 seconds of
  task start. Quick-log usage = bonus signal.
- Watch for: did they find QuickLogChips on the Track tab, or
  default to the detailed form? (Discovery is one of the 5
  goals.)

**Task 3 — Log a drink you had yesterday (Day 2, 4 min).**
Now log a drink you had at 7pm yesterday — same drink type as
Task 2.
- Success: entry exists with yesterday's date.
- Watch for: did they try quick-log and get stuck on the time?
  How did they recover? (This is the Issue 1 catch.)

**Task 4 — You're having a hard moment (Day 3, 2 min).**
Imagine it's 9pm, you're craving, and you want the app to help
you ride this out. Show me what you'd tap. Don't actually call
anyone — we just want to see how you'd find help in the app.
- Success: opens "Having a hard time?" panel within 3 taps from
  wherever they currently are.
- Watch for: which tab they were on at task start, did they need
  to navigate to Today first? (This is the Issue 4 catch.)

**Task 5 — Talk about your progress (Day 5, 5 min).**
Open the part of the app that shows how you've been doing.
Tell me what each thing on screen means. If you've crossed a
milestone, find it. If something is unclear, say so.
- Success: locates milestones list, can describe at least 3 stat
  tiles in their own words.
- Watch for: "AF" decoding (Issue 3), milestone-moment
  expectations (Issue 6), share-progress button discovery.

**Task 6 — Export your data (Day 6, 5 min).**
The app says everything stays on your phone. Find where you can
download or back up your own data. Try one of the export options
and tell me what you got.
- Success: file downloads to device. User can articulate what
  they downloaded.
- Watch for: JSON vs CSV confusion (Issue 5), date-range
  discovery, trust comprehension (do they realize this is theirs,
  not a copy on a server?).

**Task 7 — Free exploration (Day 7, 10 min).**
We've covered the basics. Spend 10 minutes doing whatever you
want with the app — explore, log, change settings. Talk out loud
about anything that surprises you, anything you wish worked
differently, and what (if anything) you'd want to use this app
for in real life.
- Success: just records the session.
- Watch for: feature discovery, settings exploration, intent
  questions revisited.

### 6. Pre/post questions

**Pre-study (in screening Google Form, 6 questions max):**
1. Age range, device, screen reader / large text use.
2. Current drinking pattern (one sentence).
3. Have you used a tracking app for any habit before? Which?
4. What would make you trust an app with personal health data?
5. What's your biggest concern about being recorded with Loom?
6. Anything else we should know to make this work for you?

**Post-study (Google Form, 7 questions, mostly open-ended):**
1. In one sentence, what is this app for? (Trust + framing recall)
2. Where does your data live? (Trust signal — Goal 5)
3. The fastest way to log a drink in this app is... (Quick-log
   discovery — Goal 2)
4. If you were having a really hard moment, what would you tap?
   (Findability — Goal 3)
5. What was the most confusing thing you saw all week?
6. What's one thing you'd change?
7. Would you use this app for real? Yes / No / Maybe — and one
   sentence why.

No Likert scales, no NPS. Open-ended produces quotes you can use
in synthesis; Likert produces noise at n=10.

### 7. Free-tier toolchain

- **Google Forms** — screening survey, pre-study questionnaire,
  post-study questionnaire. Free, unlimited responses.
- **Loom (free tier)** — participants record their own sessions.
  Free tier allows 25 videos per workspace, 5 minutes max per
  video. Each participant has their own workspace (use their own
  Google login); 7 sessions × 5 min fits comfortably.
- **Calendly (free tier)** — 1 event type, used only for the
  optional 15-min kickoff call (debrief is async via the
  post-study form). Free tier is enough.
- **Wise / Stripe** — Wise for cross-border ($50 to UK / EU /
  CA / AU costs ~$1 in fees). Stripe for US-only (instant payout
  via Stripe Connect, ~$0.30 fee).
- **No CRM, no Airtable, no Notion paid.** Track recruitment in
  a Google Sheet. Track sessions in the same sheet. Total
  software cost: $0.

### 8. Analysis template

For each issue surfaced in any Loom recording, log a row:

```
| ID | Severity | Task | Participant(s) | What happened | Quote | Screenshot stub | Recommended fix |
|----|----------|------|----------------|---------------|-------|-----------------|-----------------|
| F1 | Blocker / Major / Minor | T2 | P3, P7, P9 | Tapped quick-log, then opened History to fix the time | "Wait, this says now — I had it last night" — P3 | Loom 03:42, frame at History edit | Add 'earlier today?' link near QuickLogChips |
```

Severity rubric:
- **Blocker** — user could not complete the task or abandoned the
  app. Cite occurrence in ≥ 3 of 10 participants.
- **Major** — user completed but with visible friction (back-tap,
  re-read, audible confusion) and the friction is reproducible
  across the participant pool.
- **Minor** — single-participant friction, or a strong opinion
  voiced without behavioral evidence.

One row per issue; aggregate participants per row, not one row
per participant. Cap the table at 15 rows in the final
deliverable — anything beyond that is noise at n=10.

### 9. Output format

A 2-page PDF (max). Single deliverable, handed to the owner
within 48 hours of the last Loom landing.

**Page 1:**
- Header (study name, dates, n, methodology in 3 lines).
- The 5 study goals + actual measured result per goal (one line
  each).
- Top 5 findings (rows from the analysis template, severity-
  ordered, with one quote per finding).

**Page 2:**
- Recommendations: 5-7 specific changes the team should make
  next, with effort estimate (S/M/L) and expected user impact.
- Quote bank: 8-12 verbatim quotes from participants, organized
  by theme (trust, ease-of-use, missing features).
- Appendix link: shared Google Drive folder with raw Loom URLs,
  Form responses (anonymized), and the analysis spreadsheet.

UX reports balloon to 30 pages because researchers don't
constrain themselves. The 2-pager forces severity discipline.
Anyone who needs more detail clicks the Drive link.

---

## What would actually move the needle

If the owner can do only three things from Part 1 before launching
this study, do these — they'd otherwise dominate findings, waste
participant attention on already-known issues, and shrink the
signal the study can actually deliver:

1. **Pin the onboarding chip A/B variant for the duration of the
   study (Issue 2).** Lowest effort, highest analyst-time savings.
   Without this, the synthesist will spend hours reconciling
   "different participants quote different chips" before realizing
   it's an experiment artifact, not a UX inconsistency. ~5 minutes
   of work in `useExperiment` config / env.

2. **Add a global "Need a moment?" entry point to AppHeader for
   the Hard-Time panel (Issue 4).** Without this, Task 4 will
   measure findability of the wrong thing — participants will
   spend their attention navigating to Today before they can even
   reach the panel. The study should test "is the panel useful?",
   not "can you find the Today tab?". ~30 lines of JSX + a hook
   wire. Mirrors the existing crisis-button pattern.

3. **Add the "earlier today?" link to QuickLogChips, or pre-warn
   participants that quick-log is now-only (Issue 1).** Without
   this, ~30% of Task 2 + Task 3 sessions will surface the same
   backdating-friction finding R23-3 already documented — the
   study spend will partially re-derive a known result. Either
   ship the fix (~40 lines, R24-FF2 already scoped), or have the
   moderator brief participants in the Task 3 instructions.

The remaining four issues (AF abbreviation, export-flow ordering,
milestone celebration, `<details>` collapsed by default) are
**worth letting the study surface** — participant quotes are
stronger evidence for those design calls than internal audits.
Don't pre-fix them; let the data argue for or against the current
choices.
