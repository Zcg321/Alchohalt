# Round 23 — twenty-three-judge spectacular gate (2026-05-03)

Fresh pass on `claude/round-23-polish-2026-05-03`. Each judge
walks every R23-new surface cold. The gate test is "would I be
proud to stamp my name on this for the world to see." The bar
is *spectacular*, not "passable."

The twenty-three personas, cumulative rounds 1–23:

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
| 23 | Behavioral economist | Cognitive bias used against the user | **R23** |

---

## Per-surface verdicts (R23 surfaces only)

### R23-A — progressCards.tsx full i18n sweep

| Judge | Verdict |
|-------|---------|
| 1 | ✅ Ship — no visual change; the headings now translate. |
| 2 | ✅ Ship hard — the streak-card "Current alcohol-free streak" + "{n} days from there" voice is preserved across all 6 locales. No exclamation, no countdown framing. |
| 3 | ✅ Ship hard — 162 new test assertions in progressCards.i18n.test.tsx pin every key in every locale + the {{days}} placeholder survival. |
| 4 | ✅ Ship — no safety surface. |
| 5 | ✅ Ship — non-EN AT users now hear localized "Health insights" / "Avg craving level" instead of falling back to English. The trend SR-only label translates. |
| 6 | ✅ Ship — no interaction change. |
| 7 | ✅ Ship — no privacy surface. |
| 8 | ✅ Ship — quiet differentiation: most wellness apps localize headings but not chart-card labels. |
| 9 | ✅ Ship — Polish "Wskaźniki zdrowia" / "Średni poziom głodu" reads native, not calque. |
| 10 | ✅ Ship — no nudge surface. |
| 11 | ✅ Ship — health-insights labels stay observational, no clinical claims added. |
| 12 | ✅ Ship — no teen-specific surface. |
| 13 | ✅ Ship — no privacy claim added. |
| 14 | ✅ Ship — numeric labels (drinks remaining, drinks over) carry the same semantics across locales. |
| 15 | ✅ Ship — i18n rigor itself is a moat. |
| 16 | ✅ Ship — no recovery-fragile surface; the "drinks over today's limit" copy is calibrated calmly across all locales (R21-5 absolute-units phrasing preserved). |
| 17 | ✅ Ship — no clinical claim. |
| 18 | ✅ Ship hard — locale-parity-all + new progressCards.i18n test = double-guard against regression. |
| 19 | ✅ Ship — no security surface. |
| 20 | ✅ Ship — French "Tendance générale" + "En amélioration" / "En baisse" / "Stable" reads native. |
| 21 | ✅ Ship — the over-limit phrasing ("drinks over today's limit") translates with the same calendar-fact voice in every locale; no math-shame leaks. |
| 22 | ✅ Ship — no fine-motor surface. |
| 23 | ✅ Ship — no behavioral nudge introduced; observational voice intact. |

### R23-B — Settings jump-nav UI

