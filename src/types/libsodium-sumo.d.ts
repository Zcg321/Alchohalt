/**
 * [CHORE-TYPECHECK-CLEAN] Ambient augmentation of @types/libsodium-wrappers.
 *
 * The runtime is libsodium-wrappers-sumo (which includes Argon2id +
 * crypto_hash_sha256), but the only type package on npm is
 * @types/libsodium-wrappers (slim). Slim is a superset of sumo for
 * everything except the few SHA-2 primitives, so src/lib/sync/sodium.ts
 * casts the sumo runtime through the slim type. This file extends the
 * slim type with the additional methods the SYNC stack actually calls
 * — keeping `npm run typecheck` clean without disabling strict mode or
 * scattering `as unknown as` casts.
 *
 * Add a method here only after verifying it ships in libsodium-sumo
 * (and not just slim) — otherwise runtime will throw. The methods
 * below are the ones the sync stack uses.
 */

import 'libsodium-wrappers';

declare module 'libsodium-wrappers' {
  /** Compute the SHA-256 digest of `input`. Sumo build only. */
  function crypto_hash_sha256(input: Uint8Array): Uint8Array;
}
