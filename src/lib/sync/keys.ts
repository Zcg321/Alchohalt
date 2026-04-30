/**
 * Key derivation for the cloud-sync layer.
 *
 * Two keys are derived from the user's passphrase:
 *
 *   1. masterKey  — 32 bytes. Encrypts every blob (envelope.ts).
 *                   The server NEVER sees this.
 *   2. authHash   — 32 bytes. Used as the "password" for Supabase
 *                   Auth login. The server stores its own bcrypt hash
 *                   of authHash; it cannot reverse it back to the
 *                   passphrase, and even if it could, authHash !==
 *                   masterKey, so a database leak does not unlock
 *                   ciphertext.
 *
 *  ┌─────────────────────────────────────────────────────────────────┐
 *  │ HARD INVARIANT — the two keys MUST NEVER COLLIDE                │
 *  │                                                                 │
 *  │ Both functions take (passphrase, userSalt). They diverge by     │
 *  │ deriving a *purpose-specific* salt from userSalt + an info      │
 *  │ string, then running Argon2id with that purpose-salt. The       │
 *  │ info strings are constants in this file — alchohalt:master:v1   │
 *  │ and alchohalt:auth:v1 — and are namespaced separately from      │
 *  │ Wend's stack ("wend:..." prefixes elsewhere).                   │
 *  │                                                                 │
 *  │ A test in keys.test.ts asserts deriveMasterKey(p, s) !==        │
 *  │ deriveAuthHash(p, s) for the same (passphrase, salt). Do not    │
 *  │ relax this without re-thinking the threat model.                │
 *  └─────────────────────────────────────────────────────────────────┘
 *
 * Argon2id parameters:
 *   ops = 2 (libsodium INTERACTIVE)
 *   mem = 64 MiB (libsodium INTERACTIVE)
 *   out = 32 bytes (256-bit)
 *
 * Mobile-first: INTERACTIVE puts unlock cost around ~150ms on a
 * 2022-era iPhone. Wend uses MODERATE (~500ms, 256 MiB) — Wend is a
 * desktop-shaped product with one unlock per session; alchohalt's
 * sync runs more often and the threat model differs (no death-prep
 * recovery key on the server side).
 *
 * Salt:
 *   userSalt is 16 bytes (libsodium crypto_pwhash_SALTBYTES). Generated
 *   once per user, stored on the device after onboarding, and uploaded
 *   inside an envelope so multi-device sign-in can recover it. This
 *   module does NOT decide where userSalt is persisted — it only
 *   consumes it.
 */

import { getSodium } from './sodium';

export const KEY_BYTES = 32;
export const SALT_BYTES = 16;

const INFO_MASTER = 'alchohalt:master:v1';
const INFO_AUTH = 'alchohalt:auth:v1';

const enc = new TextEncoder();

/** Some Node test environments (notably Node's `util.TextEncoder`)
 *  return a Uint8Array whose prototype isn't recognized by
 *  libsodium's internal `instanceof Uint8Array` gate. Re-wrapping
 *  with `new Uint8Array(...)` forces the right prototype + a
 *  zero-byteOffset view, which libsodium accepts on every runtime. */
function utf8(s: string): Uint8Array {
  return new Uint8Array(enc.encode(s));
}

async function purposeSalt(
  userSalt: Uint8Array,
  info: string,
): Promise<Uint8Array> {
  if (userSalt.length !== SALT_BYTES) {
    throw new Error(
      `Invalid userSalt length: expected ${SALT_BYTES}, got ${userSalt.length}`,
    );
  }
  const sodium = await getSodium();
  // Generic hash (BLAKE2b), 16-byte output, keyed by the info string so
  // distinct labels produce uncorrelated purpose-salts.
  const infoBytes = utf8(info);
  const userSaltClean = new Uint8Array(userSalt);
  return sodium.crypto_generichash(SALT_BYTES, userSaltClean, infoBytes);
}

async function deriveWithInfo(
  passphrase: string,
  userSalt: Uint8Array,
  info: string,
): Promise<Uint8Array> {
  const sodium = await getSodium();
  const salt = await purposeSalt(userSalt, info);
  return sodium.crypto_pwhash(
    KEY_BYTES,
    passphrase,
    new Uint8Array(salt),
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_ALG_ARGON2ID13,
  );
}

/** Derive the 32-byte master key. Encrypts every blob. NEVER leaves
 *  the device. */
export async function deriveMasterKey(
  passphrase: string,
  userSalt: Uint8Array,
): Promise<Uint8Array> {
  return deriveWithInfo(passphrase, userSalt, INFO_MASTER);
}

/** Derive the 32-byte auth hash. Sent as the Supabase Auth "password".
 *  Server bcrypts it again before storage; even an unbcrypted leak
 *  does not yield masterKey because info+salt differ. */
export async function deriveAuthHash(
  passphrase: string,
  userSalt: Uint8Array,
): Promise<Uint8Array> {
  return deriveWithInfo(passphrase, userSalt, INFO_AUTH);
}

/** Generate a fresh 16-byte salt (libsodium random). Use during the
 *  first sync-enable; persist alongside the encrypted user state. */
export async function generateUserSalt(): Promise<Uint8Array> {
  const sodium = await getSodium();
  return sodium.randombytes_buf(SALT_BYTES);
}

/** Test-only — exposes the info-string constants so a regression test
 *  can pin them. Production callers should not import these. */
export const __infoStrings = { master: INFO_MASTER, auth: INFO_AUTH };
