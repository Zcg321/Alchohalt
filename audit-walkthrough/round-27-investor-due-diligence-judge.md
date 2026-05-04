# Round 27-4 — 27th judge: investor doing $250K seed due diligence

## Frame

Audit the codebase as a fictional pre-seed VC associate would walking
into a 90-minute call after reading the founder's deck. Goal: write
the talking points the partner uses on Monday morning. Two halves:

1. **Strengths the deck should lead with** — slides + screenshots
   ready.
2. **Concerns the partner will ask about** — what to fix before the
   next intro.

This is a code-level review. Numbers below come from `git log`,
`wc -l`, the test runner, and the ship-checklist documents at HEAD.

---

## Pitch deck slides — what to screenshot

### Slide 1: "Privacy is a moat, not a marketing claim"

The competitive pitch is *"we don't ship your data."* The way to
prove it on a deck:

- **Screenshot:** `Settings → Privacy → "Your data. On this device.
  Period."` (R26-B). The pinned 1-line summary above PrivacyStatus.
- **Screenshot:** Network tab on a fresh page load with all optional
  features off — only static bundle, no third-party calls.
- **One-liner under the screenshot:** *"Three checks anyone can run."*
  (the card itself shows them.)

This is investor-readable in 5 seconds because the verification steps
are listed in-app — you don't have to take the founder's word for it.

### Slide 2: "Trust Receipt — verifiable build/audit"

`src/lib/trust/receipt.ts` plus the export button in Settings (R19).
A user can hash the bundle, save the receipt, mail it to a security-
minded friend, and the friend can verify offline that the binary
they're running matches the audit they're reading.

**Investor read:** *"Most privacy-first companies say 'trust us.' This
team built a verification path that doesn't require trust."* That's
defensible vs. the "we removed Segment, now trust us again" pitch.

### Slide 3: "Tests as proof of seriousness"

| Metric              | Count |
|---------------------|-------|
| Passing tests       | 1,892+ (1,901 after R27 round) |
| Test files          | 274   |
| Source files        | 302   |
| Audit-walkthrough docs | 117+ |

A pre-seed code base typically lands at 50-200 tests. Investors who
have been burned by "we'll write tests after Series A" will read
1,900 + the audit-walkthrough trail as a posture signal.

**Suggested deck framing:** *"Every spectacular gate uses N judges
to review. Round 27 ships with 27 judges, all signed off."*

### Slide 4: "User-content portability — the data is yours"

**Screenshot:** Settings → Backup → "Encrypted backup file" with the
Argon2id passphrase prompt + the .alch-backup file format spec
(R27-3 audit).

**One-liner:** *"Round-trip tested for crisis lines, drink presets,
custom goals, journal entries — all six categories of user-installed
content."*

This is the answer to *"what's your churn risk if a user wants to
leave?"* — they take their data with them in an encrypted file
nothing else can read.

### Slide 5: "Internationalization — already shipped, not 'planned'"

6 locales × ~440 keys × native-translator review pass per locale
(R20–R24 translator-feedback docs). This includes Polish + Russian
(harder languages), not just the obvious ones (Spanish + French).

**Screenshot:** the locale picker in Settings, plus one of the
translator-feedback round docs (R23 Polish, R24 Russian) showing the
nitpick fixes that got applied.

**Investor read:** *"They didn't outsource translation; they ran a
review cycle and applied the fixes."*

### Slide 6: "Onboarding diagnostics — privacy-respecting funnel"

R11 funnel + R26-1 satisfaction signal + R27-2 A/B exposure cross-tab.
Every diagnostic surface is on-device; nothing leaves the phone.
Owner has the per-surface satisfaction tally (`12 thumbs up · 1 thumb
down`) without telemetry vendor on the bill.

**Investor read:** *"They figured out how to do product analytics
without violating their own privacy claim."*

---

## Concerns the partner will ask about

### C1. Distribution — Capacitor + PWA, no native iOS/Android team

The `capacitor.config.ts` shows the path: a Capacitor wrapper around
the PWA. iOS + Android directories exist (`ios/`, `android/`), but
the build pipeline treats these as a wrapper, not a native rewrite.

**Concern:** App Store reviewers can be inconsistent with PWA
wrappers — Apple sometimes rejects Capacitor apps that "duplicate
website functionality." `LAUNCH-CHECKLIST.md` and
`PRE_RELEASE_CHECKLIST.md` exist; partner should confirm the team
has actually shipped through review, not just prepared for it.

**Suggested answer:** Show `audit-walkthrough/round-26-twenty-six-
judges-2026-05-04.md` deploy-readiness columns. If the team can
demonstrate a current TestFlight build, this concern dissolves.

### C2. Monetization — feature flags exist, not a billing flow

`src/features/subscription/` exists; `src/features/settings/__tests__/
paywall-mount.test.tsx` exists. The architecture is wired but no
paywall has been pulled live to a user yet. (This isn't a code
defect — it's a posture choice. The founder says the privacy-first
brand requires monetization to wait until trust is established.)

