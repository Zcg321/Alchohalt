# Alchohalt — App Store + Play Console launch checklist

> **Audience:** the owner, on launch day. Every step is a single click or copy-paste. Estimated time per step is wall-clock — most steps depend on prior steps completing, so plan for 3–5 hours of focused time across 1–2 sessions, not parallelizable.
>
> If a step has a **rollback path**, it's listed inline. Steps without one are reversible by reverting the action in the same console.

> **Last refresh:** 2026-05-02 (round 11). If a step looks stale, regenerate the relevant audit doc and update this file.

---

## Pre-flight (do these BEFORE entering the consoles)

| # | Step | Owner action | Time | Verification | Rollback |
|---|---|---|---|---|---|
| P1 | Confirm Apple Developer account is paid + active | Sign in to https://developer.apple.com/account | 2 min | Account status = "Active" | n/a |
| P2 | Confirm Google Play Console access | Sign in to https://play.google.com/console | 2 min | Org dashboard loads | n/a |
| P3 | Confirm RevenueCat project exists with the three product IDs | https://app.revenuecat.com → Project → Products | 5 min | `com.alchohalt.app.premium_monthly`, `_yearly`, `_lifetime` listed. Spec: `docs/launch/revenuecat-setup.md` | n/a |
| P4 | Final test build passes locally | `npm ci && npm run typecheck && npm run lint && npm run test && npm run build` | 5 min | All green; `dist/` populated | If a step fails — STOP. Fix before launch. |
| P5 | Bump app version + build number | Edit `package.json` `version` and (for native) `ios/App/App.xcodeproj` build number / `android/app/build.gradle` `versionCode` + `versionName`. | 3 min | `git diff` shows the bump | `git checkout -- <files>` |
| P6 | Tag the release commit | `git tag v$(node -p "require('./package.json').version") && git push --tags` | 1 min | Tag visible in `git tag -l` | `git tag -d <tag> && git push --delete origin <tag>` |

---

## Apple App Store Connect

