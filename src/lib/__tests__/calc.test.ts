import { describe, it, expect } from 'vitest';
import { stdDrinks } from '../calc';

describe('calc utilities', () => {
  describe('stdDrinks', () => {
    it('calculates standard drinks correctly', () => {
      // Standard beer: 355ml at 5% ABV
      const result = stdDrinks(355, 5.0);
      expect(result).toBeCloseTo(1.0, 1);
    });

    it('calculates wine standard drinks', () => {
      // Wine: 150ml at 12% ABV
      const result = stdDrinks(150, 12.0);
      expect(result).toBeCloseTo(1.0, 1);
    });

    it('calculates spirits standard drinks', () => {
      // Spirits: 44ml at 40% ABV
      const result = stdDrinks(44, 40.0);
      expect(result).toBeCloseTo(0.99, 1);
    });

    it('handles zero volume', () => {
      expect(stdDrinks(0, 5.0)).toBe(0);
    });

    it('handles zero ABV', () => {
      expect(stdDrinks(355, 0)).toBe(0);
    });

    it('handles edge cases', () => {
      // Very small amounts
      expect(stdDrinks(1, 1)).toBeCloseTo(0.00056, 3);
      
      // Large amounts
      expect(stdDrinks(1000, 5)).toBeCloseTo(2.82, 1);
    });
  });
});