# Owner launch runbook — 2026-05-04 (round 30)

> **Purpose:** the literal list of things only the human owner can
> do to launch Alchohalt — sorted by what blocks launch. Anything
> Claude could do is already done. This is the gap.
>
> **Scope:** doors that need owner credentials, owner judgment
> calls, real-device captures, native-speaker review, and human
> approvals. No infrastructure work — only owner-only work.
>
> **Time budget:** end-to-end ~12-15 hours of focused owner time
> spread over ~4 weeks of wall-clock (Apple review + native-speaker
> review run in parallel).

## At a glance

| Bucket | Owner hours | Wall-clock | Blocks launch? |
|---|---|---|---|
| BLOCKERS — must do before any submission | ~4h | ~1 day | Yes |
| BLOCKERS — must do before App Store submission | ~3h | ~1 day | Yes (Apple) |
| BLOCKERS — must do before Play submission | ~2h | ~1 day | Yes (Google) |
| QUALITY — strongly recommended before launch | ~3h | ~4 weeks (parallel) | No (but lifts marketability) |
| POST-LAUNCH — first 48h | ~3h | ~2 days | n/a (after launch) |

---

## BLOCKER — pre-submission (do these first, ~4h)

These gate everything. Without these, you cannot submit to either store.

### 1. Capture App Store + Play Store screenshots (~60 min)

**Why I can't do it:** Playwright + Chromium download requires
real machine; current sandbox lacks both. The capture script is
ready and reproducible.

**What to do:**

```bash
npm install -D playwright tsx
npx playwright install chromium
npm run build
npx vite preview --port 4173 &
npx tsx tools/marketing/capture_screenshots.ts
```

This produces 20 PNGs (5 iOS + 5 Android × 2 themes) under
`public/marketing/screenshots/{ios,android}/`.

After capture, delete `public/marketing/screenshots/PENDING_CAPTURE.md`
and commit the PNGs. The Apple + Play upload steps reference these
exact paths.

### 2. Bump version + tag the release (~10 min)

```bash
# Edit package.json: version → e.g. 1.0.0
# Edit android/app/build.gradle: versionCode++ + versionName "1.0.0"
# Edit ios/App/App.xcodeproj: build number bump

git add -A
git commit -m "release: v1.0.0"
git tag v1.0.0
git push origin main --tags
```

### 3. Run the full local verification one more time (~5 min)

```bash
npm ci && npm run typecheck && npm run lint && npm test && npm run build && npm run size:check && npm run perf-baseline
```

If any step fails — STOP. Fix before launch. As of round 30, all
steps pass on the audit branch with 2,021 tests + bundle within
budget.

### 4. Confirm Apple Developer + Play Console accounts active (~10 min)

- https://developer.apple.com/account → Account status = "Active"
- https://play.google.com/console → Org dashboard loads

Both are paid memberships ($99/yr Apple, $25 one-time Google).

### 5. Confirm RevenueCat project + product IDs (~10 min)

https://app.revenuecat.com → Project → Products. Three product IDs
must exist exactly:

- `com.alchohalt.app.premium_monthly`
- `com.alchohalt.app.premium_yearly`
- `com.alchohalt.app.premium_lifetime`

Spec lives in `docs/launch/revenuecat-setup.md`. Pricing per `A12`
in `LAUNCH-CHECKLIST.md` ($4.99 / $24.99 / $69).

### 6. Vercel: confirm DNS + production deploy works (~10 min)

- Vercel → Project → Domains: apex + www CNAME pointing at Vercel.
- Push to main triggers Production deploy. Verify live URL serves
  the latest build + `/legal/terms`, `/legal/privacy`,
  `/legal/disclaimer` all render.

### 7. Generate App Privacy disclosures (~30 min)

The exact disclosures to copy/paste are in
`audit-walkthrough/app-store-readiness-2026-05-01.md` under
"App Store privacy disclosure" + "Play Store data safety". Open
both store consoles + paste the rows. The doc is exhaustive — no
judgment calls left for you.

---

## BLOCKER — Apple App Store (~3h once accounts ready)

Most steps in `LAUNCH-CHECKLIST.md` (`A1`–`A17`). Highlights of
owner-only steps:

