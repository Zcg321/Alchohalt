# Round 12 — npm vulnerability audit (2026-05-02)

Round 11 owner-blocking item: high-severity npm vulnerabilities on
`vite-plugin-pwa`, `workbox-build`, `tar`. R12-C audits each for actual
exploitability in our config, then either fixes or documents acceptance.

## Baseline (pre-fix)

`npm audit --audit-level=high` reported **22 vulnerabilities (1 low,
7 moderate, 14 high)**. The 14 highs broke down as:

- `serialize-javascript` chain (RCE / DoS via `RegExp.flags` and
  `Date.prototype.toISOString`) — pulled by `@rollup/plugin-terser` →
  `workbox-build` → `vite-plugin-pwa@0.20.0`
- `tar` chain (path traversal, symlink poisoning, hardlink escape) —
  pulled by `@capacitor/cli@6.0.0`
- `rollup`, `glob`, `minimatch`, `picomatch`, `lodash`, `flatted`,
  `diff`, `@xmldom/xmldom`, `@isaacs/brace-expansion` — transitive
  build-time deps of vitest/eslint/prettier/etc.

## What R12-C did

### 1. `vite-plugin-pwa` 0.20.0 → 1.2.0

Drops the entire `serialize-javascript` chain and several rollup/glob
chains via fresh transitive resolutions. `vite-plugin-pwa@1.2.0`
peer-supports vite ^5.x (we are on `^5.2.2`), so the upgrade is
compatible. Build verified: `npm run build` produces the same bundle
shape, `dist/sw.js` is generated, PWA precache count is 51 entries
(unchanged from pre-upgrade).

### 2. `serialize-javascript` override → ^7.0.5

After step 1, `workbox-build@7.4.0` (now transitively included) still
pulls `@rollup/plugin-terser@0.4.4`, which pins `serialize-javascript`
in the vulnerable 6.x range. The 6.x line has no fixed release —
`serialize-javascript@6.0.3` does not exist on npm; the fix lives in
^7.0.5. Added an `overrides` block in `package.json` to force
^7.0.5 across the whole tree. terser plugin's API surface for
serialize-javascript is stable across the 6→7 boundary (object
serialization signature unchanged); confirmed by clean build + 925
passing tests.

### 3. `tar` / `@capacitor/cli` — accepted

The fix path is `@capacitor/cli@6.0.0` → `@capacitor/cli@8.3.1`, a
two-major bump. `@capacitor/cli` major **must** match
`@capacitor/core` (and the plugin packages: haptics, local-notifications,
preferences, status-bar — all currently `^6.0.0`). Updating the CLI
alone would break `npx cap sync` and the iOS/Android native bridge.

The vulnerability is real: tar path-traversal via crafted tarballs.
Our threat model:

- `tar` is invoked by `@capacitor/cli` only during `npx cap add`,
  `npx cap sync`, or `npx cap update` — owner-run commands during
  iOS/Android project bootstrap.
- The tarballs are npm-registry artifacts of `@capacitor/*` packages,
  fetched via `npm install` (which performs registry signature
  verification before extraction).
- There is no path where attacker-controlled tar input reaches our
  build pipeline.

**Acceptance:** the residual `tar` advisory is acknowledged. The fix
is queued for the next Capacitor major upgrade (which will also need
native iOS/Android integration testing). Tracked in
`docs/launch/LAUNCH-CHECKLIST.md` carry-forward section.

## Result

- `npm audit`: **22 vulns → 7 vulns (5 moderate, 2 high)**
- Both remaining high-severity entries are the same `tar` advisory
  in two separate npm-cli paths — both same root cause, same threat
  model, same acceptance.
- `npm audit --audit-level=high` no longer surfaces the
  `serialize-javascript` / `vite-plugin-pwa` / `workbox-build` chains.
- `npm run build`: ✅ clean (5.81s, 51-entry precache).
- `npm test`: 925 passing tests.

## Why the override works (and is the right shape)

`overrides` is npm's first-class mechanism for forcing transitive
versions, in the package manager that ships with this project
(`packageManager: npm@9.8.1`). It avoids the `audit fix --force`
"breaking change" trap (npm's recommendation was to *downgrade*
`vite-plugin-pwa` to 0.19.8 — not actually a fix; it sidesteps the
chain by using an older terser path that still has the same vuln in
a different chain).

The surgical override pins one transitive package at a known-good
version without rewriting our direct deps. That is exactly what
`overrides` is for. If the upstream chain repairs itself in a future
release (workbox-build pulls a newer terser plugin that pulls
serialize-javascript ^7), the override becomes a no-op and can be
removed with no functional change.
