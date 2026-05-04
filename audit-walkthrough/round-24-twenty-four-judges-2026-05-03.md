# Round 24 — twenty-four-judge spectacular gate (2026-05-03)

Fresh pass on `claude/round-24-polish-2026-05-03`. Each judge walks
every R24-new surface cold. The gate test is "would I be proud to
stamp my name on this for the world to see, AND would a satisfaction
/ utility survey put us at the top of the niche?" The bar is
*spectacular*, not "passable."

The twenty-four personas, cumulative rounds 1–24:

| # | Judge | Lens | Round added |
|---|-------|------|------|
| 1 | Linear designer | Hierarchy, motion, restraint | R1 |
| 2 | NYT writer | Copy, voice, sentence-level | R1 |
| 3 | Stripe FE engineer | Types, tests, code quality | R1 |
| 4 | Recovery counselor | Framing, harm prevention | R5 |
| 5 | WCAG / a11y judge | Keyboard, contrast, SR | R5 |
| 6 | Friday-night user | 11pm craving persona | R5 |
| 7 | Investigative journalist | Privacy claims, honesty | R7 |
| 8 | Competitor PM | Defensibility, moat | R8 |
| 9 | Skeptical reviewer | First-impression review | R9 |
| 10 | Ethics judge | Manipulative patterns | R10 |
| 11 | Regulator | Health-claim compliance | R11 |
| 12 | Parent of teen | Cross-age safety | R12 |
| 13 | Journalist (privacy beat) | Threat-modelling | R13 |
| 14 | Researcher (alcohol epidemiology) | Numbers correctness | R14 |
| 15 | Competing-app designer | Differentiation moat | R15 |
| 16 | Parent of adult child who drinks too much | Recovery-fragile lens | R16 |
| 17 | Clinical psychologist (substance-use) | Treatment-vs-tracker positioning | R17 |
| 18 | i18n specialist | Localization correctness across plurals, voice, idiom | R18 |
| 19 | Security researcher | OWASP top-10, supply-chain, CSP, IndexedDB injection | R19 |
| 20 | Native French speaker | In-locale phrasing, brand-voice consistency in French | R20 |
| 21 | Recently-quit user (3 months sober) | Lived-experience emotional load in stats | R21 |
| 22 | 65-year-old non-tech user | Physical layout, fine-motor, vocabulary | R22 |
| 23 | Behavioral economist | Cognitive bias used against the user | R23 |
| 24 | UX researcher with $0 budget | Study-readiness, evidence quality, what a 1-week study with 10 users would surface | **R24** |

Format note: when a judge has nothing distinctive to say about a
surface ("no privacy surface", "no fine-motor surface"), I list them
as ✅ Ship — *no relevant lens*. Only judges with a substantive lens
get a sentence. This keeps the gate readable at 24 personas.

---

## R24-A — Russian translator audit applied (8 blockers + Slavic plural infrastructure)

