/**
 * [R15-3] Backup auto-verification.
 *
 * Round 12 added a manual "verify your backup file" surface
 * (BackupVerifier). Round 15 makes the same integrity check happen
 * automatically right after the user creates a backup, surfaces the
 * result in DiagnosticsAudit, and raises a small ribbon if the
 * verification failed so the user finds out at backup time rather
 * than at restore time.
 *
 * The check round-trips the just-created export through the same
 * validateImport() path the import side uses. If the checksum agrees
 * + the schema validates + the data block is structurally complete,
 * the backup is considered verified.
 *
 * Pure function plus side-effect-free Promise — no React, no store
 * access here. The caller (ExportImport.tsx) persists the result via
 * setSettings.
 */
import { createExport, validateImport, type ExportData } from './data-export';
import type { DB } from '../store/db';

export interface BackupAutoVerifyResult {
  /** When the verification ran (ms epoch). */
  ts: number;
  /** True if the verification passed. */
  ok: boolean;
  /** Error string when ok===false. Stable enough for a ribbon. */
  error?: string;
  /** Which export path was verified. */
  type: 'json' | 'encrypted';
}

/**
 * Build an ExportData payload for the given DB and immediately
 * round-trip it through validateImport. Returns the export payload
 * (so the caller can still trigger the actual download) plus a
 * BackupAutoVerifyResult.
 */
export async function createExportWithAutoVerify(
  db: DB,
): Promise<{ payload: ExportData; verification: BackupAutoVerifyResult }> {
  const ts = Date.now();
  let payload: ExportData;
  try {
    payload = await createExport(db);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`createExport failed: ${message}`);
  }

  const result = await validateImport(payload);
  if (!result.success) {
    return {
      payload,
      verification: {
        ts,
        ok: false,
        error: result.error ?? 'Verification failed',
        type: 'json',
      },
    };
  }

  return {
    payload,
    verification: {
      ts,
      ok: true,
      type: 'json',
    },
  };
}
