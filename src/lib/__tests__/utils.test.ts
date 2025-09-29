import { cn, formatCurrency, formatNumber, truncate, debounce, generateId } from '../utils';

describe('utility functions', () => {
  describe('cn', () => {
    test('merges class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
      expect(cn('class1', undefined, 'class2')).toBe('class1 class2');
      expect(cn('class1', null, 'class2')).toBe('class1 class2');
      expect(cn('class1', false, 'class2')).toBe('class1 class2');
      expect(cn()).toBe('');
    });

    test('handles extra spaces', () => {
      expect(cn('class1  class2', 'class3')).toBe('class1 class2 class3');
    });
  });

  describe('formatCurrency', () => {
    test('formats USD currency correctly', () => {
      expect(formatCurrency(10.99)).toBe('$10.99');
      expect(formatCurrency(1000)).toBe('$1,000.00');
    });

    test('handles different currencies', () => {
      expect(formatCurrency(10, 'EUR')).toContain('10');
    });
  });

  describe('formatNumber', () => {
    test('formats numbers with decimals', () => {
      expect(formatNumber(10.123)).toBe('10.12');
      expect(formatNumber(10.999, 1)).toBe('11.0');
      expect(formatNumber(1000.5)).toBe('1,000.50');
    });
  });

  describe('truncate', () => {
    test('truncates long strings', () => {
      expect(truncate('Hello world', 5)).toBe('Hello...');
      expect(truncate('Hi', 5)).toBe('Hi');
      expect(truncate('', 5)).toBe('');
    });
  });

  describe('debounce', () => {
    test('debounces function calls', async () => {
      let callCount = 0;
      const fn = () => { callCount++; };
      const debounced = debounce(fn, 10);
      
      debounced();
      debounced();
      debounced();
      
      expect(callCount).toBe(0);
      
      await new Promise(resolve => setTimeout(resolve, 15));
      expect(callCount).toBe(1);
    });
  });

  describe('generateId', () => {
    test('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
    });
  });
});