| Judge | Verdict |
|-------|---------|
| 1 | ✅ Ship — sticky chip rail with horizontal overflow stays out of the way; chips have proper visual weight. |
| 2 | ✅ Ship — chip labels are short nouns ("Appearance", "Reminders", "Privacy", "Plan", "About", "Legal") — none use marketing voice. |
| 3 | ✅ Ship hard — uses native `<a href="#…">` (no JS scrolling, no useEffect dance), with `scroll-margin-top` CSS to clear the sticky rail. SettingsJumpNav.test.tsx pins nav role + 6 anchors + 44pt floor. |
| 4 | ✅ Ship — no safety surface. |
| 5 | ✅ Ship hard — `<nav aria-label="Jump to section">` exposes the rail to AT users for one-keystroke section navigation. Each anchor is min-h-[44px] (WCAG 2.5.5). |
| 6 | ✅ Ship — Friday night user can jump straight to "Reminders" or "Privacy" without scrolling through 6 sections. |
| 7 | ✅ Ship — no privacy surface. |
| 8 | ✅ Ship hard — Settings discoverability is a quiet differentiator most competitors don't have. |
| 9 | ✅ Ship — the rail looks like a chip rail (matches the design system); no "navigation" UI weight. |
| 10 | ✅ Ship — no nudge surface. |
| 11 | ✅ Ship — no regulated surface. |
| 12 | ✅ Ship — no teen-specific surface. |
| 13 | ✅ Ship — no privacy claim. |
| 14 | ✅ Ship — no numerics. |
| 15 | ✅ Ship — sticky jump-nav over IDs feels like a "settings done right" detail. |
| 16 | ✅ Ship — no recovery-fragile surface. |
| 17 | ✅ Ship — no clinical claim. |
| 18 | ✅ Ship — 7 jump-nav keys in en/es/fr/de/pl/ru; locale-parity-all stays green. |
| 19 | ✅ Ship — `href="#…"` doesn't introduce XSS surface; same-origin fragment navigation. |
| 20 | ✅ Ship — French "Aller à une section" reads native. |
| 21 | ✅ Ship — no emotional-load surface. |
| 22 | ✅ Ship hard — for the 65yo user, sticky jump-nav at the top of a long Settings page is the *exact* affordance they need. Foundation for fine-motor users who can't scroll long pages reliably. |
| 23 | ✅ Ship — no behavioral nudge; user remains in control of where to go. |

### R23-C — Onboarding "Decide later" intent option

| Judge | Verdict |
|-------|---------|
| 1 | ✅ Ship — visually subdued (dashed border, no fill) so it reads as a non-decision rather than a 4th equal option. |
| 2 | ✅ Ship — "Decide later" is observational, not coercive. |
| 3 | ✅ Ship hard — 4 tests pin chip exists, advances (not dismisses), records intent='undecided', 44pt floor. Type system extended cleanly with PrimaryIntent / Intent split. |
| 4 | ✅ Ship hard — recovery-counselor lens: a Day-0 user who isn't ready to commit gets a path that doesn't force a label they'd later regret. Anti-coercion. |
| 5 | ✅ Ship — chip is a real `<button>` with clear accessible name; meets the 44pt floor. |
| 6 | ✅ Ship — Friday-night first-install user has a non-judgmental escape. |
| 7 | ✅ Ship — privacy preserved; intent='undecided' stays local. |
| 8 | ✅ Ship — competitors force a commitment on Day 0; we don't. Differentiation. |
| 9 | ✅ Ship — the dashed-border styling reads as "soft option" without verbal coaching. |
| 10 | ✅ Ship hard — explicitly anti-default-effect. The user can opt out of committing without skipping the entire flow. |
| 11 | ✅ Ship — no clinical claim. |
| 12 | ✅ Ship — no teen-specific surface. |
| 13 | ✅ Ship — local-only diagnostics; intent stays on device. |
| 14 | ✅ Ship — no numerics. |
| 15 | ✅ Ship — most onboarding flows treat "non-commitment" as a failure state. We don't. |
| 16 | ✅ Ship hard — for a recovery-fragile user (or someone hesitant about labels), Decide-later removes the pressure to self-categorize. |
| 17 | ✅ Ship — clinical psych lens: 'undecided' is a legitimate stance, not a deflection. Recording it honors the user's actual state. |
| 18 | ✅ Ship — onboarding.decideLater key in en/es/fr/de/pl/ru. |
| 19 | ✅ Ship — no security surface. |
| 20 | ✅ Ship — French "Décider plus tard" reads native. |
| 21 | ✅ Ship hard — recently-quit user lens: Decide-later is the option I would have wanted on Day 0 of trying to quit, when "Trying to drink less" felt too small and "Trying to stop" felt too big. |
| 22 | ✅ Ship — 44pt floor preserved. |
| 23 | ✅ Ship hard — undoes a soft default-effect (forcing a primary intent). User retains control. |

