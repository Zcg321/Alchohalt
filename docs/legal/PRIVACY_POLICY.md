# Privacy Policy — Alchohalt

**Effective date:** TBD (owner: set at submission)
**Last updated:** 2026-04-26 (template scaffold; counsel review required before public launch)

---

## TL;DR

**Your wellness data stays on your phone by default.** We don't run a
server that sees your drink log, mood, or journal entries. The only
third parties that ever see anything from your use of Alchohalt are:

1. **Apple App Store / Google Play** — they handle your subscription
   payment if you pay for premium. They tell us only "this anonymous
   user paid." They don't tell us your name, card, or anything else.
2. **RevenueCat** (purchase-validation broker) — they receive an
   anonymous user ID and a product ID at the moment you make a
   purchase, so we can confirm your premium entitlement is real. They
   never see your wellness data.
3. **Anthropic — only if you opt in to AI Insights.** AI Insights is
   off by default. When you turn it on, an anonymized summary of your
   patterns (drink counts grouped by week, mood-tag counts, HALT
   counts, streak length, day-of-week pattern) is sent through a
   server-side proxy to Anthropic. **Your raw data — journal text,
   notes, exact times, custom drink names, voice transcripts — never
   leaves the device, even with AI Insights on.** See Section 5 for
   the full data flow.

Everything else — every drink you log, every mood tag, every HALT
trigger, every dollar spent, every journal entry — stays on your
device unless you (a) explicitly export it, or (b) opt in to AI
Insights.

---

## 1. What we collect

### On your device only (not transmitted anywhere)

- Drink log entries (timestamp, type, amount, cost, intention, craving,
  HALT flags)
- Goals (daily/weekly limits, monthly budget)
- Journal entries (text + emoji + mood tag)
- Streak counts and statistics
- App preferences (language, theme, reminder settings)
- Encrypted local backups, when you export them

This data lives in your device's secure local storage (Capacitor
Preferences API on iOS / Android, IndexedDB / localStorage on web).
We have no remote copy. We cannot recover it if you uninstall the app.

### Transmitted to third parties

The only data that ever leaves your device:

| Recipient | What they see | When | Why |
|---|---|---|---|
| Apple / Google | Anonymous purchase token + product ID | Only when you tap "Purchase" or "Restore Purchases" | They process the payment + give you a receipt |
| RevenueCat | Same purchase token + your device's anonymous app-instance ID | Same moments | They validate the receipt + tell us the premium entitlement is active |
| **Anthropic** (via server-side proxy) | **Anonymized pattern summary** — see Section 5 for the exact field list | **Only if you opt in to AI Insights AND tap "Generate insights"** | They generate written reflections from the summary |
| 988 / SAMHSA / hotlines | Whatever you say in the call/text | Only when YOU tap a hotline link in our Crisis Resources page | They are the actual crisis service. We don't see what you say. |
| External support sites (AA, SMART Recovery) | Whatever your browser tells them | Only when YOU tap a "Visit" link | We don't proxy these — they're direct browser links. |

That's the complete list.

### What we do NOT collect by default

- Your name, email, phone number, or address — we don't have an
  account system
- Your IP address (beyond what Apple/Google's payment infrastructure
  inherently sees during a purchase)
- Cookies, tracking pixels, advertising IDs
- Crash reports unless you opt in (Sentry — disabled by default;
  see Section 5)
- Analytics (PostHog, Mixpanel, Google Analytics, Firebase Analytics —
  none of these are integrated)

---

## 2. How we use what we collect

The purchase-token data flowing through Apple/Google/RevenueCat is used
**only** to:

- Verify that your premium subscription is active when you open the app
- Restore your premium access if you delete and reinstall the app

We do not sell, share, rent, or otherwise transfer your data to anyone
else. We have no advertising partners.

---

## 3. Data retention

- **On your device:** retained until you delete the app or use the
  "Wipe all data" button in Settings.
