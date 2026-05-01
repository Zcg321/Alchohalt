# Performance audit — 2026-05-01

## Headline

**Eager-load bundle dropped 568 KB raw (–68%)** — from 839 KB to
272 KB. libsodium-wrappers-sumo (~400 KB) was being shipped to
every visitor on every page load even though it's only used by the
Sync feature, which most users never enable.

| | Before | After |
|--|--|--|
| `vendor-*.js` | 558 KB | **21 KB** |
| `react-*.js` | 136 KB | 136 KB |
| `index-*.js` | 144 KB | **114 KB** |
| **Eager total (raw)** | **839 KB** | **271 KB** |
| **Eager total (gzip)** | ~250 KB | **~83 KB** |
| `SyncPanel-*.js` (lazy) | — | 564 KB / 198 KB gz |

The user only pays for libsodium when they navigate to Settings.
A user who never opens Settings — the majority — never downloads
the WASM-and-bindings bundle.

## Where the regression came from

Vite's `manualChunks` rule in `vite.config.ts` was:

```js
manualChunks(id) {
  if (id.includes('node_modules')) {
    if (id.includes('react')) return 'react';
    if (id.includes('capacitor')) return 'capacitor';
    if (id.includes('recharts')) return 'charts';
    if (id.includes('lodash')) return 'lodash';
    if (id.includes('date-fns') || id.includes('dayjs')) return 'date';
    if (id.includes('lucide-react') || id.includes('@heroicons')) return 'icons';
    return 'vendor';   // ← libsodium fell through to here
  }
}
```

The default-to-vendor fallback is fine for libraries that everyone
uses (zustand, nanoid). But it forcibly groups any node_module into
the eager `vendor` chunk **even when the only consumer is itself a
lazy chunk**. libsodium → fell into vendor → got pre-loaded with
the entry, even though the only import path that reaches it is
through the Sync surface.

Compounding that: the import chain into Sync was eager too.
`AlcoholCoachApp.tsx` imports `SettingsTab` directly →
`SettingsTab` imports `SettingsPanel` → `SettingsPanel` imported
`SyncPanel` directly → `SyncPanel` imports
`features/sync/keys.ts + mnemonic.ts` → those import
`lib/sync/sodium.ts` → sodium.

So even **without** the manualChunks bug, libsodium would have
landed in the eager `index-*.js` chunk because the import chain
was synchronous all the way down.

## Fixes shipped

### Lazy-load SyncPanel `[AUDIT-2026-05-01-E]`

```tsx
// src/features/settings/SettingsPanel.tsx
const SyncPanelLazy = React.lazy(async () => {
  const [{ default: SyncPanel }, { MockSyncTransport }] = await Promise.all([
    import('../sync/SyncPanel'),
    import('../../lib/sync/transport'),
  ]);
  const transport = new MockSyncTransport();
  return { default: () => <SyncPanel transport={transport} /> };
});

// …
<Suspense fallback={<Skeleton className="h-48 w-full rounded-2xl" />}>
  <SyncPanelLazy />
</Suspense>
```

This breaks the static dependency from SettingsPanel into the sync
module tree. `MockSyncTransport` is also imported inside the lazy
factory so it doesn't drag the eager bundle.

### Carve out heavy libs from `manualChunks`

```js
if (id.includes('libsodium')) return undefined;   // → live in async chunk
if (id.includes('jspdf')) return undefined;       // → live in async chunk
```

`return undefined` from `manualChunks` lets Rollup put the library
in whichever async chunk imports it, instead of bucketing into the
eager `vendor` chunk.

## What's still in the eager bundle

| Chunk | Raw | Gzip | What's there |
|--|--|--|--|
| `react-*.js` | 136 KB | 44 KB | React 18.2 + ReactDOM. Hard floor. |
| `index-*.js` | 114 KB | 32 KB | TodayHome + TabShell + drinks + goals + onboarding + dataflow + AlcoholCoachApp |
| `vendor-*.js` | 21 KB | 8 KB | zustand, nanoid, small misc |
| `index-*.css` | 98 KB | 15 KB | Tailwind output (purged) |

83 KB of JS gzipped is excellent for a feature-rich PWA.

## What lazy-loads correctly already

These lazy-load via `React.lazy(() => import('…'))` and ship as
their own small chunks:

- `EnhancedMoodTracker` — 8.8 KB
- `InsightsPanel` — 9.8 KB
- `DrinkDiscovery` — 10.4 KB
- `DrinkForm` — 7.4 KB
- `AdvancedGoalSetting` — 7.4 KB
- `ProgressVisualization` — 8.4 KB
- `recharts` — via `LazyRecharts` Proxy in `src/shared/charts.tsx`,
  pulled into 4 different chart features

## What could still be lazy-loaded (filed, not shipped)

- `PremiumWellnessDashboard` (5.3 KB) — already lazy.
- `PremiumDataExport` / `PremiumMoodTracking` —
  imports `jspdf` (now in its own async chunk per the carve-out
  above, but the components themselves are eager). If ts-prune is
  right that these have no live importers, they may be removable
  entirely.

## CSS

98 KB raw / 15 KB gz. Tailwind purges aggressively; this is fine.
`cssCodeSplit: true` is already on so per-route chunks pull only
the styles they need.

## Service worker

Workbox precaches 41 entries (~1023 KiB). The SyncPanel chunk is
in there too — once a Sync user fetches it, subsequent loads are
instant from cache. Acceptable.

## Recommendation: bundle size budget

`size-limit` config exists. Suggest setting:

| Asset | Limit |
|--|--|
| Eager JS (gzip) | 100 KB |
| Total initial JS (gzip) | 130 KB |
| Largest async chunk | 250 KB |

This pass leaves us comfortably under all three.
