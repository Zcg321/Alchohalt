# RevenueCat product configuration — owner-action playbook

The RevenueCat **client SDK** is wired up (commit `dd379c0 [ALCH-IAP-REAL]`,
Sprint 1). The **dashboard side** — accounts, products, offerings,
entitlements, webhooks — is owner-action and described step by step
below. Cleared end-to-end this takes ~30 minutes.

Goal: at the end of this playbook the app's `useSubscription()` hook
reads real entitlement state from RevenueCat in production, and a
purchase made in App Store / Play Store flips a user from `free` to
`premium` automatically.

## What's already wired (don't redo)

In code, already shipped:

- `RevenueCatIAPProvider` at `src/features/iap/IAPProvider.ts` — wraps
  `@revenuecat/purchases-capacitor`. Reads `VITE_REVENUECAT_API_KEY_IOS`
  and `VITE_REVENUECAT_API_KEY_ANDROID` env vars at build time.
- The `useSubscription()` hook reads the **`premium`** entitlement (lower
  case, that exact spelling) from `Purchases.getCustomerInfo()`.
- Product IDs in `src/config/plans.ts`:

  | Plan                   | Product ID                             | Price ref |
  |------------------------|----------------------------------------|-----------|
  | Monthly subscription   | `com.alchohalt.app.premium_monthly`    | $3.99 / mo |
  | Yearly subscription    | `com.alchohalt.app.premium_yearly`     | $24.99 / yr |
  | Lifetime (one-time)    | `com.alchohalt.app.premium_lifetime`   | $69.00 once |

  These exact strings must be created in App Store Connect and Google
  Play Console — they're how RevenueCat maps store SKUs back to the app.
  If you change them, change them in `plans.ts` too.

The free tier (`PlanId === 'free'`) bypasses RevenueCat entirely.
Crisis resources, biometric lock, basic journal, and streak tracking are
all wired to the free tier and do **not** check entitlement state.

## Step 1 — RevenueCat account (5 min)

1. Sign up at https://app.revenuecat.com/signup. Free tier covers up to
   $10K monthly tracked revenue (MTR); paid tiers start at $99/mo.
   Alchohalt at $3.99/mo would need ~2,500 active subscribers before
   the free tier becomes a constraint.
2. Create a new project. Name it `Alchohalt`. Bundle ID: `com.alchohalt.app`.
3. From **Project settings → API keys**, copy:
   - **Public app key (iOS)** — looks like `appl_xxxxxxxxxxxxxxxxxxxxxx`
   - **Public app key (Android)** — looks like `goog_xxxxxxxxxxxxxxxxxxxxxx`

   These go in the build environment as:

   ```bash
   VITE_REVENUECAT_API_KEY_IOS=appl_xxxxxxxxxxxxxxxxxxxxxx
   VITE_REVENUECAT_API_KEY_ANDROID=goog_xxxxxxxxxxxxxxxxxxxxxx
   VITE_ENABLE_IAP=true
   ```

   Anything else is an opaque secret and stays in RevenueCat.

## Step 2 — Create the App Store products (10 min, requires Apple Developer enrollment)

In App Store Connect → My Apps → Alchohalt → **In-App Purchases**:

| RevenueCat will look for | Type                              | Reference price |
|--------------------------|-----------------------------------|-----------------|
| `com.alchohalt.app.premium_monthly`  | Auto-Renewable Subscription, 1 month | Tier 4 ($3.99) |
| `com.alchohalt.app.premium_yearly`   | Auto-Renewable Subscription, 1 year  | Tier 25 ($24.99) |
| `com.alchohalt.app.premium_lifetime` | Non-Consumable                       | Tier 69 ($69.00) |

For the two subscriptions, create a single **Subscription Group** named
`Premium` and put both products in it. App Store will then enforce the
"only one active premium subscription at a time" rule for free.

Each product needs:
- Display name (shows in the App Store native paywall): "Alchohalt Premium — Monthly", etc.
- Description: copy from `src/config/plans.ts`'s `subtitle` field
- Localization: at minimum English (US). Add more later.
- Review screenshot: a screenshot of the in-app paywall showing the product

For the Subscription Group, set the **Privacy Policy URL** to
`https://zcg321.github.io/alchohalt/privacy-policy.html` (published by
the `pages.yml` workflow — see `LISTING_NOTES.md`).

## Step 3 — Create the Google Play products (10 min, requires Play Console enrollment)

In Play Console → Alchohalt → **Monetize → Products**:

- **Subscriptions** → Create subscription:
  - Product ID: `com.alchohalt.app.premium_monthly`
  - Base plan ID: `monthly` — Auto-renewing, billing period 1 month, $3.99 USD
  - Product ID: `com.alchohalt.app.premium_yearly`
  - Base plan ID: `yearly` — Auto-renewing, billing period 1 year, $24.99 USD
