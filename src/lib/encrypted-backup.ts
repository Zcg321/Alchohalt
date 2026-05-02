/**
 * Encrypted local backup — libsodium client-side .alch-backup file format.
 *
 * Owner-locked spec: "libsodium client-side + .alch-backup file format.
 * Owner can save to Files / iCloud / Drive themselves."
 *
 * Threat model:
 *   - User wants to back up their drink history off-device (Files, iCloud,
 *     Google Drive, USB stick) without trusting that storage tier with
 *     plaintext mood/HALT/journal data.
 *   - User chooses a backup passphrase. We derive a 32-byte key via
 *     Argon2id (MODERATE limits) and encrypt the JSON payload with
 *     XChaCha20-Poly1305 AEAD.
 *   - Server NEVER sees this. Never. The whole point of a privacy-first
 *     app is that "backup" doesn't mean "upload to our cloud."
 *
 * File format (v1):
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ "ALCH-BACKUP-V1\n"            ASCII magic + version          │
 *   │ <kdf params JSON>\n           algorithm/opslimit/memlimit/salt│
 *   │ <nonce base64>\n              24-byte XChaCha20 nonce         │
 *   │ <ciphertext base64>           AEAD-sealed JSON payload        │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Versioned for forward compatibility. v2 may add password hint, etc.
 */

import sodium from 'libsodium-wrappers-sumo';
import type { DB } from '../store/db';

const MAGIC = 'ALCH-BACKUP-V1';
const KEY_BYTES = 32;
const SALT_BYTES = 16;

export interface KdfParams {
  algorithm: 'argon2id';
  opsLimit: number;
  memLimit: number;
  saltB64: string;
}

let sodiumReady: Promise<typeof sodium> | null = null;
function getSodium(): Promise<typeof sodium> {
  if (!sodiumReady) sodiumReady = sodium.ready.then(() => sodium);
  return sodiumReady;
}

function generateKdfParams(s: typeof sodium): KdfParams {
  const salt = s.randombytes_buf(SALT_BYTES);
  return {
    algorithm: 'argon2id',
    opsLimit: s.crypto_pwhash_OPSLIMIT_MODERATE,
    memLimit: s.crypto_pwhash_MEMLIMIT_MODERATE,
    saltB64: s.to_base64(salt, s.base64_variants.ORIGINAL),
  };
}

async function deriveKey(
  passphrase: string,
  params: KdfParams,
): Promise<Uint8Array> {
  const s = await getSodium();
  const salt = s.from_base64(params.saltB64, s.base64_variants.ORIGINAL);
  if (salt.length !== s.crypto_pwhash_SALTBYTES) {
    throw new Error('Backup file salt is the wrong length.');
  }
  return s.crypto_pwhash(
    KEY_BYTES,
    passphrase,
    salt,
    params.opsLimit,
    params.memLimit,
    s.crypto_pwhash_ALG_ARGON2ID13,
  );
}

/**
 * Encrypt the user's DB into a .alch-backup file body (string).
 *
 * Throws if the passphrase is empty (we don't want a zero-strength
 * passphrase silently sealing real data).
 */
export async function encryptBackup(
  db: DB,
  passphrase: string,
): Promise<string> {
  if (!passphrase || passphrase.length < 6) {
    throw new Error(
      'Backup passphrase must be at least 6 characters. Pick something you can remember.',
    );
  }
  const s = await getSodium();
  const params = generateKdfParams(s);
  const key = await deriveKey(passphrase, params);
  const nonce = s.randombytes_buf(
    s.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES,
  );

  // libsodium has a strict type guard on its message arg. Pass a
  // string directly (it accepts string|Uint8Array); the SDK does
  // its own UTF-8 encode internally.
  const ciphertext = s.crypto_aead_xchacha20poly1305_ietf_encrypt(
    JSON.stringify(db),
    null,
    null,
    nonce,
    key,
  );
  // Wipe the derived key out of working memory.
  key.fill(0);

  const lines = [
    MAGIC,
    JSON.stringify(params),
    s.to_base64(nonce, s.base64_variants.ORIGINAL),
    s.to_base64(ciphertext, s.base64_variants.ORIGINAL),
  ];
  return lines.join('\n');
}

/**
 * Decrypt a .alch-backup file body back into a DB. Throws on:
 *   - wrong magic header (not our format / wrong version)
 *   - malformed structure (missing lines, bad base64, bad JSON params)
 *   - wrong passphrase (AEAD MAC fails — no oracle for password guessing
 *     other than the Argon2id work)
 */
export async function decryptBackup(
  file: string,
  passphrase: string,
): Promise<DB> {
  if (!passphrase) throw new Error('Passphrase required.');
  const lines = file.split('\n');
  if (lines.length < 4) throw new Error('Backup file is malformed.');
  const [magic, paramsLine, nonceLine, ciphertextLine] = lines;
  if (!magic || !paramsLine || !nonceLine || !ciphertextLine) {
    throw new Error('Backup file is malformed.');
  }
  if (magic !== MAGIC) {
    throw new Error(
      `Unsupported backup format. Expected ${MAGIC}, got "${magic.slice(0, 32)}".`,
    );
  }
  let params: KdfParams;
  try {
    params = JSON.parse(paramsLine) as KdfParams;
  } catch {
    throw new Error('Backup file KDF params are corrupted.');
  }
  if (params.algorithm !== 'argon2id') {
    throw new Error(`Unsupported KDF algorithm: ${params.algorithm}`);
  }

  const s = await getSodium();
  const nonce = s.from_base64(nonceLine, s.base64_variants.ORIGINAL);
  const ciphertext = s.from_base64(
    ciphertextLine,
    s.base64_variants.ORIGINAL,
  );
  const key = await deriveKey(passphrase, params);

  let plaintext: Uint8Array;
  try {
    plaintext = s.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      ciphertext,
      null,
      nonce,
      key,
    );
  } catch {
    key.fill(0);
    throw new Error(
      'Could not decrypt backup. Wrong passphrase, or the file has been tampered with.',
    );
  }
  key.fill(0);

  const text = new TextDecoder().decode(plaintext);
  let parsed: DB;
  try {
    parsed = JSON.parse(text) as DB;
  } catch {
    throw new Error('Backup decrypted but the contents are not valid JSON.');
  }
  return parsed;
}

/** Trigger browser download of a .alch-backup file. */
export async function downloadBackup(
  db: DB,
  passphrase: string,
  filename?: string,
): Promise<void> {
  const body = await encryptBackup(db, passphrase);
  const blob = new Blob([body], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download =
    filename ??
    `alchohalt-${new Date().toISOString().slice(0, 10)}.alch-backup`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
