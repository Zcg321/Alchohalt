import React, { useRef, useState } from 'react';
import { useDB } from '../../store/db';
import { createExport, validateImport, processImport, downloadData } from '../../lib/data-export';
import type { ExportData } from '../../lib/data-export';

export default function ExportImport() {
  const aRef = useRef<HTMLAnchorElement>(null);
  const [importing, setImporting] = useState(false);
  const { db, wipeAll } = useDB(s => ({ db: s.db, wipeAll: s.wipeAll }));

  async function doExport() {
    try {
      const exportData = await createExport(db);
      downloadData(exportData);
    } catch (error) {
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        alert('Invalid JSON file');
        return;
      }

      // Validate import data
      const validation = await validateImport(parsed);
      if (!validation.success) {
        alert(`Import validation failed: ${validation.error}`);
        return;
      }

      // Show warnings if any
      if (validation.warnings && validation.warnings.length > 0) {
        const proceed = confirm(
          `Import warnings:\n${validation.warnings.join('\n')}\n\nProceed with import?`
        );
        if (!proceed) return;
      }

      // Process import and check for conflicts
      const { migratedData, conflicts } = await processImport(parsed as ExportData, db);
      
      if (conflicts.length > 0) {
        const proceed = confirm(
          `Data conflicts detected:\n${conflicts.join('\n')}\n\nThis will replace ALL current data. Continue?`
        );
        if (!proceed) return;
      } else if (!confirm('Replace ALL current data with import?')) {
        return;
      }

      // Apply the import
      useDB.setState({ db: migratedData });
      useDB.getState()._recompute();
      alert('Import completed successfully');
      
    } catch (error) {
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
      // Reset file input
      ev.target.value = '';
    }
  }

  function doWipe() {
    const s = prompt('Type WIPE to confirm');
    if (s === 'WIPE') {
      wipeAll(true);
      alert('All data cleared');
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Export Data</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Create a secure backup with checksum verification and version info
        </p>
        <button 
          onClick={doExport}
          className="btn btn-primary"
        >
          📥 Export with Checksum
        </button>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Import Data</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Restore from backup with integrity checking and conflict detection
        </p>
        <label className={`btn btn-secondary ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {importing ? '⏳ Processing...' : '📤 Import with Validation'}
          <input 
            type="file" 
            className="hidden" 
            accept=".json" 
            onChange={doImport}
            disabled={importing}
          />
        </label>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2 text-red-600">Danger Zone</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Permanently delete all data (requires double confirmation)
        </p>
        <button 
          onClick={doWipe}
          className="btn bg-red-600 hover:bg-red-700 text-white"
        >
          🗑️ Clear All Data
        </button>
      </div>
      
      <a ref={aRef} className="hidden" />
    </div>
  );
}
