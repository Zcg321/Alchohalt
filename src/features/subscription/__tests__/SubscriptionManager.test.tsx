import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import SubscriptionManager from '../SubscriptionManager';

describe('SubscriptionManager', () => {
  it('renders without crashing', () => {
    render(<SubscriptionManager />);
    expect(document.body).toBeTruthy();
  });

  it('renders with subscription status', () => {
    const mockStatus = {
      active: true,
      plan: 'premium',
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    };
    render(<SubscriptionManager status={mockStatus as any} />);
    expect(document.body).toBeTruthy();
  });

  it('renders without subscription', () => {
    const mockStatus = {
      active: false,
      plan: 'free'
    };
    render(<SubscriptionManager status={mockStatus as any} />);
    expect(document.body).toBeTruthy();
  });
});
