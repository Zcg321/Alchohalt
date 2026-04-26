# AI Insights — Architecture & Privacy Design

**Status:** v1 architecture wired; network call gated behind
`VITE_ENABLE_AI_INSIGHTS_NETWORK` and `VITE_AI_PROXY_URL`. v1.0 ships
with the consent flow live and the network call disabled. v1.1 ships
the proxy.
**Last updated:** 2026-04-26

---

## Why this document exists

Alchohalt's positioning is **privacy-first, no account, local-only**.
A naïve "send the user's data to an LLM" implementation breaks that
positioning and creates real legal exposure under WA MHMDA, NV SB 370,
CO CPA, and CT CTDPA — all of which classify drink-tracking patterns
as "consumer health data" and require affirmative consent + minimum
necessary processing.

This document is the load-bearing reference for how AI Insights is
allowed to exist inside that positioning. Read this before:

- Adding any new field to the LLM prompt.
- Switching providers.
- Wiring the proxy backend.
- Marketing AI Insights externally.

---

## Data flow

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  Local DB        │       │  Sanitize        │       │  Consent gate    │
│  (Capacitor      │──────▶│  layer           │──────▶│  (zustand        │
│   Preferences)   │       │  (allowlist)     │       │   persist)       │
└──────────────────┘       └──────────────────┘       └──────────────────┘
                                                               │
                                                               ▼
                                             ┌──────────────────────────────┐
                                             │  client.ts: requestAIInsights │
                                             │  - hasValidConsent? -> NO,    │
                                             │    return reason='no-consent' │
                                             │  - networkEnabled? -> NO,     │
                                             │    return 'network-disabled'  │
                                             │  - assertNoForbiddenFields    │
                                             │  - fetch(VITE_AI_PROXY_URL)   │
                                             └──────────────────────────────┘
                                                               │
                                                  fetch(POST)  ▼  body=JSON
                                            ┌─────────────────────────────┐
                                            │  Server proxy (Cloudflare    │
                                            │  Worker / lambda)            │
                                            │  - Holds Anthropic API key   │
                                            │  - Rate-limits by            │
                                            │    payload.instanceId        │
                                            │  - Logs only {ts, instanceId}│
                                            │  - Forwards to Anthropic     │
                                            │  - Strips response of any    │
                                            │    provider-debug fields     │
                                            └─────────────────────────────┘
                                                               │
                                                               ▼
                                                    ┌─────────────────────┐
                                                    │  Anthropic Claude   │
                                                    │  - 30-day retention │
                                                    │  - No training      │
                                                    └─────────────────────┘
