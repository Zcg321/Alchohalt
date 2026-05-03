import React, { useState } from 'react';
import { useDB } from '../../store/db';
import { validateImport, processImport, downloadData } from '../../lib/data-export';
import type { ExportData } from '../../lib/data-export';
import { exportDatabaseToCSV, databaseToCSV, downloadCSV } from '../../lib/csv-export';
import { createExportWithAutoVerify } from '../../lib/backup-auto-verify';
import {
  dbForExportRange,
  defaultLast30DaysRange,
  dateInputValue,
  parseDateInputValue,
  validateRange,
} from '../../lib/export-range';
import DataImport from './DataImport';

export default function ExportImport() {
  const [importing, setImporting] = useState(false);
  const { db, wipeAll, setSettings } = useDB(s => ({
    db: s.db,
    wipeAll: s.wipeAll,
    setSettings: s.setSettings,
  }));

  /* [R16-3] Date-range export. Default = last 30 days. Toggle hides
   * the from/to fields by default — full-DB export stays one-tap. */
  const [rangeOpen, setRangeOpen] = useState(false);
  const [range, setRange] = useState(() => defaultLast30DaysRange());
  const rangeError = validateRange(range);

  async function doExport() {
    try {
      /* [R15-3] Round-trip the just-created export through
       * validateImport and persist the result. The download still
       * happens — verification is non-blocking. If it fails, the
       * BackupAutoVerifyRibbon surfaces it next render.
       *
       * [R16-3] If a range is open, build a filtered DB clone first.
       * The filtered payload still self-verifies because checksum is
       * computed over the SAME DB snapshot we just exported — round-
       * trip identity holds against the partial DB. */
      const dbToExport = rangeOpen ? dbForExportRange(db, range) : db;
      const { payload, verification } = await createExportWithAutoVerify(dbToExport);
      downloadData(payload);
      /* Skip overwriting backup-verification settings on a partial
       * export — those track full-DB backup health. The R15-3 ribbon
       * shouldn't change just because the user pulled a 90-day slice
       * for their therapist. */
      if (!rangeOpen) {
        setSettings({
          lastBackupAutoVerification: verification,
          lastBackupRibbonDismissedTs: undefined,
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'try again';
      alert(`Couldn't save your export — ${msg}. If it keeps happening, report this at https://github.com/Zcg321/Alchohalt/issues`);
    }
  }

  function doExportCSV() {
    try {
      if (rangeOpen) {
        const filteredDb = dbForExportRange(db, range);
        const csv = databaseToCSV(filteredDb);
        downloadCSV(csv);
      } else {
        exportDatabaseToCSV(db);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'try again';
      alert(`Couldn't save your CSV export — ${msg}. If it keeps happening, report this at https://github.com/Zcg321/Alchohalt/issues`);
    }
  }

  async function doImport(ev: React.ChangeEvent<HTMLInputElement>) {
    if (importing) return;
    setImporting(true);

    try {
      const f = ev.target.files?.[0];
      if (!f) return;

      const text = await f.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        alert("That file isn't valid JSON. Make sure you picked an Alchohalt export — not a CSV, PDF, or other file.");
        return;
      }

      // Validate import data
      const validation = await validateImport(parsed);
      if (!validation.success) {
        alert(`Couldn't read the file: ${validation.error}. The export may be from an older version, or the file got modified.`);
        return;
      }

      // Show warnings if any
      if (validation.warnings && validation.warnings.length > 0) {
        const proceed = confirm(
          `Heads-up before importing:\n${validation.warnings.join('\n')}\n\nGo ahead?`
        );
        if (!proceed) return;
      }

      // Process import and check for conflicts
      const { migratedData, conflicts } = await processImport(parsed as ExportData, db);

      if (conflicts.length > 0) {
        const proceed = confirm(
          `Some entries overlap with what's already on this device:\n${conflicts.join('\n')}\n\nThis replaces ALL current data with the import. Continue?`
        );
        if (!proceed) return;
      } else if (!confirm('Replace all current data with the imported file?')) {
        return;
      }

      // Apply the import
      useDB.setState({ db: migratedData });
      useDB.getState()._recompute();
      alert('Import complete.');

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'try again';
      alert(`Couldn't finish the import — ${msg}. Your existing data wasn't changed.`);
    } finally {
      setImporting(false);
      // Reset file input
      ev.target.value = '';
    }
  }

  function doWipe() {
    const s = prompt('This deletes everything: every entry, goal, preset, and setting. Type WIPE to confirm.');
    if (s === 'WIPE') {
      wipeAll(true);
      alert('All data cleared.');
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Export</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Your data, your file. JSON is the round-trip format (export then import to restore everything, with a checksum). CSV opens cleanly in Excel, Numbers, or Google Sheets.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={doExport}
            className="btn btn-primary"
            disabled={rangeOpen && !!rangeError}
            data-testid="export-json-button"
          >
            Export to JSON
          </button>
          <button
            onClick={doExportCSV}
            className="btn btn-secondary"
            disabled={rangeOpen && !!rangeError}
            data-testid="export-csv-button"
          >
            Export to CSV
          </button>
        </div>
        {/* [R16-3] Date-range picker. Hidden by default; toggle reveals
            from/to fields. Defaults to the last 30 days so a tap-tap
            therapist export needs zero typing. */}
        <div className="mt-3">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={rangeOpen}
              onChange={(e) => setRangeOpen(e.target.checked)}
              data-testid="export-range-toggle"
              className="h-4 w-4"
            />
            <span>Limit to a date range</span>
          </label>
          {rangeOpen ? (
            <div
              className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3"
              data-testid="export-range-fields"
            >
              <label className="block text-sm">
                <span className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  From
                </span>
                <input
                  type="date"
                  value={dateInputValue(range.fromMs)}
                  onChange={(e) =>
                    setRange((r) => ({
                      ...r,
                      fromMs: parseDateInputValue(e.target.value, 'start'),
                    }))
                  }
                  data-testid="export-range-from"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5"
                />
              </label>
              <label className="block text-sm">
                <span className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  To
                </span>
                <input
                  type="date"
                  value={dateInputValue(range.toMs)}
                  onChange={(e) =>
                    setRange((r) => ({
                      ...r,
                      toMs: parseDateInputValue(e.target.value, 'end'),
                    }))
                  }
                  data-testid="export-range-to"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5"
                />
              </label>
              {rangeError ? (
                <p
                  role="alert"
                  data-testid="export-range-error"
                  className="sm:col-span-2 text-xs text-red-600 dark:text-red-400"
                >
                  {rangeError}
                </p>
              ) : (
                <p className="sm:col-span-2 text-xs text-gray-500 dark:text-gray-400">
                  Inclusive on both ends. Range exports skip the
                  full-backup verification — they&apos;re a slice, not a backup.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Import</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Restore from a previous export. We&rsquo;ll check the file&rsquo;s integrity and flag any conflicts before changing anything.
        </p>
        <label className={`btn btn-secondary ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {importing ? 'Reading file…' : 'Pick a file to import'}
          <input
            type="file"
            className="hidden"
            accept=".json"
            onChange={doImport}
            disabled={importing}
          />
        </label>
      </div>

      <DataImport />

      <div>
        <h3 className="text-lg font-semibold mb-2 text-red-600">Clear all data</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Deletes everything on this device — entries, goals, presets, settings. This can&rsquo;t be undone. Type WIPE to confirm.
        </p>
        <button
          onClick={doWipe}
          className="btn bg-red-600 hover:bg-red-700 text-white"
        >
          Clear all data
        </button>
      </div>
    </div>
  );
}
