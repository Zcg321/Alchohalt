# alchohalt

Experimental React app wrapped with Capacitor.

Currently includes basic drink logging with intention, craving rating, HALT flags, and optional alternative actions, persisted with Capacitor Preferences. It offers minimal Tailwind styling, streak and points stats, goal settings for daily caps and weekly totals, and a basic PWA setup with service worker and manifest. Optional check-in reminders can be enabled via local notifications. Recent additions include a 14-day consumption chart powered by Recharts, simple JSON export/import of drink history, and a top-level error boundary to catch unexpected issues.

A monthly spending tracker compares the last 30 days against a baseline budget and shows savings when under the target.

Light or dark appearance can be toggled and is remembered on device.

All data stays on the device. This app offers no medical advice.

## Scripts
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
