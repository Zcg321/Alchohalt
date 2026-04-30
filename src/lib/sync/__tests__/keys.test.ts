import { describe, expect, it } from 'vitest';
import {
  deriveMasterKey,
  deriveAuthHash,
  generateUserSalt,
  KEY_BYTES,
  SALT_BYTES,
  __infoStrings,
} from '../keys';

describe('[SYNC-1] keys.ts — Argon2id master / auth derivation', () => {
  it('generateUserSalt returns 16 raw bytes', async () => {
    const a = await generateUserSalt();
    const b = await generateUserSalt();
    expect(a.length).toBe(SALT_BYTES);
    expect(b.length).toBe(SALT_BYTES);
    // Random — vanishingly unlikely for two 16-byte buffers to match.
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });

  it('deriveMasterKey is deterministic for same (passphrase, salt)', async () => {
    const salt = await generateUserSalt();
    const k1 = await deriveMasterKey('correct horse battery staple', salt);
    const k2 = await deriveMasterKey('correct horse battery staple', salt);
    expect(k1.length).toBe(KEY_BYTES);
    expect(Array.from(k1)).toEqual(Array.from(k2));
  });

  it('deriveMasterKey diverges on different salts', async () => {
    const a = await generateUserSalt();
    const b = await generateUserSalt();
    const k1 = await deriveMasterKey('same passphrase', a);
    const k2 = await deriveMasterKey('same passphrase', b);
    expect(Array.from(k1)).not.toEqual(Array.from(k2));
  });

  it('deriveMasterKey diverges on different passphrases', async () => {
    const salt = await generateUserSalt();
    const k1 = await deriveMasterKey('pass-A', salt);
    const k2 = await deriveMasterKey('pass-B', salt);
    expect(Array.from(k1)).not.toEqual(Array.from(k2));
  });

  it('master vs auth derivations DO NOT COLLIDE on same (passphrase, salt)', async () => {
    const salt = await generateUserSalt();
    const master = await deriveMasterKey('correct horse battery staple', salt);
    const auth = await deriveAuthHash('correct horse battery staple', salt);
    expect(Array.from(master)).not.toEqual(Array.from(auth));
  });

  it('info-string namespacing pins alchohalt:* (not wend:*)', () => {
    expect(__infoStrings.master).toBe('alchohalt:master:v1');
    expect(__infoStrings.auth).toBe('alchohalt:auth:v1');
    expect(__infoStrings.master).not.toContain('wend');
    expect(__infoStrings.auth).not.toContain('wend');
  });

  it('rejects an undersized salt', async () => {
    await expect(
      deriveMasterKey('passphrase', new Uint8Array(8)),
    ).rejects.toThrow(/salt/i);
  });
}, { timeout: 30_000 });
