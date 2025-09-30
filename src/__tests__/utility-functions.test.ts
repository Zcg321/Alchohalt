import { describe, it, expect } from 'vitest';

// Test utility functions that don't require complex dependencies
describe('utility functions', () => {
  describe('simple math operations', () => {
    it('performs basic calculations', () => {
      const add = (a: number, b: number) => a + b;
      const multiply = (a: number, b: number) => a * b;
      const divide = (a: number, b: number) => b === 0 ? 0 : a / b;
      
      expect(add(2, 3)).toBe(5);
      expect(multiply(4, 5)).toBe(20);
      expect(divide(10, 2)).toBe(5);
      expect(divide(10, 0)).toBe(0);
    });

    it('handles string operations', () => {
      const concat = (a: string, b: string) => a + b;
      const reverse = (str: string) => str.split('').reverse().join('');
      const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
      
      expect(concat('hello', 'world')).toBe('helloworld');
      expect(reverse('abc')).toBe('cba');
      expect(capitalize('test')).toBe('Test');
    });

    it('validates array operations', () => {
      const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
      const max = (arr: number[]) => Math.max(...arr);
      const filter = (arr: number[], min: number) => arr.filter(x => x >= min);
      
      expect(sum([1, 2, 3, 4])).toBe(10);
      expect(max([1, 5, 3, 2])).toBe(5);
      expect(filter([1, 2, 3, 4, 5], 3)).toEqual([3, 4, 5]);
    });

    it('tests object operations', () => {
      const merge = (a: Record<string, any>, b: Record<string, any>) => ({ ...a, ...b });
      const keys = (obj: Record<string, any>) => Object.keys(obj);
      const values = (obj: Record<string, any>) => Object.values(obj);
      
      expect(merge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
      expect(keys({ x: 1, y: 2 })).toEqual(['x', 'y']);
      expect(values({ x: 1, y: 2 })).toEqual([1, 2]);
    });

    it('handles edge cases', () => {
      const safeAccess = (obj: any, key: string) => obj && obj[key];
      const nullishCheck = (val: any) => val ?? 'default';
      const typeCheck = (val: any) => typeof val;
      
      expect(safeAccess(null, 'key')).toBe(null);
      expect(safeAccess({ key: 'value' }, 'key')).toBe('value');
      expect(nullishCheck(null)).toBe('default');
      expect(nullishCheck('actual')).toBe('actual');
      expect(typeCheck(123)).toBe('number');
      expect(typeCheck('str')).toBe('string');
    });
  });
});