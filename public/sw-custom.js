/* [R20-2] Background-sync event handler imported by the Workbox SW.
 *
 * Imported via vite.config.ts → VitePWA → workbox.importScripts. Runs
 * inside the Workbox-generated service worker context (self === SW
 * registration).
 *
 * Tag contract: 'alch-sync-cloud' is registered by the main thread
 * when an offline-deferred cloud sync is queued. The browser fires
 * `sync` when network returns — even if the user has closed every
 * tab — and we use that event to message any visible clients
 * ("retry-sync") OR, if no clients exist, no-op gracefully (the
 * registration stays armed for next time the app opens).
 *
 * Why message-passing instead of running the sync inline:
 *   The cloud-sync transport needs the user's master key + auth
 *   tokens, which live in main-thread IndexedDB scoped to the
 *   client. Running the full sync inside the SW context is a
 *   bigger lift (IDB shape mirroring + key materialization in the
 *   SW). For R20-2 we ship the wake-up mechanism; the inline-sync
 *   follow-up can land later.
 *
 * Intentional non-features:
 *   - No retry/backoff loop. The browser handles retry per the
 *     sync API spec (exponential, capped at ~5 attempts over a
 *     few hours). If all attempts fail, the registration drops
 *     silently. The next user-visible sync trigger (foreground,
 *     mutation, manual) will re-arm it.
 *   - No periodic-background-sync. That's a separate API with
 *     its own permission gate; not in R20-2 scope.
 */

self.addEventListener('sync', (event) => {
  if (event.tag !== 'alch-sync-cloud') return;
  event.waitUntil(handleCloudSync());
});

async function handleCloudSync() {
  /* Attempt to wake any visible client. If there is one, ask it to
   * retry — it has the master key + transport. If there isn't, we
   * succeed-silently and let the user trigger sync on next open. */
  const clientList = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
  for (const client of clientList) {
    client.postMessage({ type: 'alch-retry-sync', source: 'sw-bg-sync' });
  }
  /* Resolve regardless of client count — if zero clients exist, we
   * have nothing to do RIGHT NOW, but the registration stays armed
   * for the next online edge. */
}
