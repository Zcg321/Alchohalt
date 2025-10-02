# alchohalt

[![Repo Health](https://github.com/Zcg321/Alchohalt/actions/workflows/repo-health.yml/badge.svg)](../../actions/workflows/repo-health.yml)

<!-- Coverage badge - currently at 54.55% with target of 50% for production readiness -->
<img alt="Coverage Gate" src="https://img.shields.io/badge/coverage-54.55%25-success">

Experimental React app wrapped with Capacitor. Data saved as a single versioned Preferences record (`alchohalt.db`) for easier migration.

Currently includes basic drink logging with intention, craving rating, HALT flags, and optional alternative actions, persisted with Capacitor Preferences. It offers minimal Tailwind styling, streak and points stats, goal settings for daily caps and weekly totals, and an installable PWA with Workbox-powered offline caching and proper icons. Optional check-in reminders can be enabled via local notifications. Recent additions include JSON export/import of drink history from the settings panel, per-entry editing and deletion, daily grouping with totals, a clear data option, a weekly consumption chart, and a top-level error boundary to catch unexpected issues.
Stats now surface a 30-day average craving score, HALT trigger counts, and your longest alcohol-free streak.
A color-coded badge in Stats highlights your current AF streak for a quick motivational glance.

A monthly spending tracker compares the last 30 days against a baseline budget and highlights savings in green or overspending in red.

Light or dark appearance can be toggled and is remembered on device. A settings panel also provides reminder controls and a one-click data wipe. Weekly goal progress is visualized with a color-coded bar.

Daily entries now show a compact progress bar against the daily cap and highlight days that exceed it. A simple weekly chart surfaces the last seven days of consumption. A 30-day trend line illustrates longer-term patterns.

Frequent beverages can be saved as presets for one-tap logging, and presets can be edited or removed from the settings panel.

Deleting an entry briefly shows an undo prompt so accidental removals can be reversed.

A floating “Back to top” button appears on long pages for quicker navigation.

The settings panel now includes an About card noting that Alchohalt keeps data on-device, provides no medical advice, and displays the app version.

All data stays on the device. This app offers no medical advice. Offline caching lets the PWA run without a network connection, and 192x192 & 512x512 PNG icons support home-screen installs.

The interface supports English and Spanish via a language toggle in Settings,
and your selection is remembered on-device.

PWA polish adds quick-launch shortcuts, category metadata and iOS-friendly tags; placeholder screenshots help Safari installs feel native.


### Reminders
Enable optional daily check-in reminders from Settings. Times are stored locally and trigger native notifications when supported; otherwise a small in-app banner prompts you to log.

## Scripts
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run verify` - Run typecheck + lint + test in sequence
- `npm run health:scan` - Comprehensive health scan (see [QUICKSTART_HEALTH_SCAN.md](./QUICKSTART_HEALTH_SCAN.md))

## First Device Test - Mobile Builds

### Android
```bash
npm run build:android
```
Builds the Android APK. Output: `android/app/build/outputs/apk/release/`

### iOS
```bash
npm run build:ios
```
Creates an iOS archive. Output: `ios/App/build/App.xcarchive`

### Bundle Size Report
```bash
npm run size:report
```
Analyzes and reports bundle size for web build.

## Spending Dashboard
- Budget vs. actual spend with variance bar
- Estimated alcohol-free savings based on budget/30 per AF day
- Top cost days list and donut chart

## Data Management
- 100% on-device via Capacitor Preferences (`alchohalt.db`)
- Export/Import JSON from Settings
- Wipe all data with double confirm; no network calls

## Data Management (checksummed)
Export creates a JSON with a SHA-256 checksum. Import verifies version + checksum before replacing local DB.

## Repository Health

Run comprehensive health scan:
```bash
npm run health:scan
```

This checks:
- Code quality (linting, type checking)
- Test coverage
- Bundle size & performance
- Security vulnerabilities
- Dead code & dependency health
- Build verification

See [QUICKSTART_HEALTH_SCAN.md](./QUICKSTART_HEALTH_SCAN.md) for quick reference or [HEALTH_SCAN_GUIDE.md](./HEALTH_SCAN_GUIDE.md) for complete documentation.

## Release Checklist
- npm run verify:release
- npm run preview (offline route sweep)
- npm run lh (manual) — target ≥95
- Export → Wipe → Import sanity
- Android/iOS device check for LocalNotifications
- Tag: v1.0.0

## Screenshots

Placeholder screenshots for mobile and desktop can be found under `public/screenshots/`. Replace the placeholder files with actual images when you have them.