```

The two right-side boxes (proxy, Claude) are **not deployed in v1.0**.
The client returns `reason: 'network-disabled'` and the UI shows a
"Coming in v1.1" placeholder. The architecture is reviewable today.

---

## What may leave the device — the complete allowlist

Defined in `src/lib/ai/types.ts` as `SanitizedAIPayload`:

| Field             | Shape                                     | Why it's safe                                |
|-------------------|-------------------------------------------|-----------------------------------------------|
| `schemaVersion`   | `1`                                       | Forward-compat; not user data.                |
| `instanceId`      | 32-char hex, generated at consent         | Anonymous; rotates on revoke. Not linkable.   |
| `weeklyBuckets`   | `{ isoWeek, drinkCount, totalStdDrinks, avgCraving }[]` | ISO week, never raw timestamps; counts only.  |
| `moodTagCounts`   | `Record<MoodTag, number>`                 | One-hot counts of a fixed enum.               |
| `haltCounts`      | `{ hungry, angry, lonely, tired }` ints   | Same.                                         |
| `intentionCounts` | `Record<IntentionTag, number>`            | Same.                                         |
| `dayOfWeekCounts` | `number[7]`                               | Counts only, no timestamps.                   |
| `currentStreakDays` | integer                                 | Aggregate.                                    |
| `locale`          | `'en' \| 'es'`                            | Required for prompt language.                 |

That is the complete list. Anything outside this shape is a bug.

## What may NEVER leave the device

`FORBIDDEN_FIELDS` in `src/lib/ai/types.ts`. Includes (non-exhaustive):

- `notes`, `journal`, `voiceTranscript`, `altAction` — free-text from the user.
- `profile`, `weightKg`, `sex`, `name`, `email`, `phone`, `address`, `location`, `gpsCoordinates` — PII.
- `customDrinkName`, `presetName`, `label` — could include personal references.
- `ts`, `timestamp`, `editedAt` — exact timestamps.
- `id`, `uuid`, `deviceId`, `userId` — re-linking risks.

Two enforcement layers:

1. **Allowlist construction.** `buildSanitizedPayload()` only emits
   the fields above; there is no path that lets a caller smuggle a
   raw entry through.
2. **Defense-in-depth.** `assertNoForbiddenFields()` scans the
   serialized JSON for any forbidden key OR a string value longer
   than 120 characters that looks like prose. Throws on either.

Adversarial tests: `src/lib/ai/__tests__/sanitize.test.ts`. If a
contributor adds a forbidden field via any path, those tests fail.

---

## Consent flow

Defined in `src/lib/ai/consent.ts`. State shape (`AIConsentState`):

```ts
{
  granted: boolean;
  grantedAt: number | null;
  revokedAt: number | null;
  disclosureVersion: number;  // bump to force re-consent
  instanceId: string;          // wiped on revoke; regenerated on grant
  provider: 'anthropic' | null;
}
```

Persisted in `localStorage` under key `alchohalt-ai-consent`. No
account, no server-side consent record — there's no server to put one
on. `hasValidConsent()` is the single check used by both the UI and
the network client.

`disclosureVersion` is the trip-wire for materially-changed disclosures.
If we change what gets sent, we bump `CURRENT_DISCLOSURE_VERSION` and
existing consents become invalid until re-granted.

---

## Provider selection

For v1: **Anthropic Claude.**

Rationale:
- Explicit no-training-on-customer-data policy.
- 30-day retention (short relative to peers).
- Existing internal expertise from sister projects.
- Decent privacy posture and BAAs available if we ever pursue HIPAA.

Hard-coded via the `AIProviderId` type. A user-facing provider switcher
is **deliberately not built** in v1 to avoid analysis paralysis at
consent time.

If we ever add a second provider, consent must be re-prompted — bumping
`CURRENT_DISCLOSURE_VERSION` accomplishes this automatically.

---

## API key handling

**The Alchohalt client bundle does NOT contain an Anthropic API key.**

Static check: grep `ANTHROPIC_API_KEY` across `src/` should produce
zero hits in `src/lib/ai/`.

The `client.ts` module fetches a `VITE_AI_PROXY_URL` that points at a
server-side proxy. The proxy is the only component that holds the
provider API key.

### Why not direct?

Embedding the key in a client bundle (even with build-time obfuscation)
exposes it to anyone who downloads the IPA / APK / web bundle. A
single leaked key would let a third party drain our quota.

### Proxy responsibilities

When the proxy ships in v1.1:

- **Hold** the Anthropic API key in environment variables (rotated
  via the platform's secret store).
- **Validate** request shape — reject anything that doesn't match
  `SanitizedAIPayload`. (Defense-in-depth even though the client
  already sanitizes.)
- **Rate-limit** per `payload.instanceId`: e.g., max 20 requests / day,
  max 200 / month per anonymous instance.
- **Log** only `{ ts, instanceId, status }` — never the prompt body
  or the response. Logs auto-expire at 30 days.
- **Strip** any provider-debug fields from the response before
  returning to the client.

Recommended platform: **Cloudflare Worker.** Free tier handles 100K
requests/day; KV namespace for rate-limit counters; logs auto-expire.

---

## Kill switch

If we ever need to disable AI Insights globally — e.g., a provider
incident, a regulatory event, a compromise — there are three layers:

1. **Server proxy:** delete the worker / set `MAINTENANCE_MODE=true`.
   Client receives `reason: 'proxy-error'` and the UI shows a
   maintenance message. No data egress.
2. **Build flag:** ship a release with `VITE_ENABLE_AI_INSIGHTS_NETWORK=false`.
   Client returns `reason: 'network-disabled'` even with consent on.
3. **Disclosure-version bump:** bump `CURRENT_DISCLOSURE_VERSION`.
   All existing consents become invalid; users see the consent screen
   again before any future call. Use this when we materially change
   what gets sent.

Levels 1 and 2 are immediate; level 3 requires a release.

---

## State law compliance

| State | Statute                                   | Key requirement                                                   |
|-------|-------------------------------------------|-------------------------------------------------------------------|
| WA    | My Health My Data Act (MHMDA, 2024)       | Affirmative explicit consent for "consumer health data" sharing; separate Consumer Health Data Privacy Policy doc; consumer right to delete. |
| NV    | SB 370 (2024)                             | Similar — opt-in for sensitive health data; specific deletion right. |
| CT    | Connecticut Data Privacy Act (CTDPA)      | Sensitive-category opt-in; data-minimization mandate.             |
| CO    | Colorado Privacy Act (CPA)                | Sensitive-data opt-in; universal opt-out signal honored.          |

We satisfy all four with the same architecture — the consent flow IS
the affirmative explicit consent, the allowlist IS the data-minimization
mandate, and the revoke + rotate behavior IS the deletion right.

A separate top-level [Consumer Health Data Privacy Policy](./legal/CONSUMER_HEALTH_DATA_POLICY.md)
document exists to satisfy MHMDA's "separate from your general privacy
policy" rule.

---

## Test coverage

- `src/lib/ai/__tests__/sanitize.test.ts` — adversarial; 36 tests
  covering allowlist shape, forbidden-field exclusion (one test per
  field), free-text-shape detection, mood/intention enum smuggling,
  timestamp leakage, instance-ID generation, empty inputs.
- `src/lib/ai/__tests__/consent.test.ts` — fresh-install, grant,
  revoke, re-grant rotation, `hasValidConsent` matrix.
- `src/lib/ai/__tests__/client.test.ts` — fail-closed: no consent →
  no fetch; flag off → no fetch.

If you add code in `src/lib/ai/`, add tests in the corresponding
`__tests__/` folder. The privacy claim is enforced by tests, not by
code review alone.

---

## Things deliberately NOT built in v1

- Per-call data preview ("here's what would be sent — confirm").
  Replaced by the descriptive consent screen which lists the fields
  in plain English. Add a per-call preview if user research shows
  the descriptive screen isn't sufficient.
- Provider selection UI. See "Provider selection" above.
- On-device LLM. WebLLM / WebGPU is not yet performant enough on
  mid-tier mobile devices to be a v1 fallback.
- Server-side prompt caching. Premature optimization; the proxy
  hasn't shipped yet.

---

## Owner-facing checklist before v1.1 ship

- [ ] Stand up Cloudflare Worker with the proxy responsibilities above.
- [ ] Set `VITE_AI_PROXY_URL` and `VITE_ENABLE_AI_INSIGHTS_NETWORK=true`
      in production build env.
- [ ] Counsel review of the
      [Consumer Health Data Privacy Policy](./legal/CONSUMER_HEALTH_DATA_POLICY.md).
- [ ] Counsel review of the AI Features section in
      [PRIVACY_POLICY.md](./legal/PRIVACY_POLICY.md).
- [ ] Anthropic Privacy Policy URL re-verified at submission time.
- [ ] Update App Store privacy nutrition labels: "Other Data → Linked
      to user (anonymous)" — if AI Insights enabled by default for
      premium. (For v1 it's opt-in even on premium, so the nutrition
      label can stay at "Data Not Collected" for the default case.)
- [ ] WA / NV / CO / CT consent banners verified via QA on each
      jurisdiction's locale.
