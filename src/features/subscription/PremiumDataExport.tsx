import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { usePremiumFeatures } from '../subscription/subscriptionStore';
import { PremiumFeatureGate } from '../subscription/SubscriptionManager';
import { useDB } from '../../store/db';
import type { Entry } from '../../store/db';

interface ExportOptions {
  format: 'PDF' | 'CSV' | 'JSON';
  dateRange: 'week' | 'month' | 'quarter' | 'year' | 'all';
  includeInsights: boolean;
  includeMoodData: boolean;
  includeSpendingData: boolean;
  healthcareFormat: boolean;
}

export default function PremiumDataExport() {
  const { canExportData } = usePremiumFeatures();
  const { entries } = useDB();
  const [isExporting, setIsExporting] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'PDF',
    dateRange: 'month',
    includeInsights: true,
    includeMoodData: true,
    includeSpendingData: true,
    healthcareFormat: false
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const filteredEntries = filterEntriesByDateRange(entries, options.dateRange);
      
      switch (options.format) {
        case 'PDF':
          await generatePDFReport(filteredEntries, options);
          break;
        case 'CSV':
          await generateCSVExport(filteredEntries, options);
          break;
        case 'JSON':
          await generateJSONExport(filteredEntries, options);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      // Handle error appropriately
    } finally {
      setIsExporting(false);
    }
  };

  const freeUserFallback = (
    <Card className="p-6 text-center">
      <div className="mb-4">
        <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-orange-600 text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">Premium Data Export</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Export your progress data in multiple formats for healthcare providers, personal records, or analysis.
        </p>
        <Button variant="primary">Upgrade to Premium</Button>
      </div>
    </Card>
  );

  return (
    <PremiumFeatureGate 
      isPremium={canExportData}
      fallback={freeUserFallback}
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center">
              <span className="mr-2">📊</span>
              Data Export & Reports
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate comprehensive reports for healthcare providers or personal analysis
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Export Options */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Export Format</label>
              <div className="grid grid-cols-3 gap-2">
                {(['PDF', 'CSV', 'JSON'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => setOptions(prev => ({ ...prev, format }))}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      options.format === format
                        ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                    }`}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <select
                value={options.dateRange}
                onChange={(e) => setOptions(prev => ({ ...prev, dateRange: e.target.value as ExportOptions['dateRange'] }))}
                className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last 3 Months</option>
                <option value="year">Last Year</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {/* Healthcare Format Option */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="healthcareFormat"
                checked={options.healthcareFormat}
                onChange={(e) => setOptions(prev => ({ ...prev, healthcareFormat: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="healthcareFormat" className="text-sm">
                Healthcare Provider Format
              </label>
            </div>
          </div>

          {/* Data Inclusions */}
          <div className="space-y-4">
            <h4 className="font-medium">Include in Export</h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeInsights"
                  checked={options.includeInsights}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeInsights: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="includeInsights" className="text-sm">
                  AI Insights & Patterns
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeMoodData"
                  checked={options.includeMoodData}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeMoodData: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="includeMoodData" className="text-sm">
                  Mood & HALT Tracking
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeSpendingData"
                  checked={options.includeSpendingData}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeSpendingData: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="includeSpendingData" className="text-sm">
                  Spending Analysis
                </label>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleExport}
                disabled={isExporting}
                className="w-full"
              >
                {isExporting ? 'Generating Export...' : `Export ${options.format}`}
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats Preview */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{entries.length}</div>
              <div className="text-sm text-gray-600">Total Entries</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round((Date.now() - Math.min(...entries.map(e => e.ts))) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-sm text-gray-600">Days Tracked</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {entries.filter(e => e.cost).length}
              </div>
              <div className="text-sm text-gray-600">With Cost Data</div>
            </div>
          </div>
        </div>
      </Card>
    </PremiumFeatureGate>
  );
}

function filterEntriesByDateRange(entries: Entry[], range: ExportOptions['dateRange']): Entry[] {
  const now = Date.now();
  let cutoff: number;
  
  switch (range) {
    case 'week':
      cutoff = now - (7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      cutoff = now - (30 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      cutoff = now - (90 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      cutoff = now - (365 * 24 * 60 * 60 * 1000);
      break;
    default:
      return entries;
  }
  
  return entries.filter(entry => entry.ts >= cutoff);
}

async function generatePDFReport(entries: Entry[], options: ExportOptions) {
  // Implementation would use a PDF library like jsPDF or Puppeteer
  // For now, we'll create a comprehensive text-based report
  const reportData = generateReportData(entries, options);
  
  // Create a downloadable blob
  const content = generatePDFContent(reportData, options);
  const blob = new Blob([content], { type: 'text/plain' });
  downloadFile(blob, `alchohalt-report-${new Date().toISOString().slice(0, 10)}.txt`);
}

async function generateCSVExport(entries: Entry[], options: ExportOptions) {
  const csvHeaders = [
    'Date',
    'Time',
    'Drink Type',
    'Standard Drinks',
    'Cost',
    'Intention',
    'Craving Level',
    'HALT (H-A-L-T)',
    'Alternative Action',
    'Notes'
  ];
  
  const csvRows = entries.map(entry => [
    new Date(entry.ts).toLocaleDateString(),
    new Date(entry.ts).toLocaleTimeString(),
    entry.kind,
    entry.stdDrinks.toString(),
    entry.cost?.toString() || '',
    entry.intention,
    entry.craving.toString(),
    `${entry.halt.H ? 'H' : ''}${entry.halt.A ? 'A' : ''}${entry.halt.L ? 'L' : ''}${entry.halt.T ? 'T' : ''}`,
    entry.altAction || '',
    entry.notes || ''
  ]);

  const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  downloadFile(blob, `alchohalt-data-${new Date().toISOString().slice(0, 10)}.csv`);
}

async function generateJSONExport(entries: Entry[], options: ExportOptions) {
  const exportData = {
    exportDate: new Date().toISOString(),
    dateRange: options.dateRange,
    totalEntries: entries.length,
    entries: entries.map(entry => ({
      ...entry,
      date: new Date(entry.ts).toISOString()
    }))
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  downloadFile(blob, `alchohalt-data-${new Date().toISOString().slice(0, 10)}.json`);
}

function generateReportData(entries: Entry[], options: ExportOptions) {
  // Calculate comprehensive statistics for the report
  const totalDrinks = entries.reduce((sum, e) => sum + e.stdDrinks, 0);
  const averageDrinks = totalDrinks / Math.max(1, entries.length);
  const totalCost = entries.reduce((sum, e) => sum + (e.cost || 0), 0);
  
  // Group by intention
  const intentionStats = entries.reduce((acc, entry) => {
    acc[entry.intention] = (acc[entry.intention] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // HALT analysis
  const haltStats = entries.reduce((acc, entry) => {
    ['H', 'A', 'L', 'T'].forEach(state => {
      if (entry.halt[state as keyof typeof entry.halt]) {
        acc[state] = (acc[state] || 0) + 1;
      }
    });
    return acc;
  }, {} as Record<string, number>);

  return {
    totalDrinks,
    averageDrinks,
    totalCost,
    intentionStats,
    haltStats,
    entries
  };
}

function generatePDFContent(reportData: any, options: ExportOptions): string {
  const { totalDrinks, averageDrinks, totalCost, intentionStats, haltStats } = reportData;
  
  return `
ALCHOHALT WELLNESS REPORT
Generated: ${new Date().toLocaleDateString()}
Period: ${options.dateRange}

SUMMARY STATISTICS
==================
Total Drinking Occasions: ${reportData.entries.length}
Total Standard Drinks: ${totalDrinks.toFixed(1)}
Average Drinks per Occasion: ${averageDrinks.toFixed(1)}
Total Cost Tracked: $${totalCost.toFixed(2)}

INTENTION ANALYSIS
==================
${Object.entries(intentionStats)
  .map(([intention, count]) => `${intention}: ${count} occasions`)
  .join('\n')}

HALT TRIGGER ANALYSIS
=====================
Hunger: ${haltStats.H || 0} occasions
Anger: ${haltStats.A || 0} occasions
Loneliness: ${haltStats.L || 0} occasions
Tiredness: ${haltStats.T || 0} occasions

${options.healthcareFormat ? `
HEALTHCARE PROVIDER NOTES
==========================
This report contains alcohol consumption data tracked by the individual using the Alchohalt wellness application. 
Data includes drinking occasions, quantities, emotional states, and alternative coping strategies attempted.
All data is self-reported and should be considered in the context of clinical assessment.
` : ''}

DETAILED LOG
============
${reportData.entries.map((entry: Entry) => 
  `${new Date(entry.ts).toLocaleString()} | ${entry.kind} | ${entry.stdDrinks} drinks | ${entry.intention} | Craving: ${entry.craving}/10`
).join('\n')}
`;
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}