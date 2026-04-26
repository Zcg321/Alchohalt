/**
 * PDF Export — real implementation using jsPDF.
 *
 * Owner-locked spec: real export, not placeholder. Premium feature.
 *
 * jsPDF is ~30 KB gzipped. The bundle hit is justified because any
 * hand-rolled PDF byte-stream alternative is fragile across viewers.
 * jsPDF emits standards-compliant PDFs that open everywhere.
 *
 * Privacy invariant honored: pure local generation. The blob never
 * leaves the device unless the user shares it themselves.
 */

import { jsPDF } from 'jspdf';
import type { DB, Entry } from '../store/db';

export interface PDFExportOptions {
  template?: 'summary' | 'detailed' | 'analytics';
  dateRange?: { start: Date; end: Date };
  /** Display name to print on the cover. Defaults to "Alchohalt user". */
  userLabel?: string;
}

const PAGE_MARGIN = 14;       // mm
const LINE_HEIGHT = 6;        // mm
const TITLE_FONT_SIZE = 18;
const HEADING_FONT_SIZE = 13;
const BODY_FONT_SIZE = 10;
const FOOTER_FONT_SIZE = 8;

/**
 * Generate a PDF report from the user's database. Returns a Blob ready
 * for download. NEVER throws on data shape — empty DB → "no data" PDF.
 */
export function generatePDFReport(
  db: DB,
  options: PDFExportOptions = {},
): Blob {
  const {
    template = 'summary',
    dateRange,
    userLabel = 'Alchohalt user',
  } = options;

  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const entries = filterByRange(db.entries, dateRange);

  // Cover header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(TITLE_FONT_SIZE);
  doc.text('Alchohalt Report', PAGE_MARGIN, PAGE_MARGIN + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(BODY_FONT_SIZE);
  doc.setTextColor(120);
  doc.text(
    `Prepared for ${userLabel}  ·  ${new Date().toLocaleDateString()}`,
    PAGE_MARGIN,
    PAGE_MARGIN + 12,
  );
  doc.setTextColor(40);

  let y = PAGE_MARGIN + 22;
  y = drawHeading(doc, 'Summary', y);
  y = drawSummary(doc, entries, y);

  if (template === 'detailed' || template === 'analytics') {
    y = drawHeading(doc, 'Drink log', y + 4);
    y = drawDrinkLog(doc, entries, y, pageHeight);
  }

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FOOTER_FONT_SIZE);
    doc.setTextColor(140);
    doc.text(
      `Alchohalt · page ${i} of ${pages}  ·  Generated locally on your device. Not medical advice.`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' },
    );
  }

  return doc.output('blob');
}

function drawHeading(doc: jsPDF, text: string, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(HEADING_FONT_SIZE);
  doc.setTextColor(20);
  doc.text(text, PAGE_MARGIN, y);
  doc.setDrawColor(200);
  doc.setLineWidth(0.2);
  doc.line(
    PAGE_MARGIN,
    y + 1.5,
    doc.internal.pageSize.getWidth() - PAGE_MARGIN,
    y + 1.5,
  );
  return y + LINE_HEIGHT + 2;
}

function drawSummary(doc: jsPDF, entries: Entry[], y: number): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(BODY_FONT_SIZE);
  doc.setTextColor(40);

  if (entries.length === 0) {
    doc.text('No entries in the selected period.', PAGE_MARGIN, y);
    return y + LINE_HEIGHT;
  }

  const totalStd = entries.reduce((s, e) => s + e.stdDrinks, 0);
  const totalCost = entries.reduce((s, e) => s + (e.cost ?? 0), 0);
  const days = new Set(
    entries.map((e) => new Date(e.ts).toISOString().slice(0, 10)),
  ).size;
  const avgStdPerLog = totalStd / entries.length;
  const avgCraving =
    entries.reduce((s, e) => s + (e.craving ?? 0), 0) / entries.length;

  const rows: Array<[string, string]> = [
    ['Entries logged', String(entries.length)],
    ['Days with a drink', String(days)],
    ['Total standard drinks', totalStd.toFixed(1)],
    ['Average drinks per log', avgStdPerLog.toFixed(2)],
    ['Average craving rating', avgCraving.toFixed(1)],
    ['Total cost', formatCurrency(totalCost)],
  ];

  for (const [label, value] of rows) {
    doc.text(label, PAGE_MARGIN, y);
    doc.text(value, PAGE_MARGIN + 70, y);
    y += LINE_HEIGHT;
  }

  return y;
}

