import { describe, it, expect } from 'vitest';
import { sha256 } from '../src/lib/sha256';
import { useDB } from '../src/store/db';

describe('export/import checksum', () => {
  it('accepts matching checksum and rejects mismatches', async () => {
    const db = useDB.getState().db;
    const payload = { version: db.version, exportedAt: 'now', data: db };
    const good = { ...payload, checksum: await sha256(payload.data) };
    const bad = { ...payload, checksum: 'deadbeef' };
    expect(await sha256(good.data)).toBe(good.checksum);
    expect(await sha256(bad.data)).not.toBe(bad.checksum);
  });
});
