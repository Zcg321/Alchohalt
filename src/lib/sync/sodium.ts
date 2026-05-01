/**
 * libsodium runtime accessor.
 *
 * `libsodium-wrappers-sumo` is the runtime — sumo includes Argon2id
 * (`crypto_pwhash`), the AEAD primitives, and SHA-256 (used for the
 * BIP-39 mnemonic checksum). The slim `libsodium-wrappers` package
 * does NOT export `crypto_hash_sha256`, so we type against sumo's own
 * declarations.
 *
 * The WASM blob must initialize before any primitive is callable.
 * `getSodium()` memoizes the ready promise so we only pay the
 * initialization cost once per process.
 */
import sodiumSumo from 'libsodium-wrappers-sumo';
import type * as sumoTypes from 'libsodium-wrappers-sumo';

export type Sodium = typeof sumoTypes;

let readyPromise: Promise<Sodium> | null = null;

export function getSodium(): Promise<Sodium> {
  if (!readyPromise) {
    readyPromise = sodiumSumo.ready.then(() => sodiumSumo as unknown as Sodium);
  }
  return readyPromise;
}

/** Test-only escape hatch — drops the cached promise so a fresh test
 *  can verify init paths. */
export function __resetSodiumForTests(): void {
  readyPromise = null;
}
