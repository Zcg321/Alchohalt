# Legal documents — Alchohalt

This directory holds the public-facing legal scaffolds the app needs
before submission. Every file here is a **template scaffold** — they
encode the owner-locked product decisions (free-vs-premium split,
$3.99/$24.99/$69 pricing, local-only privacy posture, never-gate
crisis resources) but each one carries a counsel-review checklist
that MUST be cleared before public launch.

| Document                                 | Purpose                                                                                       | Required by                          |
|------------------------------------------|-----------------------------------------------------------------------------------------------|--------------------------------------|
| [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) | Data flow, third parties, GDPR/CCPA rights, retention, AI Insights opt-in flow                | App Store + Google Play; GDPR; CCPA  |
| [CONSUMER_HEALTH_DATA_POLICY.md](./CONSUMER_HEALTH_DATA_POLICY.md) | Separate consumer-health-data policy for AI Insights data flow; affirmative authorization; right to revoke | WA MHMDA; NV SB 370; CO CPA; CT CTDPA |
| [TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md) | User-publisher agreement, "not medical advice" disclaimer, governing law                  | Implicit; general consumer-law       |
| [EULA.md](./EULA.md)                     | Software license; Apple-required Section 7 if using a custom EULA; AI Insights authorization clause | Apple App Store Review Guidelines    |
| [SUBSCRIPTION_TERMS.md](./SUBSCRIPTION_TERMS.md) | Auto-renewal disclosure, refund policy, lifetime-tier promise, free-vs-premium matrix    | App Store + Google Play; CA ARL      |

See also: [docs/ai_architecture.md](../ai_architecture.md) — engineering reference for the AI Insights privacy + sanitization design. Read this before adding any field to the LLM prompt or wiring a different provider.

## Hosting before launch

Before the first store submission, each of these must be reachable
at a stable public URL. The owner-task list:

1. Pick a canonical domain (e.g., `alchohalt.com/legal/...`) — until
   then, GitHub Pages or the source repository works as a stop-gap
   ONLY for App Store / Play Console review.
2. Replace the GitHub URLs in the documents with the canonical URLs.
3. In App Store Connect:
   - **Privacy Policy URL** → `PRIVACY_POLICY.md` hosted version.
   - **License Agreement** → either set custom URL pointing to
     `EULA.md`, or leave default to use Apple's standard EULA.
4. In Google Play Console:
   - **Privacy Policy** → same hosted URL.
   - In-app subscription disclosure must repeat the Section 3
     auto-renewal block from `SUBSCRIPTION_TERMS.md`.
5. Inside the app, Settings → Legal links MUST point to the hosted
   URLs (not GitHub) once a domain is set up.

## Review status

| Document                       | Counsel-review status     | Last reviewed | Next review |
|--------------------------------|---------------------------|---------------|-------------|
| PRIVACY_POLICY.md              | ⏳ Scaffold pending review | —             | Pre-launch  |
| CONSUMER_HEALTH_DATA_POLICY.md | ⏳ Scaffold pending review | —             | **Pre-launch (load-bearing for WA MHMDA + NV SB 370 compliance — block ship until cleared)** |
| TERMS_OF_SERVICE.md            | ⏳ Scaffold pending review | —             | Pre-launch  |
| EULA.md                        | ⏳ Scaffold pending review | —             | Pre-launch  |
| SUBSCRIPTION_TERMS.md          | ⏳ Scaffold pending review | —             | Pre-launch  |

These are **owner-action items**, not engineering deliverables. Do
not ship a paid tier without clearing every checkbox in each
document's counsel-review section.

## Changelog convention

When updating a document post-launch:

1. Bump **Last updated** at the top of the file.
2. Add a row to the table above with the date and a one-line summary.
3. If the change materially reduces user rights, the in-app banner
   (per Section 13 of the Terms / Section 7 of the Privacy Policy /
   Section 7 of the Subscription Terms) MUST require explicit
   acknowledgment — not just a passive notice.
