# Privacy Policy — Alchohalt

**Effective date:** TBD (owner: set at submission)
**Last updated:** 2026-04-26 (template scaffold; counsel review required before public launch)

---

## TL;DR

Your wellness data never leaves your phone. We don't run a server that
sees your drink log, mood, or journal entries. The only third parties
that ever see anything from your use of Alchohalt are:

1. **Apple App Store / Google Play** — they handle your subscription
   payment if you pay for premium. They tell us only "this anonymous
   user paid." They don't tell us your name, card, or anything else.
2. **RevenueCat** (purchase-validation broker) — they receive an
   anonymous user ID and a product ID at the moment you make a
   purchase, so we can confirm your premium entitlement is real. They
   never see your wellness data.

Everything else — every drink you log, every mood tag, every HALT
trigger, every dollar spent, every journal entry — stays on your
device.

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
| 988 / SAMHSA / hotlines | Whatever you say in the call/text | Only when YOU tap a hotline link in our Crisis Resources page | They are the actual crisis service. We don't see what you say. |
| External support sites (AA, SMART Recovery) | Whatever your browser tells them | Only when YOU tap a "Visit" link | We don't proxy these — they're direct browser links. |

That's the complete list.

### What we do NOT collect (and never will)

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

### AI-assisted insights — OFF by default, on-device when feasible

Future "AI insights" premium features will be on-device when feasible.
If a feature ever requires sending data to a remote AI, it will be
clearly labeled and require explicit opt-in per use, with the data
that would be sent shown to you first. We will update this policy
before any such feature ships.

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
