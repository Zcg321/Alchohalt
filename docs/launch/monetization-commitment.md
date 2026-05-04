# Monetization commitment

[R28-A] One-page answer to the investor-judge round-27 C2 concern:
*"What triggers the paywall flip date?"*

This document is commit-able and dated; partners can hold the team
accountable to the numeric triggers below.

## The sequencing claim

**Trust comes first; revenue comes after.** The privacy-first
brand has zero value if the very first user touchpoint is a
paywall. Every shipped feature in the app today (R28) works
without any account, login, or payment. There is no telemetry,
no remarketing, no email capture before value-delivery.

The cost of this discipline is real: the team gives up early
revenue signal in exchange for a trust posture that
analytics-driven competitors structurally cannot match (see
`audit-walkthrough/round-24-moat-features.md` M1).

## Numeric triggers for paywall flip

The paywall flips from "wired but dark" to "live to a new user
cohort" when **all three** of the following are true:

1. **Adoption:** ≥ 25,000 cumulative app installs across iOS +
   Android + PWA. Counted from the first public release date,
   measured by the union of App Store Connect / Play Console /
   Vercel install-event-equivalent (PWA `beforeinstallprompt`
   acceptances logged on-device, owner-aggregated via opt-in
   diagnostics export).
2. **Retention:** ≥ 30 % week-4 retention on the cohort defined
   as "users who completed onboarding in week N." Measured via
   the on-device satisfaction + funnel surfaces (R26-1, R27-1)
   without external analytics.
3. **Satisfaction:** ≥ 4.0 average rating across at least 100
   App Store / Play Store reviews. The unit-economics rationale
   is: a 4.0+ aggregate is the floor below which paywall friction
   produces meaningful churn.

Until **all three** are satisfied, the subscription surface ships
in code (`src/features/subscription/`) but the paywall gate stays
behind a feature flag set to off-by-default for new users.

## What the paywall will and will not gate

**Will gate (paid tier):**
- Multi-device sync (the only feature with non-zero per-user
  server cost — Supabase ciphertext storage).
- Cloud-backed encrypted backup retention beyond the device
  (the file backup itself is always free; cloud storage of the
  blob is the paid line).
- AI-generated weekly insights (LLM token cost is real).

**Will not ever gate:**
- All on-device tracking (drinks, mood, journal, goals, milestones).
- Local export (CSV, JSON, encrypted backup file).
- Trust Receipt download.
- Crisis line surface and any harm-reduction content.
- Onboarding and the privacy-status surface.

This separation is structural, not promotional. The free tier is
*useful*, not *demo-grade*; the paid tier covers genuinely
infrastructure-dependent features.

## Why pre-Series-A investors should accept this

A pre-Series-A IRR model anchored on revenue trajectory is the
wrong frame for a privacy-trust-anchored consumer app. The
correct frame is:

1. **Trust capital compounds.** Every quarter a privacy-first
   competitor ships a credible feature without telemetry, the
   verification trail (Trust Receipt, audit-walkthrough docs)
   becomes harder to clone. Reframe / Sunnyside cannot retrofit
   "we never had analytics" into their codebase.
2. **Paywall flips are reversible-down, not reversible-up.**
   Flipping the paywall too early generates a class of negative
   reviews ("they wanted money on day 2") that takes 18+ months
   of word-of-mouth to recover from. Waiting costs revenue;
   shipping early costs trust capital.
3. **The numbers above are commit-able now.** A founder who
   says "we'll figure out monetization later" is hand-waving.
   A founder who says "we'll flip the paywall when adoption +
   retention + satisfaction *all three* hit X" is making a
   testable claim. This document is the testable claim.

## Pre-flip preparation

The infrastructure work that has to be done **before** the flip,
so the flip is a single-PR change rather than a multi-quarter
project:

- [x] RevenueCat setup doc and SDK wired (`docs/launch/revenuecat-setup.md`).
- [x] Subscription state model in store (`src/features/subscription/`).
- [x] Paywall mount test
  (`src/features/settings/__tests__/paywall-mount.test.tsx`).
- [x] Restore-purchases flow (`src/features/iap/`).
- [ ] App Store Connect / Play Console subscription products
  configured (owner action — happens in the developer portals,
  not the codebase).
- [ ] Tax + payout setup in App Store Connect / Play Console
  (owner action — legal + finance prerequisite).

Owner-facing reminder: the codebase is paywall-ready. The flip
is gated on adoption / retention / satisfaction numbers, not on
remaining engineering work.

## How to update this document

When any of the three numeric triggers is hit:
1. Note the date and source measurement in a new
   `## Trigger met: <date>` section below.
2. When all three are hit, file the flip-PR and add a final
   `## Paywall live: <date>` section.

Do not change the trigger thresholds without filing a public
audit-walkthrough doc explaining why; the credibility of this
document depends on the thresholds being commit-able, not
adjustable in private.

## Status as of round 28 (2026-05-04)

| Trigger | Threshold | Current | Status |
|---------|-----------|---------|--------|
| Adoption | ≥ 25,000 installs | pre-launch | not met |
| Week-4 retention | ≥ 30 % | n/a | not measurable |
| Avg App Store rating | ≥ 4.0 / 100+ reviews | n/a | not measurable |

Paywall flag: **off**. Paywall infrastructure: **ready**.
