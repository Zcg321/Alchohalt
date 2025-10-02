/**
 * CSV Export functionality (free for all users)
 * Exports drink log data to CSV format with proper headers and locale formatting
 */

import type { DB, Entry } from '../store/db';

export interface CSVExportOptions {
  locale?: string;
  includeHeaders?: boolean;
  dateFormat?: 'iso' | 'locale';
}

/**
 * Convert drink entries to CSV format
 */
export function entriesToCSV(entries: Entry[], options: CSVExportOptions = {}): string {
  const {
    locale = 'en-US',
    includeHeaders = true,
    dateFormat = 'iso'
  } = options;

  const lines: string[] = [];

  // Add headers
  if (includeHeaders) {
    lines.push([
      'Date',
      'Time',
      'Beverage',
      'Standard Drinks',
      'Cost',
      'Intention',
      'Craving (1-5)',
      'HALT Hungry',
      'HALT Angry',
      'HALT Lonely',
      'HALT Tired',
      'Alternative Action',
      'Notes'
    ].map(escapeCSVField).join(','));
  }

  // Add data rows
  for (const entry of entries) {
    const date = new Date(entry.ts);
    const dateStr = dateFormat === 'iso' 
      ? date.toISOString().split('T')[0]
      : date.toLocaleDateString(locale);
    const timeStr = date.toLocaleTimeString(locale);

    const row = [
      dateStr,
      timeStr,
      entry.kind || '',
      formatNumber(entry.stdDrinks || 0, locale),
      formatNumber(entry.cost || 0, locale, 2),
      entry.intention || '',
      entry.craving?.toString() || '',
      entry.halt?.H ? 'Yes' : 'No',
      entry.halt?.A ? 'Yes' : 'No',
      entry.halt?.L ? 'Yes' : 'No',
      entry.halt?.T ? 'Yes' : 'No',
      entry.altAction || '',
      entry.notes || ''
    ];

    lines.push(row.map(escapeCSVField).join(','));
  }

  return lines.join('\n');
}

/**
 * Export full database to CSV
 */
export function databaseToCSV(db: DB, options: CSVExportOptions = {}): string {
  // Sort entries by timestamp (newest first)
  const sortedEntries = [...db.entries].sort((a, b) => b.ts - a.ts);
  return entriesToCSV(sortedEntries, options);
}

/**
 * Escape CSV field value
 */
function escapeCSVField(value: string | number): string {
  const str = String(value);
  
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

/**
 * Format number with locale
 */
function formatNumber(value: number, locale: string, decimals?: number): string {
  return value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename?: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `alchohalt-export-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export database to CSV and download
 */
export function exportDatabaseToCSV(db: DB, options: CSVExportOptions = {}): void {
  const csvContent = databaseToCSV(db, options);
  downloadCSV(csvContent);
}
