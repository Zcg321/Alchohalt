/**
 * Health Integration Service
 * 
 * Provides wrappers for Apple Health (HealthKit) and Google Fit integration.
 * This is a mock implementation that can be replaced with actual plugin calls
 * when @capacitor-community/apple-health-kit or fitness-activity plugins are installed.
 */

import type { HealthMetric } from '../store/db';
import { FEATURE_FLAGS } from '../config/features';

// Mock interfaces matching expected plugin APIs
interface HealthKitData {
  quantity: number;
  startDate: Date;
  endDate: Date;
}

interface HealthKitPlugin {
  requestAuthorization(options: { read: string[] }): Promise<void>;
  query(options: { dataType: string; from: Date; to: Date }): Promise<HealthKitData[]>;
  isAvailable(): Promise<{ available: boolean }>;
}

interface GoogleFitPlugin {
  requestPermissions(options: { permissions: string[] }): Promise<void>;
  readData(options: { dataType: string; startTime: number; endTime: number }): Promise<{ points: Array<{ value: number }> }>;
  isAvailable(): Promise<{ available: boolean }>;
}

// Platform detection
const isIOS = (): boolean => typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
const isAndroid = (): boolean => typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

// Mock plugin instances (would be replaced with actual imports)
let mockHealthKit: HealthKitPlugin | null = null;
let mockGoogleFit: GoogleFitPlugin | null = null;

// Helper: Get platform source identifier
const getPlatformSource = (): 'apple-health' | 'google-fit' | 'manual' => {
  if (isIOS()) return 'apple-health';
  if (isAndroid()) return 'google-fit';
  return 'manual';
};

/**
 * Request health data permissions from the user
 */
export async function requestHealthPermissions(): Promise<boolean> {
  if (!FEATURE_FLAGS.ENABLE_HEALTH_INTEGRATION) {
    console.log('Health integration is disabled');
    return false;
  }

  try {
    if (isIOS() && mockHealthKit) {
      await mockHealthKit.requestAuthorization({
        read: ['stepCount', 'sleepAnalysis', 'heartRate']
      });
      return true;
    }
    
    if (isAndroid() && mockGoogleFit) {
      await mockGoogleFit.requestPermissions({
        permissions: ['FITNESS_ACTIVITY_READ', 'FITNESS_SLEEP_READ', 'FITNESS_HEART_RATE_READ']
      });
      return true;
    }
    
    // Mock success for web/development
    console.log('Mock: Health permissions requested');
    return true;
  } catch (error) {
    console.error('Failed to request health permissions:', error);
    return false;
  }
}

/**
 * Check if health integration is available on this platform
 */
export async function isHealthIntegrationAvailable(): Promise<boolean> {
  if (!FEATURE_FLAGS.ENABLE_HEALTH_INTEGRATION) return false;

  try {
    if (isIOS() && mockHealthKit) {
      const result = await mockHealthKit.isAvailable();
      return result.available;
    }
    
    if (isAndroid() && mockGoogleFit) {
      const result = await mockGoogleFit.isAvailable();
      return result.available;
    }
  } catch (error) {
    console.error('Error checking health integration availability:', error);
  }

  return false;
}

// Generic helper for fetching health data
async function fetchHealthData<T>(
  platform: 'ios' | 'android',
  iosQuery: () => Promise<T>,
  androidQuery: () => Promise<T>
): Promise<T | null> {
  try {
    return platform === 'ios' ? await iosQuery() : await androidQuery();
  } catch {
    return null;
  }
}

/**
 * Fetch step count for a date range
 */
export async function getSteps(startDate: Date, endDate: Date): Promise<number> {
  if (!FEATURE_FLAGS.ENABLE_HEALTH_INTEGRATION) return 0;

  try {
    const platform = isIOS() ? 'ios' : isAndroid() ? 'android' : null;
    if (!platform) return Math.floor(Math.random() * 5001) + 5000;

    const result = await fetchHealthData(
      platform,
      async () => {
        if (!mockHealthKit) return 0;
        const data = await mockHealthKit.query({
          dataType: 'stepCount',
          from: startDate,
          to: endDate
        });
        return data.reduce((sum, d) => sum + d.quantity, 0);
      },
      async () => {
        if (!mockGoogleFit) return 0;
        const data = await mockGoogleFit.readData({
          dataType: 'com.google.step_count.delta',
          startTime: startDate.getTime(),
          endTime: endDate.getTime()
        });
        return data.points.reduce((sum, p) => sum + p.value, 0);
      }
    );
    
    return result ?? 0;
  } catch (error) {
    console.error('Failed to fetch steps:', error);
    return 0;
  }
}

