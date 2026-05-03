# Round 19 — offline-mode robustness audit

**Author:** Cowork Sprint
**Date:** 2026-05-03
**Scope:** Walk every async path in the app and confirm graceful
behavior when the user is offline for an hour, a day, or a week.

## Premise

Alchohalt is privacy-first by design — most paths are local-only.
The premise is that being offline should be a non-event for the
core flow:

- log a drink
- view today / week / month
- compute insights
- view milestones
- get to crisis resources
- export data
- read settings

Cloud sync is the only path that needs the network. AI insights are a
network path too but they're feature-flag-gated off in v1, so they
already return `network-disabled` instead of attempting fetch.

The audit walks every `fetch(`, `XMLHttpRequest`, and
`navigator.onLine` site in `src/` to verify the premise holds.

## Inventory of network paths

`grep -rE "fetch\(|navigator\.onLine|axios\.|XMLHttpRequest" src --include="*.ts" --include="*.tsx" -l`:

| Path | Network purpose | Offline behavior (pre-R19) | Offline behavior (post-R19) |
|---|---|---|---|
| `src/lib/sync/transport.ts` (Supabase) | Cloud-sync push/pull | Throws on `fetch` failure → caught by `executeSync()` → recordSync('error') → next trigger blocked nothing but produced noise | Same in-flight error handling, but **deferred at scheduler** when `navigator.onLine === false`. Deferral re-fires on `online` event. |
| `src/lib/ai/client.ts` | AI insights proxy | Returns `{ ok: false, reason: 'proxy-error' }`. UI tile shows error state. | **Unchanged.** Already graceful. UI tile renders the error reason. The fetch is only attempted when both consent + feature flag are on; v1 feature flag is off. |
| `src/hooks/usePWA.ts` | Listen for online/offline events to surface UI state | `isOnline` state already updates. Used by callers to decorate UI but no automatic retry. | **Unchanged here.** The R19-1 retry logic lives in the scheduler. |
| `src/features/crisis/CrisisResources.tsx` | Static `tel:` and `sms:` links | Native dialer/messaging — no network involved. | Unchanged; not a network path. |
| `src/features/homepage/TodayHome.tsx` | None | False positive — string match on the word "fetch" in comments. | n/a |
| `src/lib/trust/__tests__/receipt.test.ts` | None | Test file. | n/a |
| `src/__tests__/honesty-claims.test.ts` | None — guards "no fetch" claim | This test ASSERTS no production module imports fetch outside the audited list. | Updated lexicon — see R19-5 audit. |
| `src/__tests__/privacy-invariants.test.ts` | None | Same. | Same. |

**Conclusion:** the only async-network path that needed work was the
sync scheduler. AI insights already had the right shape; PWA hook
already exposed the connection-state signal.

## Local-only paths (verified offline-safe)

Walked these explicitly to confirm they have no network dependency:

- **Drink-log mutation** — `src/store/db.ts` writes to Capacitor
  Preferences (web: localStorage, native: SQLite-backed). Mutation
  fires `scheduleSync('mutation')` via `dbBridge` (per
  `src/lib/sync/dbBridge.ts`), which now defers when offline. The
  underlying drink-log itself completes regardless.
- **Today / week / month computation** — `src/lib/calc.ts`, all
  pure functions over the in-memory state.
- **Insights** — `src/features/insights/` tiles all consume the
  in-memory drinks list. No network.
- **Milestones** — `src/features/milestones/Milestones.ts` is pure
  computation over the drinks-by-day map.
- **Crisis resources** — `src/features/crisis/` data is bundled
  static JSON. The page renders fully offline.
- **Export / import** — `src/features/exportImport/` reads/writes
  the local store, hands JSON to file-download or file-upload native
  APIs. No network.
- **Settings** — `src/features/settings/` writes are local. Toggles
  for sync / AI insights affect future network attempts but the
  setting changes themselves are local.
- **Onboarding** — fully local. No analytics POST.
- **Voice input** — `src/features/voice/VoiceInput.tsx` uses the
  browser SpeechRecognition API, which can be local or
  cloud-augmented depending on browser. The transcript is never
  POSTed by Alchohalt.