function drawDrinkLog(
  doc: jsPDF,
  entries: Entry[],
  startY: number,
  pageHeight: number,
): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(BODY_FONT_SIZE - 1);

  let y = startY;
  doc.setFont('helvetica', 'bold');
  doc.text('Date', PAGE_MARGIN, y);
  doc.text('Kind', PAGE_MARGIN + 30, y);
  doc.text('Std', PAGE_MARGIN + 50, y);
  doc.text('Cost', PAGE_MARGIN + 65, y);
  doc.text('Cra.', PAGE_MARGIN + 82, y);
  doc.text('HALT', PAGE_MARGIN + 95, y);
  doc.text('Intent', PAGE_MARGIN + 115, y);
  y += LINE_HEIGHT;
  doc.setFont('helvetica', 'normal');

  const sorted = [...entries].sort((a, b) => b.ts - a.ts);
  for (const entry of sorted) {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = PAGE_MARGIN + 5;
    }
    const date = new Date(entry.ts).toISOString().slice(0, 10);
    doc.text(date, PAGE_MARGIN, y);
    doc.text(entry.kind, PAGE_MARGIN + 30, y);
    doc.text(entry.stdDrinks.toFixed(1), PAGE_MARGIN + 50, y);
    doc.text(
      entry.cost != null ? formatCurrency(entry.cost) : '—',
      PAGE_MARGIN + 65,
      y,
    );
    doc.text(String(entry.craving ?? '—'), PAGE_MARGIN + 82, y);
    doc.text(haltLabel(entry.halt), PAGE_MARGIN + 95, y);
    doc.text(entry.intention, PAGE_MARGIN + 115, y);
    y += LINE_HEIGHT - 1;
  }
  return y;
}

function filterByRange(
  entries: Entry[],
  range?: { start: Date; end: Date },
): Entry[] {
  if (!range) return entries;
  const startMs = range.start.getTime();
  const endMs = range.end.getTime();
  return entries.filter((e) => e.ts >= startMs && e.ts <= endMs);
}

function haltLabel(halt: Entry['halt']): string {
  const flags: string[] = [];
  if (halt.H) flags.push('H');
  if (halt.A) flags.push('A');
  if (halt.L) flags.push('L');
  if (halt.T) flags.push('T');
  return flags.length ? flags.join('/') : '—';
}

function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) return '—';
  return `$${amount.toFixed(2)}`;
}

/** Trigger browser download of the generated PDF. */
export function downloadPDFReport(
  db: DB,
  options: PDFExportOptions = {},
  filename?: string,
): void {
  const blob = generatePDFReport(db, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download =
    filename ??
    `alchohalt-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Legacy compat — old callers ask "is this implemented?" */
export function isPDFExportAvailable(): boolean {
  // The real subscription gate is enforced at the call site via
  // SoftPaywall + hasFeature('pdf_export'). The function itself works.
  return true;
}

/** Legacy compat — used by older PremiumDataExport UI. */
export function getAvailablePDFTemplates(): Array<{
  id: string;
  name: string;
  description: string;
  premium: boolean;
}> {
  return [
    {
      id: 'summary',
      name: 'Summary report',
      description: 'Top-level numbers for the period.',
      premium: true,
    },
    {
      id: 'detailed',
      name: 'Detailed log',
      description: 'Every entry, sorted newest first.',
      premium: true,
    },
    {
      id: 'analytics',
      name: 'Analytics report',
      description: 'Summary + detailed log + planned charts (v1.1).',
      premium: true,
    },
  ];
}
