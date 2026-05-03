# Round 19 — battery-impact audit

**Author:** Cowork Sprint
**Date:** 2026-05-03
**Scope:** Verify Alchohalt does not poll, animate, or schedule
notifications in ways that drain battery on older phones.

## Methodology

Three categories audited:

1. **Polling** — `setInterval`, repeating `setTimeout`, watch-style
   subscriptions that fire on a clock rather than an event.
2. **Animation loops** — `requestAnimationFrame` chains.
3. **Notification scheduling** — anything that wakes the OS or the
   browser to fire per-time-period work.

For each, the audit checks: is it bounded? Does it pause when the
tab is hidden / app is backgrounded? Is the cost proportional to the
user-visible work?

## Inventory

### `setInterval`

`grep -rE "setInterval" src --include="*.ts" --include="*.tsx"`:

| Site | Pattern | Bounded? | Background-aware? | Verdict |
|---|---|---|---|---|
| `src/features/crisis/HardTimePanel.tsx:79` (BreathingTimer) | 1Hz tick during 60s breathing exercise | ✅ Auto-stops at 60s | ✅ **Fixed in R19-2.** Now pauses when `document.hidden === true`; resumes from current `elapsed` on visibility-visible. | Pass |

That's it. One `setInterval` in the entire codebase, bounded to 60 ticks max.

### `setTimeout` (repeating or long-lived)

`grep -rE "setTimeout\(" src --include="*.ts" --include="*.tsx"`:

| Site | Pattern | Verdict |
|---|---|---|
| `useDrinkActions` | One-shot 1500ms toast clear | Pass |
| `useDrinkActions` | One-shot 5s undo window | Pass |
| `Toast.tsx` | One-shot 300ms animation cleanup (×2) | Pass |
| `TodayHome.tsx` | One-shot 1500ms idle-callback fallback | Pass |
| `IAPProvider.ts` | One-shot 300ms simulated IAP delay (test fixture) | Pass |
| `useMoodTracker.ts` | One-shot 1000ms post-mood insights show | Pass |
| `OnboardingFlow.tsx` | One-shot 500ms chip-show delay | Pass |
| `AppLock.tsx` | One-shot 100ms commit after 4 digits | Pass |
| `ClearData.tsx` | One-shot 3000ms status clear | Pass |
| `TrustReceipt.tsx` | One-shot 30s URL.revokeObjectURL cleanup | Pass |
| `SharingPanel.tsx` | One-shot 2000ms copy-state reset | Pass |
| `main.tsx` | One-shot 5000ms hard-cap on hydration handshake | Pass |

All one-shot. None re-arm. None retain references that prevent GC.
Total max in-flight pending timers across the app: ≤12.

### `requestAnimationFrame`

`grep -rE "requestAnimationFrame" src --include="*.ts" --include="*.tsx"`:

| Site | Pattern | Verdict |
|---|---|---|
| `main.tsx:75-77` | Nested rAF×2 to detect first-paint, then sets `painted = true`. Does NOT loop — fires twice and stops. | Pass |
| `TabShell.tsx:147` | Single rAF after keyboard tab change to focus the new tab button. Fires once per keystroke, not in a loop. | Pass |

No rAF loops in the codebase. No rAF-driven animations. All
animations use CSS transitions (`@keyframes` and `transition` class
utilities), which the browser pauses automatically when offscreen.

### Notifications

`@capacitor/local-notifications` is the scheduling primitive. The OS
holds the schedule; Alchohalt does not poll or wake to check times.
Web fallback uses `Notification.requestPermission()` once at startup
and lets the OS deliver. No web `setInterval` for notification timing.

**Per type, max scheduled notifications:**

| Type | ID range | Cap |
|---|---|---|
| Daily check-in | 1000-1099 | 100 (slice in `buildDailyCheckinSchedule`) |
| Goal milestone | 1100-1199 | (built per-event, not on interval) |
| Retrospective | 1200-1299 | (built per-event) |
| Backup verification | 1300-1399 | (built per-event) |

Cap of 100 daily-checkin entries means the worst case is the OS
holds ~100 scheduled fires. Each fire wakes the device once — same
shape as any reminder app (Calendar, Reminders, etc.).

### Subscriptions / event listeners

