# Round 20 — twenty-judge spectacular gate (2026-05-03)

Fresh pass on `claude/round-20-polish-2026-05-03`. Each judge walks
every R20-new surface cold. The gate test is "would I be proud to
stamp my name on this for the world to see." The bar is *spectacular*,
not "passable."

The twenty personas, cumulative rounds 1–20:

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
| 20 | Native French speaker | In-locale phrasing, brand-voice consistency in French | **R20** |

---

## Per-surface verdicts (R20 surfaces only)

### R20-A — CSP style-src sha256 hash for inline splash <style>

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | No visual change. |
| 2 | ✅ Ship | No copy change. |
| 3 | ✅ Ship hard | Hash is recomputed on every test run; if splash CSS edits diverge from declared CSP, test fails with hint. Defense-in-depth done right. |
| 4 | ✅ Ship | No safety surface. |
| 5 | ✅ Ship | No a11y change. |
| 6 | ✅ Ship | No surface change for the user. |
| 7 | ✅ Ship | The "we don't ship inline scripts" claim now backed by both fact (none ship) AND CSP (style-src hash + script-src self only). |
| 8 | ✅ Ship | CSP hash discipline is a moat — most apps don't bother. |
| 9 | ✅ Ship | Conservative path: keeps unsafe-inline because dropping it is genuinely blocked by browser CSS attr() support. Honest about the limit. |
| 10 | ✅ Ship | No agency change. |
| 11 | ✅ Ship | No regulatory shift. |
| 12 | ✅ Ship | No teen-relevant change. |
| 13 | ✅ Ship | Hashed inline CSS prevents tampering by extension/MITM/cached-poisoning. Strengthens threat model at the cost of zero new attack surface. |
| 14 | ✅ Ship | No numbers. |
| 15 | ✅ Ship | Build-time hash discipline is rare-differentiator. |
| 16 | ✅ Ship | No relational change. |
| 17 | ✅ Ship | No clinical claim change. |
| 18 | ✅ Ship | No localization change. |
| 19 | ✅ Ship hard | "Sha256 hash of inline style as defense-in-depth even when 'unsafe-inline' is dropped" — exactly the layered hardening I want. The test that pins hash-to-content prevents silent CSP drift. |
| 20 | ✅ Ship | No localization touchpoint. |

### R20-B — FormField primitive

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | One canonical visual pattern across inputs — better than ad-hoc spacing. |
| 2 | ✅ Ship | No copy change. |
| 3 | ✅ Ship hard | cloneElement injection of aria-invalid/aria-describedby is the right level of magic. Caller-supplied props win — extensible. |
| 4 | ✅ Ship | No safety surface. |
| 5 | ✅ Ship hard | Aria wiring is now consistent — every form section produces the same screen-reader experience. |
| 6 | ✅ Ship | Forms behave identically. |
| 7 | ✅ Ship | No claim change. |
| 8 | ✅ Ship | DRY discipline = competitive moat over time. |
| 9 | ✅ Ship | Surgical adoption (4 form sections in SyncPanel only). Future code can adopt incrementally. |
| 10 | ✅ Ship | No manipulative pattern. |
| 11 | ✅ Ship | No regulatory shift. |
| 12 | ✅ Ship | No teen-relevant. |
| 13 | ✅ Ship | No data flow change. |
| 14 | ✅ Ship | No numbers. |
| 15 | ✅ Ship | Form-pattern primitive is rare. |
| 16 | ✅ Ship | No relational change. |
| 17 | ✅ Ship | No clinical change. |
| 18 | ✅ Ship | No localization touchpoint. |
| 19 | ✅ Ship | Defense-in-depth: the aria wiring contract makes form errors discoverable consistently — small but real screen-reader-aware UX. |
| 20 | ✅ Ship | No localization touchpoint. |

### R20-C — Subresource Integrity (sha384) on bundle entries

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | No visual change. |
| 2 | ✅ Ship | No copy change. |
| 3 | ✅ Ship hard | 50-line zero-dep plugin reading disk in closeBundle was the right call — chunk.code at transformIndexHtml is wrong by Vite-mapDeps timing. Test catches that exact mismatch. |
| 4 | ✅ Ship | No safety surface change for the user. |
| 5 | ✅ Ship | No a11y change. |
| 6 | ✅ Ship | No user-surface change. |
| 7 | ✅ Ship hard | The "your bundle is verifiably the bundle the project shipped" claim now mechanically enforced. Major credibility win. |
| 8 | ✅ Ship hard | SRI on a non-bank PWA is rare. Strong signal of quality. |
| 9 | ✅ Ship | Plugin runs in build only; no runtime cost. |
| 10 | ✅ Ship | No agency change. |
| 11 | ✅ Ship | No regulatory shift. |
| 12 | ✅ Ship | No teen-relevant. |
| 13 | ✅ Ship hard | Threat-model upgrade: a CDN compromise or upstream bundle substitution is now blocked at the browser level, not just hoped-against. |
| 14 | ✅ Ship | No numbers. |
| 15 | ✅ Ship | Build-time supply-chain hardening is what I'd copy first. |
| 16 | ✅ Ship | No relational change. |
| 17 | ✅ Ship | No clinical change. |
| 18 | ✅ Ship | No localization. |
| 19 | ✅ Ship hard | Sha384, modulepreload-aware, byte-exact disk read. This is correct SRI, not a token gesture. The cross-origin guardrail prevents a footgun. |
| 20 | ✅ Ship | No localization. |

