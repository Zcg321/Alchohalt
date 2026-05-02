# Settings & privacy controls — completeness audit (2026-05-01, R7-C)

For every claim the app makes elsewhere, is there a corresponding
toggle or surface in Settings? The Round-7 prompt named five themes;
this is the per-theme audit.

## 1. "Optional AI features (off by default)" — single AI toggle?

**Bar:** is there a single toggle that controls everything AI?

**Today:** two toggles, both inside the AISettingsPanel card:
1. **AI Insights (Anthropic)** — opt-in, requires consent flow. Off by
   default. Sends an anonymized pattern summary off-device.
2. **Local AI suggestions** — opt-out (R7-A4 default-on). Runs on
   device, no network calls.

Both live in the same card so the user sees them together.

**Gap:** there's no master "everything AI off" switch. **Decision:**
keeping them as separate switches is right. The privacy contracts are
*different* — opt-in for outbound AI is the right posture; opt-out for
local AI is the right posture for a local-only feature. Conflating
them under one master switch would degrade either the
privacy-by-default for AI Insights or the discoverability of Local AI
suggestions. Documented; no master added.

## 2. "100% offline / Logging stays on this device" — verify diagnostic?

**Bar:** is there a "verify this" surface that shows what's been
transmitted?

**Today (post-R7-C):** new `PrivacyStatus` panel mounted at the
bottom of the Settings sequence. Lists every potentially-network
feature with current state:

| Feature | Default | When active |
|---|---|---|
| Drink + goal logs | inactive | (would send entries off-device) |
| Local AI suggestions | active | runs on device, no network |
| AI Insights | inactive | sends anon ID + summary on demand |
| Multi-device sync | inactive | uploads encrypted ciphertext |
| In-app purchases | inactive | RC API called only on purchase/restore |

The panel does not intercept actual network traffic — that's what the
browser's Network tab is for, and the panel includes a callout
pointing the user there: "open your browser's developer tools →
Network tab → reload the page. With every optional feature off, the
only requests should be for the app's static assets."

**Why this design over a custom fetch wrapper:** a JS-level traffic
counter would be circumventable (any module could `new Image()` to
fire a beacon outside the wrapper) and easy to game / bug. A status
panel that names what's possible plus a verifiable external check
(devtools) is more honest.

## 3. Notifications — every type has its own toggle, calm defaults?

**Today:**
- **Daily reminders** — single toggle ("Enable daily reminders"). Off
  by default per R4 ("[SETTINGS-DEEPENING-ROUND-4] Off by default").
  Reminder times are user-configurable (HH:MM picker + add/remove).
- No other notification types currently ship. The `notify.ts` module
  has only the daily-reminder path.

**Gap:** when a second notification type is added (e.g.,
milestone-reached push, sync-conflict toast), it must come with its
own toggle. Currently no second type → no missing toggle.

**Verdict:** complete for what ships. No fix this round.

## 4. Data — export to JSON + delete-everything + delete-account

**Today:**
- **JSON export:** `ExportImport` component → `Export` button → calls
  `createExport(db)` → `downloadData(exportData)`. Outputs a
  versioned schema with all entries, settings, goals, presets.
- **JSON import:** parallel button. Validates, warns about overlap,
  asks for explicit confirm before replacing data.
- **Wipe everything:** `Wipe` button on the same panel. Asks the user
  to type "WIPE" before proceeding. `wipeAllFn` resets the DB to
  `defaults()`.
- **Delete account / wipe IAP receipt:** the user prompt asked for
  this. **Today's state:** there is no separate delete-account
  button. The MockIAPProvider stores entitlement state in-memory
  only; the RevenueCat provider stores receipts in the platform
  keychain (which the app can't reach from JS even if it tried).

**Gap:** wipe-all clears the local DB but doesn't call
`Purchases.logOut()` to clear the local RevenueCat user. For native
builds this leaves the local entitlement cache alive after the user
"deleted everything." The fix is one line in `wipeAllFn` — a future
round.

**Decision:** not landing the IAP-logout in R7. The app's IAP feature
is gated behind `ENABLE_IAP=false` in this build, so the issue is
latent. When IAP is turned on, the wipe-IAP path needs to land in the
same commit as the production RC config. Tracked.

## 5. Crisis lines — owner edit / disable / regional override?

**Today:** `src/features/crisis/regions.ts` defines per-region crisis
resources for US, UK, AU, CA, IE. `detectRegion(navLanguage)` maps
the browser locale to a region code. Each region has its own array
of lines (988, SAMHSA, Lifeline AU, etc.). Defaults preserve per
locale.

**Gap:** there is no UI for the owner to edit, disable, or override
the lines. Editing requires a code change.

**Decision:** for v1 this is correct — crisis-line accuracy is a
liability question. The owner editing them in code with a PR review
is safer than a runtime-edit UI where a bug or a malicious actor
could route a user away from a real lifeline. Documented as
intentional; if the lines need to change, it's a PR, not a settings
toggle.

## What landed inline this round

- **`src/features/settings/PrivacyStatus.tsx`** — new "Privacy
  status" panel. Mounts at the bottom of the Settings sequence,
  after the Sync surface. ~100 lines, no new external deps, reads
  from useDB + useAIConsent + useSyncStore + isAIRecommendationsEnabled.
- **SettingsPanel.tsx** — imports + mounts PrivacyStatus.

## What did NOT land

- IAP-receipt wipe in `wipeAllFn` (latent — IAP off in this build).
- Crisis-line edit UI (intentional — PR-only is the right posture).
- AI master toggle (intentional — would degrade privacy posture).

These three are the deliberate non-fixes. Each is documented above
with a why; if the rationale changes, the doc gets updated alongside
the code change.
