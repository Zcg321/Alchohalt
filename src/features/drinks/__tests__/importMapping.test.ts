import { describe, it, expect } from 'vitest';
import { parseRows, detectColumns, applyMapping, type ColumnMap } from '../importMapping';

describe('parseRows — CSV', () => {
  it('parses a 3-column csv with quoted commas', () => {
    const csv = 'date,drinks,notes\n2026-01-15,2,"Friday, late"';
    const r = parseRows(csv);
    expect(r.format).toBe('csv');
    expect(r.headers).toEqual(['date', 'drinks', 'notes']);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0]).toEqual({ date: '2026-01-15', drinks: '2', notes: 'Friday, late' });
  });

  it('handles empty trailing lines', () => {
    const csv = 'date,drinks\n2026-01-15,1\n\n';
    const r = parseRows(csv);
    expect(r.rows).toHaveLength(1);
  });

  it('returns empty for blank input', () => {
    expect(parseRows('').rows).toHaveLength(0);
  });
});

describe('parseRows — JSON', () => {
  it('parses a JSON array of objects', () => {
    const json = '[{"date":"2026-01-15","drinks":2},{"date":"2026-01-16","drinks":1}]';
    const r = parseRows(json);
    expect(r.format).toBe('json');
    expect(r.rows).toHaveLength(2);
  });

  it('falls back to CSV if JSON is malformed', () => {
    const text = '[malformed';
    const r = parseRows(text);
    expect(r.format).toBe('csv');
  });
});

describe('detectColumns', () => {
  it('detects standard headers', () => {
    expect(
      detectColumns(['date', 'drinks', 'type', 'notes', 'mood'])
    ).toEqual({
      date: 'date',
      drinks: 'drinks',
      drinkType: 'type',
      notes: 'notes',
      mood: 'mood',
    });
  });

  it('detects via substring (e.g. "Date Logged")', () => {
    expect(detectColumns(['Date Logged', 'Quantity']).date).toBe('Date Logged');
    expect(detectColumns(['Date Logged', 'Quantity']).drinks).toBe('Quantity');
  });

  it('returns null when no match', () => {
    expect(detectColumns(['x', 'y']).date).toBeNull();
  });
});

describe('applyMapping', () => {
  const mapping: ColumnMap = {
    date: 'date',
    drinks: 'drinks',
    drinkType: 'type',
    notes: 'notes',
    mood: null,
  };

  it('builds entries from rows with all fields', () => {
    const result = applyMapping(
      [{ date: '2026-01-15', drinks: '1', type: 'wine', notes: 'with dinner' }],
      mapping
    );
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]?.kind).toBe('wine');
    expect(result.entries[0]?.notes).toBe('with dinner');
  });

  it('explodes a 3-drink row into 3 entries', () => {
    const result = applyMapping(
      [{ date: '2026-01-15', drinks: '3', type: 'beer', notes: '' }],
      mapping
    );
    expect(result.entries).toHaveLength(3);
    expect(result.entries[0]?.stdDrinks).toBe(1);
  });

  it('skips rows with unparseable dates', () => {
    const result = applyMapping(
      [
        { date: '2026-01-15', drinks: '1', type: '', notes: '' },
        { date: 'not a date', drinks: '1', type: '', notes: '' },
      ],
      mapping
    );
    expect(result.entries).toHaveLength(1);
    expect(result.skippedRows).toBe(1);
    expect(result.skipReasons).toContain('Unparseable date');
  });

  it('infers spirits from "vodka tonic"', () => {
    const result = applyMapping(
      [{ date: '2026-01-15', drinks: '1', type: 'vodka tonic', notes: '' }],
      mapping
    );
    expect(result.entries[0]?.kind).toBe('spirits');
  });

  it('drops every row when no date column is mapped', () => {
    const result = applyMapping(
      [{ date: '2026-01-15', drinks: '1', type: '', notes: '' }],
      { ...mapping, date: null }
    );
    expect(result.entries).toHaveLength(0);
    expect(result.skippedRows).toBe(1);
  });

  it('handles MM/DD/YYYY dates', () => {
    const result = applyMapping(
      [{ date: '01/15/2026', drinks: '1', type: 'beer', notes: '' }],
      mapping
    );
    expect(result.entries).toHaveLength(1);
    expect(new Date(result.entries[0]!.ts).getDate()).toBe(15);
  });
});
