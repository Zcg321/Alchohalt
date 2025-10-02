/**
 * Health Integrations (Task 19)
 * Scaffold for HealthKit/Google Fit modules
 * All behind feature flags, no data read/write yet
 */

import React, { useState, useEffect } from 'react';
import { FEATURE_FLAGS } from '../../config/features';
import { checkHealthKitAvailability, requestHealthKitPermissions } from './healthKit';
import { checkGoogleFitAvailability, requestGoogleFitPermissions } from './googleFit';

interface HealthCapability {
  name: string;
  available: boolean;
  permission: 'granted' | 'denied' | 'not-determined';
}

/**
 * Health Integrations Diagnostics Page
 * Shows capabilities and permissions status
 */
export function HealthIntegrationsDiagnostics() {
  const [capabilities, setCapabilities] = useState<HealthCapability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCapabilities();
  }, []);

  const checkCapabilities = async () => {
    setLoading(true);
    const caps: HealthCapability[] = [];

    // Check HealthKit (iOS)
    const healthKitAvailable = await checkHealthKitAvailability();
    caps.push({
      name: 'Apple HealthKit',
      available: healthKitAvailable,
      permission: healthKitAvailable ? 'not-determined' : 'denied'
    });

    // Check Google Fit (Android)
    const googleFitAvailable = await checkGoogleFitAvailability();
    caps.push({
      name: 'Google Fit',
      available: googleFitAvailable,
      permission: googleFitAvailable ? 'not-determined' : 'denied'
    });

    setCapabilities(caps);
    setLoading(false);
  };

  const handleRequestPermission = async (capabilityName: string) => {
    if (capabilityName === 'Apple HealthKit') {
      await requestHealthKitPermissions();
    } else if (capabilityName === 'Google Fit') {
      await requestGoogleFitPermissions();
    }
    
    // Refresh capabilities
    await checkCapabilities();
  };

  if (!FEATURE_FLAGS.ENABLE_HEALTH_INTEGRATION) {
    return (
      <div className="p-4 border border-warning-200 rounded-xl bg-warning-50 dark:bg-warning-900/20">
        <h3 className="font-medium text-warning-800 dark:text-warning-200 mb-2">
          Health Integrations Disabled
        </h3>
        <p className="text-sm text-warning-700 dark:text-warning-300">
          Health integrations are currently disabled. Enable the ENABLE_HEALTH_INTEGRATION flag to use this feature.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-secondary">Checking health capabilities...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border border-default rounded-xl bg-surface">
        <h2 className="text-lg font-semibold text-primary mb-4">
          Health Integrations
        </h2>
        <p className="text-sm text-secondary mb-4">
          Connect with health platforms to sync your wellness data.
        </p>
      </div>

      <div className="space-y-3">
        {capabilities.map((cap) => (
          <div
            key={cap.name}
            className="p-4 border border-default rounded-xl bg-surface"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-primary">{cap.name}</h3>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-secondary">Available:</span>
                    <span
                      className={
                        cap.available
                          ? 'text-success-600 dark:text-success-400'
                          : 'text-error-600 dark:text-error-400'
                      }
                    >
                      {cap.available ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-secondary">Permission:</span>
                    <span
                      className={
                        cap.permission === 'granted'
                          ? 'text-success-600 dark:text-success-400'
                          : cap.permission === 'denied'
                          ? 'text-error-600 dark:text-error-400'
                          : 'text-warning-600 dark:text-warning-400'
                      }
                    >
                      {cap.permission === 'granted'
                        ? '✓ Granted'
                        : cap.permission === 'denied'
                        ? '✗ Denied'
                        : '⚠ Not Determined'}
                    </span>
                  </div>
                </div>
              </div>
              {cap.available && cap.permission !== 'granted' && (
                <button
                  onClick={() => handleRequestPermission(cap.name)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Request Permission
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border border-info-200 rounded-xl bg-info-50 dark:bg-info-900/20">
        <h3 className="font-medium text-info-800 dark:text-info-200 mb-2">
          ℹ️ Feature Status
        </h3>
        <p className="text-sm text-info-700 dark:text-info-300">
          This is a scaffold implementation. Health data read/write functionality is not yet implemented.
          The integration shows capability checks and permission prompts for future implementation.
        </p>
      </div>
    </div>
  );
}
