/**
 * Schema versioning and migration system for alchohalt.db
 * Ensures data integrity across app updates
 */

export interface SchemaVersion {
  version: number;
  description: string;
  migrateFrom?: (data: unknown) => unknown;
  rollback?: (data: unknown) => unknown;
}

export const SCHEMA_VERSIONS: SchemaVersion[] = [
  {
    version: 1,
    description: 'Initial unified database schema with entries, settings, goals, and presets',
  },
  {
    version: 2,
    description: 'Enhanced subscription support and advanced analytics',
    migrateFrom: (data: unknown) => {
      // Add subscription fields to settings
      const typedData = data as Record<string, unknown>;
      return {
        ...typedData,
        settings: {
          ...(typedData.settings as Record<string, unknown>),
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
    rollback: (data: unknown) => {
      // Remove subscription fields for v1 compatibility
      const typedData = data as Record<string, unknown>;
      const settings = typedData.settings as Record<string, unknown>;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { subscription: _subscription, ...restSettings } = settings;
      return {
        ...typedData,
        settings: restSettings,
        version: 1
      };
    }
  }
];

export const CURRENT_SCHEMA_VERSION = Math.max(...SCHEMA_VERSIONS.map(v => v.version));

export function migrateToVersion(data: unknown, targetVersion: number): unknown {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data provided for migration');
  }

  const typedData = data as Record<string, unknown>;
  const currentVersion = (typedData.version as number) || 1;
  
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

export function validateSchema(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Data must be an object');
    return { valid: false, errors };
  }

  const typedData = data as Record<string, unknown>;

  if (typeof typedData.version !== 'number') {
    errors.push('Missing or invalid version number');
  }

  if (!Array.isArray(typedData.entries)) {
    errors.push('Missing or invalid entries array');
  }

  if (!typedData.settings || typeof typedData.settings !== 'object') {
    errors.push('Missing or invalid settings object');
  }

  if (!Array.isArray(typedData.presets)) {
    errors.push('Missing or invalid presets array');
  }

  if (!Array.isArray(data.advancedGoals)) {
    errors.push('Missing or invalid advancedGoals array');
  }

  return { valid: errors.length === 0, errors };
}