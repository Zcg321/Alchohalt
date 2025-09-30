/**
 * Schema versioning and migration system for alchohalt.db
 * Ensures data integrity across app updates
 */

export interface SchemaVersion {
  version: number;
  description: string;
  migrateFrom?: (data: any) => any;
  rollback?: (data: any) => any;
}

export const SCHEMA_VERSIONS: SchemaVersion[] = [
  {
    version: 1,
    description: 'Initial unified database schema with entries, settings, goals, and presets',
  },
  {
    version: 2,
    description: 'Enhanced subscription support and advanced analytics',
    migrateFrom: (data: any) => {
      // Add subscription fields to settings
      return {
        ...data,
        settings: {
          ...data.settings,
          subscription: {
            plan: 'free',
            status: 'inactive',
            expiresAt: null,
            trialEndsAt: null
          }
        },
        version: 2
      };
    },
    rollback: (data: any) => {
      // Remove subscription fields for v1 compatibility
      const { subscription, ...settings } = data.settings;
      return {
        ...data,
        settings,
        version: 1
      };
    }
  }
];

export const CURRENT_SCHEMA_VERSION = Math.max(...SCHEMA_VERSIONS.map(v => v.version));

export function migrateToVersion(data: any, targetVersion: number): any {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data provided for migration');
  }

  const currentVersion = data.version || 1;
  
  if (currentVersion === targetVersion) {
    return data;
  }

  if (currentVersion > targetVersion) {
    // Rollback scenario
    for (let v = currentVersion; v > targetVersion; v--) {
      const schema = SCHEMA_VERSIONS.find(s => s.version === v);
      if (schema?.rollback) {
        data = schema.rollback(data);
      }
    }
  } else {
    // Forward migration
    for (let v = currentVersion + 1; v <= targetVersion; v++) {
      const schema = SCHEMA_VERSIONS.find(s => s.version === v);
      if (schema?.migrateFrom) {
        data = schema.migrateFrom(data);
      }
    }
  }

  return data;
}

export function validateSchema(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Data must be an object');
    return { valid: false, errors };
  }

  if (typeof data.version !== 'number') {
    errors.push('Missing or invalid version number');
  }

  if (!Array.isArray(data.entries)) {
    errors.push('Missing or invalid entries array');
  }

  if (!data.settings || typeof data.settings !== 'object') {
    errors.push('Missing or invalid settings object');
  }

  if (!Array.isArray(data.presets)) {
    errors.push('Missing or invalid presets array');
  }

  if (!Array.isArray(data.advancedGoals)) {
    errors.push('Missing or invalid advancedGoals array');
  }

  return { valid: errors.length === 0, errors };
}