**Concern:** Pre-seed valuation often anchors on revenue trajectory.
If the team won't monetize until Year 2, the investor's IRR model
needs a clear answer on what triggers paywall flip.

**Suggested deck slide:** *"We will introduce paid features when we
hit X downloads / Y retained users. Trust comes first."* — and have
those triggers written down as commit-able.

### C3. Team & process — solo or pair? Code quality says experienced

The `git log --format='%an'` shows mostly "Cowork Sprint" with
"Co-Authored-By: Claude Opus 4.7 (1M context)" footers. This is
unusual for a pre-seed founder log: it implies heavy AI-pair
programming, which is not in itself a concern but means partner
should ask:

  - Who's the human on call when the AI gets a fix wrong?
  - What does the on-call rotation look like at GA?
  - `OPERATIONS.md` shows a 24-hour-uptime SRE runbook (R22-3) — is
    that documenting actual practice or aspirational?

**Suggested answer:** founder demonstrates a recent incident drill
or shows the most recent `audit-walkthrough/round-N-2026-MM-DD.md`
final-status doc with an item the AI got wrong and a human caught.

### C4. Market positioning — Reframe vs Sunnyside vs Drinkaware

`audit-walkthrough/round-24-competitive-matrix.md` is exhaustive
(278 lines). The matrix is helpful but a pre-seed deck condenses to
three bullets, not 30. Partner will ask:

> *"What's the one feature your top-3 competitors can't ship without
> changing their business model?"*

**Suggested answer:** the Trust Receipt + verifiable bundle (M1 in
`round-24-moat-features.md`). Reframe / Sunnyside have Segment +
Mixpanel + Amplitude; removing them would shrink their analytics-
driven roadmap. The Trust Receipt is the lock.

### C5. Defensibility of "on-device only" as moat

A motivated competitor could remove their telemetry vendors and
ship a clone. The defense is brand + verification: *we got there
first, our receipts hash-chain back to commit X.* That's a soft
moat; it relies on first-mover trust.

**Concern partner will raise:** *"What's the durable moat once a
competitor copies?"*

**Suggested answer:** the niche-leading habit-tracking surface
(M3-M6 in moat-features), built on the privacy substrate. Privacy
gets users in the door; the surfaces keep them. Show satisfaction
dashboard (R27-1) per-surface signal as evidence the team actually
measures retention surface-by-surface.

### C6. Security review — internal only, no third-party audit

`SECURITY.md` exists; `audit-walkthrough/round-19-security-researcher
-judge.md` is a self-conducted review. There is no external pen test
report.

**Concern:** investors who have done security-driven companies will
ask for an external audit before B-round. Pre-seed it's optional;
documenting now that *"external audit is in the Y-quarter plan
contingent on funding"* is a clean answer.

### C7. Compliance posture — GDPR/CCPA basics, but…

`audit-walkthrough/operations:compliance-tracking` posture not
present in repo. The privacy-first architecture means most GDPR
data-subject requests resolve to "already on-device, here's your
encrypted backup," but a partner doing healthcare-adjacent
diligence will ask about HIPAA-like postures even though the app
isn't a covered entity.

**Suggested response:** explicit non-coverage statement. *"This
is a wellness app, not a medical device, not subject to HIPAA. The
encrypted backup is end-to-end encrypted to a passphrase the app
never sees, eliminating most third-party-data-handling concerns."*

---

## Summary for the partner

**Lead with:**
- Trust Receipt + verifiable build (M1).
- 1,892+ tests, 117+ audit-walkthrough docs (process maturity).
- 6-locale i18n with native review (international reach signal).
- On-device satisfaction analytics (privacy + product judgment together).

**Open items to ask the founder:**
- Have you shipped through Apple App Store review yet? (C1)
- What triggers the paywall flip date? (C2)
- Show me a recent human override of the AI pair-programmer. (C3)
- What's the one feature competitors can't copy without changing
  business model? (C4)
- Is an external pen test in the next-funding-stage plan? (C6)

**Net read:** technically far ahead of the typical pre-seed. Process
discipline is the most surprising signal — most founders at this
stage don't have a translator-feedback round, let alone five of
them. Privacy posture is not just brand positioning — it's a
verifiable architectural commitment with code to back it. Worth
the partner's time for the follow-up call.

The biggest risk isn't the codebase — it's distribution + monetization
discipline. If the team can answer C1 + C2 cleanly, this is a
fundable pre-seed.

## Owner action items (commit-able)

None blocking the codebase. The investor-doc concerns above are
fundraising-process items, not code defects:

  - Prepare a 1-page "what we won't do until trust is established"
    monetization commitment. (For C2.)
  - Set a calendar reminder to re-run this audit pre-Series-A with
    an external pen-test path mapped. (For C6.)
  - Write a brief "human-on-call when the AI gets it wrong" note in
    `OPERATIONS.md` so future investors / partners can find it. (For
    C3.)

These are out-of-scope for round 27 itself; flagged here so the
owner has them in writing for the next investor conversation.
