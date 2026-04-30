/**
 * AEAD envelope for sync blobs.
 *
 * Primitive: XChaCha20-Poly1305 (libsodium
 * `crypto_aead_xchacha20poly1305_ietf_*`). 24-byte random nonce, safe
 * at this size. 16-byte Poly1305 tag appended to the ciphertext by
 * libsodium.
 *
 * Wire format (raw bytes — no base64 wrapping at this layer):
 *
 *   ┌────────────────┬─────────────────────────────────────────┐
 *   │ nonce (24 B)   │ ciphertext + Poly1305 tag (variable)    │
 *   └────────────────┴─────────────────────────────────────────┘
 *
 * Associated data (NOT encrypted; bound by the MAC):
 *   AD = utf8(`${userId}:${blobId}`)
 *
 * The MAC binding stops a server from transplanting a ciphertext from
 * one row into another (e.g. swap user A's `goals` blob into user B's
 * row): the AD recovered at decrypt time would not match the caller's
 * `(userId, blobId)` and decryption fails.
 *
 * Key length: 32 bytes — exactly what `deriveMasterKey` produces.
 */

import { getSodium } from './sodium';

const NONCE_BYTES = 24;   // crypto_aead_xchacha20poly1305_ietf_NPUBBYTES
const TAG_BYTES = 16;     // Poly1305 MAC (appended by libsodium)
const KEY_BYTES = 32;     // crypto_aead_xchacha20poly1305_ietf_KEYBYTES

export const ENVELOPE_NONCE_BYTES = NONCE_BYTES;
export const ENVELOPE_TAG_BYTES = TAG_BYTES;

const enc = new TextEncoder();

/** Force a zero-byteOffset Uint8Array — see keys.ts for the libsodium
 *  prototype-check rationale. */
function utf8(s: string): Uint8Array {
  return new Uint8Array(enc.encode(s));
}

function clean(buf: Uint8Array): Uint8Array {
  // `new Uint8Array(buf)` copies into a fresh zero-offset buffer so
  // libsodium accepts views / subarrays / Buffers from Node alike.
  return new Uint8Array(buf);
}

function adFor(userId: string, blobId: string): Uint8Array {
  return utf8(`${userId}:${blobId}`);
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

/** Encrypt `plaintext` to a self-contained envelope.
 *
 *  Returns `nonce(24) || ciphertext || tag(16)` — a single Uint8Array
 *  the caller can base64-encode / persist as one blob.
 *
 *  Throws if `key.length !== 32`. */
export async function encrypt(
  plaintext: Uint8Array,
  key: Uint8Array,
  userId: string,
  blobId: string,
): Promise<Uint8Array> {
  const sodium = await getSodium();
  if (key.length !== KEY_BYTES) {
    throw new Error(`Invalid key length: expected ${KEY_BYTES}, got ${key.length}`);
  }
  const nonce = sodium.randombytes_buf(NONCE_BYTES);
  const ad = adFor(userId, blobId);
  const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    clean(plaintext),
    ad,
    null,
    nonce,
    clean(key),
  );
  return concat(nonce, ciphertext);
}

/** Decrypt an envelope. Throws if the AEAD MAC fails (wrong key,
 *  tampered ciphertext, mismatched userId/blobId, mismatched key, or
 *  truncated envelope). */
export async function decrypt(
  envelope: Uint8Array,
  key: Uint8Array,
  userId: string,
  blobId: string,
): Promise<Uint8Array> {
  const sodium = await getSodium();
  if (key.length !== KEY_BYTES) {
    throw new Error(`Invalid key length: expected ${KEY_BYTES}, got ${key.length}`);
  }
  if (envelope.length < NONCE_BYTES + TAG_BYTES) {
    throw new Error('Envelope too short');
  }
  // `clean(...)` re-wraps as zero-offset Uint8Array so libsodium's
  // prototype check accepts views / subarrays / Buffers alike.
  const nonce = clean(envelope.subarray(0, NONCE_BYTES));
  const ciphertext = clean(envelope.subarray(NONCE_BYTES));
  const ad = adFor(userId, blobId);
  return sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,
    ciphertext,
    ad,
    nonce,
    clean(key),
  );
}

/** Convenience — encrypt a UTF-8 string. */
export async function encryptString(
  plaintext: string,
  key: Uint8Array,
  userId: string,
  blobId: string,
): Promise<Uint8Array> {
  return encrypt(enc.encode(plaintext), key, userId, blobId);
}

/** Convenience — decrypt to UTF-8 string. */
export async function decryptString(
  envelope: Uint8Array,
  key: Uint8Array,
  userId: string,
  blobId: string,
): Promise<string> {
  const bytes = await decrypt(envelope, key, userId, blobId);
  return new TextDecoder().decode(bytes);
}
