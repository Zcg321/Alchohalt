# Operations runbook

[R22-3] On-call documentation. Imagined scenario: 90 days post-launch,
50K MAU, zero alerting infrastructure beyond `console.error`. This
file covers what an on-call engineer needs to triage user-reported
or self-detected outages.

The app is **mostly client-side**. The only backend is the optional
sync transport (Supabase: auth + ciphertext storage). Most user-
visible failures are local and resolvable without any server change.

## System map

```
┌─────────────────────────────────────────────────────────────────┐
│ User device (browser / iOS WKWebView / Android WebView)         │
│                                                                 │
│  ┌────────────┐   ┌──────────────┐   ┌──────────────────────┐   │
│  │ React app  │←──┤ IndexedDB    │   │ Service Worker       │   │
│  │ (Vite SPA) │   │ (Capacitor   │   │ (Workbox / vite-pwa) │   │
│  │            │   │  Preferences)│   │ — precache, runtime  │   │
│  └─────┬──────┘   └──────────────┘   │   cache, BG sync     │   │
│        │                             └──────────────────────┘   │
│        ▼ optional                                               │
│  ┌────────────────────┐                                         │
│  │ Sync transport     │     (only if user enables Sync          │
│  │ (Supabase REST)    │      and provides a passphrase;         │
│  └────────┬───────────┘      ciphertext only)                   │
└───────────┼─────────────────────────────────────────────────────┘
            │
            ▼
   ┌────────────────────┐
   │ Supabase (project) │  Auth users + envelope-encrypted blobs
   │ (DB + Auth)        │  Server cannot read user data — it has
   │                    │  the ciphertext + a masterKey-derived
   │                    │  authHash; the passphrase never leaves
   │                    │  the device.
   └────────────────────┘

   ┌────────────────────┐
   │ Vercel (static)    │  Hosts the SPA build. Deploys on every
   │                    │  push to `main`. PR previews on every PR.
   │                    │  CSP restricts connect-src to the
   │                    │  Supabase + (optional) Sentry domains.
   └────────────────────┘
```

