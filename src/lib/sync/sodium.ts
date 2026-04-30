/**
 * libsodium runtime accessor.
 *
 * `libsodium-wrappers-sumo` is the runtime — sumo includes Argon2id
 * (`crypto_pwhash`) and the AEAD primitives we need; the slim build
 * does not.
 *
 * Types come from `@types/libsodium-wrappers` (the slim typings, but a
 * strict superset of what sumo exposes for our usages — the cast at
 * the bottom is safe).
 *
 * The WASM blob must initialize before any primitive is callable.
 * `getSodium()` memoizes the ready promise so we only pay the
 * initialization cost once per process.
 */
import sodiumSumo from 'libsodium-wrappers-sumo';
import type sodium from 'libsodium-wrappers';

let readyPromise: Promise<typeof sodium> | null = null;

export function getSodium(): Promise<typeof sodium> {
  if (!readyPromise) {
    readyPromise = sodiumSumo.ready.then(
      () => sodiumSumo as unknown as typeof sodium,
    );
  }
  return readyPromise;
}

/** Test-only escape hatch — drops the cached promise so a fresh test
 *  can verify init paths. */
export function __resetSodiumForTests(): void {
  readyPromise = null;
}