- **In-app products** → Create:
  - Product ID: `com.alchohalt.app.premium_lifetime`
  - Type: Non-consumable, $69.00 USD

The base plan IDs (`monthly`, `yearly`) feed RevenueCat's offering
mapping. Keep them lowercase and stable.

## Step 4 — Wire RevenueCat to the stores (5 min)

Back in RevenueCat → **App settings → App Store** and **App settings → Google Play**:

- App Store: paste the **App-Specific Shared Secret** from App Store
  Connect → My Apps → Alchohalt → App Information.
- Google Play: upload the **service account JSON** with
  `androidpublisher` API access. (Play Console → Setup → API access →
  Create new service account.)

Once both are linked, RevenueCat's **Product catalog** page should show
the three product IDs from each store side, side by side.

## Step 5 — Define the Entitlement and Offering (3 min)

In RevenueCat:

1. **Entitlements → New entitlement**:
   - ID: **`premium`** (lowercase — must match the spelling in
     `useSubscription()`; do not pluralize, do not capitalize)
   - Description: "Premium tier — unlocks analytics, multi-reminders,
     CSV/PDF export, encrypted backup, custom presets, advanced viz,
     icon themes, AI Insights."
2. Attach all three products to the `premium` entitlement.
3. **Offerings → Default offering** — name it `default`. Add three
   packages, in this order:
   - `$rc_lifetime` → `com.alchohalt.app.premium_lifetime`
   - `$rc_annual` → `com.alchohalt.app.premium_yearly`
   - `$rc_monthly` → `com.alchohalt.app.premium_monthly`

   The `$rc_*` package IDs are RevenueCat conventions and the SDK
   knows them implicitly.

## Step 6 — Sandbox test (5 min)

Before pushing live products:

1. **iOS**: in App Store Connect → Users and Access → Sandbox → add a
   test account with a fresh email. Sign into iOS Settings → App Store
   with that account. Run a TestFlight build of Alchohalt, hit the
   paywall, complete the purchase. Verify in RevenueCat → Customers
   that the account flipped to `premium` entitlement.
2. **Android**: add a license tester in Play Console → Setup → License
   testing. Build and sideload the signed APK with Internal Testing.
   Same flow — paywall → purchase → verify in RevenueCat.

If either fails: 90% of the time the bug is in the product ID string.
The product ID in App Store Connect / Play Console **must** be
character-for-character identical to the string in `plans.ts`.

## Step 7 — Webhook to Supabase (optional, 5 min)

If you want subscription state to sync into Supabase (for cross-device
entitlement checks), set up a webhook:

1. RevenueCat → **Project settings → Integrations → Webhooks → Add**
2. URL: `https://<your-supabase-project>.supabase.co/functions/v1/revenuecat-webhook`
3. Events: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`,
   `EXPIRATION`, `BILLING_ISSUE`, `NON_RENEWING_PURCHASE`,
   `PRODUCT_CHANGE`.
4. Authorization header: a shared secret you generate and keep in
   Supabase env as `REVENUECAT_WEBHOOK_SECRET`.

This step is **optional** for v1. The client-side `useSubscription()`
hook reads RevenueCat directly on app open, which is sufficient for
single-device users.

## Step 8 — Flip RevenueCat to production (1 min)

Once sandbox testing passes:

- App Store products: submit them with the next app build for review.
- Play Console products: change status from "Inactive" to "Active".
- RevenueCat: nothing to flip — it's already production-ready, just
  awaiting the App Store / Play Console approval that lets real
  customers complete a purchase.

## Troubleshooting

**"useSubscription() always returns free even after purchase"**
- Check the entitlement ID is exactly `premium` (lowercase)
- Check the API keys are loaded — `VITE_REVENUECAT_API_KEY_IOS` /
  `_ANDROID` must be set at build time, not at runtime
- In RevenueCat → Customers, look up the user by anonymous app user ID
  and verify the entitlement is attached

**"Purchase succeeds but RevenueCat doesn't see it"**
- App Store: shared secret in RevenueCat → App Store settings is wrong
  or expired
- Google Play: service account JSON missing `androidpublisher` scope

**"Sandbox account is stuck — can't re-test purchases"**
- iOS: Settings → App Store → sign out, sign back in with sandbox account
- Android: Play Store → app info → Manage subscriptions → cancel test sub

## Done state

When all of this is done, the owner-side IAP work is finished. The next
build that App Store / Play Store review approves can flip on
`VITE_ENABLE_IAP=true` in CI and ship. Until then the app stays on the
mock IAP provider and every user is on the `free` tier.