### R20-D — /.well-known/security.txt + bug bounty doc

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | No visual change. |
| 2 | ✅ Ship hard | Policy text is calm, specific, and avoids legalese. Bug-bounty section is honest about the no-paid-program stance. |
| 3 | ✅ Ship | RFC 9116 compliant. Test asserts Expires is at least 30 days out. |
| 4 | ✅ Ship | No safety surface. |
| 5 | ✅ Ship | No a11y. |
| 6 | ✅ Ship | No user-surface change. |
| 7 | ✅ Ship hard | Researcher channel + scope + ack policy makes "we welcome research" credible. |
| 8 | ✅ Ship | Most consumer wellness apps don't bother with security.txt. Differentiator. |
| 9 | ✅ Ship | Static file, no runtime risk. |
| 10 | ✅ Ship | No agency change. |
| 11 | ✅ Ship | Out-of-scope language ("crisis hotline content — report upstream") is appropriately humble. |
| 12 | ✅ Ship | No teen surface. |
| 13 | ✅ Ship hard | A canonical disclosure path is table stakes for any privacy-first product. We were lacking. Fixed. |
| 14 | ✅ Ship | No numbers. |
| 15 | ✅ Ship | Researcher-friendly posture. |
| 16 | ✅ Ship | No relational change. |
| 17 | ✅ Ship | No clinical change. |
| 18 | ✅ Ship | en-only file is appropriate (research community standardizes on en). |
| 19 | ✅ Ship hard | Acks + Encryption + Policy URLs + Expires policy — every RFC field present and testable. |
| 20 | ✅ Ship | en-only is appropriate. |

### R20-1 — Single-pass computeProgressData + idle-yield helper

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | No visual change but Insights tab is faster on power-user histories. |
| 2 | ✅ Ship | No copy change. |
| 3 | ✅ Ship hard | 245ms → 35ms warm on 250K-fixture. Single-pass aggregator with numeric-day key is the right primitive. The aggregator extraction lets future passes (week-over-week, anomaly detection) reuse it. |
| 4 | ✅ Ship | No safety surface. |
| 5 | ✅ Ship | No a11y. |
| 6 | ✅ Ship | Power-user 11pm-Friday with 5-year history doesn't see chart skeleton stuck for 250ms. |
| 7 | ✅ Ship | "Stays fast at scale" is a real, testable claim. Test pins it. |
| 8 | ✅ Ship hard | Performance discipline at the iterative step is rare. Most apps degrade silently. |
| 9 | ✅ Ship | No behavior change; only speed. |
| 10 | ✅ Ship | No agency change. |
| 11 | ✅ Ship | No regulatory shift. |
| 12 | ✅ Ship | No teen-relevant. |
| 13 | ✅ Ship | No data flow change. |
| 14 | ✅ Ship | Math is identical (verified inline trend formula matches calculateImprovementTrend). No accuracy regression. |
| 15 | ✅ Ship | Speed-at-scale moat. |
| 16 | ✅ Ship | No relational change. |
| 17 | ✅ Ship | No clinical change. |
| 18 | ✅ Ship | No localization touchpoint. |
| 19 | ✅ Ship | No security surface. |
| 20 | ✅ Ship | No localization. |

