# Round 19 — security researcher judge findings

**Author:** Cowork Sprint
**Date:** 2026-05-03
**Persona:** A security researcher with 12+ years auditing privacy-
sensitive consumer apps (recovery / mental health / financial /
medical) for OWASP top-10, supply-chain attacks, CSP completeness,
storage injection, and privacy-claim accuracy.

## Verdict

**Pass with three real findings now fixed.** The 19th-judge audit
surfaced concrete vulnerabilities that the existing test suite, lint,
and typecheck would not have caught:

1. **No CSP** — neither Vercel header nor index.html meta. Fixed.
2. **Inline `<script>`** in index.html — incompatible with strict CSP. Fixed by extracting into main.tsx.
3. **`dangerouslySetInnerHTML` without sanitizer** — markdown source is bundled (low risk) but no defense-in-depth. Fixed with DOMPurify wrapper.

Plus two non-findings (verified clean) and three v1.1 follow-ups
documented for future rounds.

## Method

Audit ran along five OWASP-ish dimensions:

1. **Untrusted-input handling** — every `dangerouslySetInnerHTML`,
   `innerHTML =`, `eval(`, `Function(`, `new Function`, plus every
   user-input form rendered into the DOM.
2. **CSP completeness** — Vercel headers, index.html meta, every
   inline `<script>` and `<style>`.
3. **IndexedDB / localStorage injection vectors** — every place
   we read user-supplied strings back out of persisted state and
   render them into the DOM.
4. **Third-party dependency security** — `npm audit --omit=dev`,
   plus a manual review of the seven prod deps.
5. **Privacy-claim accuracy** — every "we don't see this" / "we
   cryptographically can't read this" string in the app, audited
   against the actual code path.

## Findings

### Finding 1 — Missing Content-Security-Policy (HIGH)

`vercel.json` shipped X-Content-Type-Options + X-Frame-Options +
Referrer-Policy + Permissions-Policy but no CSP. Without one:

- Any inline-script injection (XSS via a future `dangerouslySetInnerHTML`,
  a compromised CDN, a captive-portal proxy that injects ads) executes
  with full origin privileges.
- A future bug that lets a `<script>` tag through React's escaping
  (e.g. via `dangerouslySetInnerHTML` reaching user content) becomes
  a full account takeover for users with Cloud Sync enabled.
- `frame-ancestors` was set via the legacy `X-Frame-Options: DENY`
  but modern browsers prefer the CSP form; clickjacking from
  alternate-origin iframes was permitted by the modern stack.

