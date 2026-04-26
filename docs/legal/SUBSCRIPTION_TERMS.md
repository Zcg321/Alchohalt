# Subscription Terms — Alchohalt

**Effective date:** TBD (owner: set at submission)
**Last updated:** 2026-04-26 (template scaffold; counsel review required before public launch)

---

## TL;DR

- **Free tier is permanent.** Drink log, streak, money-saved widget,
  basic journal, crisis resources, biometric lock, and one default
  reminder are free forever. We will never move a free feature into
  the paid tier.
- **Premium tiers:** $3.99/month, $24.99/year, or $69 once for
  lifetime. Pricing may vary by region as set by the App Store /
  Google Play.
- **Auto-renewal:** monthly and yearly subscriptions auto-renew until
  cancelled. Cancel any time in your App Store / Google Play account
  settings — at least 24 hours before the period ends to avoid the
  next charge.
- **Lifetime is one charge, no renewal.** No subscription, no recurring
  bill. If we ever raise the lifetime price, anyone who already
  bought is grandfathered.
- **Free trials (if offered):** auto-convert to a paid subscription
  unless you cancel before the trial ends.
- **Refunds:** handled by Apple / Google per their refund policies.
  We do not have access to your payment method and cannot issue
  refunds directly.

---

## 1. Tiers + pricing

### Free — $0

**Always available, no payment required.** No expiry, no trial gimmick.

- Unlimited drink logging (custom drinks; time, amount, cost)
- Streak tracker with soft-restart language (no zero-reset shame)
- Money-saved counter (sums logged drinks × cost)
- Daily journal (text + emoji + mood tag, unlimited entries)
- Crisis resources page (988, SAMHSA, AA, SMART Recovery — never
  gated under any circumstance)
- Biometric lock (Face/Touch ID / device-passcode fallback)
- Local-only privacy posture (your data never leaves the device)
- One default daily reminder
- JSON export / import (for portability)
- Dark mode
- Multi-language (UI translations)

### Premium Monthly — $3.99 / month (USD; equivalent in local currency)

Auto-renews monthly. Cancel any time. Unlocks all premium features
listed below.

### Premium Yearly — $24.99 / year (USD; equivalent in local currency)

Auto-renews annually. Cancel any time. Saves ~48% vs monthly. Unlocks
all premium features.

### Premium Lifetime — $69 once (USD; equivalent in local currency)

One-time purchase. **No subscription, no auto-renewal, no recurring
charge.** Unlocks all premium features for the lifetime of the app
on the store account that purchased it. If we raise the lifetime
price in the future, prior purchasers are grandfathered.

---

## 2. Feature matrix

| Feature                               | Free | Premium |
|---------------------------------------|:----:|:-------:|
| Drink log (unlimited, custom drinks)  |  ✓   |    ✓    |
| Streak tracker + soft-restart copy    |  ✓   |    ✓    |
| Money-saved counter                   |  ✓   |    ✓    |
| Daily journal (text + emoji + mood)   |  ✓   |    ✓    |
| Crisis resources page                 |  ✓   |    ✓    |
| Biometric lock                        |  ✓   |    ✓    |
| One default reminder                  |  ✓   |    ✓    |
| JSON export / import                  |  ✓   |    ✓    |
| Dark mode + multi-language            |  ✓   |    ✓    |
| Mood ↔ drink correlation analytics    |      |    ✓    |
| Multiple custom reminders + messages  |      |    ✓    |
| CSV export                            |      |    ✓    |
| PDF export (printable wellness report)|      |    ✓    |
| Encrypted local backup (.alch-backup) |      |    ✓    |
| Multiple custom drink presets         |      |    ✓    |
| Advanced visualizations (heatmaps)    |      |    ✓    |
| Alternate app icon themes (3-5)       |      |    ✓    |
| Future AI-assisted insights (opt-in)  |      |    ✓    |

---

## 3. Auto-renewal disclosure (required by App Store + Google Play)

**For Premium Monthly and Premium Yearly subscriptions:**

- **Length of subscription:** 1 month (monthly) or 1 year (yearly).
- **Price per period:** $3.99 (monthly) or $24.99 (yearly), USD.
  Local currency pricing is shown at checkout and may vary by region
  per Apple / Google's pricing matrix.
- **Auto-renewal:** Your subscription will automatically renew at the
  end of each period unless you cancel at least 24 hours before the
  end of the current period.
- **How to cancel:** Manage your subscription in:
  - **iOS:** Settings → [Your Name] → Subscriptions → Alchohalt → Cancel.
  - **Android:** Google Play Store → [profile icon] → Payments &
    subscriptions → Subscriptions → Alchohalt → Cancel.
- **Account holder pays:** Payment is charged to your App Store /
  Google Play account at confirmation of purchase and at the start of
  each renewal period.
- **No partial refunds for unused time** within an already-paid
  period. (Apple / Google may issue discretionary refunds; we do not
  control that flow.)

**For Premium Lifetime:** one-time charge, no renewal, no recurring
billing. The "lifetime" duration refers to the lifetime of the app
on the App Store / Google Play store account that purchased it. If
the app is delisted from the stores in the future, see Section 8.

---

## 4. Free trials (if/when offered)

If we ever offer a free trial of a paid subscription:

- The trial duration and terms will be shown clearly at the point of
  purchase, before you confirm.
- The subscription will auto-convert to a paid subscription at the
  end of the trial **unless you cancel at least 24 hours before the
  trial ends.**
- Cancellation during the trial preserves trial access until the
  trial period ends and then prevents the conversion charge.
