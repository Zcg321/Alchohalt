import { describe, it, expect } from 'vitest';
import { parseVoiceInput } from '../voice';

describe('voice.ts', () => {
  describe('parseVoiceInput', () => {
    it('should parse "two beers" correctly', () => {
      const result = parseVoiceInput('two beers');
      expect(result.quantity).toBe(2);
      expect(result.drinkType).toBe('beer');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should parse "one glass of wine" correctly', () => {
      const result = parseVoiceInput('one glass of wine');
      expect(result.quantity).toBe(1);
      expect(result.drinkType).toBe('wine');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should parse "a shot" correctly', () => {
      const result = parseVoiceInput('a shot');
      expect(result.quantity).toBe(1);
      expect(result.drinkType).toBe('spirits');
    });

    it('should default to quantity 1 for unrecognized quantity', () => {
      const result = parseVoiceInput('beer');
      expect(result.quantity).toBe(1);
    });

    it('should handle number words correctly', () => {
      const result = parseVoiceInput('three beers');
      expect(result.quantity).toBe(3);
    });
  });
});
