# Security Policy

## Reporting a vulnerability

- Email: **security@placeholder.local** (PGP key at /.well-known/pgp-key.txt)
- We aim to acknowledge within 5 business days and triage within 14.
- Please do not publicly disclose before we coordinate a fix.

The canonical machine-readable contact lives at
[`/.well-known/security.txt`](/.well-known/security.txt) per RFC 9116.

## Scope

In scope: the Alchohalt PWA bundle, Capacitor native wrappers
(iOS/Android), the Supabase encrypted-backup transport, and the
trust receipt + legal-doc surface.

Out of scope: third-party crisis-line URLs (report upstream to
988, SAMHSA, etc.), automated-scanner reports without a PoC, and
self-XSS / clickjacking against a target the user already controls.

## Posture

- No inbound services on the user's device; the app is offline-first.
- The encrypted-backup transport stores ciphertext only; the master
  key never leaves the device. See `/legal/privacy` for details.
- We follow a coordinated disclosure model and credit researchers in
  [/legal/security-acknowledgments](/legal/security-acknowledgments)
  on request.

## Bug bounty

We do not currently run a paid bounty program. We do offer public
acknowledgment + a hand-written thank-you to researchers who report
in good faith and follow this policy.
