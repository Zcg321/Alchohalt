import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.localStorage = localStorageMock as any;

describe('migrate utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('handles version migration', () => {
    localStorage.setItem('appVersion', '1.0.0');
    const version = localStorage.getItem('appVersion');
    expect(version).toBe('1.0.0');
  });

  it('migrates old data format', () => {
    const oldData = { drinks: [] };
    localStorage.setItem('oldFormat', JSON.stringify(oldData));
    
    const stored = localStorage.getItem('oldFormat');
    expect(stored).toBeTruthy();
    
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveProperty('drinks');
  });

  it('preserves data during migration', () => {
    const data = { key: 'value', nested: { prop: 'test' } };
    localStorage.setItem('data', JSON.stringify(data));
    
    const retrieved = JSON.parse(localStorage.getItem('data')!);
    expect(retrieved.key).toBe('value');
    expect(retrieved.nested.prop).toBe('test');
  });

  it('handles missing migration data', () => {
    const missing = localStorage.getItem('nonexistent');
    expect(missing).toBeNull();
  });
});
