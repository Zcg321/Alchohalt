import type { DB } from '../store/db';

/**
 * [R11-2] Schema validator for the persisted DB. Runs at hydration
 * time so a corrupt blob (browser bug, OS crash, malicious extension,
 * partial write) doesn't cause the app to render-crash on first paint.
 *
 * This is intentionally narrow: it checks the SHAPE the store relies
 * on (entries array, settings object, version number), not deep
 * field-level validity. Migrations handle field evolution; this
 * checks "is this object even survivable as a DB at all."
 *
 * Returns `{ ok: true, db }` on pass, otherwise `{ ok: false, reason,
 * raw }` where `raw` is the original blob preserved for the recovery
 * screen's "salvage as JSON" option.
 */

export type ValidationResult =
  | { ok: true; db: DB }
  | { ok: false; reason: string; raw: unknown };

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function validateDB(persisted: unknown): ValidationResult {
  if (persisted === undefined || persisted === null) {
    return { ok: false, reason: 'empty', raw: persisted };
  }
  if (!isObject(persisted)) {
    return { ok: false, reason: 'not-an-object', raw: persisted };
  }
  const db = persisted as Record<string, unknown>;
  if (!Array.isArray(db.entries)) {
    return { ok: false, reason: 'entries-not-array', raw: persisted };
  }
  if (!isObject(db.settings)) {
    return { ok: false, reason: 'settings-not-object', raw: persisted };
  }
  // Trash is allowed to be missing — defaults to []. But if present, must be array.
  if (db.trash !== undefined && !Array.isArray(db.trash)) {
    return { ok: false, reason: 'trash-not-array', raw: persisted };
  }
  // version is allowed to be missing — migrate will add it.
  if (db.version !== undefined && typeof db.version !== 'number') {
    return { ok: false, reason: 'version-not-number', raw: persisted };
  }
  // Check for obvious data poisoning: an entry without ts is fatal
  // (computeStats reads e.ts on every entry).
  for (const e of db.entries as unknown[]) {
    if (!isObject(e) || typeof e.ts !== 'number' || Number.isNaN(e.ts)) {
      return { ok: false, reason: 'entry-missing-ts', raw: persisted };
    }
  }
  return { ok: true, db: persisted as unknown as DB };
}
