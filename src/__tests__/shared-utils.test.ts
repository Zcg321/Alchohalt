import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../lib/utils';

describe('shared utilities', () => {
  describe('formatCurrency', () => {
    it('formats currency correctly', () => {
      expect(formatCurrency(123.45)).toMatch(/\$123\.45|\$123,45/);
    });

    it('handles zero', () => {
      expect(formatCurrency(0)).toMatch(/\$0\.00|\$0,00/);
    });

    it('handles negative values', () => {
      expect(formatCurrency(-50)).toMatch(/-\$50\.00|-\$50,00/);
    });

    it('handles large numbers', () => {
      expect(formatCurrency(12345.67)).toMatch(/\$12,345\.67|\$12\.345,67/);
    });
  });
});