| Site | Trigger | Verdict |
|---|---|---|
| `installReminderSync()` | Zustand store change on `db.settings.reminders` | Event-driven, not polling |
| `attachForegroundSync()` | `visibilitychange` | Event-driven |
| `attachOnlineSync()` (R19-1) | `online` | Event-driven |
| `attachDbBridge()` | Zustand store change on `db.entries` | Event-driven |
| `usePWA` | `online`, `offline`, `beforeinstallprompt`, `appinstalled`, `serviceWorker.message` | All event-driven, no timer |
| `useMilestoneHaptics` | `visibilitychange` re-evaluates milestone state | Event-driven; computation is O(n) over `db.entries` |
| `useDeepLinkRouting` | `popstate` | Event-driven |
| `OnboardingFlow` | `keydown` for Esc | Event-driven |
| `TabShell` | `popstate` | Event-driven |

Zero `setInterval`-based polling. Zero "subscribe + setTimeout(check, ms)"
anti-patterns. Everything driven by browser events.

### Service Worker / PWA

`src/features/pwa/registerSW.ts` registers the SW once at startup
and subscribes to update events. The SW itself runs only on fetch
events (no `setInterval` in `sw.ts` either) and on `push` events
(none registered today; future-reserved).

## Findings

### R19-2 fix shipped: BreathingTimer pauses on background

`src/features/crisis/HardTimePanel.tsx:69-95`. Pre-fix: a user
who started the breathing timer and then locked their phone or
switched apps would have the timer keep ticking in the background
(throttled by browser to 1Hz on mobile, but still ticking). On
return, the timer might be near or past the 60s mark.

Post-fix: a `pageHidden` state tracks `document.hidden`; the
1Hz interval only runs when `running && !pageHidden`. When the
user returns, the interval re-arms from the current `elapsed`
value, so the breath cycle is preserved.

CPU impact is small — mobile browsers throttle background
`setInterval` to 1Hz already — but the UX win is real: a 5-minute
background return shouldn't resume from "55 seconds elapsed".

Test added in `src/features/crisis/__tests__/HardTimePanel.test.tsx`:
verifies the visibility-pause path doesn't crash and preserves the
running state.

### Non-findings (verified clean)

- **No requestIdleCallback usage** that could chain forever.
- **No animation rAF loops** — all visual motion is CSS.
- **No background sync polling** — the scheduler is debounce-only,
  fires on event triggers (visibility, mutation, manual, online).
- **No analytics polling** — the analytics shim is event-driven.
- **No socket / EventSource / WebSocket** anywhere in the codebase.
- **No keep-alive heartbeat** to the sync transport — Supabase
  client handles its own connection pooling.
- **No location-watching** (`navigator.geolocation.watchPosition`) —
  the app never reads location.
- **No sensor-watching** — no `DeviceMotionEvent`,
  `DeviceOrientationEvent`, `Battery API` polling.
- **No permanent observers** — no `MutationObserver`,
  `IntersectionObserver`, or `ResizeObserver` in production code.
  The chart component uses `react-chartjs-2` which manages its own
  resize listener; that's bounded to chart-mount lifetime.

## Older-device profile

The audit's premise: a 4-year-old Android budget phone (Snapdragon
4xx, 3GB RAM, Android 12) should not perceive Alchohalt as a
battery hog. Findings:

- **At rest** (app open, idle): zero polling, zero timers running,
  zero rAF loops. Standby battery cost is whatever React's idle
  reconciliation costs — minimal.
- **Logging a drink**: writes to local store, fires
  `scheduleSync('mutation')`. The 5-second debounce + offline-defer
  mean a rapid 10-drink correction session produces one sync, not
  ten. The sync itself is one HTTP POST.
- **Foregrounding the app**: fires `scheduleSync('foreground')`
  with 30s debounce. One sync per visibility-visible cycle, capped
  at one every 30s by the timer.
- **Background**: nothing runs. The OS notification scheduler
  fires at the user's reminder times (default: 0-2 per day).

## v1.1 follow-ups (not blocking)

- **Service Worker background sync.** Today, a logged drink
  while offline waits for the next foregrounding to sync. The
  `Background Sync API` would let the SW push when connectivity
  returns even with the app backgrounded. Trade-off: the SW
  background-sync registration counts as "shall not run a background
  service" on iOS — only Android benefits today.
- **Battery API hint.** `navigator.getBattery()` could let the app
  proactively defer non-urgent syncs when battery is low. Trade-off:
  the Battery API is being deprecated for fingerprinting reasons;
  privacy-first means we shouldn't read it anyway.
- **Idle-yield for chart computation.** Insights tiles compute O(n)
  scans over `db.entries`. For 10K+ entries this becomes a 50-100ms
  blocking compute on render. Already on R19-3's storage-limits
  follow-up — once we cap entries at say 100K, we can audit
  insights-tile compute cost in the same pass.
