import { describe, expect, it } from 'vitest';
import {
  encrypt,
  decrypt,
  encryptString,
  decryptString,
  ENVELOPE_NONCE_BYTES,
  ENVELOPE_TAG_BYTES,
} from '../envelope';
import { getSodium } from '../sodium';

async function freshKey(): Promise<Uint8Array> {
  const sodium = await getSodium();
  return sodium.randombytes_buf(32);
}

describe('[SYNC-1] envelope.ts — XChaCha20-Poly1305 with AD binding', () => {
  it('roundtrips a UTF-8 payload', async () => {
    const key = await freshKey();
    const env = await encryptString('hello world', key, 'user-1', 'goals');
    const plain = await decryptString(env, key, 'user-1', 'goals');
    expect(plain).toBe('hello world');
  });

  it('envelope layout is nonce(24) || ciphertext || tag(16)', async () => {
    const key = await freshKey();
    const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
    const env = await encrypt(plaintext, key, 'u', 'b');
    expect(env.length).toBe(
      ENVELOPE_NONCE_BYTES + plaintext.length + ENVELOPE_TAG_BYTES,
    );
  });

  it('AD mismatch on userId fails decryption', async () => {
    const key = await freshKey();
    const env = await encryptString('secret', key, 'user-A', 'goals');
    await expect(decryptString(env, key, 'user-B', 'goals')).rejects.toThrow();
  });

  it('AD mismatch on blobId fails decryption', async () => {
    const key = await freshKey();
    const env = await encryptString('secret', key, 'user-1', 'goals');
    await expect(decryptString(env, key, 'user-1', 'mood')).rejects.toThrow();
  });

  it('wrong key fails decryption', async () => {
    const k1 = await freshKey();
    const k2 = await freshKey();
    const env = await encryptString('secret', k1, 'u', 'b');
    await expect(decryptString(env, k2, 'u', 'b')).rejects.toThrow();
  });

  it('produces 100 unique nonces over 100 envelopes', async () => {
    const key = await freshKey();
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const env = await encryptString(`msg-${i}`, key, 'u', 'b');
      const nonce = Array.from(env.slice(0, ENVELOPE_NONCE_BYTES)).join(',');
      seen.add(nonce);
    }
    expect(seen.size).toBe(100);
  });

  it('rejects an oversize-truncated envelope', async () => {
    const key = await freshKey();
    const env = await encryptString('secret', key, 'u', 'b');
    const truncated = env.subarray(0, ENVELOPE_NONCE_BYTES + 1);
    await expect(decrypt(truncated, key, 'u', 'b')).rejects.toThrow();
  });

  it('throws on bad key length', async () => {
    await expect(
      encryptString('hi', new Uint8Array(31), 'u', 'b'),
    ).rejects.toThrow(/key length/);
  });
});
