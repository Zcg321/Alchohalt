import { describe, it, expect } from 'vitest';
import { validateDB } from '../dbValidate';

describe('[R11-2] validateDB', () => {
  it('rejects undefined / null with reason="empty"', () => {
    expect(validateDB(undefined)).toEqual({ ok: false, reason: 'empty', raw: undefined });
    expect(validateDB(null)).toEqual({ ok: false, reason: 'empty', raw: null });
  });

  it('rejects scalars and arrays with reason="not-an-object"', () => {
    expect(validateDB('a string')).toEqual({
      ok: false,
      reason: 'not-an-object',
      raw: 'a string',
    });
    expect(validateDB(42)).toEqual({ ok: false, reason: 'not-an-object', raw: 42 });
    expect(validateDB([])).toEqual({ ok: false, reason: 'not-an-object', raw: [] });
  });

  it('rejects when entries is not an array', () => {
    const v = validateDB({ entries: 'oops', settings: {} });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toBe('entries-not-array');
  });

  it('rejects when settings is not an object', () => {
    const v = validateDB({ entries: [], settings: null });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toBe('settings-not-object');
  });

  it('rejects when trash is present but not an array', () => {
    const v = validateDB({ entries: [], settings: {}, trash: 'oops' });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toBe('trash-not-array');
  });

  it('rejects when version is present but not a number', () => {
    const v = validateDB({ entries: [], settings: {}, version: 'one' });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toBe('version-not-number');
  });

  it('rejects when an entry is missing ts (data poisoning)', () => {
    const v = validateDB({
      entries: [{ id: 'a', volumeMl: 350 }],
      settings: {},
    });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toBe('entry-missing-ts');
  });

  it('rejects when an entry has NaN ts', () => {
    const v = validateDB({
      entries: [{ id: 'a', ts: Number.NaN }],
      settings: {},
    });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toBe('entry-missing-ts');
  });

  it('accepts a minimal valid DB shape', () => {
    const db = { entries: [], settings: {}, version: 1 };
    const v = validateDB(db);
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.db).toBe(db);
  });

  it('accepts a DB with valid entries and trash', () => {
    const db = {
      entries: [{ id: 'a', ts: 1000 }],
      settings: { language: 'en' },
      trash: [],
      version: 1,
    };
    const v = validateDB(db);
    expect(v.ok).toBe(true);
  });

  it('preserves the raw blob in rejection so the recovery screen can salvage', () => {
    const corrupt = { entries: 'wat', extra: 'preserved' };
    const v = validateDB(corrupt);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.raw).toBe(corrupt);
  });
});