### R23-D — Drink-form Quick / Detailed mode toggle

| Judge | Verdict |
|-------|---------|
| 1 | ✅ Ship — quick chips are visually distinct from the detailed form; each is a 64px-tall card with headline + subhead. |
| 2 | ✅ Ship — "Tap to log" subhead is observational. No exclamation, no "+1!" feedback. |
| 3 | ✅ Ship hard — useDB-gated mode preference, back-compat default ('detailed' === undefined), 6 unit tests on QuickLogChips + 4 integration tests on TrackTab pin the mode behavior including the edit-falls-through-to-detailed guarantee. |
| 4 | ✅ Ship — fast-log path doesn't strip the harm-prevention surfaces (HALT, intention) from the detailed form; just lets the user skip them on a casual entry. |
| 5 | ✅ Ship — chips expose `<div role="group" aria-label="Quick log a drink">`. Each chip is a real `<button>` with name + 64px target. |
| 6 | ✅ Ship hard — Friday-night user's win. Tap chip, drink logged, phone away. R23-3 stress test confirmed 1-tap quick-log path. |
| 7 | ✅ Ship — same on-device persistence; no new transmission. |
| 8 | ✅ Ship hard — "1-tap log" was the killer feature of competing apps; we now match it without breaking the detailed-form discipline. |
| 9 | ✅ Ship — the "Need more detail?" disclosure is the right escape hatch — not a footgun. |
| 10 | ✅ Ship — toggle is opt-in (default 'detailed'). |
| 11 | ✅ Ship — no regulated surface. |
| 12 | ✅ Ship — no teen-specific surface. |
| 13 | ✅ Ship — no privacy claim. |
| 14 | ✅ Ship — std-drink defaults match useDrinkForm CHIPS (Beer 355ml/5%, Wine 150ml/12%, Cocktail 60ml/40%) — no double-counting risk. |
| 15 | ✅ Ship hard — quick mode is a UX moat tier most competitors lack. |
| 16 | ✅ Ship — quick mode keeps the user from feeling micromanaged on a casual log. |
| 17 | ✅ Ship — no clinical claim. |
| 18 | ✅ Ship — 14 new drinkLog.quick.* keys in en/es/fr/de/pl/ru; locale-parity-all green. |
| 19 | ✅ Ship — no security surface. |
| 20 | ✅ Ship — French "Saisie rapide" / "Plus de détails ?" reads native. |
| 21 | ✅ Ship — quick mode reduces the friction tax for users who want to log without re-living the moment. |
| 22 | ✅ Ship hard — 64px tall chips are well above the 44pt floor; for the 65yo user, this is the most tap-friendly entry path. |
| 23 | ✅ Ship — no behavioral nudge; user retains control of mode. |

### R23-E — CSP Level 3 split (style-src-elem + style-src-attr)

| Judge | Verdict |
|-------|---------|
| 1 | ✅ Ship — no UI change. |
| 2 | ✅ Ship — no copy change. |
| 3 | ✅ Ship hard — 4 new pin assertions in security-headers.test.ts including a guard that style-src-elem does NOT include 'unsafe-inline'. Investigation memo enumerates the 14 inline-style sites and 5 options considered. |
| 4 | ✅ Ship — no safety-surface change. |
| 5 | ✅ Ship — no a11y impact. |
| 6 | ✅ Ship — no UX change. |
| 7 | ✅ Ship — privacy posture strengthened: XSS via inline `<style>` injection now blocked at the CSP layer. |
| 8 | ✅ Ship — no moat impact directly, but CSP rigor is a credibility signal. |
| 9 | ✅ Ship — no UX change. |
| 10 | ✅ Ship — no nudge surface. |
| 11 | ✅ Ship — no regulated surface. |
| 12 | ✅ Ship — no teen-specific surface. |
| 13 | ✅ Ship hard — defense-in-depth against the realistic XSS-stylesheet payload class. |
| 14 | ✅ Ship — no numerics. |
| 15 | ✅ Ship — CSP rigor differentiates from competitors who ship `'unsafe-inline'` in script-src too. |
| 16 | ✅ Ship — no recovery-fragile surface. |
| 17 | ✅ Ship — no clinical claim. |
| 18 | ✅ Ship — no localization. |
| 19 | ✅ Ship hard — security-researcher lens: this is the right increment on the Level 3 CSP path. Investigation memo names the next step (CSS attr() typed reads) clearly so the trajectory is visible. |
| 20 | ✅ Ship — no localization. |
| 21 | ✅ Ship — no emotional-load surface. |
| 22 | ✅ Ship — no fine-motor surface. |
| 23 | ✅ Ship — no behavioral nudge. |

