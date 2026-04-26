/**
 * IAP service abstraction.
 *
 * Two implementations:
 *   - MockIAPProvider — used in tests + dev when env vars are missing.
 *   - RevenueCatIAPProvider — used in production. Wraps
 *     @revenuecat/purchases-capacitor (Cap 6 compatible build).
 *
 * `getIAPProvider()` selects the right one at runtime based on env:
 *   VITE_ENABLE_IAP=true + VITE_REVENUECAT_API_KEY_IOS|_ANDROID set →
 *   RevenueCat. Otherwise Mock.
 */

import { PLANS } from '../../config/plans';

export type ProductId = 'premium_monthly' | 'premium_yearly' | 'premium_lifetime';

export type PurchaseState = 'pending' | 'approved' | 'failed' | 'cancelled';

export interface Product {
  id: ProductId;
  title: string;
  description: string;
  price: string;
  priceCurrency: string;
  priceAmount: number;
}

export interface Purchase {
  productId: ProductId;
  transactionId: string;
  purchaseDate: Date;
  state: PurchaseState;
}

export interface EntitlementState {
  isPremium: boolean;
  productId?: ProductId;
  expiryDate?: Date;
  isTrialActive?: boolean;
}

export interface IAPProvider {
  initialize(): Promise<void>;
  getProducts(): Promise<Product[]>;
  purchase(productId: ProductId): Promise<Purchase>;
  restore(): Promise<Purchase[]>;
  getEntitlementState(): Promise<EntitlementState>;
  ownsProduct(productId: ProductId): Promise<boolean>;
}

// ─────────────────────────────────────────────────────────
// Helper: map RevenueCat product identifier ↔ our ProductId
// (the IDs in App Store Connect / Play Console MUST match
// PLANS[*].productId from src/config/plans.ts)
// ─────────────────────────────────────────────────────────

const RC_TO_PRODUCT_ID: Record<string, ProductId> = {
  [PLANS.premium_monthly.productId!]: 'premium_monthly',
  [PLANS.premium_yearly.productId!]: 'premium_yearly',
  [PLANS.premium_lifetime.productId!]: 'premium_lifetime',
};

const PRODUCT_ID_TO_RC: Record<ProductId, string> = {
  premium_monthly: PLANS.premium_monthly.productId!,
  premium_yearly: PLANS.premium_yearly.productId!,
  premium_lifetime: PLANS.premium_lifetime.productId!,
};

const PRODUCT_TITLES: Record<ProductId, string> = {
  premium_monthly: PLANS.premium_monthly.name,
  premium_yearly: PLANS.premium_yearly.name,
  premium_lifetime: PLANS.premium_lifetime.name,
};

const PRODUCT_DESCRIPTIONS: Record<ProductId, string> = {
  premium_monthly: PLANS.premium_monthly.subtitle,
  premium_yearly: PLANS.premium_yearly.subtitle,
  premium_lifetime: PLANS.premium_lifetime.subtitle,
};

// ─────────────────────────────────────────────────────────
// MockIAPProvider — dev / tests
// ─────────────────────────────────────────────────────────

export class MockIAPProvider implements IAPProvider {
  private purchases: Purchase[] = [];
  private mockProducts: Product[] = (
    ['premium_monthly', 'premium_yearly', 'premium_lifetime'] as ProductId[]
  ).map((id) => ({
    id,
    title: PRODUCT_TITLES[id],
    description: PRODUCT_DESCRIPTIONS[id],
    price: PLANS[id].priceLabel,
    priceCurrency: PLANS[id].currency.toUpperCase(),
    priceAmount: PLANS[id].amountCents / 100,
  }));

  async initialize(): Promise<void> {
    /* no-op for mock */
  }

  async getProducts(): Promise<Product[]> {
    return this.mockProducts;
  }

  async purchase(productId: ProductId): Promise<Purchase> {
    await new Promise((r) => setTimeout(r, 300));
    const purchase: Purchase = {
      productId,
      transactionId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      purchaseDate: new Date(),
      state: 'approved',
    };
    this.purchases.push(purchase);
    return purchase;
  }

  async restore(): Promise<Purchase[]> {
    return this.purchases;
  }

  async getEntitlementState(): Promise<EntitlementState> {
    const active = this.purchases.find((p) => p.state === 'approved');
    return {
      isPremium: !!active,
      productId: active?.productId,
      expiryDate: active
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : undefined,
      isTrialActive: false,
    };
  }

  async ownsProduct(productId: ProductId): Promise<boolean> {
    return this.purchases.some(
      (p) => p.productId === productId && p.state === 'approved',
    );
  }
}

