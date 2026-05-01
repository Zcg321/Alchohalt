# Code-quality audit — 2026-05-01

Branch: `claude/quirky-goldwasser-fd5b5a` (audit work) → origin/main
Pre-audit baseline: origin/main `3331519` (Lighthouse 100 / 100 / 100 / 100 / 97)

## Tooling run

| Tool | Pre-audit | Post-audit |
|------|-----------|------------|
| `npm run lint` | 3 errors / 45 warnings | **0 errors / 44 warnings** |
| `npm run typecheck` | 6 errors | **0 errors** |
| `npm test` | 480 pass / 1 skip | **470 pass / 1 skip** (10 fewer — see below) |
| `npx madge --circular src/` | 4 cycles | 4 cycles (all type-only or runtime-safe) |
| `npx ts-prune` | 97 unused exports | ~85 (12 dropped via dead-code commits) |

The lower test count is intentional: the audit removed three dead
features (`_deprecated/community-challenges`, the orphan
`QuickActions.tsx + MoodTracker.tsx` chain, and the orphan
`IconThemeManager.tsx`) along with their auto-generated smoke tests.
No coverage was lost on live code paths.

## What axe / Lighthouse missed (and we found)

### 1. SYNC-branch typecheck + lint regressions
`dbBridge.test.ts` had four `addEntry({ … })` fixtures using fields
(`drinkType`, `volumeMl`, `cravingLevel`, `altActionUsed`, `coping`)
that don't exist on the `Entry` type — copy-paste from a different
schema. `mnemonic.ts` reached for `crypto_hash_sha256` against the
slim `@types/libsodium-wrappers`, which doesn't expose it. Two
`react/no-unescaped-entities` errors in tab copy.

**Fix:** retyped `getSodium()` against `libsodium-wrappers-sumo`
itself (the actual runtime), trimmed the ghost fields out of the
test, fixed the apostrophes. `[AUDIT-2026-05-01-A]`

### 2. Orphan code carrying real costs
`ts-prune` plus a manual import-graph trace surfaced a chain of code
that had no live callers but was still being shipped:

- `src/features/_deprecated/community-challenges/` — three files,
  ~290 lines, no importers. Marked deprecated, never deleted.
- `src/features/insights/QuickActions.tsx` — no importers (imported
  ONLY by its smoke test). It in turn was the only importer of:
- `src/features/mood/MoodTracker.tsx` — which was actively writing
  `'mood-entries'` to `localStorage` on every submit, but **nothing
  reads them back**. Silent orphan PII writes accumulating on user
  devices. The `EnhancedMoodTracker` (which IS wired up) uses an
  entirely different schema and is the canonical mood surface.
- `src/features/icon-themes/IconThemeManager.tsx` — orphan, no
  importers; also wrote its own `localStorage` key.

**Fix:** removed all four. `[AUDIT-2026-05-01-B]`

### 3. The fake-analytics PII pump
`src/features/analytics/analytics.ts` was a "we'll wire it later"
development stub disguised as a working analytics service. Five
files (DrinkDiscovery, PersonalizedDashboard, EnhancedMoodTracker,
SubscriptionManager, PremiumWellnessDashboard) called
`useAnalytics().track*(...)` to record drink type, volume, mood,
intensity, subscription action, page views — keyed by a generated
`analytics-user-id` stored in `localStorage`.

There is **no upload destination** — the inline comment literally
reads:

```
// In a real implementation, you would send to your analytics service
// For now, we'll store locally for demo purposes
```

So the events accumulated forever in `localStorage` with no rotation,
no cap, no UI to view, no UI to clear. Every drink the user logged
generated a record they could not see, on a device-persistent fake
"user-id" that survived clears. This contradicts the Sprint 2 voice
note "data stays on device" (commit `0544837 [VOICE-6]`) — the data
never leaves, but it's silently piling up locally.

**Fix:** rewrote the module as a true no-op shim. The same public API
(`analytics.track`, `useAnalytics`, `measurePerformance`) compiles
cleanly so callers don't break, but every method now either does
nothing or logs to `console.debug` in dev. If real analytics ever
ship, do it with explicit opt-in, a "view & clear" UI, and storage
through the Preferences-backed `lib/storage.ts` helpers (TTL'd).
`[AUDIT-2026-05-01-C]`

### 4. Direct localStorage usage with no guardrail
The Capacitor.Preferences shim (`src/shared/capacitor.ts`, commit
`a97b424`) gives every consumer a single API that works on web AND
inside the iOS / Android WebView. But there was no eslint rule
keeping consumers honest, and three files had drifted to direct
`localStorage`:

- `analytics.ts` — covered above.
- `services/theme.ts` — wrote `'alchohalt-theme'` on every theme
  change. Nobody reads it back; theme persists via the proper
  zustand+Preferences path. Removed.
- `app/PWAInstallBanner.tsx` — the install dismissal flag. This is
  legitimately web-only (Capacitor's WebView never fires
  `beforeinstallprompt`), so direct `localStorage` here is fine —
  but documented so the intent is auditable.

**Fix:** added an `eslint no-restricted-syntax` rule that bans
`localStorage.*` and `window.localStorage.*` in `src/`, with
overrides for the shim itself, the PWA banner, and tests. The next
drift is an error at lint time. `[AUDIT-2026-05-01-C]`

### 5. Production code is clean of `as any` / suppressions
86 `as any` matches across the repo, but **0** in production code —
all are in `__tests__/`, `test/stubs/`, or `.test.ts` files. The
only file-level `eslint-disable @typescript-eslint/no-explicit-any`
in production code is `src/store/db.ts`, which is justified by
zustand persist's storage adapter typing.

No `@ts-ignore` / `@ts-nocheck` / `@ts-expect-error` in production
code.

## Remaining warnings (pre-existing, not addressed)

44 `max-lines-per-function` warnings on long components. The
threshold is 80 lines and most violators are in 100–350 line range
(SyncPanel: 345, PremiumWellnessDashboard: 350,
PremiumDataExport: 196). A refactor sweep would help readability but
is its own task — the audit did not touch them.

## Madge cycles (all benign)

Madge reports four import cycles:

```
1) store/db.ts > lib/migrate.ts        (type-only on migrate side)
2) store/db.ts > lib/notify.ts         (notify uses useDB.getState())
3) store/db.ts > lib/stats.ts          (type-only on stats side)
4) features/crisis/CrisisResources.tsx > features/crisis/regions.ts
   (type-only on regions side)
```

Three of the four are pure `import type` cycles that TypeScript
strips at runtime. Cycle (2) is a real runtime cycle but all useDB
references are inside function bodies (`useDB.getState()` in the
notify failure handler), so module-init order doesn't matter. Worth
flagging in the audit but no live bug.

## Net effect

| | Before | After |
|--|--|--|
| Lint errors | 3 | **0** |
| Typecheck errors | 6 | **0** |
| Lines of dead code shipped | ~1,400 | 0 |
| Direct `localStorage` calls in `src/` | 21 | 4 (all in shim or PWA banner, eslint-guarded) |
| Silent PII writes per session | many | 0 |