| # | Step | Owner action | Time | Verification | Rollback |
|---|---|---|---|---|---|
| A1 | Create the app entry (first-launch only — skip if it already exists) | App Store Connect → My Apps → "+" → New App. Bundle ID = `com.alchohalt.app`. | 5 min | App appears in My Apps | Delete the app entry from My Apps |
| A2 | Paste app description (long + short) | Copy from `docs/launch/app-store-description.md`. App Information → Description. | 3 min | Description preview reads cleanly | Re-edit |
| A3 | Paste keywords | From `docs/launch/LISTING_NOTES.md`, keywords section. App Information → Keywords. | 1 min | Field accepts input under 100 char limit | Re-edit |
| A4 | Set primary + secondary category | Health & Fitness primary; Lifestyle secondary. App Information → Category. | 1 min | Categories saved | Re-edit |
| A5 | Set age rating | App Information → Age Rating questionnaire. Answer "Frequent/Intense" → Alcohol; "None" → everything else. Result: 17+. | 5 min | Age rating shows 17+ | Re-take questionnaire |
| A6 | Upload app icon (1024×1024) | Already in repo: `public/icons/icon-1024.png`. App Store → App Icon. | 1 min | Preview shows current icon | Replace with prior file |
| A7 | Upload screenshots (iPhone) | Capture set: `audit-walkthrough/store-screenshots/iphone-portrait/`. Re-run `npx tsx tools/marketing/capture_store_screenshots.ts` if the manifest hash differs from `audit-walkthrough/store-screenshots/MANIFEST.md`. Upload 3-10 screenshots per size class. | 15 min | Each device size shows preview thumbnails | Delete + re-upload |
| A8 | Upload screenshots (iPad) | Same source dir, ipad-* folders | 10 min | Preview shows on iPad mockup | Delete + re-upload |
| A9 | Paste privacy disclosure | From `audit-walkthrough/app-store-readiness-2026-05-01.md` → "App Store privacy disclosure" section. App Privacy → Privacy Practices. | 10 min | All declared data types match doc | Re-edit each row |
| A10 | Set up in-app purchases (one-time per IAP) | App Store Connect → In-App Purchases → "+". Three products from P3. Match RevenueCat product IDs exactly. | 20 min | Three IAPs in "Ready to Submit" | Reject IAP from review queue |
| A11 | Upload IAP review screenshots | Each IAP needs a screenshot showing the upgrade UI. Use `audit-walkthrough/store-screenshots/iphone-portrait/light/insights.png` (shows the soft-paywall). | 10 min | Each IAP has a review screenshot attached | Replace screenshot |
| A12 | Set pricing tier | $4.99 / $24.99 / $69 from `docs/launch/revenuecat-setup.md`. App Store Connect → Pricing → choose tier or use "custom". | 5 min | Prices match | Adjust tier |
| A13 | Upload the binary (TestFlight first) | Build via Xcode → Product → Archive → Distribute App → App Store Connect → Upload. Wait for processing (~10-30 min). | 30 min | Build appears under TestFlight | Reject build, upload new one |
| A14 | Internal TestFlight smoke test | Install via TestFlight on the owner's iPhone. Run through onboarding, log a drink, open Crisis, dismiss without a crash. | 15 min | All 5 paths work | If a path crashes — DO NOT submit for review. Diagnose and respin. |
| A15 | Submit for review | App Store Connect → Version → Submit for Review. Answer the IAP / encryption questions. Encryption: "Yes — uses standard encryption (libsodium)." Export compliance: file ITSAppUsesNonExemptEncryption = false in `Info.plist` (already set, verify). | 10 min | Status: "Waiting for Review" | Reject from queue (keeps you in control of resubmit timing) |
| A16 | (Wait) Apple review | 24-48h typical. Watch email for "In Review" then "Approved" or "Rejected". | up to 48h passive | Email arrives | If rejected: read the rejection reason in Resolution Center, fix, resubmit. Most common: missing screenshots, IAP review screenshots, or age-rating mismatch. |
| A17 | Release | After approval: choose "Release this version" (manual) or auto-release. Pick MANUAL for the first launch so you control the moment. | 1 min | Status: "Pending Developer Release" → "Ready for Sale" | Pull from sale: App Store Connect → Version → Pricing → "Remove from Sale" |

---

## Google Play Console

| # | Step | Owner action | Time | Verification | Rollback |
|---|---|---|---|---|---|
| G1 | Create the app entry (first-launch only) | Play Console → All apps → Create app. Package name = `com.alchohalt.app`. | 5 min | App appears in All apps | Delete app within 30 days |
| G2 | Set up the store listing | Play Console → Main store listing. Paste short description, full description from `docs/launch/app-store-description.md`. | 5 min | Listing preview reads cleanly | Re-edit |
| G3 | Upload feature graphic (1024×500) | From `audit-walkthrough/store-screenshots/feature-graphic.png` (regenerate via marketing capture script if missing). Main store listing → Graphic assets. | 3 min | Preview shows in Play Store style | Replace |
| G4 | Upload icon | `public/icons/icon-1024.png` — Play accepts the same 1024×1024. | 1 min | Icon preview correct | Replace |
| G5 | Upload phone screenshots | `audit-walkthrough/store-screenshots/android-portrait/` — minimum 4, max 8. | 10 min | Carousel preview correct | Delete + re-upload |
| G6 | Upload tablet screenshots | `audit-walkthrough/store-screenshots/android-landscape/` for tablet size class | 10 min | Tablet preview correct | Delete + re-upload |
| G7 | Set category | Health & Fitness | 1 min | Category saved | Re-select |
| G8 | Content rating questionnaire | Play Console → Policy → Content rating. Answer "Yes" to Alcohol references; everything else "No". Result: PEGI 18 / IARC equivalent. | 10 min | Rating shows | Re-take |
| G9 | Paste data safety form | From `audit-walkthrough/app-store-readiness-2026-05-01.md` → "Play Store data safety" section. Each row maps 1:1 to a Play Console question. | 15 min | All sections show "Confirmed" | Re-edit each row |
| G10 | Set up in-app products (subscriptions) | Play Console → Monetization → Subscriptions → Create subscription. Three products from P3, prices from A12. | 20 min | Three subscriptions in "Active" | Deactivate subscription |
| G11 | Upload signed AAB | Build via `npx cap sync android && cd android && ./gradlew bundleRelease`. Upload `android/app/build/outputs/bundle/release/app-release.aab` to Production track (or Internal Test track for safer pre-launch). | 20 min | AAB appears in Production / Internal | Discard release in same screen |
| G12 | Internal track smoke test | Add yourself as an internal tester. Install from the Play Store internal-test link. Run through onboarding, log a drink, open Crisis. | 30 min | All 3 paths work | If broken — DO NOT promote to Production. |
| G13 | Promote internal → production | Play Console → Production → Create new release → Promote from internal. | 2 min | Release appears under Production | Roll back: same screen → Halt rollout |
| G14 | Submit for review | Production → Send for review. Google review is usually faster than Apple (a few hours to a day). | 5 min | Status: "In review" | Halt rollout |
| G15 | (Wait) Google review | Email when approved. | up to 24h passive | Email arrives | If rejected: read rejection in Inbox, fix, resubmit (faster cycle than Apple) |
| G16 | Release rollout (gradual) | Start at 10% rollout for 24h, watch crash dashboard, then 50%, then 100%. Production → "Manage rollout". | 5 min/decision | Each rollout %  takes effect within ~30 min | Halt rollout: same screen → Halt rollout (existing installs unaffected; new installs paused) |