// ─────────────────────────────────────────────────────────
// RevenueCatIAPProvider — production
//
// Wraps @revenuecat/purchases-capacitor v9 (the latest series that
// supports Capacitor 6, which is what this app currently runs on).
// Upgrading to Capacitor 8 + RevenueCat 13 is a separate task.
//
// Singleton entitlement: 'premium' (configured in RevenueCat dashboard).
// Any of the 3 product IDs maps to that entitlement.
// ─────────────────────────────────────────────────────────

interface RcLikePurchases {
  configure(config: { apiKey: string; appUserID?: string | null }): Promise<void>;
  getOfferings(): Promise<unknown>;
  purchasePackage(args: { aPackage: unknown }): Promise<{
    customerInfo: RcCustomerInfo;
    productIdentifier: string;
  }>;
  restorePurchases(): Promise<{ customerInfo: RcCustomerInfo }>;
  getCustomerInfo(): Promise<{ customerInfo: RcCustomerInfo }>;
}

interface RcCustomerInfo {
  entitlements: {
    active?: Record<string, RcEntitlement | undefined>;
  };
}

interface RcEntitlement {
  identifier?: string;
  productIdentifier?: string;
  isActive?: boolean;
  expirationDate?: string | null;
  willRenew?: boolean;
  periodType?: string;
}

const PREMIUM_ENTITLEMENT = 'premium';

export class RevenueCatIAPProvider implements IAPProvider {
  private rc: RcLikePurchases | null = null;
  private offerings: { packages?: Array<{ identifier: string; product: { identifier: string; priceString?: string; price?: number; currencyCode?: string; title?: string; description?: string }; rcPackage: unknown }> } = {};

  async initialize(): Promise<void> {
    const apiKey = readApiKey();
    if (!apiKey) {
      throw new Error(
        'RevenueCat API key not configured. Set VITE_REVENUECAT_API_KEY_IOS / _ANDROID.',
      );
    }
    // Lazy-import so the SDK never loads in tests / non-Capacitor contexts.
    const mod = await import('@revenuecat/purchases-capacitor');
    this.rc = mod.Purchases as unknown as RcLikePurchases;
    await this.rc.configure({ apiKey });
    await this.refreshOfferings();
  }

  private async refreshOfferings(): Promise<void> {
    if (!this.rc) return;
    const result = await this.rc.getOfferings();
    // Walk RC's nested offerings object: { current: { availablePackages: [...] } }
    const r = result as { current?: { availablePackages?: unknown[] } };
    const pkgs: Array<{ identifier: string; product: { identifier: string; priceString?: string; price?: number; currencyCode?: string; title?: string; description?: string }; rcPackage: unknown }> = [];
    for (const pkg of r.current?.availablePackages ?? []) {
      const p = pkg as {
        identifier: string;
        product: { identifier: string; priceString?: string; price?: number; currencyCode?: string; title?: string; description?: string };
      };
      pkgs.push({ identifier: p.identifier, product: p.product, rcPackage: pkg });
    }
    this.offerings = { packages: pkgs };
  }

  async getProducts(): Promise<Product[]> {
    if (!this.rc) await this.initialize();
    if (!this.offerings.packages || this.offerings.packages.length === 0) {
      // Fall back to the static plan metadata so the UI still renders.
      return (
        ['premium_monthly', 'premium_yearly', 'premium_lifetime'] as ProductId[]
      ).map((id) => ({
        id,
        title: PRODUCT_TITLES[id],
        description: PRODUCT_DESCRIPTIONS[id],
        price: PLANS[id].priceLabel,
        priceCurrency: PLANS[id].currency.toUpperCase(),
        priceAmount: PLANS[id].amountCents / 100,
      }));
    }
    return this.offerings.packages
      .map((pkg) => {
        const id = RC_TO_PRODUCT_ID[pkg.product.identifier];
        if (!id) return null;
        return {
          id,
          title: pkg.product.title ?? PRODUCT_TITLES[id],
          description: pkg.product.description ?? PRODUCT_DESCRIPTIONS[id],
          price: pkg.product.priceString ?? PLANS[id].priceLabel,
          priceCurrency: pkg.product.currencyCode ?? PLANS[id].currency.toUpperCase(),
          priceAmount: pkg.product.price ?? PLANS[id].amountCents / 100,
        };
      })
      .filter((p): p is Product => p !== null);
  }

