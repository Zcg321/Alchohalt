# Round 15 — fifteen-judge spectacular gate (2026-05-03)

Fresh pass on `claude/round-15-polish-2026-05-03`. Each judge walks
every R15-new surface cold; conflicts are surfaced explicitly. The
gate test is "would I be proud to stamp my name on this for the
world to see." The bar is *spectacular*, not "passable."

The fifteen personas, cumulative rounds 1–15:

| # | Judge | Lens | Bar | Round added |
|---|-------|------|-----|------|
| 1 | Linear designer | Hierarchy, motion, restraint | "Would this fit at Linear?" | R1 |
| 2 | NYT writer | Copy, voice, sentence-level | "Does any string read like marketing?" | R1 |
| 3 | Stripe FE engineer | Types, tests, code quality | "Would I merge this PR?" | R1 |
| 4 | Recovery counselor | Framing, harm prevention | "Could a vulnerable user be hurt?" | R5 |
| 5 | WCAG / a11y judge | Keyboard, contrast, SR | "AA, no exceptions" | R5 |
| 6 | Friday-night user | 11pm craving persona | "Does this meet me where I am?" | R5 |
| 7 | Investigative journalist | Privacy claims, honesty | "Does README match code?" | R7 |
| 8 | Competitor PM | Defensibility, moat | "Could I clone this in two weeks?" | R8 |
| 9 | Skeptical reviewer | First-impression review | "Is the change worth the risk?" | R9 |
| 10 | Ethics judge | Manipulative patterns | "Does design respect agency?" | R10 |
| 11 | Regulator | Health-claim compliance | "Are we within bounds?" | R11 |
| 12 | Parent of teen | Cross-age safety | "Would I hand this to my 15-y-o?" | R12 |
| 13 | Journalist (privacy beat) | Threat-modelling | "Does sealed-sync hold under pressure?" | R13 |
| 14 | Researcher (alcohol epidemiology) | Numbers correctness | "Are the std-drink formulas right per jurisdiction?" | R14 |
| 15 | Competing-app designer | Differentiation moat | "What would I copy / what can't I?" | R15 |

Prior rounds covered older surfaces. This round focuses on R15
surfaces (A, B, C, 1, 2, 3, 4) and the cross-cutting effect each
addition has on the whole.

---

## Per-surface verdicts (R15 surfaces only)

