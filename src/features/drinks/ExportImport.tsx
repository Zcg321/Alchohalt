import React, { useState } from 'react';
import { useDB } from '../../store/db';
import { createExport, validateImport, processImport, downloadData } from '../../lib/data-export';
import type { ExportData } from '../../lib/data-export';
import DataImport from './DataImport';

export default function ExportImport() {
  const [importing, setImporting] = useState(false);
  const { db, wipeAll } = useDB(s => ({ db: s.db, wipeAll: s.wipeAll }));

  async function doExport() {
    try {
      const exportData = await createExport(db);
      downloadData(exportData);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'try again';
      alert(`Couldn't save your export — ${msg}. If it keeps happening, report this at https://github.com/Zcg321/Alchohalt/issues`);
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
          A JSON file of everything — entries, goals, presets, settings. Includes a checksum so you can verify it later.
        </p>
        <button
          onClick={doExport}
          className="btn btn-primary"
        >
          Export to JSON
        </button>
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