- **Apple / Google:** retained per their respective privacy policies.
- **RevenueCat:** retained per their privacy policy
  (https://www.revenuecat.com/privacy). Typically the purchase record
  is kept for the lifetime of your subscription plus 7 years for
  accounting.

We retain nothing on our own servers because we don't operate any.

---

## 4. Your rights (GDPR / CCPA / CPRA)

Under applicable data-protection laws you have rights to access, port,
correct, and erase your data. Because all of YOUR data is on YOUR
device:

- **Access / portability:** open Settings → "Export data (JSON)" or
  use the encrypted backup feature (premium).
- **Correction:** edit any entry directly in the app.
- **Erasure:** Settings → "Wipe all data" (double-confirm).

For the small purchase-token slice held by Apple/Google/RevenueCat,
contact them directly — they are the data controllers for those
records, not us.

If you reside in a jurisdiction (e.g. California, EU, UK) that grants
additional rights, those rights apply directly against the third
parties listed in Section 1, since we hold no personal data of yours
on our infrastructure.

---

## 5. Optional features that change this posture

### Crash reporting (Sentry) — OFF by default

If a future release adds opt-in crash reporting (Sentry), enabling it
sends crash stack traces and basic device metadata (OS version, app
version, locale) to Sentry's servers. Wellness data is NEVER included
in crash reports. You can disable this from Settings at any time.

### AI Insights — OFF by default, opt-in only

AI Insights is an optional, opt-in feature available on premium tiers.
**It is off by default.** Turning it on requires:

1. A premium subscription (so the feature is gated by entitlement).
2. Reading the in-app consent screen that lists exactly what is sent
   and what is never sent.
3. Affirming the "I understand" checkbox.
4. Tapping **Enable AI Insights**.

#### What gets sent (only after you opt in)

When you tap "Generate insights," an anonymized summary is built
locally on your device and sent through our server-side proxy to
Anthropic (Claude). The summary contains exclusively:

- Drink counts grouped by ISO week (no exact timestamps).
- Mood-tag counts (e.g., `happy: 12, anxious: 4`).
- HALT trigger counts (hungry / angry / lonely / tired).
- Intention counts (celebrate / social / taste / bored / cope / other).
- Day-of-week pattern (counts only).
- Current streak length.
- An anonymous device ID generated locally at consent (rotates on
  revoke + re-grant).
- Your locale (e.g., `en`).

The exact JSON shape is defined in `src/lib/ai/types.ts` as
`SanitizedAIPayload`. The sanitization function in `src/lib/ai/sanitize.ts`
is **allowlist-based** — fields outside this list cannot pass through.
A defense-in-depth check runs before every send and refuses to
transmit if any forbidden field is present.

#### What is NEVER sent, even with AI Insights on

- Your name, email, phone, or address (we never collect these).
- Your IP address beyond what TLS unavoidably exposes to our proxy.
- Your location or any GPS data.
- Any free text you've written: journal entries, drink notes,
  alt-action text, voice transcripts.
- Custom drink names you've created (these may contain personal
  references like "Dad's IPA").
- Your weight, sex, or any other profile field.
- Exact timestamps of any logged event.
- Any persistent device identifier other than the rotating
  AI-Insights anonymous instance ID.

#### Provider posture (Anthropic)

- Anthropic does not train its production models on customer data.
- Prompts may be retained for up to 30 days for abuse detection.
- See https://www.anthropic.com/legal/privacy.

#### How the proxy works

Alchohalt itself does **not** embed an AI provider API key in the
app bundle. The opt-in network call goes to a server-side proxy that
holds the API key and rate-limits per anonymous device ID. We log
only the timestamp and the anonymous ID for rate-limiting; we do not
log the prompt body. The proxy retains nothing else about your usage.

In v1.0 the proxy is not yet deployed; the consent flow is live but
the network call itself is gated behind a feature flag and returns
a "coming in v1.1" placeholder. No data leaves the device until the
proxy ships.

#### Revoking consent

Settings → AI → **Revoke consent**. Revoking:

- Wipes the anonymous device ID locally.
- Stops any in-flight request immediately (client-side abort).
- Future re-grants generate a fresh anonymous device ID, so the
  proxy cannot link before-vs-after-revoke usage.

There is nothing for us to delete on the server side beyond the
proxy's rate-limit log; that log retains only the anonymous ID and
timestamps, not your prompt content.

#### Your state-specific rights

If you reside in Washington (MHMDA), Nevada (SB 370), Colorado
(CPA), or Connecticut (CTDPA), additional consumer-health-data
rights apply. See [Consumer Health Data Privacy Policy](./CONSUMER_HEALTH_DATA_POLICY.md)
for the state-specific disclosures.

---

## 6. Children

Alchohalt is rated 17+ on the App Store and Mature 17+ on Google Play
because it tracks alcohol consumption. Not directed at users under 17.

---

## 7. Changes to this policy

When we change this policy, we'll show a one-time in-app banner the
next time you open the app, with a summary of what changed. The latest
version is always at https://github.com/Zcg321/Alchohalt — until
owner sets up a custom domain, that's the canonical URL.

---

## 8. Contact

For questions about this policy, open a GitHub Discussion at
https://github.com/Zcg321/Alchohalt/discussions or open a GitHub Issue
at https://github.com/Zcg321/Alchohalt/issues.

---

## Counsel-review checklist (owner action — do BEFORE first paid user)

- [ ] Set Effective Date and Last Updated.
- [ ] Replace "owner action" placeholders with real values.
- [ ] If using a paid domain, replace GitHub URLs with `alchohalt.com/legal/privacy`.
- [ ] Have a lawyer review for: GDPR Art. 13 + 14 disclosures, CCPA
      "right to know" notice, ARL state requirements (CA / NY / IL /
      CO if you ever take subscriptions in those states — for in-app
      purchases via Apple/Google those rules apply to Apple/Google,
      not to us).
- [ ] Confirm RevenueCat's privacy posture matches what you claim above
      (they update their data-processing addendum annually).
- [ ] Verify Apple App Store nutrition labels match this policy:
      "Data Not Collected" everywhere except "Purchases → Linked to
      user identity (anonymous)."