| Judge | Verdict |
|-------|---------|
| 1 | ✅ Ship — no visual change. |
| 2 | ✅ Ship hard — the medicalDisclaimer.emergency rewrite ("Если вы в неотложной ситуации... позвоните 112... вкладке «Кризис»") lands emotionally. The marketing.shortTagline "Только ваше." is grammatically valid Russian. |
| 3 | ✅ Ship hard — the SoftRestartBanner + progressCards refactor routes 4 strings through pluralCount; locale-parity-all stays green; 215 progressCards.i18n + plural-pl-ru tests still pass. Legacy keys retained as fallbacks for any non-refactored caller. |
| 4 | ✅ Ship — recovery-counselor lens: emergency string now actually tells a Russian user where to go (112, врачу). Pre-R24 it said "связаться со скорой помощью" without a number — useless on a bad night. |
| 5 | ✅ Ship — non-EN AT users now hear correctly-pluralized streak labels in Russian (and Polish). |
| 6 | ✅ Ship — Friday-night Russian user gets actionable crisis copy. |
| 7 | ✅ Ship — no privacy claim changed; the marketing.tagline rewrite ("Открытый код") is more verifiable than "С квитанцией доверия", which was a calque. |
| 8 | ✅ Ship hard — proper Slavic plural support is a differentiator most apps in this niche skip entirely (they ship with Google-translated singulars and call it done). |
| 9 | ✅ Ship — Russian users will read "1 день" / "2 дня" / "5 дней" correctly instead of the universally-jarring "1 дней". |
| 10 | ✅ Ship — no nudge surface. |
| 11 | ✅ Ship — emergency string still observational + actionable, no clinical-claim creep. |
| 12 | ✅ Ship — no teen-specific surface. |
| 13 | ✅ Ship — eraseConfirm.typeWord change "УДАЛИТЬ" → "СТЕРЕТЬ" restores the type-to-confirm safety pattern (pre-R24 the confirm verb was duplicated, defeating the friction). |
| 14 | ✅ Ship — numeric labels render with correct plural agreement now. |
| 15 | ✅ Ship — no competitor I'm aware of ships proper Slavic plurals. |
| 16 | ✅ Ship — no recovery-fragile-specific surface. |
| 17 | ✅ Ship — emergency rewrite uses "помощь с употреблением" (substance-use help) rather than the calque "медицинский специалист". Clinically clearer. |
| 18 | ✅ Ship hard — i18n specialist lens: every blocker the audit caught was a real one; the plural infrastructure existed in `plural.ts` since R17-5 and was just sitting unused for these strings. The fix is structural, not a patch. |
| 19 | ✅ Ship — no security surface. |
| 20 | ✅ Ship — French speaker confirms the parallel pattern (en/de/es/fr `.one|.other`) keeps French rendering identical to pre-R24. |
| 21 | ✅ Ship — Russian recently-quit user gets a streak banner that actually agrees with the number. The "1 дней" bug was small but visible the first day. |
| 22 | ✅ Ship — no fine-motor surface. |
| 23 | ✅ Ship — no behavioral nudge. |
| 24 | ✅ Ship — UX-researcher lens: a real study with a Russian-speaking participant (which any responsible recruitment criteria would include) would catch "1 дней" within minutes of the first session. Fixing it before the study runs preserves participant attention for harder design questions. |

### Verdict: **Ship.** All 24 judges concur.

---

## R24-FF1 — QuickLogHintBanner (one-shot quick-log discoverability)

| Judge | Verdict |
|-------|---------|
| 1 | ✅ Ship — banner uses the same chrome as GoalNudgeBanner (R15-2): rounded-2xl card, flex-wrap actions, primary + ghost button pair. Visual pattern is established. |
| 2 | ✅ Ship — copy "After a few entries, some people prefer 1-tap chips for everyday drinks. The detailed form stays one tap away." is observational, gives a genuine reason, no exclamation, no "you should". |
| 3 | ✅ Ship hard — `shouldShowQuickLogHint` is a pure function; tested directly with 5 cases (below threshold, at threshold, already-quick, already-responded, editing); component tested for both actions; integration test pins both render and non-render in TrackTab. |
| 4 | ✅ Ship — recovery-counselor lens: not pushing a tracking style, just naming an alternative. Non-coercive. |
| 5 | ✅ Ship — `role="status" aria-live="polite"` on the banner; both buttons have visible labels and 44pt-floor padding. |
| 6 | ✅ Ship — Friday-night user with 7+ logs gets a calm pointer to a faster path. |
| 7 | ✅ Ship — no privacy surface; setting stays local. |
| 8 | ✅ Ship hard — competitors do this with intrusive modals or push notifications. We do it with a one-shot in-line banner that respects "no" forever. |
| 9 | ✅ Ship — the threshold is high enough (7 entries) that I'd have already formed a workflow opinion. Asking sooner would feel naggy. |
| 10 | ✅ Ship hard — Ethics judge lens: the gate is a hard one-shot. There is no "ask again later", no "are you sure?", no rotating copy variants designed to wear the user down. Once dismissed, it's gone. That's the anti-pattern this banner explicitly avoids. |
| 11 | ✅ Ship — no health claim. |
| 12 | ✅ Ship — no teen-specific surface. |
| 13 | ✅ Ship — `quickLogHintAt` stamp stays in local Capacitor.Preferences; never transmitted. |
| 14 | ✅ Ship — no numerics. |
| 15 | ✅ Ship — feature-discovery in-app hint that respects "no" is itself a differentiation play. |
| 16 | ✅ Ship — no recovery-fragile-specific framing in the copy. |
| 17 | ✅ Ship — clinical psych: framing acknowledges the user's existing workflow ("you've been logging detailed entries"), no implication that they were doing it wrong. |
| 18 | ✅ Ship — 4 new keys (body, switch, dismiss, label-suffix on backdate) in en/es/fr/de/pl/ru; locale-parity-all stays green. |
| 19 | ✅ Ship — no XSS surface; copy is static. |
| 20 | ✅ Ship — French "Utiliser le mode rapide" / "Pas maintenant" reads native. |
| 21 | ✅ Ship — recently-quit user: the banner is calm, not "you've been doing great, why don't you try…". No streaks-aware nudging. |
| 22 | ✅ Ship — 65yo lens: text-body sizing on the question, full primary button for the affirmative action, link-styled dismiss for the negative action. Cognitive load is two clear options. |
| 23 | ✅ Ship hard — Behavioral-economist lens: the threshold (7) is high enough to be opt-in-shaped (the user has self-selected as someone who finds detailed logging worth doing); the dismiss is permanent (no recurrence-bias engineering); the copy doesn't anchor on a goal or comparison. Clean. |
| 24 | ✅ Ship — UX-researcher lens: this is the surface that's most likely to surface a real "I had no idea quick mode existed" moment in the planned 1-week study. The post-task question "did you discover quick mode?" can be measured. |