What's NOT in scope:
- No analytics service (no GA, Segment, Amplitude, etc.).
- No CDN of user content (everything is on-device).
- No background workers, cron, or queue (sync is opportunistic
  client-side via the SW's BackgroundSync registration).

## Service-level objectives (SLO)

For a 30-day rolling window:

| SLI | Target | Error budget (30d) |
|-----|--------|--------------------|
| App load (TTI < 3s on a mid-range Android over 4G) | 99% | 7h |
| First Contentful Paint < 1.8s | 99% | 7h |
| Sync request success rate (when enabled) | 99% | 7h |
| Trust Receipt round-trip integrity | 100% | 0 (hard) |
| Service Worker update propagation < 24h | 95% | 36h |

If error budget is exhausted in any month: pause non-critical
launches and investigate root cause. Trust Receipt integrity is a
**hard** constraint (no error budget) because the receipt is the
user's evidence of the privacy claim — any corruption breaks the
moat.

## Common incidents & runbooks

### Incident: "Users can't sync"

**Symptoms:** users report "Sync failed" toast on the Sync panel;
SyncErrorRibbon visible in the app.

**Diagnose:**
1. Check Supabase project status:
   `https://status.supabase.com` and the project dashboard.
2. From a known-good test account, reproduce: open the app, go to
   Settings → Sync, paste your test mnemonic, hit "Sync now".
3. If transport returns 4xx: likely auth issue (check
   `humanizeSyncError` mappings in
   `src/features/sync/syncErrorMessage.ts` for the user-facing
   message vs. raw Supabase error).
4. If transport returns 5xx: Supabase backend issue → escalate to
   Supabase support.
5. If transport returns network error: client-side / CSP issue →
   check `connect-src` in `vercel.json` includes the Supabase URL.

**Fix paths:**
- **Auth**: rotate Supabase anon key if leaked; user-side fix is
  to re-derive masterKey from passphrase.
- **CSP**: `vercel.json` → `connect-src` adjustment + redeploy.
- **Backend**: nothing to fix client-side; user can keep using the
  app offline (everything works without sync).

**User communication:** in-app `SyncErrorRibbon` already surfaces
"Sync paused — your data is safe on this device." That covers most
cases without an additional notification.

### Incident: "Trust Receipt is corrupt / unreadable"

**Symptoms:** user opens Settings → Trust Receipt and sees garbled
text, missing fields, or a print preview that fails.

**Diagnose:**
1. Check `src/features/settings/TrustReceipt.tsx` for the receipt
   schema. Run `TrustReceipt.print.test.tsx` and
   `TrustReceipt.redaction.test.tsx` against `main` —
   if they pass, the issue is data-side, not code-side.
2. Ask user to open browser console at Settings → Trust Receipt and
   send the printed `JSON.stringify(receipt)` (the receipt is
   already designed to redact PII; it's safe to share).
3. If a single field is corrupt: likely a storage migration didn't
   apply on this user. Check `src/lib/sync/dbBridge.ts` migration
   list for a missing path.

**Fix paths:**
- **Data**: instruct the user to export their data → wipe → import
  (trust receipt regenerates from the imported state).
- **Code**: ship a fix on the next release; no rollback needed
  unless many users are affected.

**Severity:** SEV-1 if reproducible on multiple users (this breaks
the privacy promise); SEV-2 for a single-user case.

### Incident: "Service Worker won't update"

**Symptoms:** users on old build seeing stale strings or missing
features that landed in the latest release.

**Diagnose:**
1. Check the build's SW hash in `dist/sw.js` matches the deployed
   one (`curl -s https://app.example.com/sw.js | head -3`).
2. Open the `UpdateBanner` component logic — it surfaces when the
   SW detects a new version. If users aren't seeing the banner,
   the SW lifecycle event isn't firing.
3. Inspect the Workbox cache in DevTools → Application → Service
   Workers; look for orphaned controllers.

**Fix paths:**
- **Soft**: ask user to close all tabs → reopen. SW will activate
  on next clean load.
- **Hard**: ask user to "Update Now" via the in-app banner or
  manually `Application → Service Workers → Unregister` then
  reload.
- **Codebase**: if many users are stuck, ship a release that bumps
  the SW version string (vite-pwa does this automatically on every
  build, but a manual revision string in `index.html` forces an
  earlier check).

### Incident: "Onboarding completion rate dropped"

**Symptoms:** users reporting they bounce off the onboarding flow;
internal metric (the on-device `OnboardingFunnelView`) shows a
funnel cliff.

**Diagnose:**
1. Reproduce the flow with `localStorage.clear()` to start fresh.
2. Walk each step; note which step you bounce off.
3. Check the i18n strings for that step in en.json — a recent copy
   change or removed-translation key may have made the step
   confusing.

**Fix paths:**
- **Copy regression**: redeploy with the fixed string.
- **Layout regression**: check the landscape-phone CSS rules
  (R22-B); if a recent CSS edit broke the onboarding card, fix
  in `src/index.css` or the onboarding component.

This funnel data is on-device only — there's no telemetry to query
centrally. The signal comes from user reports + the owner sampling
their own funnel via `Settings → Self-experiment → Onboarding
funnel`.

### Incident: "Backup failed integrity check"

**Symptoms:** user restores from a backup file and `BackupVerifier`
reports tampering or corruption.

**Diagnose:**
1. Check `src/features/backup/BackupVerifier.tsx` for the
   integrity-check method (HMAC over the encrypted blob).
2. Most common cause: user transferred backup over a transport
   that mangled the bytes (e.g., copy-pasted a base64 blob and
   missed a character).

**Fix paths:**
- **User-side**: ask user to re-export and transfer via a binary-
  safe path (file attachment, not chat clipboard).
- **Code**: if integrity check is flagging valid backups, run
  `BackupVerifier` tests and check for a regression in the HMAC
  derivation.

## Deploy & rollback

**Deploy:** auto-fires on push to `main` via Vercel. Production URL
serves from the latest deployment within ~60s of the push.

**Rollback:**
1. **Fastest:** Vercel dashboard → Deployments → previous deploy →
   "Promote to Production". Takes ~30 seconds.
2. **Git-based:** `git revert <bad-commit-sha> && git push origin
   main`. Triggers a fresh build of the rollback state. Slower
   (~3 min) but creates a permanent record in git history.
3. **Hard rollback** (in case of credential leak in the build):
   - Pull the deployment offline via Vercel dashboard
   - Rotate exposed credentials (Supabase anon key)
   - Push a fix release

**Preferred:** option 2 (git revert) for everything except security
incidents. The git history stays linear and the rollback is itself
audited.

## Observability

Current state (90-day-mature scenario): **none beyond `console.error`
and user reports**. The privacy claim ("nothing leaves the device")
precludes adding analytics or RUM.

What you DO have:
- **Vercel deployment logs** — useful for build failures, CSP
  reports (if `report-uri` is added later).
- **Supabase logs** (if sync is in use) — useful for auth failures
  and rate-limit hits.
- **`OnboardingFunnelView`** on each user's device — the user's
  own funnel data, not aggregated. The owner samples this on
  their personal device for trends.
- **`Diagnostics`** card on each user's device — same shape, for
  app-level health.
- **`BackupVerifier`** — integrity check on every backup, surfaces
  to the user as `BackupAutoVerifyRibbon` if tampering detected.

What you don't have (intentional):
- No GA, Mixpanel, Segment, Amplitude.
- No Sentry-style error reporting unless the user opts in (the
  `CrashReportsToggle` is off by default and the toggle is
  audited per round to make sure it stays opt-in).
- No log aggregation for client-side errors.

If you NEED a metric, the path is:
1. Add it to the on-device `Diagnostics` panel (visible to the
   user, never sent off-device).
2. If aggregation is genuinely needed, propose a feature that
   adds an explicit opt-in toggle with the data-flow documented
   in the user-facing privacy doc.

## Escalation

For all SEV-1 incidents (Trust Receipt corruption, sync data leak,
auth bypass): pull the deployment offline first, investigate
second.

Owner contact (sole maintainer in the imagined scenario): see
`README.md` and the in-app Settings → Support panel.

For Supabase backend issues: Supabase support is the escalation
target (project settings → support).

## Human-on-call when AI pair-programming gets it wrong

[R28-A] Investor / partner question (round-27 investor-judge C3):
*"You ship with heavy AI pair-programming. Who's the human on
call when the AI gets a fix wrong, and how do you catch it?"*

**Honest answer:** the owner is the human on call. The defenses
that catch AI mistakes before they ship to a user are layered:

1. **Lint + typecheck + 1,900+ tests** must pass before any commit
   merges. Each round has an audit-walkthrough doc that records
   "what the AI initially proposed and what got changed before
   merge." Recent examples on file:
   - `audit-walkthrough/round-25-stddrink-verify.md` — the AI's
     first jurisdiction table had two mass-conversion bugs caught
     by the verification round.
   - `audit-walkthrough/round-23-csp-style-src-investigation.md`
     — the AI misdiagnosed a CSP issue as needing a `style-src`
     loosening; the human override kept the strict CSP and fixed
     the actual cause.
   - `audit-walkthrough/round-27-user-installed-content-backup-audit.md`
     — the AI initially missed a category in the round-trip
     enumeration; the audit doc forced the gap surface.
2. **Spectacular gate at the end of every round** — N judges
   (currently 27 → 28) review the round's work from N different
   user perspectives. Anything one judge flags as broken blocks
   the merge.
3. **Pre-commit hooks** plus `scripts/health-scan.sh` runs the
   full suite locally before push.
4. **PR review via GitHub** (the merge UI is the final human
   touch point — owner uses the Chrome MCP UI, native `.click()`
   pattern, never auto-merge from CLI).

**Failure mode we have NOT yet drilled:** silent AI regressions
that pass all tests but ship behavior the owner didn't intend.
Mitigation: every round writes an audit-walkthrough doc the owner
reads before merge; any deviation from the round scope shows up
in the doc summary. This is the discipline we'd commit to in
writing for an investor: **no merge without an audit-walkthrough
doc and a green spectacular gate.**

**Pre-Series-A external pen test plan:** see
`docs/launch/external-audit-plan.md` (R28-A). The investor doc
C6 concern is tracked there with a triggering condition (close
of pre-seed round) and a target firm category (browser-side crypto
+ web app pen test, not network ops).

**Monetization commitment for partners:** see
`docs/launch/monetization-commitment.md` (R28-A). The investor
doc C2 concern is answered there with explicit numeric triggers
for paywall flip and the trust-first sequencing rationale.

## Tooling references

- `scripts/health-scan.sh` — runs a comprehensive scan against the
  current code (lint, typecheck, tests, bundle budget, perf
  baseline). Run before every release.
- `scripts/release-checklist.sh` — pre-flight checklist for a
  release.
- `scripts/round-kickoff.sh` / `round-finalize.sh` — internal
  process for the rounds workflow that produced this app.
- `tools/check_bundle_budget.cjs` — fails if eager JS exceeds the
  budget (currently passes at 245 KB / budget 250 KB).
- `tools/perf_baseline.cjs` — fails on >5% perf regression vs.
  pinned baseline.

## R22-3 vs prior rounds

This file replaces the implicit "owner knows it all" model with a
written runbook. The 90-day scenario is hypothetical — the app
hasn't shipped to 50K users yet — but the document is real and
should be updated as actual incidents teach us what's missing.

Each `## Incident` heading should be expanded with `### Postmortem
notes` after a real incident lands. Don't lose the lesson.
