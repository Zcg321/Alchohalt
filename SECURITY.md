# Security Policy

## Reporting a vulnerability

If you find a security issue in Alchohalt — a vulnerability in our
code, a flaw in our cryptographic posture, a way to extract or
modify another user's data, or any other issue that puts a user
at risk — please report it privately.

**Do not open a public GitHub issue.** Public disclosure before a
fix is in production exposes users.

### How to report

Use GitHub's private vulnerability reporting feature:

1. Navigate to <https://github.com/Zcg321/Alchohalt/security>
2. Click "Report a vulnerability"
3. Fill in the form with as much detail as you have

If GitHub's private reporting is unavailable to you, open an
issue titled "**Security disclosure request**" with no further
detail — the maintainer will reach out by email to coordinate.

### What to include

Be as specific as you can, but err on the side of reporting even
if you're unsure:

- A description of the issue
- The version / commit hash where you observed it
- Steps to reproduce
- The impact you can demonstrate (data leak, unauthorized
  modification, denial of service, etc.)
- Any proof-of-concept code (if safe to share)
- Whether you've shared this with anyone else

### What happens next

- We acknowledge receipt within **3 business days** of your report
- We confirm or refute the issue within **7 business days**
- We agree on a coordinated disclosure timeline (typically 30 days
  for low-impact, 60-90 days for higher-impact)
- We fix the issue and ship the fix
- We credit you (with your consent) in the release notes
- We publish a security advisory describing the issue and the fix

If we determine the issue is not a security concern (e.g., it's a
correctness bug instead), we'll explain why and reclassify it as a
regular bug report.

## Scope

In scope:

- The web/PWA codebase under `src/`
- The Capacitor native bridges under `android/` and `ios/`
- The encryption code in `src/lib/sync/sodium.ts` and the backup
  format in `src/lib/backup/`
- The trust receipt machinery in `src/lib/trust/`
- The Vite + plugin chain (especially the SRI hash plugin)
- The CI workflows in `.github/workflows/`
- Build outputs (anything we ship to a store or hosting provider)

Out of scope:

- Third-party services we integrate with (Anthropic, RevenueCat,
  Supabase) — report those to the respective vendors
- Issues in dependencies that aren't reachable from our code
  paths (we still want to know, but it's a `npm audit` issue not
  a security disclosure)
- Vulnerabilities that require already-compromised user devices
- Social-engineering or phishing reports about people, not code

## Our commitments to you

- **No legal action against good-faith research.** We will not
  pursue legal action against security researchers who comply
  with this policy. We will not contact law enforcement about
  good-faith research.
- **No silent fixes.** Once an issue is fixed, we publish an
  advisory. We don't bury security fixes in routine release
  notes.
- **Credit, with your consent.** If you want public credit for
  the report, we list you in the advisory. If you want to stay
  anonymous, that's fine.

## Cryptographic disclosures

The encryption posture (`src/lib/sync/sodium.ts`) uses libsodium
(XChaCha20-Poly1305 for sealed boxes; Argon2id for key derivation
from a passphrase). If you find a flaw in our usage of those
primitives — wrong nonce handling, key reuse, weak parameters —
that is a security issue and we want to hear about it.

The Trust Receipt format (`src/lib/trust/receipt.ts`) is not
cryptographically protected against a determined local attacker
with shell access to the device — it is a transparency record,
not a tamper-evident audit log. If you have ideas for how to make
the receipt tamper-evident without a server, we welcome those as
discussions, not as security disclosures.

## Anti-pattern alert

If a report says "you should add analytics so you can detect
attacks" — that is the opposite of what we want and we will
respectfully decline. The privacy posture is itself a security
property. We detect issues from user reports, code review, and
periodic audits, not from telemetry.

## Public-facing privacy claims we make

We claim:

- Nothing leaves the device by default
- Backup is end-to-end encrypted, key only on device
- No analytics SDK is in `package.json`
- Crash reports are opt-in only

If you can disprove any of those claims by inspecting the code or
running the app, that is a security-class disclosure. The claims
are user-facing commitments, not aspirational statements.

## Acknowledgments

We will list past valid reports in this section as they happen.

(No reports yet — this policy was added in Round 26, 2026-05-04.
If your report is the first, you go in the inaugural slot.)
