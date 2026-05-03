/**
 * [R20-2] Background-sync registrar.
 *
 * When the cloud-sync scheduler defers a sync because the browser is
 * offline, we ALSO register a Background Sync tag with the SW. The
 * browser fires `sync` events when network returns — even if the user
 * has closed every tab. The SW (sw-custom.js) responds by messaging
 * any visible client to retry; the main thread listens for those
 * messages and re-enters scheduleSync('foreground').
 *
 * Browser support:
 *   - Background Sync: Chrome 49+, Edge 79+, Opera 36+. Not Safari /
 *     Firefox / iOS WebKit.
 *   - When unsupported, registerCloudSyncRetry() is a no-op success;
 *     the existing online-listener-on-the-main-thread path covers
 *     unsupported browsers (only fires while the app is open).
 *
 * Tag: 'alch-sync-cloud' — must match the tag in public/sw-custom.js.
 *
 * Threat model: a malicious SW could in principle spoof the
 * 'alch-retry-sync' message. We mitigate by checking event.source
 * is the active SW registration, not just any worker.
 */

interface SyncRegistration {
  register(tag: string): Promise<void>;
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync?: SyncRegistration;
}

/**
 * Register the cloud-sync retry tag with the SW. Browsers that
 * support Background Sync will fire a sync event when network
 * returns. Browsers that don't (Safari, Firefox) silently no-op.
 */
export async function registerCloudSyncRetry(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  try {
    const reg = (await navigator.serviceWorker.ready) as ServiceWorkerRegistrationWithSync;
    if (!reg.sync) return false;
    await reg.sync.register('alch-sync-cloud');
    return true;
  } catch {
    return false;
  }
}

type RetryHandler = () => void;

let mainThreadHandler: RetryHandler | null = null;
let messageListenerAttached = false;

/**
 * Subscribe the main thread to SW retry messages. When the SW posts
 * 'alch-retry-sync' (after a sync event fires), the registered handler
 * runs. Only one handler at a time — calling this again replaces the
 * previous handler.
 *
 * Returns a detach function for cleanup.
 */
export function onCloudSyncRetry(handler: RetryHandler): () => void {
  mainThreadHandler = handler;

  if (
    !messageListenerAttached &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator
  ) {
    navigator.serviceWorker.addEventListener('message', (e) => {
      const data = e.data as { type?: string; source?: string } | undefined;
      if (!data || data.type !== 'alch-retry-sync') return;
      /* Defense-in-depth: the source field is set by sw-custom.js
       * to 'sw-bg-sync'. A page-level postMessage would not carry
       * it. */
      if (data.source !== 'sw-bg-sync') return;
      mainThreadHandler?.();
    });
    messageListenerAttached = true;
  }

  return () => {
    if (mainThreadHandler === handler) mainThreadHandler = null;
  };
}

/** Test escape hatch — clear the singleton handler + listener flag. */
export function __resetBackgroundSyncForTests(): void {
  mainThreadHandler = null;
  messageListenerAttached = false;
}