### R23-1 — Native Polish translator judge (4 fixes)

| Judge | Verdict |
|-------|---------|
| 1 | ✅ Ship — no visual change. |
| 2 | ✅ Ship hard — "Zaufanie wliczone." matches the EN tagline cadence and the R22-1 German "Vertrauen inklusive." pattern. |
| 3 | ✅ Ship — locale-parity-all green; no key changes, only string updates. |
| 4 | ✅ Ship — no safety surface. |
| 5 | ✅ Ship — Polish AT users hear the corrected phrasings. |
| 6 | ✅ Ship — Friday-night Polish user gets a "Czas na nowy cel" headline that doesn't misgender. |
| 7 | ✅ Ship — privacy claim translates correctly. |
| 8 | ✅ Ship — 4/5 non-EN locales now native-audited. |
| 9 | ✅ Ship — Polish reads native, not calque. |
| 10 | ✅ Ship — no nudge surface. |
| 11 | ✅ Ship — no clinical claim. |
| 12 | ✅ Ship — no teen-specific surface. |
| 13 | ✅ Ship — privacy claim intact. |
| 14 | ✅ Ship — no numerics changed. |
| 15 | ✅ Ship — i18n rigor itself is a quiet moat. |
| 16 | ✅ Ship — gender-neutral "Czas na nowy cel" is a softer landing than the prior gendered past tense. |
| 17 | ✅ Ship — no clinical claim. |
| 18 | ✅ Ship hard — i18n-specialist lens: gender-marked past tense is the Polish footgun nobody catches without a native audit. The fix is the right rephrasing. |
| 19 | ✅ Ship — no security surface. |
| 20 | ✅ Ship — French translator already shipped the FR equivalent (R20-6). |
| 21 | ✅ Ship — no emotional-load change. |
| 22 | ✅ Ship — no fine-motor change. |
| 23 | ✅ Ship — no behavioral nudge. |

### R23-2 — Real NVDA-equivalent a11y tree dump

| Judge | Verdict |
|-------|---------|
| 1 | ✅ Ship — no visual change. |
| 2 | ✅ Ship — no copy change. |
| 3 | ✅ Ship hard — Playwright spec dumps real Chromium tree per surface; vitest companion pins landmark + label minimums on every PR. |
| 4 | ✅ Ship — no safety surface. |
| 5 | ✅ Ship hard — closes the JS-emulation-vs-real-AT-tree gap. NVDA users get the right contract. |
| 6 | ✅ Ship — no UX change. |
| 7 | ✅ Ship — no privacy claim. |
| 8 | ✅ Ship — a11y rigor is a credibility differentiator. |
| 9 | ✅ Ship — no UX change. |
| 10 | ✅ Ship — no nudge surface. |
| 11 | ✅ Ship — no regulated surface. |
| 12 | ✅ Ship — no teen-specific surface. |
| 13 | ✅ Ship — no privacy claim. |
| 14 | ✅ Ship — no numerics. |
| 15 | ✅ Ship — quiet a11y moat. |
| 16 | ✅ Ship — no recovery-fragile surface. |
| 17 | ✅ Ship — no clinical claim. |
| 18 | ✅ Ship — no localization. |
| 19 | ✅ Ship — no security surface. |
| 20 | ✅ Ship — no localization. |
| 21 | ✅ Ship — no emotional-load surface. |
| 22 | ✅ Ship — no fine-motor surface. |
| 23 | ✅ Ship — no behavioral nudge. |

