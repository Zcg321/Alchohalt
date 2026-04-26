# IAP swap surface — RevenueCat wiring map

**Audience:** anyone wiring real RevenueCat after the `ALCH-PRICING` commit lands.

## Where MockIAPProvider lives today

```
src/features/iap/IAPProvider.ts
  ├─ class MockIAPProvider          ← in-memory stub
  ├─ class RevenueCatIAPProvider    ← stub, throws on every method
  ├─ getIAPProvider()               ← module singleton, returns Mock today
  └─ setIAPProvider(provider)       ← test seam
```

## Callsites today

`getIAPProvider()` is **not imported anywhere outside `IAPProvider.ts`**.
Verified by `grep -rln 'getIAPProvider\|MockIAPProvider' src/`. The whole
IAP surface is currently disconnected from the rest of the app.

The `subscriptionStore` (Zustand-persisted) reads `currentSubscription`
which… nothing ever sets. Premium UI is feature-flagged off. So flipping
`ENABLE_IAP=true` today would expose premium UI but the purchase button
would do nothing (no callsite wired).

## Swap plan (executed in `[ALCH-IAP-REAL]`)

1. Implement `RevenueCatIAPProvider` (currently throws on every method).
   Use `@revenuecat/purchases-capacitor` — the official cross-platform SDK
   (one call site for both iOS StoreKit + Google Play Billing).
2. Make `getIAPProvider()` return `RevenueCatIAPProvider` when
   `import.meta.env.VITE_ENABLE_IAP === 'true'` AND `VITE_REVENUECAT_API_KEY`
   is set. Otherwise fall back to `MockIAPProvider` (dev / tests).
3. App-load (`src/main.tsx`): call `getIAPProvider().initialize()` then
   `restore()`. Push the resulting `EntitlementState` into
   `subscriptionStore`.
4. `SubscriptionManager.tsx` purchase buttons → `getIAPProvider().purchase(productId)`
   → on success: `setSubscription(...)`. On failure: toast + audit-log.
5. Background: hook `Purchases.addCustomerInfoUpdateListener` to keep the
   store in sync if entitlements change while the app is open
   (e.g. user redeems a code in App Store).

## RevenueCat dashboard config (owner-task — flag in final report)

1. Sign up at app.revenuecat.com (free until $10K MTR).
2. Create project "Alchohalt".
3. Connect App Store Connect (needs Apple Dev account + App-Specific Shared Secret).
4. Connect Google Play Console (needs Service Account JSON).
5. Create 3 products with the IDs in `plans.ts`:
   - `com.alchohalt.app.premium_monthly`  (auto-renewable subscription, 1 month)
   - `com.alchohalt.app.premium_yearly`   (auto-renewable subscription, 1 year)
   - `com.alchohalt.app.premium_lifetime` (non-consumable)
6. Define ONE entitlement: `premium`. Attach all 3 products to it.
7. Copy the public iOS API key + public Android API key.
8. Set in app's build env: `VITE_REVENUECAT_API_KEY_IOS`, `VITE_REVENUECAT_API_KEY_ANDROID`.
9. Submit a test purchase in App Store Sandbox + Google Play Internal Testing.

## Sanity test that ships in `[ALCH-TESTS]`

```ts
// tests/iap/provider.test.ts
import { describe, it, expect } from 'vitest';
import { getIAPProvider, MockIAPProvider, RevenueCatIAPProvider } from '@/features/iap/IAPProvider';

describe('IAPProvider — production safety', () => {
  it('falls back to Mock when ENABLE_IAP is false', () => {
    // env defaults — VITE_ENABLE_IAP undefined
    expect(getIAPProvider()).toBeInstanceOf(MockIAPProvider);
  });

  // The CRITICAL test — ensures we don't ship Mock to production
  it('selects RevenueCat when ENABLE_IAP=true + api key set', () => {
    // setup env, expect RevenueCatIAPProvider
    // …
  });
});
```
