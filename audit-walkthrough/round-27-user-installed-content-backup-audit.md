# Round 27-3 — User-installed content backup audit

## Audit question

Are user-installed dictionary entries (custom crisis line, custom drink
presets, custom goals) backed up? Encrypted? Survives reinstall? Survives
device-swap?

## Inventory of user-installed content

What in the data store originates from the user adding their own content
(as opposed to telemetry, defaults, or computed values):

| Content                | Storage path                       | Type            | Audited at       |
|------------------------|------------------------------------|-----------------|------------------|
| Custom crisis line     | `db.settings.userCrisisLine`       | object \| undef | src/store/db.ts:199 |
| Custom drink presets   | `db.presets[]`                     | DrinkPreset[]   | src/store/db.ts:334 |
| Custom advanced goals  | `db.advancedGoals[]`               | AdvancedGoal[]  | src/store/db.ts:333 |
| User-imported entries  | `db.entries[]` (from R10/R27-D)    | Entry[]         | src/store/db.ts:330 |
| Custom satisfaction signals | `db.settings.satisfactionSignals[]` | SatisfactionSignal[] | src/store/db.ts:284 |
| User onboarding diagnostics | `db.settings.onboardingDiagnostics` | object | src/store/db.ts:55 |

## Audit method

The encrypted-backup serializer at `src/lib/encrypted-backup.ts:103`
runs `JSON.stringify(db)` against the entire DB before sealing it
with libsodium XChaCha20-Poly1305 AEAD. This means every JSON-
serializable value in the DB shape is automatically:

  1. **Backed up** — included in the .alch-backup file.
  2. **Encrypted** — sealed with the user's Argon2id-derived key.
  3. **Survives reinstall** — decrypted into the same shape on import.
  4. **Survives device-swap** — file is portable between devices.

The risk model: any field that lives OUTSIDE `db` won't be in the
backup. The audit walks the user-installed content list to confirm
each is inside `db`.

## Per-content audit

### 1. Custom crisis line — `db.settings.userCrisisLine`

- **Storage:** Inside `db.settings`, which is inside `db`. ✅
- **Backed up:** Yes — `JSON.stringify(db)` includes
  `db.settings.userCrisisLine`.
- **Encrypted:** Yes — entire stringified blob is AEAD-encrypted.
- **Round-trip test:** `[R27-3] round-trips a custom user crisis line`
  in `src/lib/__tests__/encrypted-backup.test.ts`.
- **Status:** ✅ Safe.

### 2. Custom drink presets — `db.presets[]`

- **Storage:** Top-level `db.presets`. ✅
- **Backed up:** Yes.
- **Encrypted:** Yes.
- **Round-trip test:** `[R27-3] round-trips custom drink presets`.
- **Status:** ✅ Safe.

### 3. Custom advanced goals — `db.advancedGoals[]`

- **Storage:** Top-level `db.advancedGoals`. ✅
- **Backed up:** Yes.
- **Encrypted:** Yes.
- **Round-trip test:** `[R27-3] round-trips custom advanced goals`.
- **Status:** ✅ Safe.

### 4. User-imported entries — `db.entries[]`

- **Storage:** Top-level `db.entries`. ✅
- **Backed up:** Yes.
- **Encrypted:** Yes.
- **Round-trip test:** Existing `round-trips with the correct
  passphrase` covers this.
- **Status:** ✅ Safe.

### 5. Custom satisfaction signals (R26-1) — `db.settings.satisfactionSignals[]`

- **Storage:** Inside `db.settings`. ✅
- **Backed up:** Yes.
- **Encrypted:** Yes.
- **Round-trip test:** Covered by JSON.stringify on the whole settings
  object; no dedicated unit test (signals are primarily owner-facing
  diagnostics, not user-installed content per se — but the audit
  should still confirm they survive backup).
- **Status:** ✅ Safe.

### 6. User onboarding diagnostics — `db.settings.onboardingDiagnostics`

- **Storage:** Inside `db.settings`. ✅
- **Backed up:** Yes.
- **Status:** ✅ Safe (preserves intent + trackStyle + drinkLogMode
  pick from R27-C, so a device-swap user doesn't see the onboarding
  flow re-fire).

## Cross-cutting concerns

### Things that DON'T survive backup (by design)

These are scoped to the device's local browser and intentionally
not transmitted:

- `localStorage['exp.device-bucket']` — random bucket id used for A/B
  variant assignment. Resets on reinstall, which is the correct
  behavior (a fresh install is effectively a new participant).
- `localStorage['exp.exposures']` — exposure history. Diagnostic-only;
  rotates on storage clear.

These live OUTSIDE `db`. Recommend leaving them out of backup so
device-swap doesn't transplant exposure history that wouldn't apply
to the new device.

### Things that DO survive backup that might surprise the user

- Every `db.entries[]` entry, including notes/journal/voiceTranscript.
  The user is told this on the backup-passphrase prompt; nothing
  silent.
- `db.settings.satisfactionSignals[]`. Owner-facing, but for a
  privacy-paranoid user this is "data they didn't think they were
  storing." Documented in the existing PrivacyHeadline (R26-B).

### Privacy check

The .alch-backup file is sealed before it hits the user's clipboard,
download folder, iCloud, Drive, etc. Any third-party storage
provider sees only ciphertext + KDF parameters + nonce — no plaintext
crisis line, no plaintext goals, no plaintext entries.

The Argon2id work parameter (`MODERATE`) is sized so a 12-character
passphrase resists offline brute-force on commodity hardware for
years. If the user picks a 6-char passphrase (the R-set minimum),
the threat model degrades to "password-spray-feasible" and the user
should be warned. This is documented in `encrypted-backup.ts:87` and
the Settings backup UI surfaces it.

## Findings

✅ All five categories of user-installed content survive a round-trip
through the encrypted backup. New round-trip tests added cover the
three categories that didn't have explicit coverage before R27-3.

No new gaps found. R27-3 audit closes the loop on the "is my custom
content portable?" question for the round-26 ex-competitor user
audit's data-portability concern.

## Owner action items

None blocking. The audit confirms the backup machinery works as
intended for every content type the user installs.

If a future version adds a new top-level user-installed dictionary
(say, `db.customMoods[]` or `db.customTags[]`), repeat this audit:

  1. Confirm storage path is inside `db`.
  2. Add a round-trip test in `encrypted-backup.test.ts`.
  3. Update this doc's inventory table.

The encrypted backup's `JSON.stringify(db)` posture means the only
way to silently break this is to store user content in a side
channel (localStorage, IndexedDB outside the store, etc). Don't.
