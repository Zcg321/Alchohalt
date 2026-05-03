/**
 * [R14-4] Stable variant assignment + on-device exposure log.
 *
 * Two pieces:
 *
 *   1. getDeviceBucket() — a random ID generated on first call,
 *      persisted to localStorage, read thereafter. The same browser
 *      on the same device always sees the same bucket. Clearing
 *      browser storage rotates it (intentional — that user is
 *      effectively a new install).
 *
 *   2. assignVariant(experiment, bucket) — pure function that maps
 *      (experiment.key, bucket) → variant. Deterministic across
 *      sessions; uniformly (or weighted) distributed across buckets.
 *
 * No fetch, no UUIDs from a server, no fingerprinting. Just a random
 * 12-byte nanoid kept in localStorage.
 *
 * Why direct localStorage (not src/lib/storage.ts):
 *   useExperiment() runs during React render and must return a
 *   variant synchronously. The storage shim is async (it goes through
 *   Capacitor Preferences). For variant assignment, the failure mode
 *   of a cleared localStorage (rotated bucket) is acceptable — that
 *   user is effectively a new install. Each call below is wrapped in
 *   try/catch so an env without localStorage degrades gracefully to
 *   per-session bucketing.
 */

/* eslint-disable no-restricted-syntax */
import { nanoid } from 'nanoid';
import type { Experiment } from './registry';

const BUCKET_KEY = 'exp.device-bucket';
const EXPOSURES_KEY = 'exp.exposures';
const MAX_EXPOSURES = 200;

export interface ExposureRecord {
  key: string;
  variant: string;
  ts: number;
}

function readLocalStorage(key: string): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  } catch {
    /* localStorage may be disabled (private mode, quota exceeded);
     * silently no-op so the calling code stays functional. The cost
     * is that variant assignment becomes per-session instead of
     * stable, which is the correct fallback for an unsupported env. */
  }
}

export function getDeviceBucket(): string {
  const existing = readLocalStorage(BUCKET_KEY);
  if (existing) return existing;
  const fresh = nanoid(12);
  writeLocalStorage(BUCKET_KEY, fresh);
  return fresh;
}

/**
 * 32-bit FNV-1a hash. Sufficient for variant bucketing — we just need
 * a deterministic, reasonably uniform integer per (experimentKey,
 * deviceBucket) pair. Not for cryptographic use.
 */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // >>> 0 to coerce to unsigned 32-bit.
  return hash >>> 0;
}

export function assignVariant(experiment: Experiment, bucket: string): string {
  const variants = experiment.variants;
  if (variants.length === 0) {
    throw new Error(`Experiment "${experiment.key}" has no variants`);
  }
  if (variants.length === 1) return variants[0]!;

  const weights = experiment.weights ?? variants.map(() => 1);
  if (weights.length !== variants.length) {
    throw new Error(
      `Experiment "${experiment.key}" weights length (${weights.length}) must match variants (${variants.length})`,
    );
  }
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  if (totalWeight <= 0) {
    throw new Error(`Experiment "${experiment.key}" weights sum must be positive`);
  }

  // Hash deterministically; map to a [0, 1) value via /2^32.
  const h = fnv1a(`${experiment.key}::${bucket}`);
  const r = h / 0x100000000;
  const target = r * totalWeight;

  let acc = 0;
  for (let i = 0; i < variants.length; i++) {
    acc += weights[i]!;
    if (target < acc) return variants[i]!;
  }
  // Floating-point safety: should never reach here, but fall back to last.
  return variants[variants.length - 1]!;
}

export function recordExposure(key: string, variant: string): void {
  const raw = readLocalStorage(EXPOSURES_KEY);
  let log: ExposureRecord[] = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) log = parsed as ExposureRecord[];
    } catch {
      log = [];
    }
  }
  log.push({ key, variant, ts: Date.now() });
  while (log.length > MAX_EXPOSURES) log.shift();
  writeLocalStorage(EXPOSURES_KEY, JSON.stringify(log));
}

export function readExposures(): ExposureRecord[] {
  const raw = readLocalStorage(EXPOSURES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ExposureRecord[]) : [];
  } catch {
    return [];
  }
}

export function clearExposures(): void {
  writeLocalStorage(EXPOSURES_KEY, '[]');
}

/**
 * Test-only helper for resetting the device bucket between tests.
 * Production callers should never need this.
 */
export function resetDeviceBucket(): void {
  writeLocalStorage(BUCKET_KEY, '');
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(BUCKET_KEY);
  } catch {
    /* no-op */
  }
}
