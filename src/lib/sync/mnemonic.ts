/**
 * BIP-39 12-word mnemonic — generation, decoding, seed/key derivation.
 *
 * Standard BIP-39 (English wordlist, vendored in `wordlist.ts`):
 *
 *   ┌───────────────────────────────┐
 *   │ 16-byte entropy (128 bits)    │
 *   ├───────────────────────────────┤
 *   │ + 4-bit checksum from SHA-256 │
 *   ├───────────────────────────────┤
 *   │ = 132 bits → 12 × 11-bit words│
 *   └───────────────────────────────┘
 *
 * The checksum is computed on the entropy bytes (not the words). On
 * decode, we recompute and require an exact match — typos that
 * happen to land on real wordlist entries are caught here.
 *
 * Recovery flow:
 *   - generate() produces fresh entropy + words
 *   - words → seed via BIP-39's PBKDF2-HMAC-SHA512 stretch (2048 iters,
 *     key="mnemonic" || passphrase). We use passphrase="" so the
 *     mnemonic alone is the recovery secret.
 *   - seed → masterKey via libsodium crypto_kdf with our `alchohalt:`
 *     namespace context, so the mnemonic-derived master key is
 *     domain-separated from anything else that might be derived from
 *     the same seed.
 *
 * The mnemonic IS the recovery secret. The user is shown it ONCE and
 * never again; the UI gates on a "I've saved it" acknowledgement.
 */

import { getSodium } from './sodium';
import { BIP39_ENGLISH } from './wordlist';

const ENTROPY_BYTES = 16;             // 128 bits
const CHECKSUM_BITS = ENTROPY_BYTES * 8 / 32;  // 4
const TOTAL_BITS = ENTROPY_BYTES * 8 + CHECKSUM_BITS; // 132
const WORD_COUNT = TOTAL_BITS / 11;   // 12
const WORDLIST_SIZE = 2048;

const enc = new TextEncoder();

/** See keys.ts — re-wrap to satisfy libsodium's instanceof check
 *  in Node test environments. */
function utf8(s: string): Uint8Array {
  return new Uint8Array(enc.encode(s));
}

function clean(buf: Uint8Array): Uint8Array {
  return new Uint8Array(buf);
}

function bytesToBits(bytes: Uint8Array): string {
  let out = '';
  for (const b of bytes) out += b.toString(2).padStart(8, '0');
  return out;
}

function bitsToBytes(bits: string): Uint8Array {
  if (bits.length % 8 !== 0) {
    throw new Error('bit string length must be a multiple of 8');
  }
  const out = new Uint8Array(bits.length / 8);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  return out;
}

async function entropyChecksumBits(entropy: Uint8Array): Promise<string> {
  const sodium = await getSodium();
  const hash = sodium.crypto_hash_sha256(clean(entropy));
  return bytesToBits(hash).slice(0, CHECKSUM_BITS);
}

/** Generate a fresh 12-word mnemonic. Each call uses 16 bytes of
 *  fresh entropy from libsodium randombytes_buf. */
export async function generate(): Promise<string[]> {
  const sodium = await getSodium();
  const entropy = sodium.randombytes_buf(ENTROPY_BYTES);
  return entropyToWords(entropy);
}

export async function entropyToWords(entropy: Uint8Array): Promise<string[]> {
  if (entropy.length !== ENTROPY_BYTES) {
    throw new Error(
      `Invalid entropy length: expected ${ENTROPY_BYTES}, got ${entropy.length}`,
    );
  }
  const checksum = await entropyChecksumBits(entropy);
  const bits = bytesToBits(entropy) + checksum;
  const words: string[] = [];
  for (let i = 0; i < WORD_COUNT; i++) {
    const idx = parseInt(bits.slice(i * 11, i * 11 + 11), 2);
    if (idx < 0 || idx >= WORDLIST_SIZE) {
      throw new Error(`Word index out of range: ${idx}`);
    }
    words.push(BIP39_ENGLISH[idx]!);
  }
  return words;
}

/** Decode mnemonic words back to entropy bytes. Throws if any word is
 *  unknown OR if the embedded checksum doesn't match a fresh
 *  recomputation over the entropy. */
