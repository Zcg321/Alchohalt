# External security audit plan

[R28-A] Answer to investor-judge round-27 C6 concern:
*"Is an external pen test in the next-funding-stage plan?"*

This document records the trigger date, scope, and target firm
profile for the first external security audit. Purpose: a
partner can read this in 60 seconds and have a concrete answer
without having to ask the founder mid-call.

## Trigger

The first external audit is commissioned **at close of pre-seed
round**. Specifically: when the term sheet is countersigned and
the first wire clears the operating account, the owner places a
deposit with the audit firm within 30 days.

Why this trigger and not earlier: external audits cost
$25K – $80K depending on scope. Pre-funding, that's the
operating budget for a quarter. Post-funding, it's a single
line item. The architectural posture is already audit-ready
(see scope below); the trigger is purely financial, not
engineering-readiness.

Why not later: the deck claims privacy as a moat. A deck claim
that doesn't have an external receipt by the time the seed is
deployed is a credibility liability. 30-day commitment after
wire is the maximum lag we accept.

## Scope

The audit must cover all four of:

1. **Browser-side cryptography review** of the envelope-encrypt
   sync transport. The threat model is: passive Supabase
   compromise must not yield user data. Specific files:
   - `src/features/sync/crypto.ts`
   - `src/features/sync/envelope.ts`
   - `src/features/backup/encryption.ts`
   - The Argon2id parameter choice and the masterKey-derivation
     path (passphrase → authHash → ciphertext binding).
2. **Web app pen test** of the static SPA. Focus on:
   - XSS surfaces (especially journal + crisis-line content
     where user-supplied strings render).
   - CSP escape paths (round-23-csp-style-src-investigation
     documents the strict CSP; verify externally).
   - DOMPurify usage and any rich-text surfaces.
3. **Capacitor bridge audit** — the iOS / Android native layers
   re-expose JS-runtime privileges. Specific concerns:
   - WKWebView / WebView CORS bypass paths.
   - Custom URL scheme handling (any deep links treated as
     trusted input?).
   - The lazy-load capacitor plugin path
     (`tools/lazy_capacitor_plugins.ts`) — confirm no plugin
     gets loaded with elevated permissions on a code path the
     user didn't trigger.
4. **Trust Receipt verification** — the receipt is the user's
   evidence of build integrity. Audit must include:
   - Reproducibility of the receipt from a clean checkout.
   - Whether the receipt's hash chain actually binds the
     deployed bundle to the signed commit.
   - Any way an attacker could ship a malicious bundle that
     produces a valid receipt for a benign commit.

What's **out of scope** for the first audit:
- Server-side hardening of Supabase (Supabase is the vendor;
  their SOC 2 covers their stack).
- iOS App Store / Play Store reviewer-side compromise (out of
  user threat model — if Apple is compromised, the OS is gone).

## Target firm profile

The audit must come from a firm whose recent published reports
include all three of:

1. Web-app crypto reviews (not just network ops). Trail of
   Bits, Cure53, NCC Group, and Doyensec are all in this lane;
   firms that primarily do AWS infra audits are not.
2. Mobile-runtime experience (Capacitor or React Native or
   Cordova specifically — not just native-iOS-only).
3. Public reports on at least one privacy-positioned consumer
   app in the last 24 months. The audit's value to investors
   compounds with the firm's reputation in this niche.

Cure53 + Trail of Bits are the leading candidates; the owner
solicits at least one quote from each, plus one regional
boutique quote, and picks based on scope-match and turnaround.

## Output

The deliverable is a public `docs/launch/external-audit-2026-Q?.md`
that:
- Links to the firm's PDF report (re-hosted on the project's
  static site so the link doesn't rot).
- Lists every finding with the issue tracker entry that closed
  it.
- Has a one-line summary card the marketing site can quote.

Findings rated High or above must be closed before the next
public release; findings rated Medium or below are tracked but
do not block a release.

## Re-audit cadence

After the first audit, the cadence is:

- **Annually** for the SPA + crypto layers.
- **Within 30 days** of any privacy-affecting architectural
  change (e.g., adding a new external service to CSP, changing
  the crypto envelope, introducing a non-on-device feature).
- **Pre-Series-A and pre-Series-B fundraise** — partners doing
  diligence will ask; having the most recent audit be < 12
  months old is the bar.

## Status as of round 28 (2026-05-04)

| Item | Status |
|------|--------|
| Trigger condition met | not yet (pre-funding) |
| Firm shortlist drafted | yes (Cure53, Trail of Bits, regional) |
| Internal audit chain (round 19 + round 23) | complete |
| Reproducible build verified for receipt | yes (round 19) |
| Owner action item | open quote requests at term-sheet close |

This document is updated when the trigger fires.