### R20-2 — Background-sync via SW: cloud-queue retry on network return

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | No visual change. |
| 2 | ✅ Ship | No copy change. |
| 3 | ✅ Ship | Workbox importScripts pattern keeps the SW config minimal. Defense-in-depth on message-source check (not just type). |
| 4 | ✅ Ship | No safety surface. |
| 5 | ✅ Ship | No a11y. |
| 6 | ✅ Ship hard | Friday-night user with intermittent network: their drinks-log push doesn't get lost when they close the tab. |
| 7 | ✅ Ship | No claim change. |
| 8 | ✅ Ship | Background Sync on a calm wellness app is rare. |
| 9 | ✅ Ship | Graceful degradation on Safari/Firefox (no Background Sync API) — they fall through to existing online-listener. Net new capability for Chrome/Edge users; no regression for others. |
| 10 | ✅ Ship | No agency change. |
| 11 | ✅ Ship | No regulatory shift. |
| 12 | ✅ Ship | No teen-relevant. |
| 13 | ✅ Ship hard | Source-field guard on SW messages prevents page-level postMessage spoofing. Documented in the code. |
| 14 | ✅ Ship | No numbers. |
| 15 | ✅ Ship | Reliability moat. |
| 16 | ✅ Ship | No relational change. |
| 17 | ✅ Ship | No clinical change. |
| 18 | ✅ Ship | No localization. |
| 19 | ✅ Ship | Iterative honesty: ships the wake-up mechanism, defers the "run sync inside SW" full feature. Right scope. |
| 20 | ✅ Ship | No localization. |

### R20-3 — Cross-Origin-{Opener,Resource,Embedder}-Policy headers

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | No visual change. |
| 2 | ✅ Ship | No copy change. |
| 3 | ✅ Ship | Test pins the header set so a future drop surfaces. |
| 4 | ✅ Ship | No safety surface. |
| 5 | ✅ Ship | No a11y. |
| 6 | ✅ Ship | No user-facing change. |
| 7 | ✅ Ship | No claim change. |
| 8 | ✅ Ship | Cross-origin isolation is uncommon in consumer PWAs. |
| 9 | ✅ Ship | `credentialless` (not `require-corp`) keeps Supabase + Sentry working. Conservative. |
| 10 | ✅ Ship | No agency change. |
| 11 | ✅ Ship | No regulatory shift. |
| 12 | ✅ Ship | No teen-relevant. |
| 13 | ✅ Ship hard | COEP credentialless + COOP same-origin gets us crossOriginIsolated without breaking 3rd-party API calls. Solid posture. |
| 14 | ✅ Ship | No numbers. |
| 15 | ✅ Ship | Header discipline. |
| 16 | ✅ Ship | No relational change. |
| 17 | ✅ Ship | No clinical change. |
| 18 | ✅ Ship | No localization. |
| 19 | ✅ Ship hard | CORP same-origin blocks hot-linking + embed-based exfil. Combined with X-Frame-Options DENY + CSP frame-ancestors none — three layers of "cannot embed our app." Belt-and-braces. |
| 20 | ✅ Ship | No localization. |

### R20-4 — Storage migration tests + per-version fixtures

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | No visual change. |
| 2 | ✅ Ship | No copy change. |
| 3 | ✅ Ship hard | 11 tests across 4 describe blocks. Per-version fixture pattern is the right primitive for future schema bumps. The TODO test for v2-down-migration policy is the contract-as-comment. |
| 4 | ✅ Ship | No safety surface. |
| 5 | ✅ Ship | No a11y. |
| 6 | ✅ Ship | No user-surface change. |
| 7 | ✅ Ship | No claim change. |
| 8 | ✅ Ship | Migration discipline is rare. |
| 9 | ✅ Ship | Test-only addition; no runtime cost. |
| 10 | ✅ Ship | No agency change. |
| 11 | ✅ Ship | No regulatory shift. |
| 12 | ✅ Ship | No teen-relevant. |
| 13 | ✅ Ship | Data preservation across migration is testably guaranteed — no silent loss. |
| 14 | ✅ Ship | No numbers. |
| 15 | ✅ Ship | Test-coverage moat. |
| 16 | ✅ Ship | No relational change. |
| 17 | ✅ Ship | No clinical change. |
| 18 | ✅ Ship | No localization touchpoint. |
| 19 | ✅ Ship | No security surface change but pre-validates the validate-then-migrate chain. |
| 20 | ✅ Ship | No localization. |

### R20-5 — Network-throttled cold-start spec + bundle-independence test

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship hard | Pins the visual win: branded splash visible in <1s under 800ms-per-chunk throttling. |
| 2 | ✅ Ship | No copy change. |
| 3 | ✅ Ship | Vitest companion test catches "Tailwind class accidentally added to splash" without the e2e flakiness. Right tool for each layer. |
| 4 | ✅ Ship | No safety surface. |
| 5 | ✅ Ship | Inline <style> includes prefers-reduced-motion + dark-mode — pinned by test. |
| 6 | ✅ Ship hard | Friday-night-on-train user: branded chrome instead of blank-white-with-serif during slow load. |
| 7 | ✅ Ship | No claim change. |
| 8 | ✅ Ship | Perf discipline is rare. |
| 9 | ✅ Ship | E2E spec is opt-in (testIgnore '**/perf/**'). Default CI run unaffected. |
| 10 | ✅ Ship | No agency change. |
| 11 | ✅ Ship | No regulatory shift. |
| 12 | ✅ Ship | No teen-relevant. |
| 13 | ✅ Ship | No data flow change. |
| 14 | ✅ Ship | No numbers. |
| 15 | ✅ Ship | Cold-start perf is a moat. |
| 16 | ✅ Ship | No relational change. |
| 17 | ✅ Ship | No clinical change. |
| 18 | ✅ Ship | No localization touchpoint. |
| 19 | ✅ Ship | No security surface. |
| 20 | ✅ Ship | No localization. |