### R23-3 — Drink-form usability stress test (analysis-only)

No code change; carry-forwards filed for R24. All judges pass —
the analysis confirmed R23-D shipped at the right shape.

### R23-4 — Insights empty-state illustration

| Judge | Verdict |
|-------|---------|
| 1 | ✅ Ship hard — calm sage-tone illustration earns the empty state without crossing into chipper-cheerleader territory. |
| 2 | ✅ Ship — voice gate: 0 exclamation marks anywhere in the empty state. Existing observational copy preserved verbatim. |
| 3 | ✅ Ship — 4 tests pin testid + aria-hidden SVG + voice intact + illustration disappears when drinks present. |
| 4 | ✅ Ship hard — recovery-counselor lens: the muted dashed line with three subtle markers reads as "the future is open" not "you're behind." |
| 5 | ✅ Ship — `aria-hidden="true"` on the SVG so SR users hear the text only, not "graphic". |
| 6 | ✅ Ship — first-install user sees a calm canvas, not a "log your first drink to unlock!" upsell. |
| 7 | ✅ Ship — no privacy claim. |
| 8 | ✅ Ship — most wellness apps use cheerleader empty states. We don't. Quiet differentiation. |
| 9 | ✅ Ship — the illustration is decorative without being twee. |
| 10 | ✅ Ship hard — explicitly chose NOT to use a celebratory icon (no checkmark, no rocket, no smiley). Anti-cheerleader. |
| 11 | ✅ Ship — no regulated surface. |
| 12 | ✅ Ship — no teen-specific surface. |
| 13 | ✅ Ship — no privacy claim. |
| 14 | ✅ Ship — no numerics. |
| 15 | ✅ Ship hard — empty-state design is a known competitive surface most apps mishandle. We earn this one. |
| 16 | ✅ Ship — recovery-fragile lens: the "trends will show up here" framing is observational, not "you need to log to be seen." |
| 17 | ✅ Ship — no clinical claim. |
| 18 | ✅ Ship — no localization changes; existing keys cover the copy. |
| 19 | ✅ Ship — inline SVG; same security posture as existing icons. |
| 20 | ✅ Ship — no localization. |
| 21 | ✅ Ship — no emotional-load surface. |
| 22 | ✅ Ship — no fine-motor surface. |
| 23 | ✅ Ship — no behavioral nudge. |

### R23-5 — Behavioral economist judge (1 fix)