/**
 * Fetch sleep hours for a specific date
 */
export async function getSleepHours(date: Date): Promise<number> {
  if (!FEATURE_FLAGS.ENABLE_HEALTH_INTEGRATION) return 0;

  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const platform = isIOS() ? 'ios' : isAndroid() ? 'android' : null;
    if (!platform) return Math.random() * 3 + 6; // Mock: 6-9 hours

    const result = await fetchHealthData(
      platform,
      async () => {
        if (!mockHealthKit) return 0;
        const data = await mockHealthKit.query({
          dataType: 'sleepAnalysis',
          from: startOfDay,
          to: endOfDay
        });
        return data.reduce((sum, d) => sum + d.quantity, 0) / 60; // Convert minutes to hours
      },
      async () => {
        if (!mockGoogleFit) return 0;
        const data = await mockGoogleFit.readData({
          dataType: 'com.google.sleep.segment',
          startTime: startOfDay.getTime(),
          endTime: endOfDay.getTime()
        });
        return data.points.reduce((sum, p) => sum + p.value, 0) / 60; // Convert minutes to hours
      }
    );
    
    return result ?? 0;
  } catch (error) {
    console.error('Failed to fetch sleep hours:', error);
    return 0;
  }
}

// Helper: Fetch iOS heart rate
async function fetchIOSHeartRate(startOfDay: Date, endOfDay: Date): Promise<number> {
  if (!mockHealthKit) return 0;
  const data = await mockHealthKit.query({
    dataType: 'heartRate',
    from: startOfDay,
    to: endOfDay
  });
  if (data.length === 0) return 0;
  return data.reduce((sum, d) => sum + d.quantity, 0) / data.length;
}

// Helper: Fetch Android heart rate
async function fetchAndroidHeartRate(startOfDay: Date, endOfDay: Date): Promise<number> {
  if (!mockGoogleFit) return 0;
  const data = await mockGoogleFit.readData({
    dataType: 'com.google.heart_rate.bpm',
    startTime: startOfDay.getTime(),
    endTime: endOfDay.getTime()
  });
  if (data.points.length === 0) return 0;
  return data.points.reduce((sum, p) => sum + p.value, 0) / data.points.length;
}

/**
 * Fetch average heart rate for a date
 */
export async function getHeartRate(date: Date): Promise<number> {
  if (!FEATURE_FLAGS.ENABLE_HEALTH_INTEGRATION) return 0;

  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    if (isIOS()) return await fetchIOSHeartRate(startOfDay, endOfDay);
    if (isAndroid()) return await fetchAndroidHeartRate(startOfDay, endOfDay);
    
    // Mock data for development/testing
    return Math.floor(Math.random() * 20) + 60; // 60-80 bpm
  } catch (error) {
    console.error('Failed to fetch heart rate:', error);
    return 0;
  }
}

/**
 * Import health metrics for a date range
 */
export async function importHealthMetrics(startDate: Date, endDate: Date): Promise<HealthMetric[]> {
  if (!FEATURE_FLAGS.ENABLE_HEALTH_INTEGRATION) return [];

  const metrics: HealthMetric[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    
    const [steps, sleepHours, heartRate] = await Promise.all([
      getSteps(current, new Date(current.getTime() + 24 * 60 * 60 * 1000)),
      getSleepHours(current),
      getHeartRate(current)
    ]);

    if (steps > 0 || sleepHours > 0 || heartRate > 0) {
      metrics.push({
        date: dateStr,
        steps: steps || undefined,
        sleepHours: sleepHours || undefined,
        heartRate: heartRate || undefined,
        source: getPlatformSource()
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return metrics;
}

/**
 * Initialize health plugins (to be called when actual plugins are installed)
 */
export function initializeHealthPlugins(healthKit?: HealthKitPlugin, googleFit?: GoogleFitPlugin) {
  mockHealthKit = healthKit || null;
  mockGoogleFit = googleFit || null;
}