- **Reminders / notifications** — `@capacitor/local-notifications`
  schedules locally. No network call.
- **Backup verifier** — reads a backup file off the device,
  validates structure. No network.

## Round-19 fix: scheduler offline awareness

**File:** `src/lib/sync/scheduler.ts`

Added:
1. `isBrowserOnline()` helper — checks `navigator.onLine`, fails open
   when navigator is unavailable (test environments).
2. Offline branch in `scheduleSync()` — when offline, the trigger is
   recorded as a deferred reason and a sync-error activity entry is
   logged with detail `"offline; deferred (<reason>)"` so the user
   sees in the audit log that we held the request rather than
   silently dropping it.
3. **Reason upgrade**: if multiple triggers arrive while offline, the
   most-urgent one (lowest debounce) wins. `manual` deferred from a
   tap during offline still bypasses the foreground/mutation debounce
   when connectivity returns.
4. `attachOnlineSync()` — listens for `window.online` event, replays
   the deferred reason via `scheduleSync()` if sync is enabled.
   Idempotent: a second call returns a no-op detach.
5. Wired into `useAppEffects.useSyncBridges()` alongside the existing
   `attachForegroundSync()` so every app start gets both behaviors.

**Test coverage:** 9 new tests in
`src/lib/sync/__tests__/scheduler-offline.test.ts`:
- defers when offline (no runner fire, no timer armed)
- records sync-error activity entry with detail
- upgrades deferred reason for more-urgent trigger
- does NOT downgrade for slower trigger
- replays deferred sync on `online` event when sync enabled
- does NOT replay when sync disabled
- online with no deferral is a no-op
- attachOnlineSync is idempotent
- manual deferred still bypasses debounce after online

## Hour / day / week test scenarios

| Scenario | Behavior |
|---|---|
| Offline for an hour, log 3 drinks | All 3 logs persist locally. Each fires `scheduleSync('mutation')` → all coalesce into one deferred mutation. |
| Offline for a day, log 50 drinks | Same — coalesces to one deferred mutation. Activity log shows N "offline; deferred" entries (not noisy because the upgrade-only path means we only log when the deferral upgrades). |
| Offline for a week | Identical. The deferred reason persists in scheduler state for the lifetime of the JS process. (If the user closes the tab, we lose the deferral but the next foreground-trigger on next app open will re-arm.) |
| Offline → online during in-flight sync | The in-flight sync completes (or errors); the new `online` event finds no deferral, so no extra fire. The next mutation will trigger normally. |
| Offline + user taps "Sync now" | Deferred as `manual` (the strongest reason). When `online` fires, `manual` re-enters scheduleSync, which fires immediately on the microtask boundary — no foreground/mutation wait. |

## Honesty entry (would be filed for R19-5)

R19-5's security researcher will audit our offline claims. Preview:
- **Promise:** "your data stays on your device unless you explicitly
  enable Cloud Sync"
- **Verification:** zero `fetch(` calls outside `src/lib/ai/client.ts`
  (gated by feature flag) and `src/lib/sync/transport.ts` (gated by
  user enabling Cloud Sync). Confirmed by `honesty-claims.test.ts`.

## v1.1 follow-ups (not blocking)

- **Persist deferred reason across tab close.** Today the deferral
  lives in JS-process memory. If the user closes the tab while
  offline, the deferred reason is lost (the next foreground sync
  picks up via the existing visibility-change handler so it isn't a
  data-loss bug, just a small efficiency loss). Persisting the
  deferred reason to Preferences would close the gap.
- **Visible offline indicator.** Today the user sees the deferral as
  a sync-activity entry only if they open Settings → Sync. A subtle
  AppHeader badge would tell them at-a-glance that sync is paused.
  Tradeoff: any UI affordance risks promoting offline-as-a-feature
  in a way that contradicts "offline is default; sync is the
  exception." Defer to product call.
- **Connection-quality detection.** `navigator.onLine` returns true
  whenever the OS thinks there's a network, even if the network is
  captive-portal-trapped (airport wifi). A short HEAD request to a
  known endpoint would catch this. Defer; small audience.