export async function decode(words: string[]): Promise<Uint8Array> {
  if (words.length !== WORD_COUNT) {
    throw new Error(`Expected ${WORD_COUNT} words, got ${words.length}`);
  }
  let bits = '';
  for (const w of words) {
    const idx = BIP39_ENGLISH.indexOf(w);
    if (idx < 0) throw new Error(`Unknown word: ${w}`);
    bits += idx.toString(2).padStart(11, '0');
  }
  const entropyBits = bits.slice(0, ENTROPY_BYTES * 8);
  const checksumBits = bits.slice(ENTROPY_BYTES * 8);
  const entropy = bitsToBytes(entropyBits);
  const expected = await entropyChecksumBits(entropy);
  if (checksumBits !== expected) {
    throw new Error('Mnemonic checksum mismatch');
  }
  return entropy;
}

/** PBKDF2-HMAC-SHA512 (2048 iterations) over the joined mnemonic +
 *  the BIP-39 salt prefix. Returns 64 bytes. libsodium's `crypto_pwhash`
 *  is Argon2id, not PBKDF2 — so we hand-roll PBKDF2 over libsodium's
 *  HMAC-SHA512 primitive. 2048 iterations is the BIP-39 spec. */
export async function seedFromMnemonic(
  words: string[],
  passphrase = '',
): Promise<Uint8Array> {
  const sodium = await getSodium();
  // BIP-39: NFKD-normalize joined mnemonic and salt = "mnemonic" + passphrase.
  const password = utf8(words.join(' ').normalize('NFKD'));
  const salt = utf8(('mnemonic' + passphrase).normalize('NFKD'));
  return pbkdf2HmacSha512(sodium, password, salt, 2048, 64);
}

/** Derive the 32-byte master key from a mnemonic. The derivation is
 *  deterministic — same words always produce the same key — and
 *  domain-separated from any other use of the BIP-39 seed via the
 *  `alchohalt:master:v1` info string. */
export async function masterKeyFromMnemonic(
  words: string[],
  passphrase = '',
): Promise<Uint8Array> {
  const sodium = await getSodium();
  const seed = await seedFromMnemonic(words, passphrase);
  // crypto_kdf takes a 32-byte master input + 8-char context + numeric
  // subkey id. Use SHA-256(seed || "alchohalt:master:v1") as the
  // master input so the seed is domain-separated.
  const info = utf8('alchohalt:master:v1');
  const labeled = new Uint8Array(seed.length + info.length);
  labeled.set(seed, 0);
  labeled.set(info, seed.length);
  return sodium.crypto_hash_sha256(labeled);
}

// ------- pbkdf2 helper (libsodium has HMAC-SHA512 but no PBKDF2) -------
//
// libsodium's `crypto_auth_hmacsha512` requires an EXACTLY 32-byte
// key — too strict for PBKDF2 where the key (= the password) is an
// arbitrary-length user input. We use the streaming API
// `crypto_auth_hmacsha512_init/update/final` instead, which accepts
// arbitrary key lengths per libsodium docs (and per HMAC RFC: keys
// longer than the block size are pre-hashed; shorter keys are
// zero-padded — the streaming API does this internally).

function hmacSha512(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sodium: any,
  key: Uint8Array,
  msg: Uint8Array,
): Uint8Array {
  const state = sodium.crypto_auth_hmacsha512_init(new Uint8Array(key));
  sodium.crypto_auth_hmacsha512_update(state, new Uint8Array(msg));
  return new Uint8Array(sodium.crypto_auth_hmacsha512_final(state));
}

function pbkdf2HmacSha512(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sodium: any,
  password: Uint8Array,
  salt: Uint8Array,
  iterations: number,
  dkLen: number,
): Uint8Array {
  const out = new Uint8Array(dkLen);
  const hLen = 64; // HMAC-SHA512 output length
  const blocks = Math.ceil(dkLen / hLen);
  for (let i = 1; i <= blocks; i++) {
    const intBlock = new Uint8Array(4);
    intBlock[0] = (i >>> 24) & 0xff;
    intBlock[1] = (i >>> 16) & 0xff;
    intBlock[2] = (i >>> 8) & 0xff;
    intBlock[3] = i & 0xff;
    const saltBlock = new Uint8Array(salt.length + intBlock.length);
    saltBlock.set(salt, 0);
    saltBlock.set(intBlock, salt.length);

    let u = hmacSha512(sodium, password, saltBlock);
    const t = new Uint8Array(u);
    for (let j = 1; j < iterations; j++) {
      u = hmacSha512(sodium, password, u);
      for (let k = 0; k < hLen; k++) t[k] ^= u[k]!;
    }
    const offset = (i - 1) * hLen;
    out.set(t.subarray(0, Math.min(hLen, dkLen - offset)), offset);
  }
  return out;
}
