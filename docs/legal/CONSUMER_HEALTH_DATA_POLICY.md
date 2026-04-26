# Consumer Health Data Privacy Policy — Alchohalt

**Effective date:** TBD (owner: set at submission)
**Last updated:** 2026-04-26 (template scaffold; counsel review required before public launch)

---

This document is **separate from** the [main Privacy Policy](./PRIVACY_POLICY.md)
because Washington State's My Health My Data Act (MHMDA, RCW 19.373)
requires that any entity processing "consumer health data" maintain
a separate, plain-language consumer-health-data privacy policy, and
that it be linked from the entity's homepage / app.

It also covers the analogous "consumer health data" or sensitive-
category requirements under:

- Nevada SB 370 (2024)
- Colorado Privacy Act (CPA)
- Connecticut Data Privacy Act (CTDPA)

If you do not reside in WA, NV, CO, or CT, the rights described here
may still apply if your jurisdiction enacts similar legislation; we
honor them globally as a matter of practice.

---

## TL;DR

- Alchohalt processes drink-tracking patterns, mood tags, and HALT
  triggers, all of which qualify as **consumer health data** under
  the statutes above.
- By default, all of this data stays **on your device only**.
- The **only** time consumer health data leaves your device is if you
  opt in to the **AI Insights** feature, in which case an anonymized
  pattern summary (no journal text, no notes, no PII) is sent through
  a server-side proxy to Anthropic. See [PRIVACY_POLICY.md §5](./PRIVACY_POLICY.md#5-optional-features-that-change-this-posture).
- You can **revoke** consent at any time in Settings → AI. Revoking
  rotates the anonymous device ID locally.
- Under WA MHMDA / NV SB 370 / CO CPA / CT CTDPA, you have specific
  rights described below. We honor them regardless of which state
  you reside in.

---

## 1. Categories of consumer health data we process

For users who opt into AI Insights, the data sent is described in
full detail in [PRIVACY_POLICY.md §5](./PRIVACY_POLICY.md#5-optional-features-that-change-this-posture).
In summary, only the following categories are transmitted:

- Drink counts grouped by ISO week (no exact timestamps).
- Mood-tag counts (one-hot enum counts).
- HALT trigger counts (hungry, angry, lonely, tired).
- Intention counts (celebrate, social, taste, bored, cope, other).
- Day-of-week pattern (counts only).
- Current streak length.
- Anonymous device ID generated locally at consent (rotates on revoke).
- Locale code (e.g., `en`).

For users who do **not** opt into AI Insights, no consumer health
data is transmitted at all. All data stays on the device's secure
local storage.

---

## 2. How we collect consumer health data

Exclusively through the in-app drink-log, journal, mood, and HALT
trigger entry forms. We do not:

- Purchase or otherwise receive consumer health data from third
  parties.
- Infer consumer health data from non-health categories.
- Use cookies, tracking pixels, advertising IDs, or any cross-site
  tracking.

---

## 3. How we use consumer health data

**By default:** to render the in-app drink log, streak, money-saved,
journal, mood timeline, and HALT-trigger analytics that the user
themselves sees on their own device.

**If the user opts into AI Insights:** to produce written reflections
about the user's patterns. The opt-in summary is sent to Anthropic
via a server-side proxy and the response is rendered back to the
user's device.

We do not use consumer health data for:

- Advertising (we run no ads).
- Profiling for any purpose other than user-visible insights.
- Selling or sharing with any third party other than the AI provider
  on opt-in (Anthropic).
- Training any AI model.

---

## 4. Sharing of consumer health data

We share consumer health data only with the AI provider, and only
when the user has explicitly opted in. The exact data shared is
described in §1 above. The provider's privacy policy is at
https://www.anthropic.com/legal/privacy.

We do **not** sell consumer health data, as that term is defined in
WA RCW 19.373.030(11), to anyone for any consideration.

We do **not** share consumer health data with affiliates, partners,
or service providers except for the AI provider described above.

---

## 5. Your rights

Regardless of which state you reside in, you have the following
rights with respect to your consumer health data:

### 5.1 Right to confirm

You have the right to confirm whether we are processing your
consumer health data. Because we do not collect or store your data
on any server, the answer is straightforward: by default, we are
not. If you have AI Insights enabled, we are processing your data
through the proxy as described in §1 — and the timestamp of each
processing event is in your in-app AI Insights history (Settings →
AI).

### 5.2 Right to access

You can access your consumer health data at any time in the
Alchohalt app. Settings → Data Management → "Export data (JSON)"
provides a complete machine-readable export.

### 5.3 Right to delete

You can delete your consumer health data at any time:

- **Locally:** Settings → Data Management → "Wipe all data" (double-
  confirm).
- **In the proxy log:** Settings → AI → Revoke consent. This wipes
  the anonymous device ID locally, after which the proxy's rate-
  limit log cannot be linked back to you.

Because we do not run a server that stores prompt content or other
consumer health data beyond the proxy's anonymous rate-limit log,
there is no other server-side data to delete.

### 5.4 Right to revoke consent

Settings → AI → Revoke consent. Revocation:

- Stops any in-flight AI Insights request immediately.
- Wipes the local anonymous device ID.
- Future re-grants generate a fresh anonymous device ID, so the
  proxy's rate-limit log cannot link before-vs-after-revoke usage.

### 5.5 Right to non-discrimination

We do not deny services, charge different prices, or provide
different quality based on the exercise of any right described
here. The free tier remains free regardless of AI Insights consent.
Premium-tier features other than AI Insights remain available
regardless of AI Insights consent.

### 5.6 Right to appeal (CTDPA / CPA / NV SB 370)

If you reside in CT, CO, or NV and believe we have wrongly denied
a request under §5.1–5.5, you may appeal by emailing the address
in §10 with subject line "Consumer Health Data Appeal." We will
respond within 45 days as required by statute. If your appeal is
denied, we will provide instructions on contacting your state
Attorney General.

### 5.7 Authorized agent

If you wish to authorize an agent to exercise these rights on your
behalf, the agent may submit a written authorization signed by you,
along with proof of the agent's identity. We will verify the
authorization before acting on the request.

---

## 6. Affirmative authorization (WA MHMDA-required)

Under WA RCW 19.373.040, sharing consumer health data with a third
party requires the consumer's "valid authorization." The AI
Insights consent screen in Settings → AI satisfies this requirement
by:

- Providing a clear, plain-language description of what consumer
  health data will be shared.
- Identifying the third party (Anthropic) and linking to that
  party's privacy policy.
- Identifying the duration of the authorization (until you revoke).
- Identifying the specific purpose (generating written reflections).
- Requiring an affirmative checkbox + button click to grant.
- Allowing revocation at any time without prejudice to the rest
  of the app.

The disclosure version (`CURRENT_DISCLOSURE_VERSION` in
`src/lib/ai/types.ts`) is bumped any time the disclosure copy
materially changes; existing authorizations become invalid until
re-granted.

---

## 7. Geolocation and reproductive-health data (WA MHMDA-specific)

Alchohalt does **not** collect:

- Precise geolocation data.
- Reproductive- or sexual-health data.
- Biometric data (the Biometric Lock feature uses your device's OS-
  level biometric API; the biometric template never leaves the
  device's secure enclave and is never accessible to Alchohalt).

WA MHMDA's heightened consent requirements for reproductive-health
data and precise geolocation therefore do not apply.

---

## 8. Children

We do not knowingly process consumer health data of any individual
under 17 years of age. The app is rated 17+ on the App Store and
Mature 17+ on Google Play. If you believe we have inadvertently
collected such data, contact us at the address in §10 and we will
delete it immediately.

---

## 9. Changes to this policy

When we change this policy, we will:

1. Bump `CURRENT_DISCLOSURE_VERSION` in `src/lib/ai/types.ts`.
2. Show an in-app banner the next time you open the app, requiring
   explicit re-acknowledgment if AI Insights consent is affected.
3. Update the "Last updated" date at the top of this file.

We do not retro-apply changes to data that was already processed
under a prior version.

---

## 10. Contact

For questions, requests, or appeals under this policy:

- GitHub Discussion: https://github.com/Zcg321/Alchohalt/discussions
- GitHub Issue: https://github.com/Zcg321/Alchohalt/issues
- (Owner: replace with `privacy@alchohalt.com` once domain set up.)

For state-specific Attorney General contact information:

- WA: https://www.atg.wa.gov
- NV: https://ag.nv.gov
- CO: https://coag.gov
- CT: https://portal.ct.gov/AG

---

## Counsel-review checklist (owner action — do BEFORE first paid user)

- [ ] Set Effective Date + Last Updated.
- [ ] Verify the homepage / Settings → Legal links surface this
      document at a stable public URL — MHMDA requires it be
      accessible from the homepage.
- [ ] Confirm contact email + replace GitHub URLs with canonical
      domain.
- [ ] Verify Anthropic's current privacy policy URL still maps to
      the no-training and 30-day-retention claims (Anthropic updates
      their policy periodically).
- [ ] If Alchohalt ever begins processing precise geolocation or
      reproductive-health data, §7 must be rewritten and re-counseled.
- [ ] Counsel review of §5.6 (right to appeal) — exact response
      timeline and AG-contact wording varies between CT / CO / NV.
- [ ] Authorized-agent identity-verification process in §5.7 must
      match what we actually have process for; for an app with no
      account system, that process is "we don't store identity, so
      the agent's request operates only on the proxy log if any."
