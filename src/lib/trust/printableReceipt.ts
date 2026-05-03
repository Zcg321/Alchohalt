/**
 * [R15-4] Printable Trust-Receipt builder.
 *
 * Round 9-10 added the in-app Trust Receipt and Privacy Status
 * surfaces. Round 15 lets the user export a printable HTML version
 * of the receipt for archival ("here's a record of what the app did
 * on date X").
 *
 * Pure builder: takes (events, generatedAt, optional headerNote)
 * and returns a self-contained HTML string. No fetches, no
 * dependencies, no styling that breaks when the document is
 * printed. The consuming UI opens this HTML in a new window via a
 * blob URL and the user invokes the platform print dialog.
 *
 * Voice: technical, factual. Header reads "Trust receipt — generated
 * {date}, {n} events captured. Browser DevTools remains authoritative."
 */
import type { TrustEvent } from './receipt';

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toISOString();
}

interface BuildOptions {
  /** Events to include. Caller may pre-filter / pre-sort. */
  events: readonly TrustEvent[];
  /** Generation timestamp; usually Date.now(). */
  generatedAt: number;
  /** Optional human note to display under the header. */
  headerNote?: string;
}

export function buildPrintableReceipt(opts: BuildOptions): string {
  const { events, generatedAt, headerNote } = opts;
  const generatedIso = formatTimestamp(generatedAt);

  // Counts per event type for the summary block
  const counts: Record<string, number> = {};
  for (const e of events) counts[e.type] = (counts[e.type] ?? 0) + 1;
  const summaryEntries = Object.entries(counts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(
      ([type, count]) =>
        `<li><span class="t">${escapeHtml(type)}</span> &middot; ${count}</li>`
    )
    .join('');

  const rows = events
    .map((e) => {
      const ts = formatTimestamp(e.ts);
      const detail = e.detail
        ? escapeHtml(JSON.stringify(e.detail))
        : '';
      return `<tr>
  <td class="ts">${escapeHtml(ts)}</td>
  <td class="type">${escapeHtml(e.type)}</td>
  <td class="src">${escapeHtml(e.source)}</td>
  <td class="summary">${escapeHtml(e.summary)}</td>
  <td class="detail">${detail}</td>
</tr>`;
    })
    .join('\n');

  const note = headerNote ? `<p class="note">${escapeHtml(headerNote)}</p>` : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Alchohalt trust receipt — ${escapeHtml(generatedIso)}</title>
<style>
  body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; color: #1f2937; line-height: 1.4; padding: 24px; max-width: 1080px; margin: 0 auto; }
  h1 { font-size: 18px; margin: 0 0 4px 0; }
  .sub { font-size: 12px; color: #6b7280; margin: 0 0 16px 0; }
  .note { font-size: 12px; color: #4b5563; margin: 0 0 16px 0; padding: 8px 12px; background: #f9fafb; border-left: 3px solid #d1d5db; }
  ul.summary { list-style: none; padding: 0; margin: 0 0 16px 0; display: flex; gap: 14px; flex-wrap: wrap; font-size: 12px; }
  ul.summary li .t { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  th, td { text-align: left; padding: 4px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  th { background: #f3f4f6; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #374151; }
  td.ts { white-space: nowrap; color: #6b7280; }
  td.type { white-space: nowrap; }
  td.src { white-space: nowrap; color: #6b7280; }
  td.detail { color: #6b7280; word-break: break-all; }
  @media print {
    body { padding: 0; }
    table { font-size: 10px; }
    @page { margin: 0.5in; }
  }
</style>
</head>
<body>
<h1>Alchohalt trust receipt</h1>
<p class="sub">Generated ${escapeHtml(generatedIso)} &middot; ${events.length} event${events.length === 1 ? '' : 's'} captured. Browser DevTools remains authoritative.</p>
${note}
<ul class="summary">
${summaryEntries || '<li>No events captured.</li>'}
</ul>
<table>
<thead>
<tr><th>Time (UTC)</th><th>Type</th><th>Source</th><th>Summary</th><th>Detail</th></tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
</body>
</html>`;
}