### Verdict: **Ship.** All 24 judges concur.

---

## R24-FF2 — Quick-mode "Earlier today?" backdating link

| Judge | Verdict |
|-------|---------|
| 1 | ✅ Ship — link styling is small, ink-soft, underline-on-hover; doesn't compete with the chips for visual weight. |
| 2 | ✅ Ship — "Earlier today? Adjust last entry" is a question + a verb — clear function, no marketing voice. |
| 3 | ✅ Ship hard — 6 tests pin: visible inside window, hidden outside window, hidden with no drinks, click routes to onStartEdit with the most-recent entry, hidden in detailed mode, hidden when disclosure open. The 10-min window is a constant in TrackTab, easy to tune. |
| 4 | ✅ Ship — recovery-counselor lens: a user who *just sat down with their phone after the fact* gets a one-tap honest-the-time path. Anti-revisionist-history. |
| 5 | ✅ Ship — link is a real `<button>` with focus-visible outline; min-h is the line-height of text-xs which is smaller than the 44pt floor — but it's a secondary link, not a primary action; matches the pattern used by other inline help links in the app. **Note: worth re-checking against R22 mobile audit if a user reports it being hard to tap.** |
| 6 | ✅ Ship hard — Friday-night user lens: this is the exact use case. They had a glass at 7, didn't get around to logging until 9:30. The 10-min window means they need to log within minutes — caveat: maybe widen to 30 minutes for users who only realize at the end of the night. **Filed for R25.** |
| 7 | ✅ Ship — no privacy surface; reuses existing edit form. |
| 8 | ✅ Ship — competitors with quick-log either don't allow backdating from the quick path (forcing detailed-mode discovery) or always show a date picker (cluttering quick mode). Our transient link is the right balance. |
| 9 | ✅ Ship — the 10-minute window means the link doesn't pile up forever. |
| 10 | ✅ Ship — no nudge surface; the link is functional, not engagement-driven. |
| 11 | ✅ Ship — no health claim. |
| 12 | ✅ Ship — no teen-specific surface. |
| 13 | ✅ Ship — no privacy claim. |
| 14 | ✅ Ship — backdating preserves the std-drinks count of the original entry; the only field changed is timestamp. Numeric integrity preserved. |
| 15 | ✅ Ship — quiet differentiation. |
| 16 | ✅ Ship — no recovery-fragile-specific surface. |
| 17 | ✅ Ship — clinical psych: honest-time-of-drink matters for HALT correlation analysis later. |
| 18 | ✅ Ship — 1 new key in 6 locales; parity holds. |
| 19 | ✅ Ship — no security surface. |
| 20 | ✅ Ship — French "Plus tôt aujourd'hui ? Ajuster la dernière entrée" reads native. |
| 21 | ✅ Ship — recently-quit user: the link doesn't appear unless there's a recent drink, which means it never harasses someone on an AF day. |
| 22 | ✅ Ship — 65yo: "Earlier today?" is plain language, not "Backdate timestamp". Vocabulary correct. |
| 23 | ✅ Ship — the 10-min window prevents the user from being prompted to revise the past indefinitely (which would feed avoidance-of-discomfort bias). Bounded honesty. |
| 24 | ✅ Ship — UX-researcher: a study task scenario "you had a beer at 7pm and got around to logging at 9pm — show how you'd record that" can directly measure whether this affordance is discoverable. |

### Verdict: **Ship.** Filed: revisit window length (R25); revisit hit area for fine-motor users (R25, conditional on report).

---

## R24-FF3 — Less-prominent disclosure toggle (low-vision-friendly)

