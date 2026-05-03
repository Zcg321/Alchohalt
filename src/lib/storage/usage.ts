/**
 * [R19-3] Storage usage estimation.
 *
 * Wraps two complementary signals:
 *
 *   1. Browser quota — `navigator.storage.estimate()` returns the
 *      OS-allocated quota for this origin and the current usage
 *      across IndexedDB / localStorage / Cache Storage. Roughly
 *      reflects how close we are to the OS evicting our data.
 *
 *   2. App-domain size — the size of `db.entries` and related
 *      structures, serialized to JSON. This is the cost the app
 *      itself contributes; the OS estimate may include bundles,
 *      caches, and other origin data we don't own.
 *
 * Why both: a user on a low-quota Safari install (often as small as
 * 50MB for non-PWA web origins) might be near the OS limit even with
 * a small entries count. A user on Chrome (typically GB-scale quota)
 * with 100K+ entries will hit our soft warning long before the OS
 * is pressured.
 *
 * The 80% soft warning fires on whichever signal trips first.
 *
 * Privacy: this code reads its own data via `JSON.stringify` and
 * the public `navigator.storage` API. No PII leaves the device. The
 * estimate is computed on-demand (no polling).
 */

export interface StorageUsage {
  /** Bytes used by THIS origin per browser estimate. Null when the
   *  Storage API is unavailable (older Safari, some Capacitor envs). */
  browserUsedBytes: number | null;
  /** Quota the browser will allow this origin to use. Null when
   *  unavailable. */
  browserQuotaBytes: number | null;
  /** Bytes consumed by app-domain state once JSON-serialized. */
  appUsedBytes: number;
  /**
   * App-domain "soft cap" beyond which we recommend the user export
   * + clear. Chosen at 50 MB to leave headroom in the typical Safari
   * 50-100 MB quota; on Chrome / Capacitor SQLite the cap is generous
   * but the same value keeps the UX uniform.
   */
  appSoftCapBytes: number;
  /** % of browser quota in use. Null when browser estimate unavailable. */
  browserPercentUsed: number | null;
  /** % of the app-domain soft cap in use. Always defined. */
  appPercentUsed: number;
  /** Highest of the two percentages — the one that drives the warning. */
  effectivePercentUsed: number;
  /** True when the effective percent is >= 80%. */
  warn: boolean;
  /** Approximate count of entries contributing to appUsedBytes. */
  entryCount: number;
}

const APP_SOFT_CAP_BYTES = 50 * 1024 * 1024;

interface Sizable {
  entries?: unknown[];
  goals?: unknown;
  settings?: unknown;
  presets?: unknown[];
  tags?: unknown;
}

/**
 * Compute the JSON-serialized byte size of the app's persisted state.
 * Uses TextEncoder for accurate UTF-8 byte counting (`.length` would
 * undercount any non-ASCII string — Spanish accents, French
 * diacritics, Cyrillic, etc.).
 */
export function computeAppUsedBytes(state: Sizable): { bytes: number; entryCount: number } {
  const entries = Array.isArray(state.entries) ? state.entries : [];
  // Stringify a slice of the state we actually persist. We don't try
  // to be exhaustive — the four fields below cover ~99% of the
  // payload by mass, so the estimate is conservatively high enough
  // to drive the warning UI.
  const payload = JSON.stringify({
    entries,
    goals: state.goals,
    settings: state.settings,
    presets: state.presets,
    tags: state.tags,
  });
  const bytes = new TextEncoder().encode(payload).byteLength;
  return { bytes, entryCount: entries.length };
}

/**
 * Read the browser's storage estimate. Returns nulls when the API is
 * unavailable; never throws (a thrown exception in a diagnostics
 * panel is worse than an "unknown" indicator).
 */
export async function readBrowserStorage(): Promise<{
  usedBytes: number | null;
  quotaBytes: number | null;
}> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.storage ||
    typeof navigator.storage.estimate !== 'function'
  ) {
    return { usedBytes: null, quotaBytes: null };
  }
  try {
    const est = await navigator.storage.estimate();
    return {
      usedBytes: typeof est.usage === 'number' ? est.usage : null,
      quotaBytes: typeof est.quota === 'number' ? est.quota : null,
    };
  } catch {
    return { usedBytes: null, quotaBytes: null };
  }
}

/**
 * Compute the combined StorageUsage snapshot. Async because the
 * browser estimate is a Promise; the app-side compute is synchronous.
 *
 * The `warn` flag fires when EITHER signal exceeds 80%. Browser quota
 * is the harder limit (hits eviction); app-soft-cap is the gentler
 * one (encourages export-and-clear before performance suffers).
 */
export async function computeStorageUsage(state: Sizable): Promise<StorageUsage> {
  const { bytes: appUsedBytes, entryCount } = computeAppUsedBytes(state);
  const { usedBytes, quotaBytes } = await readBrowserStorage();
  const browserPercentUsed =
    usedBytes !== null && quotaBytes !== null && quotaBytes > 0
      ? (usedBytes / quotaBytes) * 100
      : null;
  const appPercentUsed = (appUsedBytes / APP_SOFT_CAP_BYTES) * 100;
  const effectivePercentUsed = Math.max(appPercentUsed, browserPercentUsed ?? 0);
  return {
    browserUsedBytes: usedBytes,
    browserQuotaBytes: quotaBytes,
    appUsedBytes,
    appSoftCapBytes: APP_SOFT_CAP_BYTES,
    browserPercentUsed,
    appPercentUsed,
    effectivePercentUsed,
    warn: effectivePercentUsed >= 80,
    entryCount,
  };
}

/**
 * Format a byte count into a human-readable string. Picks the
 * narrowest unit that keeps the value under 999.
 *
 *   formatBytes(900) → "900 B"
 *   formatBytes(1500) → "1.5 KB"
 *   formatBytes(2_500_000) → "2.4 MB"
 *   formatBytes(50 * 1024 * 1024) → "50.0 MB"
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}
