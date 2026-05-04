# Round 23 — Real NVDA-equivalent a11y tree dump

Date: 2026-05-03
Tooling:
- `e2e/a11y-tree-dump.spec.ts` — Playwright spec that drives Chrome
  at the dev server, calls `page.accessibility.snapshot()` to get
  the real Chromium accessibility tree (the same tree NVDA reads
  via IAccessible2 on Windows), and dumps per-surface JSON to
  `e2e/a11y-snapshots/`. Asserts structural minimums per surface.
- `src/__tests__/a11y-tree-dump.test.tsx` — vitest-side companion
  that runs in jsdom on every PR and pins landmark + label
  assertions for the surfaces hardened by R22-2 + R23-A through
  R23-D.

## Why this judge

R22-2 ran a JS-emulated AccName walk in jsdom. The protocol caught
the duplicate skip-link issue because the structural problem was
visible in the markup. But jsdom approximates the AT tree via
hand-rolled name resolution; it doesn't replicate Chromium's:

- `display: none` pruning from media queries (the dual mobile /
  desktop tablists rely on this)
- `aria-hidden` ancestor inheritance into the computed tree
- AccName algorithm edge cases (visited links, empty strings,
  overlapping `aria-labelledby` references)

Real NVDA reads the platform a11y API tree, which on Windows is
IAccessible2 backed by the Chromium accessibility tree. The
closest available proxy is `page.accessibility.snapshot()` from
Playwright — same source tree.

## Per-surface dump protocol

For each tab (Today / Track / Goals / Insights / Settings):

1. Load the app at `/` with the `day7` persona fixture (so trees
   exercise populated paths, not just empty states).
2. Wait for `[role="tablist"]` to mount.
3. Click the tab via `page.getByRole('tab', { name })` — same
   navigation path NVDA users take.
4. Wait 500ms for async surfaces (Insights worker) to resolve.
5. `await page.accessibility.snapshot({ interestingOnly: false })`
   to get the full tree (including nodes Chromium would normally
   prune as "uninteresting" for performance).
6. Save the JSON to `e2e/a11y-snapshots/<surface>.json`.
7. Walk the tree counting roles, find unnamed interactive nodes,
   collect tab-list names.
8. Assert structural minimums:
   - At least one landmark (`role="main"` or `role="region"`).
   - Fewer than 2 interactive nodes without an accessible name
     (budget for the rare Chromium tablist-container node some
     versions expose unnamed).
   - All 5 tab labels present in the tree.

## Findings

### NONE — every surface passes the structural minimums

Running the spec locally against the day7 fixture, all five tabs
produce trees that satisfy:

- ≥1 landmark per surface (the `<main id="main">` from each tab
  component, plus `<nav>` for SettingsJumpNav on Settings).
- 0 unnamed interactive nodes on Today, Track, Goals, Insights,
  Settings.
- Tab list announces all 5 names: Today, Track, Goals, Insights,
  Settings.

The dumped JSON for each surface is committed to `.gitignore`'d
`e2e/a11y-snapshots/` (CI artifact only — review-time aid, not a
source-of-truth). The structural assertions in the spec itself are
the regression guard.

### NONE — R23-A/B/C/D additions all clean

The four R23 features each introduce new interactive nodes that
the dump exercises:

- **R23-A** progressCards i18n — translated headings/labels appear
  with their translated `name` in the tree (no fallback to the
  English source visible).
- **R23-B** SettingsJumpNav — `<nav aria-label="Jump to section">`
  exposes role=navigation with the aria-label as its accessible
  name; 6 anchors expose role=link with their localized chip
  labels.
- **R23-C** Decide-later chip — exposes role=button with the
  `Decide later` accessible name (or its translated form). Tab
  order places it after the 3 primary chips, before the
  just-looking link, matching the visual order.
- **R23-D** QuickLogChips — exposes role=group with the
  "Quick log a drink" aria-label, then 3 buttons with names
  "Beer / Wine / Cocktail" + the "Tap to log" subhead in the
  accessible description.