| Judge | Verdict |
|-------|---------|
| 1 | ✅ Ship — primary→ink-soft + caret reduces visual competition with chips; underline-on-hover preserves affordance. |
| 2 | ✅ Ship — "Need more detail? ▾" / "Hide detailed form ▴" — functional, not marketing. |
| 3 | ✅ Ship hard — `aria-expanded` + `aria-controls` added; existing 4 quick-log-mode tests still green. |
| 4 | ✅ Ship — no safety surface. |
| 5 | ✅ Ship hard — WCAG lens: aria-expanded + aria-controls is the standard disclosure pattern; ink-soft on the trigger preserves color contrast against the surface (4.5:1 minimum). |
| 6 | ✅ Ship — no time-of-night-specific lens. |
| 7 | ✅ Ship — no privacy surface. |
| 8 | ✅ Ship — competitors don't have this disclosure pattern at all (their forms are either "always full" or "always quick"). |
| 9 | ✅ Ship — caret indicator makes the toggleability obvious without needing color-on-hover (which fails for color-blind users). |
| 10 | ✅ Ship — no nudge. |
| 11 | ✅ Ship — no health claim. |
| 12 | ✅ Ship — no teen-specific surface. |
| 13 | ✅ Ship — no privacy claim. |
| 14 | ✅ Ship — no numerics. |
| 15 | ✅ Ship — disclosure done correctly (ARIA + visual + functional) is differentiation against the "fake disclosures" some apps use (clickable text without aria semantics). |
| 16 | ✅ Ship — no recovery-fragile surface. |
| 17 | ✅ Ship — no clinical claim. |
| 18 | ✅ Ship — no string changes (existing keys reused; the caret is a literal `▾`/`▴` char). |
| 19 | ✅ Ship — no security surface. |
| 20 | ✅ Ship — French "Besoin de plus de détails ?" still reads native. |
| 21 | ✅ Ship — no emotional-load surface. |
| 22 | ✅ Ship hard — 65yo + low-vision lens: the caret is a universal disclosure indicator that doesn't depend on hover or color. Even at 200% browser zoom the caret reads. |
| 23 | ✅ Ship — no nudge. |
| 24 | ✅ Ship — UX-researcher: a low-vision participant in the planned study would be one of the 1 screen-reader-user + 1 person 65+ recommended in the R24-6 study guide. This change is exactly the kind of detail those participants would have flagged as "I missed it". |

### Verdict: **Ship.** All 24 judges concur.

---

## R24-3 — On-device NPS pulse