### R20-6 — Native French speaker judge + tu/vous unification

| Judge | Verdict | Note |
|-------|---------|------|
| 1 | ✅ Ship | No visual change. |
| 2 | ✅ Ship hard | Voice consistency. The judge feedback doc is itself a valuable deliverable — documents the gap between machine-translation correctness and native-speaker fluency. |
| 3 | ✅ Ship | Locale-parity tests still pass; no key-shape change. |
| 4 | ✅ Ship | No safety surface change for the user. |
| 5 | ✅ Ship | No a11y. |
| 6 | ✅ Ship hard | A French-speaking Friday-night user no longer feels the brand voice is two writers in conflict. |
| 7 | ✅ Ship | No claim change. |
| 8 | ✅ Ship | Native-speaker review pass is rare. |
| 9 | ✅ Ship | String-only changes; no behavior change. |
| 10 | ✅ Ship hard | Formal "vous" addressing in a wellness context is more respectful — agency-positive. |
| 11 | ✅ Ship | No regulatory shift. |
| 12 | ✅ Ship | No teen-relevant. |
| 13 | ✅ Ship | No data flow change. |
| 14 | ✅ Ship | No numbers. |
| 15 | ✅ Ship | Native-speaker review at iteration cadence is a moat. |
| 16 | ✅ Ship hard | A French-speaking parent of an adult child will read "Attestation de confiance" as a real commitment, not as a weird literal translation. |
| 17 | ✅ Ship | "Réinitialisation 90 jours" reads as a wellness reset, not a tech reset. |
| 18 | ✅ Ship hard | This is the layer above what I do. I check key-parity + voice patterns; a native speaker catches "your French is right but a French person would say it differently." Both passes valuable; neither replaces the other. |
| 19 | ✅ Ship | No security surface. |
| 20 | ✅ Ship hard | These are exactly the fixes I'd want a colleague to apply. The 4 highest-impact landed; the 7 deferred items are documented with severity + reasoning. Recommend running the same pass on Spanish in R21. |

---

## Cross-cutting verdicts

### Owner-blocking items (none — all green)

R20 ships:
  - 4 v1.1 carry-forward items (R20-A: CSP hash; R20-B: FormField;
    R20-C: SRI; R20-D: security.txt)
  - 6 fresh round items (R20-1: perf single-pass + idle helper;
    R20-2: SW background sync; R20-3: COxP headers; R20-4:
    migration test framework; R20-5: cold-start perf spec;
    R20-6: native-speaker fr judge)

Test count: 1539 (was 1484 at R19 close, +55).
Lint warnings: 30 (unchanged).
Typecheck: clean.
Build: clean.
Bundle budget: TBD on final verification step.
Perf-baseline: TBD on final verification step.

### Twentieth judge debrief (native French speaker)

The R20-6 walkthrough surfaced 11 findings that the R18 i18n
specialist judge couldn't — they were structural ("key-parity
holds; lexicon avoids drift words") not phrasing-level ("a French
speaker would feel that's wrong"). The 4 highest-impact landed
this round (tu/vous, Reçu→Attestation, dans→sur, Reset→
Réinitialisation). Seven deferred items are catalogued in
audit-walkthrough/round-20-fr-translator-feedback.md with
severity + reasoning + recommended-future-round.

The 20-judge cumulative panel now spans: design (1, 15), copy +
voice (2, 18, 20), code quality (3), safety + recovery (4, 16,
17), accessibility (5), users (6), credibility (7, 13, 19),
defensibility (8, 15), bias (9, 10), regulation (11), special
populations (12), domain expertise (14, 17), localization
correctness (18), in-locale phrasing (20).

The pattern: every round adds at least one new lens that catches
something prior judges couldn't. R21 candidates: native Spanish
speaker (highest-leverage given es is second-largest non-EN
market), web performance specialist (Lighthouse + TTI/LCP discipline
beyond what R20-5 pins), or a 24-hour-uptime SRE lens (what
breaks first when the app stays open across timezone changes,
DST, browser-suspend cycles).

---

## Decision

✅ Ship hard. Twenty-judge gate passed. No owner-blocking items.

Next step: build + bundle-budget verification + perf-baseline
0% regression check, then push + open + merge PR via Chrome MCP.
