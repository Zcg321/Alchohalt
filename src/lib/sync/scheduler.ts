/**
 * Sync scheduler.
 *
 * Single-process queue for cloud-sync runs. Three triggers fan in
 * here; the scheduler debounces them, coalesces rapid duplicates,
 * and serializes execution so two syncs never race.
 *
 *   reason       debounce
 *   ──────────   ────────
 *   foreground   30 s    — app came back from background; the user
 *                          is probably about to look at trends, so
 *                          a refresh is warranted but not urgent.
 *   mutation     5 s     — drink-log mutation just landed. Recovery
 *                          context: the user is making decisions
 *                          they shouldn't lose to a long debounce,
 *                          but rapid rapid logs (e.g. correcting an
 *                          entry) coalesce into one push.
 *   manual       0 s     — user tapped "Sync now". Bypass the
 *                          debounce; always fire immediately.
 *
 * In-flight serialization
 * ───────────────────────
 * If a run is already executing when scheduleSync() is called, we
 * mark `retriggerAfter = true` and let the current run complete.
 * The retrigger fires immediately on completion (no further
 * debounce — the debounce already paid for the queue position).
 *
 * Override priority
 * ─────────────────
 * If a SHORTER debounce arrives while a longer one is waiting, we
 * cancel the longer timer and use the shorter one (manual cancels
 * mutation cancels foreground). This means a "Sync now" tap during
 * a queued foreground sync wins immediately.
 *
 * Failure handling
 * ────────────────
 * A throw from the runner is caught, logged into the sync activity
 * via useSyncStore.recordSync('error', ...), and the next trigger is
 * NOT blocked — the scheduler stays armed. A run that times out the
 * runtime tab (browser close) is just dropped; the next trigger picks
 * up on next session.
 *
 * Testing
 * ───────
 * setSyncRunner() lets tests inject a mock runner without touching
 * production wiring. __resetSchedulerForTests() returns the module
 * to a clean state between specs.
 */

import { useSyncStore } from './syncStore';

export type SyncReason = 'foreground' | 'mutation' | 'manual';

export const DEBOUNCE_MS: Record<SyncReason, number> = {
  foreground: 30_000,
  mutation: 5_000,
  manual: 0,
};

type Runner = () => Promise<void>;

interface SchedulerState {
  timer: ReturnType<typeof setTimeout> | null;
  inFlight: boolean;
  retriggerAfter: boolean;
  scheduledReason: SyncReason | null;
  runner: Runner;
}

async function defaultRunner(): Promise<void> {
  // The production runner will be a closure over the active
  // SyncTransport + the user's session — wired during enable. Until
  // it's set, the default just records a "noop" success so the UI
  // surfaces "you tapped a button". Tests should always inject
  // their own runner via setSyncRunner.
  useSyncStore.getState().recordSync('success', 'noop');
}

const state: SchedulerState = {
  timer: null,
  inFlight: false,
  retriggerAfter: false,
  scheduledReason: null,
  runner: defaultRunner,
};

export function setSyncRunner(fn: Runner): void {
  state.runner = fn;
}

export function scheduleSync(reason: SyncReason): void {
  const debounce = DEBOUNCE_MS[reason];

  // If a run is already in flight, don't kick off a parallel one —
  // queue an immediate retrigger after it completes.
  if (state.inFlight) {
    state.retriggerAfter = true;
    return;
  }

  // Compare against the existing timer's debounce. A shorter (more
  // urgent) reason cancels the existing timer; an equal-or-longer
  // one defers to it.
  if (state.timer && state.scheduledReason !== null) {
    if (debounce < DEBOUNCE_MS[state.scheduledReason]) {
      clearTimeout(state.timer);
      state.timer = null;
    } else {
      return; // existing timer wins
    }
  }

  state.scheduledReason = reason;
  if (debounce === 0) {
    // Manual — fire on the microtask boundary so tests can `await`
    // without immediate sync inside the same tick.
    void Promise.resolve().then(executeSync);
  } else {
    state.timer = setTimeout(() => {
      void executeSync();
    }, debounce);
  }
}

async function executeSync(): Promise<void> {
  state.timer = null;
  state.scheduledReason = null;
  state.inFlight = true;
  try {
    await state.runner();
  } catch (err) {
    useSyncStore.getState().recordSync('error', (err as Error).message);
  } finally {
    state.inFlight = false;
    if (state.retriggerAfter) {
      state.retriggerAfter = false;
      void Promise.resolve().then(executeSync);
    }
  }
}

/** Test escape hatch — drop any pending timer + reset internal state. */
export function __resetSchedulerForTests(): void {
  if (state.timer) clearTimeout(state.timer);
  state.timer = null;
  state.inFlight = false;
  state.retriggerAfter = false;
  state.scheduledReason = null;
  state.runner = defaultRunner;
}

/** Test introspection — exposes scheduler internals so tests can
 *  assert "is a debounce armed" / "did the runner queue another
 *  invocation". Not for production code. */
export function __schedulerSnapshot(): {
  hasTimer: boolean;
  inFlight: boolean;
  retriggerAfter: boolean;
  scheduledReason: SyncReason | null;
} {
  return {
    hasTimer: state.timer !== null,
    inFlight: state.inFlight,
    retriggerAfter: state.retriggerAfter,
    scheduledReason: state.scheduledReason,
  };
}

// ───── browser foreground wiring ─────
//
// The app uses `visibilitychange` instead of @capacitor/app
// (not installed). Capacitor's WebView fires visibilitychange on
// foreground/background transitions, so behavior matches the native
// listener for our purposes. Web users get the same trigger when a
// tab returns to focus.

let foregroundListenerAttached = false;

export function attachForegroundSync(): () => void {
  if (foregroundListenerAttached) return () => { /* no-op */ };
  if (typeof document === 'undefined') return () => { /* no-op */ };

  const handler = () => {
    if (document.visibilityState === 'visible') {
      // Only fire if sync is actually enabled — no point waking up
      // the scheduler for a user who opted out.
      const enabled = useSyncStore.getState().phase === 'enabled';
      if (enabled) scheduleSync('foreground');
    }
  };
  document.addEventListener('visibilitychange', handler);
  foregroundListenerAttached = true;
  return () => {
    document.removeEventListener('visibilitychange', handler);
    foregroundListenerAttached = false;
  };
}