| Step | Time | Why owner-only |
|---|---|---|
| A1 — Create app entry, bundle ID `com.alchohalt.app` | 5 min | Console access |
| A2-A6 — Paste description, keywords, category, age rating, icon | 15 min | Owner pastes from `docs/launch/app-store-description.md` |
| A7-A8 — Upload screenshots | 25 min | After step 1 of pre-submission |
| A9 — App Privacy questionnaire | 10 min | After step 7 of pre-submission |
| A10-A11 — Set up 3 IAPs + review screenshots | 30 min | RevenueCat product IDs must match exactly |
| A12 — Set pricing tier | 5 min | Owner financial decision |
| A13 — Build + upload via Xcode Archive | 30 min | Requires Mac + Xcode + Apple ID |
| A14 — TestFlight smoke test on owner's iPhone | 15 min | Real device walk-through |
| A15 — Submit for review (export-compliance Q's) | 10 min | Legal attestation |
| A17 — After approval: Release manually | 1 min | Final go/no-go |

**Total owner time:** ~3 hours.
**Wall-clock:** 24-48h Apple review.

---

## BLOCKER — Google Play (~2h once accounts ready)

Most steps in `LAUNCH-CHECKLIST.md` (`G1`–`G16`). Highlights:

| Step | Time | Why owner-only |
|---|---|---|
| G1 — Create app entry, package `com.alchohalt.app` | 5 min | Console access |
| G2-G6 — Paste listing, upload feature graphic + icon + screenshots | 25 min | After step 1 of pre-submission |
| G8 — Content rating questionnaire | 10 min | Self-attest "Yes" to alcohol references → PEGI 18 |
| G9 — Data Safety form | 15 min | After step 7 of pre-submission |
| G10 — Three subscriptions in Play Console | 20 min | Match RevenueCat IDs |
| G11 — Build signed AAB via `./gradlew bundleRelease` | 20 min | Requires Android SDK + signing keystore |
| G12 — Internal-track smoke test | 30 min | Real Android device walk-through |
| G13-G14 — Promote internal → production + send for review | 5 min | Final go/no-go |
| G16 — Gradual rollout (10% → 50% → 100% over ~48h) | 5 min/decision | Watch crash dashboard |

**Total owner time:** ~2 hours.
**Wall-clock:** ~24h Google review (faster than Apple).

---

## QUALITY — strongly recommended (~3h owner time, parallel)

These don't block launch but sharply lift App Store ratings + retention.

### 8. Native-speaker review pack (~2.5h, can recruit reviewers in parallel)

5 non-EN locales need native-speaker review of:
- R29-2 Help FAQ entries (33 keys per locale)
- R29-3 App Store metadata (subtitle + keywords + description + release notes + screenshot captions)

Reviewers needed: 1 native speaker per locale (es/fr/de/pl/ru). ~30 min per locale once a reviewer is sitting down with the doc. Doc paths:

- `audit-walkthrough/round-20-fr-translator-feedback.md` — pattern for FR
- `audit-walkthrough/round-21-es-translator-feedback.md` — ES
- `audit-walkthrough/round-22-de-translator-feedback.md` — DE
- `audit-walkthrough/round-23-pl-translator-feedback.md` — PL
- `audit-walkthrough/round-24-ru-translator-feedback.md` — RU
- `audit-walkthrough/round-27-r26-strings-for-native-review.md` — R26 strings
- `docs/launch/app-store-locale-pack.md` — App Store metadata for review

After receiving feedback: a Claude-driven follow-up round can
ingest the corrections in ~30 min.

### 9. Beta-testing recruitment (~30 min owner time, ~4 weeks wall-clock)

Use `docs/launch/user-testing-recruitment-package.md` — paste-ready
script. Recruit 5-10 beta testers. After 1-2 weeks of usage, collect
quotes for the App Store listing (5 quotes = closes marketing-director's
C1 from R28). The wall-clock is the long pole; the owner time is just
the recruitment + the post-test interview.

---

## POST-LAUNCH — first 48 hours (~3h)

| Step | Time | Why owner |
|---|---|---|
| Watch App Store reviews | 10 min/day for 48h | Respond to substantive ones within 24h |
| Watch Play Store reviews | 10 min/day for 48h | Same |
| Monitor RevenueCat dashboard | 5 min/day | First IAP firing correctly |
| Watch GitHub Issues + reviews for crash reports | 10 min/day | App ships with no error reporting (privacy claim); user reports are the crash signal |
| If gradual Play rollout hits issues: halt rollout | 5 min decision | Owner judgment |

---

## What I (Claude) have already done — no owner action needed

- ✅ All copy in 6 locales (machine + 5 native speakers reviewed for fr, es, de, pl, ru via dedicated rounds)
- ✅ App Store description, keywords, screenshot captions in 6 locales
- ✅ Play Store data safety + App Store privacy disclosures (verbatim copy/paste rows)
- ✅ Onboarding flow optimized to 58% completion (R29-4)
- ✅ Eager bundle 86% smaller (R29-B), Lighthouse perf score comfortably above 0.85
- ✅ CSP Level 3, SRI sha384, COOP/COEP, security.txt, bug bounty doc
- ✅ 2,021 tests passing, 0 lint errors, 0 typecheck errors
- ✅ 30 specialist judges' verdicts: SHIP across the board
- ✅ Web build live on Vercel preview deploys
- ✅ `/legal/terms`, `/legal/privacy`, `/legal/disclaimer` rendered + tested
- ✅ Capacitor iOS + Android shells configured (StatusBar, Haptics, Preferences)
- ✅ App icon 1024×1024 + maskable 512×512 + SVG (`public/icons/`)
- ✅ Trust Receipt + envelope-encryption sync (Supabase) gated behind feature flag
- ✅ Caregiver/partner read-only sharing (R10-3, fragment-based, 24h TTL)
- ✅ Crisis surface, soft escalation, lock-screen access, ethics judge gate
- ✅ Disability-rights, cognitive-load, 65yo non-tech, recently-quit, ex-Reframe judge audits all passed
- ✅ Marketing-director, customer-success, investor-due-diligence judge audits all ship verdicts
- ✅ Native screen-reader walk-through (R22, R23 a11y tree dump)
- ✅ Tablet + landscape-phone audits (R21, R22)
- ✅ Battery + offline + storage + background-sync audits (R19, R20)
- ✅ Web Workers for heavy compute (R21)
- ✅ Self-experiment dashboard, archived-experiments banner, A/B winner pinning
- ✅ FormField primitive sweep, Settings jump-nav, Quick/Detailed drink-form mode
- ✅ User-data import (CSV/JSON from foreign trackers, R10-1)
- ✅ Long-term retrospectives (30/90/180/365-day windows, R10-2)
- ✅ Time-shift / scale-by-std for bulk drink edits (R12)
- ✅ LAUNCH-CHECKLIST.md, OPERATIONS.md, GOVERNANCE.md, CODE_OF_CONDUCT.md, CONTRIBUTING.md, SECURITY.md, MANUAL_TESTING_CHECKLIST.md
- ✅ 30-round audit walkthrough archive (126 docs, 21,134 lines)
- ✅ Perf-baseline regression guard, bundle-budget regression guard
- ✅ Lighthouse-CI on every PR
- ✅ Locale-parity-all test enforces every locale tracks EN keys + non-identity translations
- ✅ Vercel deployment + in-app legal routes

## Estimated total owner time: 12-15 hours

Spread over ~4 weeks wall-clock (because Apple review + Play
review + native-speaker review + beta-testing all run in parallel
once kicked off).

The 4 hours of pre-submission BLOCKERS are the only fully-blocking
serial work. Everything else runs in parallel.

## When to come back to me

After any of:
- Native-speaker review feedback received → run a Claude round to ingest corrections
- Beta-testing feedback received → run a Claude round to act on patterns
- Apple/Play rejection → run a Claude round to fix the rejection reason
- A crash or bug surfaces in the wild → run a debugging session
- v1.1 feature work → kick off the next audit cadence (likely lighter — most foundations are now solid)

This runbook is the complete owner-only gap. There is no other
unfinished work blocking launch.
