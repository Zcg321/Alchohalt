import { describe, it, expect } from 'vitest';
import { sha256 } from '../sha256';

describe('sha256', () => {
  it('hashes empty string', async () => {
    const result = await sha256('');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('hashes simple string', async () => {
    const result = await sha256('hello');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('produces consistent hashes', async () => {
    const input = 'test123';
    const hash1 = await sha256(input);
    const hash2 = await sha256(input);
    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for different inputs', async () => {
    const hash1 = await sha256('input1');
    const hash2 = await sha256('input2');
    expect(hash1).not.toBe(hash2);
  });

  it('handles special characters', async () => {
    const result = await sha256('!@#$%^&*()');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('handles unicode characters', async () => {
    const result = await sha256('こんにちは世界 🌍');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('handles long strings', async () => {
    const longString = 'a'.repeat(10000);
    const result = await sha256(longString);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});