---

## Vercel / web (if shipping a web build alongside native)

| # | Step | Owner action | Time | Verification | Rollback |
|---|---|---|---|---|---|
| V1 | Confirm DNS points to Vercel | Vercel → Project → Domains. Apex + www CNAME. | 2 min | `dig alchohalt.app` resolves to Vercel | Restore prior DNS via registrar |
| V2 | Deploy to Production | Vercel → Project → Deployments → Promote latest preview to Production. Or push to `main`. | 2 min | Production URL serves the new build | Vercel → Promote prior production deployment |
| V3 | Verify legal routes | Open `/legal/terms`, `/legal/privacy`, `/legal/disclaimer` in production. | 2 min | Each page renders content + back-link | Promote prior deployment if any 404 |

---

## Post-launch (first 48 hours)

| # | Step | Owner action | Time | Verification | Rollback |
|---|---|---|---|---|---|
| L1 | Watch Apple App Store reviews | App Store Connect → Reviews. Respond to anything substantive within 24h. | 10 min/day | First review appears | n/a |
| L2 | Watch Play Store reviews | Play Console → Ratings & reviews | 10 min/day | First review appears | n/a |
| L3 | Monitor RevenueCat dashboard | https://app.revenuecat.com → Charts. Check that the first IAP fires correctly. | 5 min/day | At least one transaction recorded if a tester upgrades | If transactions fail: check product ID match (RevenueCat ↔ App Store Connect ↔ Play Console) |
| L4 | Check Sentry / no telemetry — but watch for user reports | The app ships with no error reporting by design. Watch GitHub Issues + reviews for crash reports. | 10 min/day | No crash reports | If a crash pattern appears: ship a hot-fix |
| L5 | Document anything you'd want next launch to be easier | Append to this file under "Lessons" | 15 min | Section appears | n/a |

---

## Lessons (append after launch)

_Empty until first launch._

---

## Files referenced from this checklist

- `package.json` — version bump
- `docs/launch/app-store-description.md` — listing copy
- `docs/launch/LISTING_NOTES.md` — keywords + categories
- `docs/launch/revenuecat-setup.md` — pricing + product IDs
- `audit-walkthrough/app-store-readiness-2026-05-01.md` — privacy disclosures
- `audit-walkthrough/store-screenshots/` — all the screenshots
- `tools/marketing/capture_store_screenshots.ts` — regenerate screenshots
- `public/icons/icon-1024.png`, `public/icons/maskable-512.png`, `public/icons/icon.svg` — app icons
