/**
 * IAP Service Interface (Task 23)
 * In-app purchases abstraction - no vendor lock-in
 * Mock provider for testing without actual store integration
 */

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

/**
 * IAPProvider interface - defines the contract for IAP implementations
 */
export interface IAPProvider {
  /**
   * Initialize the IAP provider
   */
  initialize(): Promise<void>;

  /**
   * Get available products
   */
  getProducts(): Promise<Product[]>;

  /**
   * Purchase a product
   */
  purchase(productId: ProductId): Promise<Purchase>;

  /**
   * Restore previous purchases
   */
  restore(): Promise<Purchase[]>;

  /**
   * Get current entitlement state
   */
  getEntitlementState(): Promise<EntitlementState>;

  /**
   * Check if a specific product is owned
   */
  ownsProduct(productId: ProductId): Promise<boolean>;
}

/**
 * Mock IAP Provider for testing
 * Simulates purchase flow without actual store integration
 */
export class MockIAPProvider implements IAPProvider {
  private purchases: Purchase[] = [];
  private mockProducts: Product[] = [
    {
      id: 'premium_monthly',
      title: 'Premium Monthly',
      description: 'All premium features, billed monthly',
      price: '$4.99',
      priceCurrency: 'USD',
      priceAmount: 4.99
    },
    {
      id: 'premium_yearly',
      title: 'Premium Yearly',
      description: 'All premium features, billed yearly (save 40%)',
      price: '$29.99',
      priceCurrency: 'USD',
      priceAmount: 29.99
    },
    {
      id: 'premium_lifetime',
      title: 'Premium Lifetime',
      description: 'All premium features, one-time payment',
      price: '$79.99',
      priceCurrency: 'USD',
      priceAmount: 79.99
    }
  ];

  async initialize(): Promise<void> {
    console.log('MockIAPProvider: Initialized');
    // In real implementation, this would initialize the store SDK
  }

  async getProducts(): Promise<Product[]> {
    console.log('MockIAPProvider: Getting products');
    return this.mockProducts;
  }

  async purchase(productId: ProductId): Promise<Purchase> {
    console.log('MockIAPProvider: Purchasing', productId);
    
    // Simulate purchase flow
    await new Promise(resolve => setTimeout(resolve, 1000));

    const purchase: Purchase = {
      productId,
      transactionId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      purchaseDate: new Date(),
      state: 'approved'
    };

    this.purchases.push(purchase);
    return purchase;
  }

  async restore(): Promise<Purchase[]> {
    console.log('MockIAPProvider: Restoring purchases');
    return this.purchases;
  }

  async getEntitlementState(): Promise<EntitlementState> {
    const activePurchase = this.purchases.find(p => p.state === 'approved');
    
    return {
      isPremium: !!activePurchase,
      productId: activePurchase?.productId,
      expiryDate: activePurchase ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
      isTrialActive: false
    };
  }

  async ownsProduct(productId: ProductId): Promise<boolean> {
    return this.purchases.some(p => p.productId === productId && p.state === 'approved');
  }
}

/**
 * RevenueCat IAP Provider (Task 24 - Stub)
 * Will be implemented when RevenueCat is integrated
 */
export class RevenueCatIAPProvider implements IAPProvider {
  async initialize(): Promise<void> {
    console.log('RevenueCatIAPProvider: Not implemented yet');
    throw new Error('RevenueCat integration not yet implemented. Use MockIAPProvider for testing.');
  }

  async getProducts(): Promise<Product[]> {
    throw new Error('RevenueCat integration not yet implemented');
  }

  async purchase(_productId: ProductId): Promise<Purchase> {
    throw new Error('RevenueCat integration not yet implemented');
  }

  async restore(): Promise<Purchase[]> {
    throw new Error('RevenueCat integration not yet implemented');
  }

  async getEntitlementState(): Promise<EntitlementState> {
    throw new Error('RevenueCat integration not yet implemented');
  }

  async ownsProduct(_productId: ProductId): Promise<boolean> {
    throw new Error('RevenueCat integration not yet implemented');
  }
}

// Singleton instance
let iapProvider: IAPProvider | null = null;

/**
 * Get IAP Provider instance
 * Use mock provider by default, can be replaced with RevenueCat when ready
 */
export function getIAPProvider(): IAPProvider {
  if (!iapProvider) {
    // Default to mock provider
    // In production with feature flag, use: new RevenueCatIAPProvider()
    iapProvider = new MockIAPProvider();
  }
  return iapProvider;
}

/**
 * Set IAP Provider (for testing or switching implementations)
 */
export function setIAPProvider(provider: IAPProvider): void {
  iapProvider = provider;
}