**Fix:** added `Content-Security-Policy` to vercel.json with:

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self' https://*.supabase.co https://*.supabase.in https://*.ingest.sentry.io;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
manifest-src 'self';
worker-src 'self';
upgrade-insecure-requests
```

**Why each entry:**
- `script-src 'self'` — no inline scripts, no CDN scripts. The R19-5
  inline-script extraction (Finding 2 below) makes this enforceable.
- `style-src 'self' 'unsafe-inline'` — Tailwind's runtime injects
  inline `<style>` for @apply rules; the splash chrome `<style>` in
  index.html stays inline. Removing `'unsafe-inline'` is a v1.1
  follow-up that requires a Tailwind extraction pass.
- `img-src 'self' data: blob:` — `data:` for inline SVG icons + the
  R15-3 chart-image data-URLs; `blob:` for the Trust Receipt
  short-lived URLs (`URL.revokeObjectURL` after 30s).
- `connect-src` — strictly the Supabase Cloud Sync hosts + the Sentry
  ingestion host (R19-4, opt-in). Anything else fails-closed.
- `frame-ancestors 'none'` — modern clickjacking prevention.
- `object-src 'none'` — no Flash, no PDF embeds; closes a legacy
  vector.
- `upgrade-insecure-requests` — any accidental http:// resource is
  forced to https://.

A meta-tag fallback was added to `index.html` so non-Vercel hosts
(Capacitor WebView, file://, local static-server smoke) also get
the policy. Tests in `src/__tests__/fouc-splash.test.ts` pin the
presence of the meta tag and the object-src + frame-ancestors +
script-src directives.

### Finding 2 — Inline `<script>` in index.html (MEDIUM)

The cold-load splash had a `<script>...</script>` block that removed
the loader on `window.load`. This:

- Required `script-src 'self' 'unsafe-inline'` in the CSP, which
  defeats half the point of CSP (any future XSS-via-inline-script is
  permitted).
- Existed for ~10 lines of "wait for load, fade out, remove" — small
  enough to inline into the bundle.

**Fix:** moved the loader-removal into `main.tsx` (`removeInitialLoader()`
called from `announceAppReady()`). The fade-and-remove still happens
at the same lifecycle point — one frame after the bundle commits its
first paint — so the user-visible behavior is unchanged. CSP can now
declare `script-src 'self'` with no allowance for inline.

### Finding 3 — `dangerouslySetInnerHTML` without sanitizer (LOW)

`src/features/legal/LegalDocPage.tsx` rendered marked-parsed markdown
via `dangerouslySetInnerHTML`. The markdown source is bundled at build
time (`?raw` imports of `docs/legal/*.md`), so user input never
reaches this code path.

But:
- `marked` has had multiple historical XSS CVEs (the package's
  `sanitize` option was removed in v5+ specifically to push users
  toward DOMPurify).
- A future supply-chain compromise of `marked` could inject
  executable HTML into the build output.
- A typo in a legal doc (e.g. accidentally pasting raw HTML with
  an `onerror=` handler) becomes a stored XSS at the moment the
  build ships.

**Fix:** wrapped the marked output with `DOMPurify.sanitize()`. Cost
is one tree-walk over a few KB of HTML per legal-page view; bundle
cost is ~30 KB gz (DOMPurify is already a transitive dep via jspdf,
now declared as a direct dep). Defense-in-depth at marginal cost.

## Non-findings (audited and clean)

### Cloud sync end-to-end encryption

Verified in `src/lib/sync/`:
- Master key derived client-side via libsodium-wrappers-sumo Argon2id
  (`mnemonic.ts`, `keys.ts`).
- Plaintext entries are XChaCha20-Poly1305 encrypted client-side
  before any transport call (`envelope.ts`).
- Server (Supabase) only sees `(domain, blobId, ciphertext, updatedAt)`.
- Auth uses a derived `authHash` separate from the master key; the
  passphrase never leaves the device.
- Email enumeration is blocked by `getUserSalt` returning a
  pepper-derived fake salt for unknown emails.

The "Nobody else, including us, can see what you log" claim holds
when verified against the code.

### IndexedDB / localStorage injection

Searched for places where user-supplied strings are read back and
rendered to the DOM via attribute interpolation, `eval`, or
`Function`. None found. React's default escaping handles every
user-input render path (entry notes, drink names, goal labels, user
crisis-line label/description). The only `dangerouslySetInnerHTML`
in the production bundle is the legal-page case (Finding 3, fixed).

### npm audit (production deps)

`npm audit --omit=dev --audit-level=low` returns "found 0
vulnerabilities" against:

- @capacitor/core, /haptics, /local-notifications, /preferences, /status-bar
- @revenuecat/purchases-capacitor
- dompurify
- jspdf
- libsodium-wrappers-sumo
- marked
- nanoid
- react, react-dom
- recharts
- zustand

Optional deps audited separately: @capacitor-community/{apple-health-kit,
fitness-activity, speech-recognition} are gated behind
runtime-feature-detection and never loaded in the default web path.

### Crash reporter privacy

Audited the R19-4 wire payload allow-list (`src/lib/crashReporter.ts`).
The Sentry envelope sent on opt-in contains exactly:
- event_id, timestamp, platform, level, message
- exception (type + value + stack frames)
- release, contexts.os, contexts.runtime
- breadcrumbs: [] (always empty)

It explicitly does NOT contain user, tags, request bodies, cookies,
or any field from the user's drink entries / goals / settings. Tests
in `src/lib/__tests__/crashReporter.test.ts` pin this allow-list.

### AI insights privacy

Audited `src/lib/ai/`:
- `consent.ts` requires explicit per-session consent re-grant before
  any payload leaves the device.
- `sanitize.ts` strips notes, tags, mood text — only the count
  histograms reach the proxy.
- `client.ts` is feature-flag-gated (off in v1) and refuses to fetch
  if the proxy URL isn't set.

## Supply-chain audit notes

Reviewed the seven prod deps for: maintainer concentration, recent
release cadence, npm package signing, recent CVEs:

- **dompurify** — Cure53 maintained, MPL-2.0, signed releases via
  npm provenance. Last CVE was 2.x (2018). Currently 3.x. Pinned
  ^3.4.1 in package.json.
- **marked** — markedjs/marked, MIT, active maintenance. v5+ removed
  the `sanitize` option as a safety push; we layer DOMPurify per
  Finding 3.
- **libsodium-wrappers-sumo** — official libsodium WASM bindings;
  the canonical client-side libsodium for browsers. Pinned ^0.8.4.
- **nanoid** — ai/nanoid, MIT. Stable; last CVE was a minor issue
  in 3.x; we're on 5.x.
- **zustand** — pmndrs/zustand, MIT. Active. No security history.
- **react / react-dom** — Meta, well-known. We're on 18.2.0 (would
  pin to 18.3.x in next bump for the React 18 final release).
- **recharts** — recharts/recharts. Largest prod dep by mass. No
  security history; would benefit from a `vite` bundle analysis on
  next round to see if the chart code is loading SSR-only paths
  unnecessarily.
- **jspdf** — pdfkit-style PDF generator. Generates exports
  client-side; never makes network calls. Bundles dompurify (which
  was the transitive source we just promoted to direct).

**Lockfile integrity:** package-lock.json contains integrity hashes
for every entry; Vercel installs run `npm ci` which fails on hash
mismatch. Recommend enabling npm provenance verification when
provenance becomes mandatory in npm 11.

## v1.1 follow-ups (not blocking)

1. **Remove `'unsafe-inline'` from style-src.** Requires a Tailwind
   extraction pass + moving the splash chrome `<style>` to an
   external file with a SRI hash. Cuts the last CSP softness.
2. **SRI for the bundle entry.** Vercel does not yet inject
   `integrity=` on `<script src="…/index-<hash>.js">`. A
   post-build script could add SRI hashes to lock the integrity of
   the loaded bundle against a future CDN compromise.
3. **`Cross-Origin-Opener-Policy: same-origin`** + `Cross-Origin-
   Embedder-Policy: require-corp` for spectre/process-isolation.
   Currently only X-Frame-Options + frame-ancestors prevent
   embedding; COOP/COEP would also enforce process isolation. Trade-
   off: any future cross-origin embed (e.g. embedding YouTube for a
   support-video) becomes more painful.
4. **Bug bounty.** No formal program today. A `security.txt` with
   a `mailto:` and signed PGP would let researchers responsibly
   disclose. Cheap to add.
5. **DOMPurify `RETURN_TRUSTED_TYPE` mode** would let us stop
   passing strings entirely, using TrustedHTML throughout. Only
   meaningful when `require-trusted-types-for 'script'` is also
   enabled in the CSP, which is a separate v1.x decision.

## What this judge would say to ship

Three real findings, all fixed. Five non-findings audited and clean.
Five v1.1 follow-ups documented. The privacy claims hold against the
code. The crash reporter is the right shape: opt-in, no PII, allow-
listed payload. The CSP is now strict enough that future XSS vectors
have meaningful obstacles.

**Verdict: ship.**
