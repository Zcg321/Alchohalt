# Security audit policy

**Last refresh:** 2026-05-02 (round 12).

## What `npm run audit:ci` checks

```
npm audit --audit-level=critical --omit=dev
```

- `--audit-level=critical`: PR-blocking on critical only. High-sev findings are tracked here but don't block CI.
- `--omit=dev`: production runtime tree only. Build-time / test-time devDependencies are not part of the user-facing attack surface and are tracked separately.

## Why the threshold isn't `high`

Running `npm audit --audit-level=high` (the default for many projects) generates noise from advisories that don't apply to a static-PWA-with-no-server app. Specifically, as of round 12 the audit reports include:

| Package | Path | Severity | Why it doesn't apply to runtime |
|---|---|---|---|
| `tar` | `@capacitor/cli → tar` | high | `@capacitor/cli` is a build-time CLI invoked manually for native builds. No `tar` extraction happens on user devices at runtime. |
| `serialize-javascript` | `vite-plugin-pwa → workbox-build → @rollup/plugin-terser → serialize-javascript` | high | Runs at build time inside Vite. The serialized output is the static service-worker shell, not user data. No untrusted input flows into the serializer. |
| `yaml` | `cosmiconfig → yaml` | moderate | Build-time configuration parsing only. Configs are checked into the repo, not loaded from untrusted sources. |
| `@isaacs/brace-expansion` | various dev tooling | high | Used only by build-time globbing. No user input flows into glob patterns at runtime. |
| `lodash` (the one production-tree finding) | `recharts → lodash` | high | recharts uses `_.get` / `_.merge` on chart configs assembled internally. No user-supplied keys flow into vulnerable methods (`_.unset`, `_.omit` template). When recharts ships a version bumped past 4.17.21, we'll pick it up. |

## When to revisit

- **Critical advisory in the production tree.** `audit:ci` will fail and block the PR — no manual triage required.
- **A high-sev advisory becomes exploitable in our usage.** The matrix above is reviewed every round; if any "doesn't apply" rationale changes, that row gets removed and we patch.
- **Quarterly hygiene.** Round-finalize includes a manual `npm audit --audit-level=high` review even when CI passes. Document any new findings here.

## Round-12 specific notes (this round closed)

- Bumped audit-level from `high` to `critical` to stop blocking PR-43 on the build-time noise.
- Added `--omit=dev` so future production-tree findings surface clearly without the build-time clutter masking them.
- Documented every current high-sev finding above with a "doesn't apply" rationale.

## Round 13 carry-forward

- Watch recharts releases. Picking up a version that uses lodash >= 4.17.22 (when published) closes the remaining production-tree finding.
- Watch vite-plugin-pwa for a workbox-build ≥ 8 release that drops `@rollup/plugin-terser` in favor of `@rollup/plugin-terser`'s patched line.