### MINOR (kept) — InsightsWorker placeholder uses aria-busy

While Playwright snapshots are taken after the 500ms wait, the
spec sometimes captures the placeholder skeleton on a slow run.
The `<div aria-busy="true" aria-live="polite">` exposes itself
correctly to AT users (sr-only "Computing your insights…" label),
but the placeholder screenshot is visual noise in a dump. Consider
adding a `waitFor('[data-testid="progress-loading"]', { state:
'detached' })` step before the snapshot in a future iteration.

### MINOR (kept) — Drink-list day groups have heading inflation

The Track tab's DayGroup component emits an `<h4>` per day. With
the day7 fixture (~7 days of entries) this produces 7 h4 headings
inside the tab panel. NVDA users navigating by heading hit each
day separately — useful, not noise — but the tree has more h4
density than other surfaces. Not actionable for R23; flagged for
the heading-hierarchy judge if it ever runs again.

### NONE — Skip-link is a singleton

The R22-2 fix held: exactly one `<a href="#main">` exists in the
tree. The duplicate skip-link regression is now pinned by both the
existing `skip-link.test.tsx` and the new `a11y-tree-dump.test.tsx`
assertion.

## What this judge catches that the other 22 don't

The Chromium-tree-vs-jsdom-tree gap. Three classes of issue would
have been invisible to R22-2's walk and visible to R23-2's:

1. **Media-query-driven duplicate role exposure.** A bug where
   both DesktopTablist + MobileTablist somehow render at the same
   viewport (e.g. a Tailwind regression that breaks `lg:hidden`)
   would expose 2 sets of 5 tabs in the tree. R22-2's jsdom walk
   wouldn't see the prod CSS; R23-2's Chromium snapshot does.
2. **`aria-hidden` ancestor inheritance bugs.** A wrapper that
   accidentally sets `aria-hidden="true"` on its parent removes
   the entire subtree from the AT view. jsdom's role queries work
   on the markup; Chromium's snapshot reflects what's actually
   exposed.
3. **AccName algorithm edge cases.** Empty `aria-labelledby`
   references, circular labelled-by chains, naming through
   `<title>` elements — Chromium's implementation is the spec;
   jsdom's hand-rolled equivalent diverges.

## Process notes

The Playwright spec doesn't run as part of `npm test` (matches the
existing convention — perf specs are also opt-in). It runs:
- Locally via `npx playwright test e2e/a11y-tree-dump.spec.ts`
- In CI via the existing `.github/workflows/playwright.yml`
  workflow which runs all `*.spec.ts` files under `e2e/`

The vitest-side companion (`src/__tests__/a11y-tree-dump.test.tsx`)
runs on every PR via the standard verify chain. The Playwright dump
is the deeper verification; the vitest assertions are the every-PR
guard.

## Tests added

- `e2e/a11y-tree-dump.spec.ts` — 5 Playwright tests (one per tab).
- `src/__tests__/a11y-tree-dump.test.tsx` — 7 vitest tests pinning
  landmark + label minimums.

Net: tests +12 (5 Playwright + 7 vitest) for the round-23 a11y
tree-dump judge.

## What R23-2 didn't fix (deferred to R24)

- **Real NVDA + JAWS + VoiceOver pass on physical devices.** The
  Playwright snapshot is the closest software-side proxy; it
  doesn't catch:
    - Pronunciation issues ("AF" → "ay-eff" vs "ahf")
    - Focus-order discrepancies between rendered DOM order and
      visual order in flexbox
    - Announcement-timing bugs (rapid toast updates clobbering
      each other in `polite` live regions)
- **Mobile-viewport tree dump.** The Playwright config uses
  Desktop Chrome only. A second project for iOS Safari + Android
  Chrome with their respective AT trees (VoiceOver / TalkBack)
  would catch mobile-specific regressions.
- **Persona-shifted dumps.** Currently only `day7`. Day0 (empty
  states), day30 (mid-game), and recovery (post-slip) trees may
  expose surface-specific issues that day7 doesn't.
