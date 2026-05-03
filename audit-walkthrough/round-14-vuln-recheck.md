# Round 14 — vulnerability re-audit (2026-05-03)

Round 12 accepted the `tar` advisory because the fix path
(`@capacitor/cli@6` → `@capacitor/cli@8`) is a two-major bump that
forces matching majors across every `@capacitor/*` package and breaks
the iOS/Android native bridge. Round 14 revisits whether an upstream
fix has landed that doesn't require the Capacitor major bump.

## Findings

### tar advisory — eliminated via override

`tar@<=7.5.10` is vulnerable; `tar@7.5.11+` ships the fix. The npm
`overrides` field forces the resolution across the whole tree even
when `@capacitor/cli@6.x` declares `tar: ^6.1.11`.

API check on `@capacitor/cli`'s actual tar usage:

```js
// node_modules/@capacitor/cli/dist/util/template.js
const tar_1 = tslib_1.__importDefault(require("tar"));
async function extractTemplate(src, dir) {
  await tar_1.default.extract({ file: src, cwd: dir });
}
```

`tar.extract({ file, cwd })` is API-stable across tar 6 → 7. The
breaking changes in tar@7 (Node <18 dropped, single-letter `c`/`x`
aliases removed, ESM-first packaging) don't touch this call site.

Override added to `package.json`:

```json
"overrides": {
  "serialize-javascript": "^7.0.5",
  "tar": "^7.5.11"
}
```

Build, tests, lint, typecheck all pass post-override. No regressions.

### postcss advisory — fixed via direct-dep bump

`postcss@<8.5.10` has a moderate XSS-via-stringify advisory. Bumped
direct dep `8.4.38` → `^8.5.10`. Minor bump within major 8; no
breaking changes affect tailwind/autoprefixer build path.

### brace-expansion advisory — fixed via npm audit fix

Moderate ReDoS in 1.x line. `npm audit fix` (no `--force`) bumped
the transitive resolution to a patched version.

### Remaining: esbuild / vite — accepted

The 3 remaining moderate advisories chain through:

```
esbuild <= 0.24.2  →  vite <= 6.4.1  →  @vitejs/plugin-react <= 4.3.3
```

Fix path: vite@6, which is a breaking change for our build config.
Threat model:

- The advisory is `GHSA-67mh-4wv8-2f99`: dev server allows any
  website to send requests to it and read responses.
- Triggered ONLY against `vite dev` running locally, never in
  production builds.
- Local-network attacker would have to trick a developer into
  visiting a malicious site while running `npm run dev`.
- Production users are unaffected — `dist/` is served as static
  files behind Vercel.

**Acceptance:** dev-server vuln, queued for next vite major upgrade.
The acceptance is identical in shape to round-12's tar acceptance,
but actually safer: tar's threat surface was the developer's own
machine during cap sync; vite-dev-server's is the same.

## Audit deltas

```
Round 12 final:    7 vulns (5 moderate, 2 high)
Round 14 starting: 7 vulns (5 moderate, 2 high)
Round 14 final:    3 vulns (3 moderate, 0 high)

Production-only audit (npm audit --omit=dev): 0 vulnerabilities
```

Both `high` advisories (the two tar paths) eliminated. All remaining
are dev-time, none in the production runtime tree.