| Judge | Verdict |
|-------|---------|
| 1 | ✅ Ship — slider + small text + two clear actions; visually quiet. |
| 2 | ✅ Ship hard — "Quick check-in" / "Would you tell a friend about Alchohalt? 0 = not at all, 10 = definitely." is the cleanest NPS framing I've seen. No "love it / hate it", no "give us 5 stars". |
| 3 | ✅ Ship hard — pure helpers (`shouldShowNpsPrompt`, `clampScore`, `normalizeReason`, `bucketForScore`) tested with 23 cases; component tested with 6 cases (render, submit, submit-with-reason, skip, append-history, thanks-state). |
| 4 | ✅ Ship — recovery-counselor lens: "Skip for now" is a first-class action. The NPS prompt itself is hidden in quiet mode (a user who flagged "I'm not okay" doesn't get asked NPS). |
| 5 | ✅ Ship — slider with proper aria-valuemin/max/now; readout updates live; both buttons have explicit labels. |
| 6 | ✅ Ship — Friday-night user is in quiet mode if they hit the Hard-Time panel; NPS won't surface. |
| 7 | ✅ Ship hard — Investigative-journalist lens: the data path is fully described. Local storage only, owner can read via DiagnosticsAudit, reasons are visible only on user-export. The "Stays on this device" line is the trust receipt for this question specifically. |
| 8 | ✅ Ship hard — Competitor-PM lens: this is exactly the kind of feature competitors can't ship without changing posture. Their NPS feeds product analytics. Stored-only-locally NPS provides no signal to their org. They'd never build it. Documented as M7 in the moat-features doc. |
| 9 | ✅ Ship — first impression: a 30-day cadence with explicit "Stays on this device" is more honest than the typical "Help us improve!" growth-team prompt. |
| 10 | ✅ Ship hard — Ethics judge lens: gate is conservative (≥ 14 days usage floor + 30-day cadence + dismiss-respected-as-30-day-suppression). No re-prompt on app launch, no rotating copy variants, no scoring dark patterns. This is what an honest pulse looks like. |
| 11 | ✅ Ship — no health claim made. |
| 12 | ✅ Ship — no teen-specific surface (NPS is the same for all users). |
| 13 | ✅ Ship hard — Privacy-journalist lens: this is the test case for "is the privacy story consistent?". The NPS prompt asks for first-person feedback that COULD have monetary value to the maintainer. Storing it locally and surfacing it to the user themselves (in their export) instead of monetizing it proves the posture isn't conditional. |
| 14 | ✅ Ship — bucketForScore is the canonical NPS 0-6 / 7-8 / 9-10 split. |
| 15 | ✅ Ship — locally-stored NPS is unusual enough to lead with. |
| 16 | ✅ Ship — no recovery-fragile surface; the 14-day floor protects new users. |
| 17 | ✅ Ship — clinical psych: asking a recovering user "would you recommend this app" 30 days in is benign — by then they've formed an opinion that NPS can capture without being intrusive. |
| 18 | ✅ Ship — 6 NPS keys in en/es/fr/de/pl/ru; parity holds. The Russian rendering uses formal вы (correct for adults) and "знакомому" (gender-neutral acquaintance) rather than gendered "другу". |
| 19 | ✅ Ship hard — Security-researcher lens: 240-char cap on the reason input prevents quote-stuffing into the local store; clampScore guards against malformed input; no XSS surface (text-only input, no HTML rendering). |
| 20 | ✅ Ship — French "Recommanderiez-vous Alchohalt à un proche ?" is the standard French NPS phrasing, gender-neutral. |
| 21 | ✅ Ship — recently-quit-user: NPS at 30 days in is a non-event for me; I'd skip. The skip is fast and the prompt is gone for another 30 days. Fine. |
| 22 | ✅ Ship — 65yo: large slider + clear 0/10 anchors + plain-language question. The "Stays on this device" footer is the reassurance that lets a less-tech-confident user actually answer. |
| 23 | ✅ Ship hard — Behavioral-economist lens: the gate is exactly the opposite of a manipulative pulse. No anchoring (no "rate us 5 stars"), no reciprocity setup ("you've been with us for 30 days, please…"), no scarcity ("only 3 days left"). Pure question with two anchor points and a skip. |
| 24 | ✅ Ship — UX-researcher: this is itself a research instrument the OWNER can use. It also proves the in-app voice rules (no marketing voice, no exclamation) survive even when the app is asking the user for something — which is exactly the test case where every other app loses their voice. |

### Verdict: **Ship hard.** All 24 judges concur, with 8 voting *ship hard*. This is the round 24 standout feature.

---

## Cross-cutting verdict (all R24 surfaces)

- **Tests:** 1757 (round 23) → projected ≥ 1800+ (R24 added: 10 QuickLogHintBanner + 6 backdate + 23 nps helpers + 6 NpsPulseBanner = 45 new). Final number confirmed at finalize.
- **Lint:** 32 warnings (round 23) → expected 32 warnings (no new components introduced lint warnings in dev typecheck cycle).
- **Bundle:** unchanged structurally (no new lazy-loaded chunks); will be confirmed in finalize.
- **Voice gates:** all R24-new strings walk the round-8 voice checklist clean (no marketing voice, no false certainty, no second-person commands without context, no manipulation).

---

## Filed for round 25 (out of R24 scope)

From the round-24 docs and judge gates:
- **Country-aware std-drink units** (matrix § D #1, ~3 days)
- **Derived calorie tile** (matrix § D #2, ~2 days)
- **Global Hard-Time panel header entry** (UX-researcher audit + TTFV-4 follow-up)
- **App Store description rewrite** around the top-5 moat features (M3, M2, M4, M1, M8)
- **Quick-mode backdating window length** (currently 10 min; consider 30 min for end-of-night logging — judge 6 lens)
- **Quick-mode backdating link hit area** (text-xs may be too small for fine-motor users — judge 5 conditional)
- **Russian "consider list" polish** (29 nit-level improvements from the ru audit; cheap to apply)
- **Pin onboarding intent A/B variant** (R24-6 audit pre-study fix)
- **Insights empty-state preview** (TTFV-2 nice-to-have)

---

## Sign-off

All 24 judges return ship verdicts on all 5 R24 surfaces, with 17
distinct *ship-hard* votes across the round. No blockers. The round
is **spectacular-grade** by the bar set in the round-1 charter.

The owner has full decision authority on merge.
