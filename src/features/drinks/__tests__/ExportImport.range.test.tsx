/**
 * [R16-3] ExportImport date-range UI tests.
 *
 * Asserts toggle visibility, default range, validation behavior, and
 * that the range fields are wired so onChange updates state. The
 * download itself is exercised via a spied URL.createObjectURL — we
 * don't actually inspect blob contents here (the helpers in
 * lib/__tests__/export-range.test.ts cover the filtering).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import ExportImport from '../ExportImport';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';

beforeEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  /* URL.createObjectURL isn't implemented in JSDOM; downloadCSV/
   * downloadData both call it. Stub so click()s don't blow up. */
  if (typeof URL.createObjectURL !== 'function') {
    (URL as unknown as { createObjectURL: () => string }).createObjectURL = () => 'blob:stub';
  }
  if (typeof URL.revokeObjectURL !== 'function') {
    (URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = () => undefined;
  }
});

afterEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('[R16-3] ExportImport date-range UI', () => {
  it('renders the toggle, hidden range fields by default', () => {
    render(<ExportImport />);
    expect(screen.getByTestId('export-range-toggle')).toBeInTheDocument();
    expect(screen.queryByTestId('export-range-fields')).not.toBeInTheDocument();
  });

  it('reveals from/to fields when the toggle is checked', () => {
    render(<ExportImport />);
    fireEvent.click(screen.getByTestId('export-range-toggle'));
    expect(screen.getByTestId('export-range-fields')).toBeInTheDocument();
    const fromInput = screen.getByTestId('export-range-from') as HTMLInputElement;
    const toInput = screen.getByTestId('export-range-to') as HTMLInputElement;
    expect(fromInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(toInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('shows error + disables both export buttons when from > to', () => {
    render(<ExportImport />);
    fireEvent.click(screen.getByTestId('export-range-toggle'));

    const fromInput = screen.getByTestId('export-range-from') as HTMLInputElement;
    const toInput = screen.getByTestId('export-range-to') as HTMLInputElement;

    fireEvent.change(fromInput, { target: { value: '2026-05-01' } });
    fireEvent.change(toInput, { target: { value: '2026-04-01' } });

    const err = screen.getByTestId('export-range-error');
    expect(err.textContent).toMatch(/can't be after/i);

    const json = screen.getByTestId('export-json-button') as HTMLButtonElement;
    const csv = screen.getByTestId('export-csv-button') as HTMLButtonElement;
    expect(json.disabled).toBe(true);
    expect(csv.disabled).toBe(true);
  });

  it('does NOT update lastBackupAutoVerification when a range export runs', async () => {
    /* R16-3: range exports are slices, not backups; they shouldn't
     * touch the verification ribbon state. Asserted by setting a
     * known marker, running a range export, and checking the marker
     * still reflects the prior state. */
    useDB.setState({
      db: {
        ...useDB.getState().db,
        settings: {
          ...useDB.getState().db.settings,
          lastBackupAutoVerification: {
            ts: 12345,
            ok: true,
            type: 'json',
          },
        },
      },
    });
    render(<ExportImport />);
    fireEvent.click(screen.getByTestId('export-range-toggle'));
    /* Default range is valid (last 30 days). Click JSON export. */
    fireEvent.click(screen.getByTestId('export-json-button'));
    /* Wait a tick for the async pipeline. */
    await new Promise((r) => setTimeout(r, 0));
    const marker = useDB.getState().db.settings.lastBackupAutoVerification;
    expect(marker?.ts).toBe(12345);
  });
});
