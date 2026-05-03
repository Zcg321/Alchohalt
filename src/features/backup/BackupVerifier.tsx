import React, { useState } from 'react';
import { verifyBackup } from '../../lib/encrypted-backup';
import type { VerifyBackupReport } from '../../lib/encrypted-backup';

/**
 * [R12-3] Verify a previously-exported .alch-backup file is restorable
 * without actually importing it. Catches the worst possible
 * silent-failure mode for a privacy-first app: user diligently exports
 * an encrypted backup every month for two years, then needs to restore
 * it after a phone wipe — and discovers the passphrase is wrong, or
 * the file got truncated by Dropbox sync, or the format changed two
 * versions ago. Verifying NOW means the user finds out NOW, while
 * they still have a working device they can re-export from.
 *
 * Voice (success):
 *   "Backup verified at 14:23. 247 entries readable. Passphrase works.
 *    File size 19.4 KB."
 *
 * Voice (failure): always names the failure mode + an actionable next
 * step. Never silent, never blame-the-user. See verifyBackup() for the
 * full taxonomy.
 *
 * The verification path is read-only — file goes through decrypt-and-
 * structure-check, the result is held in component state, and the UI
 * never touches the user's actual database. A user can verify ten
 * different files in a row without any side effects.
 */
function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BackupVerifier() {
  const [fileBody, setFileBody] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [passphrase, setPassphrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<VerifyBackupReport | null>(null);

  async function onPickFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0];
    if (!f) return;
    setReport(null);
    try {
      const text = await f.text();
      setFileBody(text);
      setFileName(f.name);
    } catch {
      setReport({
        ok: false,
        error: "Couldn't read the file.",
        hint: 'The file may be too large or your device may be out of memory.',
      });
    } finally {
      ev.target.value = '';
    }
  }

  async function onVerify() {
    if (!fileBody || busy) return;
    setBusy(true);
    setReport(null);
    try {
      const result = await verifyBackup(fileBody, passphrase);
      setReport(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setReport({ ok: false, error: 'Verification crashed unexpectedly.', hint: message });
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFileBody(null);
    setFileName('');
    setPassphrase('');
    setReport(null);
  }

  return (
    <section className="card" data-testid="backup-verifier">
      <div className="card-header">
        <h3 className="text-base font-semibold tracking-tight">
          Verify a backup file
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Confirms a .alch-backup file unlocks with your passphrase and
          the contents are intact — without changing anything on this
          device. Run this after every backup you save.
        </p>
      </div>
      <div className="card-content space-y-4">
        <div>
          <label className={`btn btn-secondary ${fileBody ? 'opacity-50' : ''}`}>
            {fileBody ? `Picked: ${fileName}` : 'Pick a .alch-backup file'}
            <input
              type="file"
              className="hidden"
              accept=".alch-backup,application/octet-stream"
              onChange={onPickFile}
              data-testid="backup-verifier-file-input"
              aria-label="Backup file to verify"
            />
          </label>
        </div>

        {fileBody && (
          <>
            <div className="space-y-1">
              <label htmlFor="backup-verify-pass" className="label">
                Passphrase
              </label>
              <input
                id="backup-verify-pass"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="input w-full"
                placeholder="Enter the passphrase you used to encrypt"
                autoComplete="off"
                spellCheck={false}
                data-testid="backup-verifier-pass-input"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onVerify}
                disabled={busy || !passphrase}
                className="btn btn-primary"
                data-testid="backup-verifier-verify-btn"
              >
                {busy ? 'Verifying…' : 'Verify backup'}
              </button>
              <button
                type="button"
                onClick={reset}
                className="btn btn-ghost"
                data-testid="backup-verifier-reset-btn"
              >
                Pick a different file
              </button>
            </div>
          </>
        )}

        {report && report.ok && (
          <div
            role="status"
            data-testid="backup-verifier-success"
            className="rounded-lg border border-sage-300 bg-sage-50 px-4 py-3 text-sm dark:border-sage-700 dark:bg-sage-950/50"
          >
            <p className="font-medium text-sage-900 dark:text-sage-100">
              Backup verified at {formatTime(report.verifiedAt)}.
            </p>
            <ul className="mt-2 space-y-0.5 text-sage-800 dark:text-sage-200">
              <li>{report.entriesCount} entries readable.</li>
              <li>{report.goalsCount} goals, {report.presetsCount} presets.</li>
              <li>Passphrase works. File size {formatBytes(report.sizeBytes)}.</li>
              <li>Schema v{report.schemaVersion}.</li>
            </ul>
            <p className="mt-2 text-xs text-sage-700 dark:text-sage-300">
              Nothing on this device changed. This was a read-only check.
            </p>
          </div>
        )}

        {report && !report.ok && (
          <div
            role="alert"
            data-testid="backup-verifier-error"
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm dark:border-red-700 dark:bg-red-950/50"
          >
            <p className="font-medium text-red-900 dark:text-red-100">
              {report.error}
            </p>
            {report.hint && (
              <p className="mt-1 text-red-800 dark:text-red-200">
                {report.hint}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