### R15-A — Tag explorer (tap-through from Tag Patterns)

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | Inline expand-in-place is the right pattern; no modal, no scroll-trap. Mini-bars are restrained. |
| 2 | ✅ Ship | "By weekday" / "By hour of day" / "Recent" headings are literal, not ornamental. No marketing. |
| 3 | ✅ Ship | Pure analyzer + presentational component; 9 + 6 + 5 tests cover surfaces and edge cases. Filename collision (`tagExplorer.ts` vs `TagExplorer.tsx`) caught + renamed to `tagExplorerAnalyzer.ts` — case-insensitive-FS lesson encoded. |
| 4 | ✅ Ship | The user-curated tag taxonomy is *their* framing of *their* drinking; surfacing the shape doesn't impose ours. |
| 5 | ✅ Ship | Buttons have aria-expanded and aria-controls; weekday bars carry title attributes for screen-reader hover. |
| 6 | ✅ Ship | A 11pm user clicking "#stressed" sees their stress drinking is concentrated Sat 9pm + Sun 10pm — that's the kind of self-knowledge that lasts past closing the app. |
| 7 | ✅ Ship | All on-device. No fetch, no logging, no telemetry. |
| 8 | ⚠ Note | This is "the most delightful feature" per Judge 15. Easy to copy. Not a moat. — accepted; deepening, not broadening. |
| 9 | ✅ Ship | Tap-through is well-bounded; toggling closed works, closing via X works, switching tags swaps explorer cleanly. |
| 10 | ✅ Ship | No dark patterns. The "Close" button is text, not a tiny icon. |
| 11 | ✅ Ship | No health-claim language. |
| 12 | ✅ Ship | Same data the user logged. No new collection. |
| 13 | ✅ Ship | Same memory footprint as the existing card; the analyzer doesn't enlarge the privacy surface. |
| 14 | ✅ Ship | avg-std uses `stdDrinks()` honoring active jurisdiction (R14-6 inheritance via the analyzer's call into `lib/calc`). |
| 15 | ✅ Notable | The exact feature Judge 15 said "I'd copy second." Owner accepts: differentiation cost ≈ a designer's week. |

### R15-B — Onboarding chip-copy A/B test

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | The two label sets are visually identical — only words change. No layout shift. |
| 2 | ⚠ Note | "I'm here to learn" is good. "I'm stopping for now" is good. "I want to drink less" is *slightly* more declarative than "Trying to drink less" — could read as overconfidence. Owner judgment: ship, watch the data. **Decided: ship.** |
| 3 | ✅ Ship | Variant assignment deterministic from device-bucket; existing regression test refactored to testid; new test pins both variants. |
| 4 | ✅ Ship | Both variants are non-pathologizing. Neither claims "you should" do anything. |
| 5 | ✅ Ship | Tab order unchanged; data-variant exposed for inspection without breaking accessibility tree. |
| 6 | ✅ Ship | Friday-night user gets either variant — both feel honest. |
| 7 | ✅ Ship | Exposure recording is local-only; the audit trail confirms no fetch on chip render. |
| 8 | ✅ Ship | A/B infra is a process moat (we can iterate copy without server). The variant choice is content, not architecture. |
| 9 | ✅ Ship | Scaffold from R14-4 was dormant; R15-B is its first real use. Spec was clear; landing matches. |
| 10 | ✅ Ship | Both variants give the user agency over their framing — "stopping for now" doesn't claim "stopping forever." |
| 11 | ✅ Ship | No medical-claim shift between variants. |
| 12 | ✅ Ship | No teen-specific concern. |
| 13 | ✅ Ship | Storage events for `exp.device-bucket` and `exp.exposures` show up in TrustReceipt — auditable. |
| 14 | n/a | No std-drink calc surface. |
| 15 | ✅ Ship | "The chips are doing more work than they look." Confirmed in the variant labels. |

### R15-C — Std-drink jurisdiction callout in Diagnostics

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | Callout uses surface-elevated bg + border-soft, sits inside the Diagnostics card, doesn't visually shout. |
| 2 | ✅ Ship | "You're using the United States (NIAAA, 14 g) std-drink definition." — names what it is, what authority defined it, what the threshold is. Nothing extra. |
| 3 | ✅ Ship | Pure detector with 13 BCP-47 cases, deterministic. AlcoholCoachApp pushes detected default into calc module without persisting — exactly the right shape. |
| 4 | ✅ Ship | A non-US user seeing US numbers + a sub-label saying "Detected from your locale" gets immediate clarity that their region has a different rule. No shame. |
| 5 | ✅ Ship | Anchor link `#stddrink-system` is real (added in SettingsPanel). |
| 6 | n/a | Not a Friday-night surface. |
| 7 | ✅ Ship | Detection is local-only (reads `navigator.language`). No region-based fingerprint sent anywhere. |
| 8 | ✅ Ship | Honest jurisdiction handling is a credibility multiplier — competitors hard-code US. |
| 9 | ✅ Ship | Default behavior changes for non-US users; no breaking change for US users. |
| 10 | ✅ Ship | The user can override; the detected value is never silently persisted. Agency preserved. |
| 11 | ✅ Notable | Each jurisdiction's gram threshold is documented to its health authority — exactly what regulator would want. |
| 12 | ✅ Ship | Locale detection doesn't differ by user age. |
| 13 | ✅ Ship | Read of `navigator.language` is a single client-side attribute; doesn't widen privacy surface. |
| 14 | ✅ Notable | This is the R14-6 researcher-judge follow-up. Numbers were correct in R14; R15-C makes the active jurisdiction visible. The journey from "wrong default" → "right default by jurisdiction" → "user can see and change which one" is now complete. |
| 15 | ✅ Ship | This is a credibility deepener. |

### R15-1 — Monthly delta drinking-days + avg-per-drinking-day

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | 2x2 grid extension; `Metric` subcomponent extracted to keep the panel readable. |
| 2 | ✅ Ship | "Avg per drinking day" — literal, no synonym. |
| 3 | ✅ Ship | New fields on `MonthSummary` + `MonthlyDelta`; null-prior path returns nulls for both new pcts. 5 new tests. |
| 4 | ✅ Ship | Numeric, not narrative. The user reads their own pattern; the app doesn't moralize. |
| 5 | ✅ Ship | Same a11y shape as existing tiles; tabular-nums for alignment. |
| 6 | ✅ Ship | A user who AF'd 11 days but had 5 heavy days needs to see *both* numbers. Round 15 makes that visible. |
| 7 | ✅ Ship | Pure local computation. |
| 8 | ✅ Ship | Doesn't broaden the moat but tightens the diagnostic. |
| 9 | ✅ Ship | Two new metrics; deltas null-safe; pluralization correct. |
| 10 | ✅ Ship | Quantitative; doesn't push interpretation. |
| 11 | ✅ Ship | Numbers, not health claims. |
| 12 | ✅ Ship | Same as parent verdict for Insights surface. |
| 13 | ✅ Ship | No new data path. |
| 14 | ✅ Ship | avg-per-drinking-day is dimensionally consistent with std-drinks (per the active jurisdiction). |
| 15 | ✅ Notable | "Real diagnostic." Confirms the value of expansion. |

### R15-2 — Goal nudges (calm, opt-in)

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | Banner uses the same surface-elevated treatment as MonthlyDeltaPanel; sits at top of Insights. Two CTAs in clear hierarchy. |
| 2 | ⚠ Note | Copy is "You've been at X std/day this week. Your goal is Y/day. Want to revisit it?" — Judge 15 flagged the "missing-goal-as-failure" risk. Owner read: the *question* form ("Want to revisit?") is the saving move. **Decided: ship; flag for variant test in R16.** |
| 3 | ✅ Ship | Pure analyzer + presentational banner; 10 + 5 tests cover all gates (off, dailyCap unset, dismissed, no recent, avg ≤ goal, fires, dismissal expired). |
| 4 | ✅ Critical hold-and-decide | This is the judge most relevant to the ⚠ above. Recovery counselor's read: a user who set 1.5/day and is at 2.0 already feels it. The nudge could land as confirmation ("yes, I noticed") or as fresh shame ("there's the app saying it too"). Mitigation: opt-in default-off, dismissable for the week. **Verdict: ship with the opt-in default-off, but R16 must verify with real users.** |
| 5 | ✅ Ship | role=status + aria-live=polite; both buttons in tab order; dismiss is text not icon. |
| 6 | ✅ Ship | Friday-night user who set 1.5 and is at 2 either taps Revisit (changes goal) or Not-this-week (mute). Both are emotionally honest. |
| 7 | ✅ Ship | Local-only; no telemetry on nudge fires. |
| 8 | ✅ Ship | Paired with goal-setting infrastructure already in place. |
| 9 | ✅ Ship | One feature flag (`goalNudgesEnabled`); cleanly gated. |
| 10 | ✅ Ship | "Calm-config compliant" semantics: dismissable, time-bounded suppression, opt-in. The agency-preserving affordances are real. |
| 11 | ✅ Ship | No clinical claim. |
| 12 | ✅ Ship | A teen who uses the app the same way an adult does sees the same banner. |
| 13 | ✅ Ship | Nudge state lives in settings (already in encrypted-sync scope). |
| 14 | ✅ Ship | Compares avg to dailyCap; both honor jurisdiction. |
| 15 | ✅ Critical | Judge 15 explicitly flagged this as the only feature where they'd push back on framing. Their concern matches Judge 4. **Round 16 should A/B the copy.** |

### R15-3 — Backup auto-verification + ribbon

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | Ribbon uses amber palette (caution, not alarm). Sits below UpdateBanner; doesn't fight other top-of-app surfaces. |
| 2 | ✅ Ship | "Last backup couldn't verify." 4 words. Then "Tap for details." Restraint exemplified. |
| 3 | ✅ Ship | Verification round-trips through the same `validateImport` the import path uses — no separate "verify" code path to drift. 3 lib + 6 ribbon = 9 new tests. |
| 4 | ✅ Ship | The ribbon is dismissable. The user is informed without being trapped. |
| 5 | ✅ Ship | role=status + aria-live=polite; dismiss button labeled. |
| 6 | n/a | Not Friday-night. |
| 7 | ✅ Notable | This is one of two R15 features Judge 15 called out as deepening privacy posture. Catching corruption at backup time means the user finds out *before* relying on a corrupt backup. |
| 8 | n/a | Operational, not differentiating. |
| 9 | ✅ Ship | Wraps existing functions; adds 4 settings fields; ribbon mount is a single line in AlcoholCoachApp. |
| 10 | ✅ Ship | The ribbon doesn't push the user toward any action — it informs. Tap-for-details opens the audit panel; no auto-redirect. |
| 11 | n/a | No health claim. |
| 12 | ✅ Ship | A teen with a corrupted backup sees the same ribbon as an adult. |
| 13 | ✅ Critical | "Failed-verification = the app caught it before the user did" is exactly the trust posture the privacy beat would respect. The DiagnosticsAudit surface lets a determined user verify the chain. |
| 14 | n/a | No std-drink. |
| 15 | ✅ Notable | Judge 15: "operationally valuable but invisible-by-design." Owner accepts. |

### R15-4 — Privacy Receipt printable

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | "Save / print" alongside "Clear log" — discoverable without being chrome-heavy. |
| 2 | ✅ Ship | Header reads "Trust receipt — generated {iso}, N events captured. Browser DevTools remains authoritative." Honest provenance, no marketing. |
| 3 | ✅ Ship | Pure builder; HTML-escapes every user-facing field; @media print + @page rules. 10 builder tests + 3 button tests. |
| 4 | ✅ Ship | The user holds an artifact of trust. That's an emotional resource, not just an information one. |
| 5 | ✅ Ship | Print stylesheet sets margins, hides chrome. |
| 6 | n/a | Not a Friday-night surface. |
| 7 | ✅ Critical | The journalist persona's actual ask: "I want to walk away with a piece of paper." This delivers it. Same per-event redaction guarantee carries through (no PII tokens render). |
| 8 | ✅ Critical | Judge 15 named this as **the one feature to copy**. The artifact-of-trust is the cheap-to-replicate, high-marketing-leverage piece. The implementation here is good enough to be the reference. |
| 9 | ✅ Ship | One feature, one component, one builder. Clean blast radius. |
| 10 | ✅ Ship | Print is a save action, not a publish action — there's no upload-to-third-party hidden in this. |
| 11 | n/a | No health claim. |
| 12 | ✅ Ship | A teen who runs this gets the same artifact format. |
| 13 | ✅ Critical | "Browser DevTools remains authoritative" preserves the honesty about scope. We can capture every fetch the JS initiates; sub-resource loads (script/img) are visible in DevTools, not here. The header says so. |
| 14 | n/a | No std-drink. |
| 15 | ✅ Critical | The named "feature to copy first." We've delivered it; the moat is the no-server architecture, not the receipt itself, which is exactly what Judge 15 said. |

---

## Cross-cutting observations

**Voice consistency across all R15 strings.** Every new string was checked against the round template's voice gates: no marketing, no "you're broken," no clinical jargon, no false certainty, no second-person commands without context. The only string flagged as "watch this" was R15-2's nudge prompt — judges 4 + 15 agreed the question form is the saving grace, but a future variant test would be informative.

**The R14 → R15 throughline.** Round 14 added scaffolds (A/B infra dormant, tag patterns visible, std-drink jurisdictions correct). Round 15 pulls them into use:
- A/B infra → first variant (R15-B)
- Tag patterns → tap-through explorer (R15-A)
- Std-drink jurisdictions → user-visible callout (R15-C)
- Researcher-judge correctness → user-facing transparency

**The privacy-stack accumulation is now visible as a unified product surface:**

1. PrivacyStatus (what features could send data, are they on?)
2. TrustReceipt (live log of storage writes + fetches this session)
3. DiagnosticsAudit (per-subsystem state read-out)
4. **R15-3 backup auto-verify** (catches corruption at backup time)
5. **R15-4 printable receipt** (artifact of trust the user can hold)

That stack is what Judge 15 called the moat-deepening combination. Each piece is small; together they make the privacy claim concrete.

**Disagreement matrix updates** (D-entries to add to round-8-eight-judges-2026-05-02.md if we ever consolidate):

- **D9 (R15-B):** Variant copy "I want to drink less" reads slightly more declarative than "Trying to drink less". Judges 2 + 4 noted; Judge 15 supported declarative framing. Decision: ship with both variants; let exposure data inform R16. Rationale: the A/B infra exists exactly to settle these.
- **D10 (R15-2):** Goal-nudge framing risks shame-framing for users who interpret missing-goal as failure. Judges 2 + 4 + 15 noted; question-form ("Want to revisit?") and opt-in default mitigate. Decision: ship with opt-in default-off, flag copy for variant test in R16. Rationale: opt-in + dismissal-for-week + question-form is the calm-config compliant minimum; real-user signal beats theorizing.

---

## Round 15 final verdict

| | Pass count | Critical-pass count | Notes / Holds |
|---|------------|---------------------|---------------|
| R15-A | 14/14 | — | none |
| R15-B | 13/13 (1 n/a) | — | D9 above |
| R15-C | 13/14 (1 n/a) | 1 (J11) | none |
| R15-1 | 14/14 (1 n/a) | — | none |
| R15-2 | 14/14 | 2 (J4, J15) | D10 above; R16 variant test |
| R15-3 | 11/11 (4 n/a) | 2 (J7, J13) | none |
| R15-4 | 11/11 (4 n/a) | 4 (J7, J8, J13, J15) | none |

**Total:** 90 ship verdicts, 9 critical-pass, 2 D-entries logged for R16.

**Owner-blocking items:** none. The two ⚠ notes (R15-B copy, R15-2 framing) are flagged for follow-up A/B work in R16 but neither blocks merge — both have opt-in / non-default mitigations.

**Bar reached?** "Would I be proud to stamp my name on this for the world to see." The fifteen judges, walking the build cold, all said yes — the two who held had specific framing concerns that don't block the gate, and both noted the existing mitigations.

**Recommendation:** ship.
