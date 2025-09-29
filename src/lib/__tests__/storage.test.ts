import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getJSON, setJSON, setJSONDebounced } from '../storage';

// Mock the capacitor preferences
const mockPreferences = {
  get: vi.fn(),
  set: vi.fn(),
};

vi.mock('@/shared/capacitor', () => ({
  getPreferences: vi.fn().mockResolvedValue(mockPreferences),
}));

describe('storage utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  describe('getJSON', () => {
    it('returns parsed JSON when value exists', async () => {
      const testData = { name: 'test', value: 42 };
      mockPreferences.get.mockResolvedValue({ value: JSON.stringify(testData) });

      const result = await getJSON('test-key', {});
      expect(result).toEqual(testData);
      expect(mockPreferences.get).toHaveBeenCalledWith({ key: 'test-key' });
    });

    it('returns default value when no value exists', async () => {
      mockPreferences.get.mockResolvedValue({ value: null });
      const defaultValue = { default: true };

      const result = await getJSON('test-key', defaultValue);
      expect(result).toEqual(defaultValue);
    });

    it('returns default value when JSON parsing fails', async () => {
      mockPreferences.get.mockResolvedValue({ value: 'invalid-json' });
      const defaultValue = { default: true };

      const result = await getJSON('test-key', defaultValue);
      expect(result).toEqual(defaultValue);
    });
  });

  describe('setJSON', () => {
    it('stringifies and stores value', async () => {
      const testData = { name: 'test', value: 42 };
      
      await setJSON('test-key', testData);
      
      expect(mockPreferences.set).toHaveBeenCalledWith({
        key: 'test-key',
        value: JSON.stringify(testData)
      });
    });
  });

  describe('setJSONDebounced', () => {
    it('debounces multiple calls', async () => {
      const testData1 = { value: 1 };
      const testData2 = { value: 2 };
      
      setJSONDebounced('test-key', testData1, 100);
      setJSONDebounced('test-key', testData2, 100);
      
      // Should not have called set yet
      expect(mockPreferences.set).not.toHaveBeenCalled();
      
      // Fast-forward time
      vi.advanceTimersByTime(100);
      
      // Should only call with the last value
      await vi.runAllTimersAsync();
      expect(mockPreferences.set).toHaveBeenCalledTimes(1);
      expect(mockPreferences.set).toHaveBeenCalledWith({
        key: 'test-key',
        value: JSON.stringify(testData2)
      });
    });

    it('uses default delay of 300ms', async () => {
      const testData = { value: 'test' };
      
      setJSONDebounced('test-key', testData);
      
      vi.advanceTimersByTime(299);
      expect(mockPreferences.set).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(1);
      await vi.runAllTimersAsync();
      expect(mockPreferences.set).toHaveBeenCalledTimes(1);
    });
  });
});