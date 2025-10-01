# Deep Codebase Review for Alchohalt

## Project Overview

Alchohalt is a cross-platform React/TypeScript app (using Vite) wrapped with Capacitor for native Android/iOS deployment. All user data (drink logs, cravings, HALT flags, etc.) is stored locally via Capacitor Preferences in a single JSON ("alchohalt.db"), with no server or cloud backend.

The app functions as an offline-first PWA (Progressive Web App) with Workbox caching for offline use, and supports installation to home screen.

## Key Features

- Drink logging with mood/context ("HALT") tags
- Craving ratings
- Goal tracking (daily/weekly limits)
- Streak tracking
- Spending estimates
- Optional daily reminder notifications
- Basic stats and charts
- Multi-language UI (English/Spanish)

## Technical Implementation

- Top-level error boundary implemented to catch runtime errors
- UI supports light/dark themes
- PWA niceties like home-screen icons and shortcuts

## Review Status

Despite a solid foundation, a number of tasks should be completed before installing the app on a phone for the first test, to tighten the codebase and prepare for a robust v1.0 release. Below is a comprehensive breakdown of required and recommended improvements:

## 🔧 Features & UI

- [ ] Hide or clearly label unfinished Premium/Subscriptions UI (no payment system yet — mark as "Coming soon" or hide).
- [ ] Disable/remove premium export (PDF/CSV) options until they're implemented.
- [ ] Remove or relabel multi-device sync mentions (not available yet).
- [ ] Replace placeholder screenshots/icons with real ones.
- [ ] Update Privacy Policy & Terms (correct contact emails, finalize text).
- [ ] Complete missing Spanish translations (ensure no mixed-language UI).

## ✅ Code Quality & Stability

- [ ] Run and fix issues from:
  - [ ] `npm run lint` (ESLint)
  - [ ] `npm run typecheck` (TypeScript)
  - [ ] `npm test` (ensure all tests pass)
- [ ] Increase test coverage (aim >70% over time).
- [ ] Run `npm run deadcode` — delete or refactor unused code.
- [ ] Run `npm run deps:check` — remove unused or add missing dependencies.
- [ ] Run `npm audit` — fix vulnerabilities.
- [ ] Check and update packages (`npm outdated`).

## 🔒 Security & Privacy

- [ ] Confirm no hardcoded secrets/API keys.
- [ ] Run full release checklist (`npm run release:checklist`).
- [ ] Add Android 13+ POST_NOTIFICATIONS permission to AndroidManifest.xml.
- [ ] Verify no unnecessary permissions on Android/iOS.

## 📱 Platform Build & Device Testing

- [ ] Build Android APK (`npm run build:android`) and iOS app (`npm run build:ios`) — confirm they run on devices.
- [ ] Test local notifications on both platforms.
- [ ] Test data export/import JSON (backup, wipe, restore).
- [ ] Test offline mode & PWA install.
- [ ] Test multi-language switch (English ↔ Spanish).
- [ ] Check for console errors or crashes on device.

## 🛠 CI/CD & Release Prep

- [ ] Add GitHub Actions CI to run lint/tests/build automatically.
- [ ] Set up version tagging (e.g., v1.0.0 for first release).
- [ ] Prepare App Store assets:
  - [ ] Real icons & screenshots
  - [ ] Description/keywords
  - [ ] Privacy policy URL
  - [ ] Support contact info
- [ ] Verify age rating & disclaimers for alcohol content.
- [ ] Plan distribution: Android APK sideload / Play Store / TestFlight / App Store.
