# alchohalt

Experimental React app wrapped with Capacitor.

Currently includes basic drink logging with intention, craving rating, HALT flags, and optional alternative actions, persisted with Capacitor Preferences. It offers minimal Tailwind styling, streak and points stats, goal settings for daily caps and weekly totals, and a basic PWA setup with service worker and manifest. Optional check-in reminders can be enabled via local notifications. Recent additions include a 14-day consumption chart powered by Recharts, simple JSON export/import of drink history, and a top-level error boundary to catch unexpected issues.
A tabbed interface groups logging, goals, stats, reminders, charts, data export, and history for easy navigation.

A monthly spending tracker compares the last 30 days against a baseline budget and shows savings when under the target.

Light or dark appearance can be toggled and is remembered on device.

All data stays on the device. This app offers no medical advice.

## Privacy & safety
- Data is stored on-device via Capacitor Preferences.
- The app works fully offline and makes no network requests.
- Use for personal tracking only; it is not medical advice.

## Scripts
- `npm ci` (to install pinned dependencies)
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build` 
- `npm run build:apk` (requires Android SDK and `KEYSTORE_PATH`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` env vars)

## Contributing
- Avoid committing binary assets; icons are SVG and `.gitignore` excludes images and other large files.
