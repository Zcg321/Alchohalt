import { describe, it, expect } from 'vitest';
import { buildPrintableReceipt } from '../printableReceipt';
import type { TrustEvent } from '../receipt';

const event = (
  id: number,
  type: TrustEvent['type'],
  source: string,
  summary: string,
  detail?: Record<string, unknown>,
): TrustEvent => ({
  id,
  ts: 1700000000000 + id * 1000,
  type,
  source,
  summary,
  ...(detail ? { detail } : {}),
});

describe('[R15-4] buildPrintableReceipt', () => {
  it('returns a complete HTML document', () => {
    const html = buildPrintableReceipt({
      events: [],
      generatedAt: 1700000000000,
    });
    expect(html).toMatch(/<!doctype html>/i);
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('includes a generated-at timestamp in ISO form', () => {
    const html = buildPrintableReceipt({
      events: [],
      generatedAt: 1700000000000,
    });
    expect(html).toContain('2023-11-14');
  });

  it('renders a row for each event', () => {
    const events = [
      event(1, 'storage-set', 'storage', 'SET foo'),
      event(2, 'fetch', 'fetch', 'GET /api → 200'),
    ];
    const html = buildPrintableReceipt({ events, generatedAt: Date.now() });
    expect(html).toContain('SET foo');
    expect(html).toContain('GET /api → 200');
  });

  it('escapes HTML in event summaries', () => {
    const evil = event(1, 'fetch', 'fetch', '<script>alert(1)</script>');
    const html = buildPrintableReceipt({
      events: [evil],
      generatedAt: Date.now(),
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('renders a per-type counts summary', () => {
    const events = [
      event(1, 'storage-set', 'storage', 'SET a'),
      event(2, 'storage-set', 'storage', 'SET b'),
      event(3, 'fetch', 'fetch', 'GET'),
    ];
    const html = buildPrintableReceipt({ events, generatedAt: Date.now() });
    expect(html).toContain('storage-set');
    expect(html).toMatch(/storage-set[\s\S]*?2/);
    expect(html).toMatch(/fetch[\s\S]*?1/);
  });

  it('shows "No events captured" when events is empty', () => {
    const html = buildPrintableReceipt({ events: [], generatedAt: Date.now() });
    expect(html).toContain('No events captured');
  });

  it('renders an optional headerNote when provided', () => {
    const html = buildPrintableReceipt({
      events: [],
      generatedAt: Date.now(),
      headerNote: 'Captured during AI Insights consent flow.',
    });
    expect(html).toContain('Captured during AI Insights consent flow.');
  });

  it('escapes HTML in detail JSON', () => {
    const e = event(1, 'fetch', 'fetch', 'GET', { url: '<not-a-tag>' });
    const html = buildPrintableReceipt({
      events: [e],
      generatedAt: Date.now(),
    });
    expect(html).not.toContain('<not-a-tag>');
    expect(html).toContain('&lt;not-a-tag&gt;');
  });

  it('renders pluralization correctly', () => {
    const oneEvent = buildPrintableReceipt({
      events: [event(1, 'fetch', 'fetch', 'GET')],
      generatedAt: Date.now(),
    });
    expect(oneEvent).toContain('1 event captured');

    const manyEvents = buildPrintableReceipt({
      events: [
        event(1, 'fetch', 'fetch', 'GET'),
        event(2, 'fetch', 'fetch', 'GET'),
      ],
      generatedAt: Date.now(),
    });
    expect(manyEvents).toContain('2 events captured');
  });

  it('contains print-media CSS for tighter pagination', () => {
    const html = buildPrintableReceipt({
      events: [],
      generatedAt: Date.now(),
    });
    expect(html).toContain('@media print');
    expect(html).toContain('@page');
  });
});
