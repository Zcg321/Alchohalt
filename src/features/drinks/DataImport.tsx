import React, { useState } from 'react';
import { useDB } from '../../store/db';
import { nanoid } from 'nanoid';
import {
  parseRows,
  detectColumns,
  applyMapping,
  type ColumnMap,
  type ParseResult,
  type ApplyResult,
} from './importMapping';

/**
 * [R10-1] Foreign-tracker import wizard.
 *
 * Three steps:
 *   1. Pick file (CSV or JSON array). Auto-parse + auto-detect columns.
 *   2. Adjust column mapping if auto-detect missed something. Preview the
 *      first 5 entries that would be created.
 *   3. Commit: append to existing entries (does NOT replace, so the user
 *      can bring history in without losing their alchohalt data).
 *
 * Voice rule: this is a settings-section feature so register is calm-
 * helpful. Don't overstate the capability — say "may need column
 * mapping" up front.
 */
type Step = 'pick' | 'map' | 'preview' | 'done';

export default function DataImport() {
  const { db } = useDB();
  const [step, setStep] = useState<Step>('pick');
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMap | null>(null);
  const [result, setResult] = useState<ApplyResult | null>(null);
  const [committedCount, setCommittedCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep('pick');
    setParsed(null);
    setMapping(null);
    setResult(null);
    setCommittedCount(0);
    setError(null);
  };

  const handleFile = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = ev.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const p = parseRows(text);
      if (p.rows.length === 0) {
        setError("That file looks empty or unreadable. Pick a CSV or JSON array of entries.");
        return;
      }
      setParsed(p);
      setMapping(detectColumns(p.headers));
      setStep('map');
    } catch (e) {
      setError(`Couldn't read the file — ${e instanceof Error ? e.message : 'try again'}`);
    } finally {
      ev.target.value = '';
    }
  };

  const updateMapping = (key: keyof ColumnMap, value: string) => {
    if (!mapping) return;
    setMapping({ ...mapping, [key]: value === '' ? null : value });
  };

  const goPreview = () => {
    if (!parsed || !mapping) return;
    const r = applyMapping(parsed.rows, mapping);
    setResult(r);
    setStep('preview');
  };

  const commit = () => {
    if (!result) return;
    const withIds = result.entries.map((e) => ({ ...e, id: nanoid() }));
    const next = {
      ...db,
      entries: [...db.entries, ...withIds],
      _lastLogAt: withIds.length > 0 ? Math.max(...withIds.map((e) => e.ts), db._lastLogAt ?? 0) : db._lastLogAt,
    };
    useDB.setState({ db: next });
    useDB.getState()._recompute();
    setCommittedCount(withIds.length);
    setStep('done');
  };

  return (
    <div className="card" data-testid="data-import">
      <div className="card-header">
        <h3 className="text-lg font-semibold">Import from another tracker</h3>
        <p className="text-sm text-ink-soft mt-1">
          Bring history in from Drinkaware, Reframe, Dryy, Sunnyside, or any
          spreadsheet. CSV or JSON. We&rsquo;ll preview before changing anything.
        </p>
      </div>
      <div className="card-content space-y-3">
        {error && (
          <div role="alert" className="p-3 rounded-md bg-rose-50 text-rose-900 text-sm dark:bg-rose-900/20 dark:text-rose-200">
            {error}
          </div>
        )}

        {step === 'pick' && (
          <label className="btn btn-secondary inline-flex items-center cursor-pointer">
            Pick file
            <input
              type="file"
              className="hidden"
              accept=".csv,.json,.txt,text/csv,application/json"
              onChange={handleFile}
              data-testid="data-import-file"
            />
          </label>
        )}

        {step === 'map' && parsed && mapping && (
          <div className="space-y-3">
            <p className="text-sm">
              Detected {parsed.rows.length.toLocaleString()} rows in {parsed.format.toUpperCase()}.
              Map columns below — date is required, the rest are optional.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['date', 'drinks', 'drinkType', 'notes', 'mood'] as const).map((field) => (
                <label key={field} className="flex flex-col text-sm">
                  <span className="text-xs uppercase tracking-wider text-ink-soft mb-1">
                    {fieldLabel(field)}
                    {field === 'date' && <span className="text-rose-700 ms-1">*</span>}
                  </span>
                  <select
                    value={mapping[field] ?? ''}
                    onChange={(e) => updateMapping(field, e.target.value)}
                    data-testid={`mapping-${field}`}
                    className="px-3 py-2 rounded-md border border-current/20 bg-surface-elevated"
                  >
                    <option value="">— not mapped —</option>
                    {parsed.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-primary"
                onClick={goPreview}
                disabled={!mapping.date}
                data-testid="data-import-preview"
              >
                Preview
              </button>
              <button type="button" className="btn btn-secondary" onClick={reset}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && result && (
          <div className="space-y-3">
            <p className="text-sm">
              <strong>{result.entries.length.toLocaleString()}</strong> entr{result.entries.length === 1 ? 'y' : 'ies'} ready to import.
              {result.skippedRows > 0 && (
                <span className="text-amber-700 dark:text-amber-300">
                  {' '}{result.skippedRows} row{result.skippedRows === 1 ? '' : 's'} skipped.
                </span>
              )}
            </p>
            {result.skipReasons.length > 0 && (
              <ul className="list-disc list-inside text-xs text-ink-soft">
                {result.skipReasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            {result.entries.length > 0 && (
              <div className="border border-current/10 rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-current/5">
                    <tr>
                      <th className="text-start p-2">Date</th>
                      <th className="text-start p-2">Type</th>
                      <th className="text-end p-2">Std drinks</th>
                      <th className="text-start p-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.entries.slice(0, 5).map((e, i) => (
                      <tr key={i} className="border-t border-current/10">
                        <td className="p-2 font-mono">{new Date(e.ts).toISOString().slice(0, 10)}</td>
                        <td className="p-2">{e.kind}</td>
                        <td className="p-2 text-end tabular-nums">{e.stdDrinks}</td>
                        <td className="p-2 truncate max-w-[16ch]">{e.notes ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.entries.length > 5 && (
                  <div className="p-2 text-xs text-ink-soft">
                    + {result.entries.length - 5} more
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-primary"
                onClick={commit}
                disabled={result.entries.length === 0}
                data-testid="data-import-commit"
              >
                Add to my data
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setStep('map')}>
                Back
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-3">
            <p className="text-sm">
              Imported <strong>{committedCount.toLocaleString()}</strong> entries.
            </p>
            <button type="button" className="btn btn-secondary" onClick={reset} data-testid="data-import-done">
              Import another file
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function fieldLabel(field: keyof ColumnMap): string {
  switch (field) {
    case 'date':
      return 'Date';
    case 'drinks':
      return 'Drinks (count)';
    case 'drinkType':
      return 'Drink type';
    case 'notes':
      return 'Notes';
    case 'mood':
      return 'Mood';
  }
}
