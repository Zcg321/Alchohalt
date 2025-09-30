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
function isIOS(): boolean {
  return typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isAndroid(): boolean {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
}

// Mock plugin instances (would be replaced with actual imports)
let mockHealthKit: HealthKitPlugin | null = null;
let mockGoogleFit: GoogleFitPlugin | null = null;

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
    } else if (isAndroid() && mockGoogleFit) {
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
  if (!FEATURE_FLAGS.ENABLE_HEALTH_INTEGRATION) {
    return false;
  }

  try {
    if (isIOS() && mockHealthKit) {
      const result = await mockHealthKit.isAvailable();
      return result.available;
    } else if (isAndroid() && mockGoogleFit) {
      const result = await mockGoogleFit.isAvailable();
      return result.available;
    }
  } catch (error) {
    console.error('Error checking health integration availability:', error);
  }

  return false;
}

/**
 * Fetch step count for a date range
 */
export async function getSteps(startDate: Date, endDate: Date): Promise<number> {
  if (!FEATURE_FLAGS.ENABLE_HEALTH_INTEGRATION) {
    return 0;
  }

  try {
    if (isIOS() && mockHealthKit) {
      const data = await mockHealthKit.query({
        dataType: 'stepCount',
        from: startDate,
        to: endDate
      });
      return data.reduce((sum, d) => sum + d.quantity, 0);
    } else if (isAndroid() && mockGoogleFit) {
      const data = await mockGoogleFit.readData({
        dataType: 'com.google.step_count.delta',
        startTime: startDate.getTime(),
        endTime: endDate.getTime()
      });
      return data.points.reduce((sum, p) => sum + p.value, 0);
    }
    
    // Mock data for development/testing
    return Math.floor(Math.random() * 5000) + 5000; // 5000-10000 steps
  } catch (error) {
    console.error('Failed to fetch steps:', error);
    return 0;
  }
}

/**
 * Fetch sleep hours for a specific date
 */
export async function getSleepHours(date: Date): Promise<number> {
  if (!FEATURE_FLAGS.ENABLE_HEALTH_INTEGRATION) {
    return 0;
  }

  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    if (isIOS() && mockHealthKit) {
      const data = await mockHealthKit.query({
        dataType: 'sleepAnalysis',
        from: startOfDay,
        to: endOfDay
      });
      // Convert sleep minutes to hours
      return data.reduce((sum, d) => sum + d.quantity, 0) / 60;
    } else if (isAndroid() && mockGoogleFit) {
      const data = await mockGoogleFit.readData({
        dataType: 'com.google.sleep.segment',
        startTime: startOfDay.getTime(),
        endTime: endOfDay.getTime()
      });
      // Convert sleep minutes to hours
      return data.points.reduce((sum, p) => sum + p.value, 0) / 60;
    }
    
    // Mock data for development/testing
    return Math.random() * 3 + 6; // 6-9 hours
  } catch (error) {
    console.error('Failed to fetch sleep hours:', error);
    return 0;
  }
}

/**
 * Fetch average heart rate for a date
 */
export async function getHeartRate(date: Date): Promise<number> {
  if (!FEATURE_FLAGS.ENABLE_HEALTH_INTEGRATION) {
    return 0;
  }

  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    if (isIOS() && mockHealthKit) {
      const data = await mockHealthKit.query({
        dataType: 'heartRate',
        from: startOfDay,
        to: endOfDay
      });
      if (data.length === 0) return 0;
      return data.reduce((sum, d) => sum + d.quantity, 0) / data.length;
    } else if (isAndroid() && mockGoogleFit) {
      const data = await mockGoogleFit.readData({
        dataType: 'com.google.heart_rate.bpm',
        startTime: startOfDay.getTime(),
        endTime: endOfDay.getTime()
      });
      if (data.points.length === 0) return 0;
      return data.points.reduce((sum, p) => sum + p.value, 0) / data.points.length;
    }
    
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
  if (!FEATURE_FLAGS.ENABLE_HEALTH_INTEGRATION) {
    return [];
  }

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
      const source = isIOS() ? 'apple-health' : isAndroid() ? 'google-fit' : 'manual';
      metrics.push({
        date: dateStr,
        steps: steps || undefined,
        sleepHours: sleepHours || undefined,
        heartRate: heartRate || undefined,
        source
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
