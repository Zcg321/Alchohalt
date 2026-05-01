/**
 * DB → sync-scheduler bridge.
 *
 * Subscribes to the unified-DB store. On every entry mutation
 * (add / edit / delete — observable as a change to entries.length
 * OR _lastLogAt) triggers `scheduleSync('mutation')` IF sync is
 * currently enabled. The 5-second debounce inside the scheduler
 * coalesces rapid logs into a single push.
 *
 * Why a separate module: src/store/db.ts has a "no network calls"
 * DNA invariant (line 2 of the file). scheduleSync() isn't a
 * network call directly — it just queues — but the eventual sync
 * IS, so keeping the wiring out of db.ts honors the boundary.
 *
 * Wiring: call `attachDbBridge()` once at app startup (e.g. inside
 * AlcoholCoachApp's mount effect). Returns a teardown function for
 * symmetry with attachForegroundSync().
 */

import { useDB } from '../../store/db';
import { useSyncStore } from './syncStore';
import { scheduleSync } from './scheduler';

let attached = false;
let unsubscribe: (() => void) | null = null;

export function attachDbBridge(): () => void {
  if (attached) return () => { /* no-op */ };
  attached = true;

  let lastEntriesCount = useDB.getState().db.entries.length;
  let lastLogAt = useDB.getState().db._lastLogAt ?? 0;

  unsubscribe = useDB.subscribe((s) => {
    const entries = s.db.entries;
    const lastLogAtNow = s.db._lastLogAt ?? 0;
    const changed =
      entries.length !== lastEntriesCount || lastLogAtNow !== lastLogAt;
    if (!changed) return;
    lastEntriesCount = entries.length;
    lastLogAt = lastLogAtNow;

    // Only schedule if sync is enabled — no point waking up the
    // queue for a user who opted out.
    if (useSyncStore.getState().phase !== 'enabled') return;
    scheduleSync('mutation');
  });

  return () => {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    attached = false;
  };
}

/** Test-only escape hatch — drops the subscription and the
 *  attached flag so a fresh attachDbBridge() in a later test sees
 *  the world the same way as a cold start. */
export function __resetDbBridgeForTests(): void {
  if (unsubscribe) unsubscribe();
  unsubscribe = null;
  attached = false;
}