- One trial per store account; re-purchasing after a cancelled trial
  does not re-trigger trial pricing.

This scaffold assumes no free trial at v1 launch. Update this section
if owner enables a trial in App Store Connect or Google Play Console.

---

## 5. What happens at the boundaries

### When you upgrade

A paid subscription unlocks every premium feature listed in Section 2
on every device signed into the same App Store / Google Play account.
Entitlement is checked at app launch and then cached locally. If the
entitlement check fails (network down, RevenueCat unreachable), free
features continue to work; previously-cached premium entitlement
remains honored client-side until the next successful re-check.

### When you cancel a subscription

You retain premium access through the end of your current paid
period. After expiry, the app reverts to free tier. **No data is
deleted or hidden.** Every drink log, journal entry, mood tag, and
goal you created on premium remains fully accessible on free.

### When you switch tiers

- **Monthly → Yearly (or vice versa):** Apple / Google handles the
  proration. You keep premium access continuously.
- **Subscription → Lifetime:** Apple does not natively prorate
  cross-tier purchases. You may end up briefly paying for both;
  contact Apple Support / Google Play Support for any refund.

### When you reinstall the app

Tap "Restore Purchases" in Settings → Subscription. The app re-reads
the entitlement from the App Store / Google Play account, which
restores your premium tier. You don't have to pay again.

### When you switch devices

Premium entitlement follows the App Store / Google Play account, not
the device. Sign in to your store account on the new device and tap
Restore Purchases. Wellness data does NOT follow you — that's stored
only on the prior device. Use the encrypted backup feature (premium)
to move your wellness data to the new device manually.

### When you delete the app

Your local wellness data is deleted along with the app. Your
subscription continues to renew on the store side until you cancel
it explicitly in App Store / Google Play account settings.
Reinstalling and tapping Restore Purchases brings premium back; it
does NOT bring back deleted wellness data.

---

## 6. Refunds

Refund decisions for App Store and Google Play purchases are made by
Apple and Google respectively, per their published refund policies.
We do not have access to your payment method and cannot directly
issue refunds.

To request a refund:

- **iOS:** https://reportaproblem.apple.com → Apps → Alchohalt → Request a refund.
- **Android:** https://play.google.com/store/account/orderhistory → Find Alchohalt → Request a refund (if eligible).

Some jurisdictions (notably the EU under the Consumer Rights
Directive) grant a 14-day cooling-off period for digital purchases
unless you've expressly waived it by starting to use the service. We
honor that right; contact us if Apple / Google declines a refund
that applicable law requires us to honor.

---

## 7. Pricing changes

If we change the price of a recurring subscription:

- **Existing subscribers** are grandfathered at their current price
  for at least their next renewal period.
- We will notify you in-app and via the store's required notification
  flow at least 30 days before the higher price takes effect.
- If you do not accept the new price, you may cancel before the next
  renewal at no further charge.

If we change the price of the lifetime tier, prior purchasers are
permanently grandfathered.

---

## 8. App availability

The app is published via the Apple App Store and Google Play Store.
We may delist the app, change its features, or discontinue
development. If we discontinue:

- We will provide at least 60 days' notice in-app and on the store
  listing.
- Active monthly / yearly subscriptions will be allowed to lapse
  without further renewal; we will not charge for renewals after the
  delist date.
- Lifetime purchasers retain access to the last-shipped version on
  any device that still has it installed; we cannot guarantee
  availability of new installs from the store after delist.
- Active premium features that depend on a third-party service
  (e.g., RevenueCat for entitlement validation) will be replaced by
  a permanent client-side entitlement before delist where feasible,
  so that lifetime purchasers retain access without depending on a
  service we no longer operate.

---

## 9. Restoring purchases on a re-installed device

Tap **Settings → Subscription → Restore Purchases**. The app calls
the App Store / Google Play receipt-validation flow (via RevenueCat
in production) and re-applies the entitlement that matches your
store account. This is the ONLY way to reactivate a paid tier after
reinstall — there is no email/password recovery because we have no
account system.

---

## 10. Contact

For questions about subscriptions, billing problems Apple / Google
cannot resolve, or grandfathering questions:

- GitHub Discussion: https://github.com/Zcg321/Alchohalt/discussions
- GitHub Issue: https://github.com/Zcg321/Alchohalt/issues

For payment-method or refund questions: contact Apple / Google
directly using the links in Section 6.

---

## Counsel-review checklist (owner action — do BEFORE first paid user)

- [ ] Set Effective Date + Last Updated.
- [ ] Confirm prices in Sections 1 + 3 match the App Store Connect /
      Play Console pricing tier you actually configure (Apple's
      pricing tiers don't have a $3.99 USD slot in every region; the
      generated regional prices may differ slightly).
- [ ] Confirm the cancellation paths in Section 3 still match Apple /
      Google's current UI flow (these change every couple of years).
- [ ] If owner enables a free trial in App Store Connect or Play
      Console, update Section 4 with concrete trial duration +
      conversion behavior, and update App Store / Play screenshots /
      metadata to match.
- [ ] CA Auto-Renewal Law compliance check: in-app cancel link must
      be present (Apple / Google handle this via deep link), and the
      auto-renewal disclosure must appear on the purchase confirmation
      screen — not only here.
- [ ] EU Consumer Rights Directive: confirm the in-app purchase flow
      shows the "By starting to use this digital service, I waive my
      14-day right of withdrawal" acknowledgment in EU regions.
- [ ] Have counsel confirm Section 8 (app availability + lifetime
      delist behavior) is enforceable as written and that there's no
      better way to ring-fence the lifetime promise against future
      RevenueCat dependence.