  async purchase(productId: ProductId): Promise<Purchase> {
    if (!this.rc) await this.initialize();
    if (!this.offerings.packages) await this.refreshOfferings();
    const rcId = PRODUCT_ID_TO_RC[productId];
    const pkg = this.offerings.packages?.find(
      (p) => p.product.identifier === rcId,
    );
    if (!pkg) {
      throw new Error(
        `Product ${productId} (RC id ${rcId}) not found in current offerings.`,
      );
    }
    try {
      const result = await this.rc!.purchasePackage({ aPackage: pkg.rcPackage });
      const isApproved = isPremiumActive(result.customerInfo);
      return {
        productId,
        transactionId: result.productIdentifier,
        purchaseDate: new Date(),
        state: isApproved ? 'approved' : 'pending',
      };
    } catch (err) {
      // RevenueCat throws with userCancelled flag; we surface as cancelled.
      const e = err as { userCancelled?: boolean; message?: string };
      if (e.userCancelled) {
        return {
          productId,
          transactionId: '',
          purchaseDate: new Date(),
          state: 'cancelled',
        };
      }
      return {
        productId,
        transactionId: '',
        purchaseDate: new Date(),
        state: 'failed',
      };
    }
  }

  async restore(): Promise<Purchase[]> {
    if (!this.rc) await this.initialize();
    const result = await this.rc!.restorePurchases();
    return purchasesFromCustomerInfo(result.customerInfo);
  }

  async getEntitlementState(): Promise<EntitlementState> {
    if (!this.rc) await this.initialize();
    const result = await this.rc!.getCustomerInfo();
    return entitlementStateFromCustomerInfo(result.customerInfo);
  }

  async ownsProduct(productId: ProductId): Promise<boolean> {
    const state = await this.getEntitlementState();
    return state.productId === productId && state.isPremium;
  }
}

// ─── Helpers shared across the RC provider ───

function readApiKey(): string | null {
  if (typeof globalThis === 'undefined') return null;
  // import.meta.env access wrapped so tests don't fail
  const env = (globalThis as { __RC_ENV__?: Record<string, string> }).__RC_ENV__ ??
    (typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: Record<string, string | undefined> }).env : undefined);
  if (!env) return null;
  // Platform detection happens at the Capacitor layer; we pass whichever
  // key matches the current build target (set by env at build time).
  const ios = env.VITE_REVENUECAT_API_KEY_IOS;
  const android = env.VITE_REVENUECAT_API_KEY_ANDROID;
  return android ?? ios ?? null;
}

function isPremiumActive(info: RcCustomerInfo): boolean {
  const ent = info.entitlements?.active?.[PREMIUM_ENTITLEMENT];
  return !!ent && ent.isActive !== false;
}

function entitlementStateFromCustomerInfo(info: RcCustomerInfo): EntitlementState {
  const ent = info.entitlements?.active?.[PREMIUM_ENTITLEMENT];
  if (!ent) return { isPremium: false };
  const productId = ent.productIdentifier
    ? RC_TO_PRODUCT_ID[ent.productIdentifier]
    : undefined;
  return {
    isPremium: ent.isActive !== false,
    productId,
    expiryDate: ent.expirationDate ? new Date(ent.expirationDate) : undefined,
    isTrialActive: ent.periodType === 'TRIAL' || ent.periodType === 'trial',
  };
}

function purchasesFromCustomerInfo(info: RcCustomerInfo): Purchase[] {
  const out: Purchase[] = [];
  for (const ent of Object.values(info.entitlements?.active ?? {})) {
    if (!ent) continue;
    const productId =
      ent.productIdentifier && RC_TO_PRODUCT_ID[ent.productIdentifier];
    if (!productId) continue;
    out.push({
      productId,
      transactionId: ent.productIdentifier ?? '',
      purchaseDate: new Date(),
      state: ent.isActive !== false ? 'approved' : 'failed',
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────
// Singleton selection
// ─────────────────────────────────────────────────────────

let iapProvider: IAPProvider | null = null;

/**
 * Get the active IAP provider.
 *
 * Selection rules:
 *   - VITE_ENABLE_IAP === 'true' AND a RevenueCat API key is set →
 *     RevenueCatIAPProvider
 *   - Otherwise → MockIAPProvider
 *
 * The selection is cached for the process lifetime. Use setIAPProvider()
 * to override in tests.
 */
export function getIAPProvider(): IAPProvider {
  if (iapProvider) return iapProvider;
  const env =
    typeof import.meta !== 'undefined'
      ? ((import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {})
      : {};
  const enabled = env.VITE_ENABLE_IAP === 'true';
  const hasKey =
    !!env.VITE_REVENUECAT_API_KEY_IOS || !!env.VITE_REVENUECAT_API_KEY_ANDROID;
  if (enabled && hasKey) {
    iapProvider = new RevenueCatIAPProvider();
  } else {
    iapProvider = new MockIAPProvider();
  }
  return iapProvider;
}

/** Test seam — override the selection. */
export function setIAPProvider(provider: IAPProvider): void {
  iapProvider = provider;
}

/** Test seam — clear the cached provider. */
export function _resetIAPProvider(): void {
  iapProvider = null;
}
