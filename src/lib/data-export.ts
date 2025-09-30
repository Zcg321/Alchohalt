/**
 * Enhanced data import/export with checksums, versioning, and conflict resolution
 */

import { sha256 } from './sha256';
import { migrateToVersion, validateSchema, CURRENT_SCHEMA_VERSION } from './schema';
import type { DB } from '../store/db';

export interface ExportData {
  version: number;
  timestamp: string;
  appVersion: string;
  data: DB;
  checksum: string;
}

export interface ImportResult {
  success: boolean;
  conflicts?: string[];
  warnings?: string[];
  error?: string;
}

export async function createExport(data: DB): Promise<ExportData> {
  const timestamp = new Date().toISOString();
  const appVersion = '1.0.0'; // Keep simple fallback, avoiding dynamic import issues
  
  const exportPayload = {
    version: CURRENT_SCHEMA_VERSION,
    timestamp,
    appVersion,
    data
  };

  const dataString = JSON.stringify(exportPayload);
  const checksum = await sha256(dataString);

  return {
    ...exportPayload,
    checksum
  };
}

export async function validateImport(importData: any): Promise<ImportResult> {
  try {
    // Basic structure validation
    if (!importData || typeof importData !== 'object') {
      return { success: false, error: 'Invalid import file format' };
    }

    if (!importData.data || !importData.checksum) {
      return { success: false, error: 'Missing required fields in import file' };
    }

    // Checksum verification
    const { checksum, ...dataForVerification } = importData;
    const dataString = JSON.stringify(dataForVerification);
    const calculatedChecksum = await sha256(dataString);

    if (calculatedChecksum !== checksum) {
      return { success: false, error: 'Data integrity check failed - file may be corrupted' };
    }

    // Schema validation
    const schemaValidation = validateSchema(importData.data);
    if (!schemaValidation.valid) {
      return { 
        success: false, 
        error: `Schema validation failed: ${schemaValidation.errors.join(', ')}` 
      };
    }

    // Version compatibility check
    const warnings: string[] = [];
    const currentVersion = CURRENT_SCHEMA_VERSION;
    const importVersion = importData.version || importData.data.version || 1;

    if (importVersion > currentVersion) {
      warnings.push(`Import data is from a newer app version (v${importVersion}). Some features may not be available.`);
    } else if (importVersion < currentVersion) {
      warnings.push(`Import data will be upgraded from v${importVersion} to v${currentVersion}.`);
    }

    return { success: true, warnings };

  } catch (error) {
    return { 
      success: false, 
      error: `Import validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

export async function processImport(importData: ExportData, currentData: DB): Promise<{
  migratedData: DB;
  conflicts: string[];
}> {
  const conflicts: string[] = [];
  let dataToImport = importData.data;

  // Migrate data if needed
  if (importData.version !== CURRENT_SCHEMA_VERSION) {
    dataToImport = migrateToVersion(dataToImport, CURRENT_SCHEMA_VERSION);
  }

  // Check for data conflicts
  if (currentData.entries.length > 0 && dataToImport.entries.length > 0) {
    const currentLatest = Math.max(...currentData.entries.map(e => e.ts));
    const importLatest = Math.max(...dataToImport.entries.map(e => e.ts));
    
    if (Math.abs(currentLatest - importLatest) > 24 * 60 * 60 * 1000) {
      conflicts.push('Import data timestamp differs significantly from current data');
    }
  }

  // Merge strategies could be implemented here
  // For now, we replace all data (as per original behavior)

  return {
    migratedData: dataToImport,
    conflicts
  };
}

export function downloadData(data: ExportData, filename?: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `alchohalt-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}