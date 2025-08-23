import React, { useRef } from 'react';
import { useDB } from '../../store/db';
import type { DB } from '../../store/db';
import { sha256 } from '../../lib/sha256';

export default function ExportImport() {
  const aRef = useRef<HTMLAnchorElement>(null);
  const { db, wipeAll } = useDB(s => ({ db: s.db, wipeAll: s.wipeAll }));

  async function doExport() {
    const payload = { version: db.version, exportedAt: new Date().toISOString(), data: db };
    const checksum = await sha256(payload.data);
    const blob = new Blob([JSON.stringify({ ...payload, checksum }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    if (aRef.current) {
      aRef.current.href = url;
      aRef.current.download = `alchohalt-export-${Date.now()}.json`;
      aRef.current.click();
      URL.revokeObjectURL(url);
    }
  }

  async function doImport(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      alert('Invalid JSON');
      return;
    }
    const obj = parsed as { data: DB; checksum?: string };
    if (!obj?.data?.version) {
      alert('Missing data/version');
      return;
    }
    const sum = await sha256(obj.data);
    if (sum !== obj.checksum) {
      alert('Checksum mismatch');
      return;
    }
    if (!confirm('Replace ALL current data with import?')) return;
    useDB.setState({ db: obj.data });
    useDB.getState()._recompute();
    alert('Import complete');
  }

  function doWipe() {
    const s = prompt('Type WIPE to confirm');
    if (s === 'WIPE') {
      wipeAll(true);
      alert('All data cleared');
    }
  }

  return (
    <div className="space-x-2">
      <button className="px-3 py-1 rounded border" onClick={doExport}>Export</button>
      <label className="px-3 py-1 rounded border cursor-pointer">
        Import
        <input type="file" accept="application/json" className="hidden" onChange={doImport} />
      </label>
      <button className="px-3 py-1 rounded border border-red-600 text-red-600" onClick={doWipe}>Wipe</button>
      <a ref={aRef} className="hidden" />
    </div>
  );
}