| Judge | Verdict |
|-------|---------|
| 1 | ✅ Ship — no visual change. |
| 2 | ✅ Ship hard — "Best per-month value" is a value claim, not a peer-pressure claim. |
| 3 | ✅ Ship — 2 regression-guard tests pin the new label + forbid social-proof framings. |
| 4 | ✅ Ship — no safety surface. |
| 5 | ✅ Ship — no a11y impact. |
| 6 | ✅ Ship — no UX-on-craving change. |
| 7 | ✅ Ship — no privacy claim. |
| 8 | ✅ Ship hard — competitor-PM lens: most subscription UIs lean on "Most popular." Removing it is the kind of trust-building move that has long compounding payoff. |
| 9 | ✅ Ship — the new label is more honest about WHY the yearly tier is a deal. |
| 10 | ✅ Ship hard — ethics judge: this is exactly the kind of dark-pattern-undoing R23-5 was designed to surface. |
| 11 | ✅ Ship — no regulated claim. |
| 12 | ✅ Ship — no teen-specific surface. |
| 13 | ✅ Ship — no privacy claim. |
| 14 | ✅ Ship — no numerics. |
| 15 | ✅ Ship hard — competing-app designer lens: this is a quiet moat. Most "calm" apps still ship "Most popular" labels. |
| 16 | ✅ Ship — recovery-fragile lens: removing peer-pressure framing on a paid-tier upsell is the right move for an audience already vulnerable to "what should I do?" pressure. |
| 17 | ✅ Ship — no clinical claim. |
| 18 | ✅ Ship — label is EN-only currently (subscription UI doesn't yet localize); future localization round can carry. |
| 19 | ✅ Ship — no security surface. |
| 20 | ✅ Ship — see #18. |
| 21 | ✅ Ship — no emotional-load surface. |
| 22 | ✅ Ship — no fine-motor surface. |
| 23 | ✅ Ship hard — the 23rd judge's own fix. The audit memo names 6 dimensions that were already clean by design (sunk-cost, loss-aversion, default-effect, variable-rewards, FOMO, anchoring) and 1 that needed the fix (social-proof). The thinness of findings is itself a finding: R8 voice gates + IA-5 levels-strip + R16 milestone-language audit + R17 lifetime-credit had already aligned the surfaces. |

---

## Twenty-third judge debrief (behavioral economist)

The behavioral-economist judge surfaced 1 MEDIUM finding (the
"Most popular" yearly-tier label) that 22 prior judges had not
caught. The reason: the prior 22 lenses each look at the surface
in isolation — voice (is it calm?), a11y (is it usable?), perf
(is it fast?). R23-5 looks at the *motivation* embedded in the
framing — whose interest is the nudge serving?

The thinness of findings is itself a finding: R8 voice gates,
R16 milestone-language audit, R17 lifetime-credit milestones,
and the IA-5 levels/points strip had already aligned the
surfaces against the bias dimensions R23-5 measures. The 23-judge
panel now spans:

design (1, 15), copy + voice (2, 18, 20), code quality (3),
safety + recovery (4, 16, 17, 21), accessibility (5),
users (6, 21, 22), credibility (7, 13, 19),
defensibility (8, 15), bias (9, 10, **23**),
regulation (11), special populations (12, 22),
domain expertise (14, 17), localization correctness (18),
in-locale phrasing (20, 22-1 de, 23-1 pl),
lived-experience emotional load (21),
physical layout / fine-motor / vocabulary load (22),
and **cognitive-bias-against-the-user (23)**.

R24 candidate judges (filed for the next round):

- **Native Russian speaker** (5/5 non-EN locales would be
  covered: fr/es/de/pl/ru after R24).
- **Real-NVDA on hardware** (R23-2 was the closest software
  proxy via Playwright; physical-device pass with an actual
  Windows + NVDA + Firefox / Chrome stack would catch
  pronunciation + focus-order + announcement-timing issues
  that the Chromium tree dump can't see).
- **Cross-cultural recovery counselor** (R4 was US-trained;
  someone trained in a different recovery tradition could
  flag voice / framing assumptions specific to the US 12-step
  paradigm).
- **GitHub-issue-driven maintenance review** (a real user
  filing a real issue is a different kind of judge than any
  of the synthetic 23).

---

## Decision

✅ **Ship hard.** Twenty-three-judge gate passed. No
owner-blocking items.

Per-section status (recap):
- R23-A — progressCards i18n sweep + 162 i18n tests
- R23-B — Settings jump-nav UI + scroll-margin + 7 i18n keys
- R23-C — Decide-later intent chip + Diagnostics label
- R23-D — Drink-form Quick/Detailed mode + 14 i18n keys
- R23-E — CSP Level 3 split (style-src-elem/attr)
- R23-1 — Polish translator (4 fixes)
- R23-2 — NVDA-equivalent a11y tree dump (Playwright + vitest)
- R23-3 — Drink-form usability stress test (analysis)
- R23-4 — Insights empty-state illustration
- R23-5 — Behavioral economist (1 fix to subscription label)

Next step: build + bundle-budget verification + perf-baseline
0% regression check, then push + open + merge PR via Chrome MCP
UI flow.
