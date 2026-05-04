# R23-E — CSP `style-src` investigation

**Date**: 2026-05-03
**Question**: Can we drop `'unsafe-inline'` from CSP `style-src`
entirely by way of Vite + Tailwind JIT?

## TL;DR

No, not yet — but R23-E ships a **CSP Level 3 split** that gets us
80% of the defense-in-depth benefit immediately.

- `style-src-elem 'self' 'sha256-…'` (no `'unsafe-inline'`) blocks
  inline `<style>` injection on Chrome 90+ / Firefox 109+ / Safari
  15.4+ — the realistic XSS payload surface for stylesheet abuse.
- `style-src-attr 'unsafe-inline'` remains because React's `style={}`
  prop renders to inline `style=""` attributes. Removing this without
  rewriting every progress bar is a months-long refactor.
- `style-src 'self' 'unsafe-inline' 'sha256-…'` is left as the legacy
  fallback for browsers that ignore Level 3 directives.

## What forces inline-style attributes

`grep -rn "style={{ " src --include="*.tsx" | wc -l` → **14 sites**.

| Site | Reason |
|---|---|
| `progressCards.tsx` (3 ×) | Goal/streak/budget progress-bar widths from runtime data |
| `Goals.tsx`, `Spending.tsx` | Day / week / month progress bars |
| `analytics/tiles/HALTCorrelationsTile.tsx` | Correlation strength bars |
| `analytics/tiles/WeeklyPatternsTile.tsx` | Hour-of-day average bars |
| `drinks/DrinkList/DayGroup.tsx` | Day total vs limit bar |
| `goals/GoalCard.tsx` | Per-goal progress |
| `insights/TagExplorer.tsx` | Tag-frequency bar heights |
| `mood/moodSteps.tsx` | Stepper progress |
| `drinks/DrinkDiscoveryCard.tsx` | Per-drink color swatch |
| `styles/DevTokensPreview.tsx` | Dev-only token preview |

Every one is a value the browser computes from runtime data. None
are hash-able ahead of time.

## Options considered

### 1. Tailwind JIT with dynamic `w-[NN%]` arbitrary values

Tailwind 3.x JIT scans source for class strings. `w-[50%]` works in
source code, but **runtime-computed** classes (`` `w-[${pct}%]` ``)
do **not** trigger JIT generation — Tailwind only sees literal
substrings during the build. The class wouldn't ship.

A safelist with all 1% increments (`w-[0%]`, `w-[1%]`, …, `w-[100%]`)
plus equivalent height utilities would inflate CSS by ~30 KB and
still cap at integer percentages. Not worth it for a paywall on
inline styles.

### 2. CSS custom properties

```tsx
<div style={{ '--w': `${pct}%` }} className="w-[var(--w)]" />
```

The `style=""` attribute still gets set inline. Browsers don't
distinguish "inline style sets a variable" from "inline style sets
a width" — both fall under `style-src-attr`. No CSP benefit.

### 3. CSS `attr()` typed reads (Chrome 133+)

```css
.bar { width: attr(data-pct percentage, 0%); }
```

Targets `<div data-pct="50">` instead of `<div style="width:50%">`,
moving the dynamic value from a `style` attribute to a `data-*`
attribute. CSP no longer cares.

**Browser support**: Chrome 133+ shipped Feb 2026; Firefox + Safari
have not. Anywhere from 6 months to 2 years before we can ship this
without a polyfill. **Defer to round 28+**.

### 4. CSP nonces via Vercel middleware

A per-request nonce injected into every inline `style=""` attribute
would let us drop `'unsafe-inline'` entirely (from `style-src-attr`
too). Requires:

- Vercel edge middleware to inject the nonce into HTML at request
  time
- A React-side patch to add `nonce={…}` on every dynamic style site
  (or a global wrapper)
- Cache invalidation per request (nonces must be unique per
  response; cached HTML breaks)

Trade-off: kills static-asset caching for `index.html`. The PWA
cold-start budget (R20-1) was tuned around aggressively-cached HTML;
moving to nonces would push initial paint by ~80–150ms on the
70th-percentile mobile connection. **Not worth it for the marginal
defense-in-depth this adds beyond the R23-E split.**

### 5. style-src-elem / style-src-attr split (CHOSEN)

CSP Level 3 lets us specify two separate directives:

- `style-src-elem`: applies to `<link rel="stylesheet">` and inline
  `<style>` blocks (the dangerous channel — XSS payloads can do
  `document.head.appendChild(<style>…body{display:none}</style>)`)
- `style-src-attr`: applies to `style=""` attribute (the React
  surface we can't avoid)

The split lets us tighten the dangerous side without breaking the
forced side. Result:

| Before (R20-A) | After (R23-E) |
|---|---|
| `style-src 'self' 'unsafe-inline' 'sha256-…'` | `style-src 'self' 'unsafe-inline' 'sha256-…'` (legacy fallback, unchanged) |
| — | `style-src-elem 'self' 'sha256-…'` (NO `'unsafe-inline'`) |
| — | `style-src-attr 'unsafe-inline'` |

XSS scenarios this newly blocks on modern browsers:

1. `document.write('<style>...</style>')` injection
2. `el.innerHTML += '<style>...</style>'` injection
3. CSS stylesheet imports from non-`'self'` origins

What still works (necessary):

1. React `style={{ width: '50%' }}` rendering
2. Inline `<style>` block in `index.html` (matches sha256 hash)
3. Tailwind-built `index.css` (matches `'self'`)

## Rollout

The split header lands in both:

- `vercel.json` — the production-authoritative HTTP CSP header
- `index.html` `<meta http-equiv>` — the fallback for hosts that
  don't apply the Vercel header (Capacitor WebView, file://, local
  static-server smoke)

Both stay in sync per the existing R19-5 / R20-A conventions.

## Test pinning

`src/__tests__/security-headers.test.ts` extended with 4 new
assertions:

- `style-src-elem` contains `'self'` + the splash hash
- `style-src-elem` does **not** contain `'unsafe-inline'`
- `style-src-attr` keeps `'unsafe-inline'`
- The legacy `style-src` fallback is unchanged from R20-A

## Verdict

R23-E ships incremental defense-in-depth without breaking anything.
A future round 28+ should re-investigate option (3) once Firefox +
Safari ship CSS `attr()` typed reads — at that point the inline-style
sites can migrate to `data-*` attributes and we can drop
`'unsafe-inline'` from `style-src-attr` as well.

**Status**: ✅ Shipped. No regressions; bundle / perf untouched.
