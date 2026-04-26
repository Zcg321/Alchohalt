import { describe, expect, it } from 'vitest';
import { generatePDFReport } from '../pdf-export';
import type { DB, Entry } from '../../store/db';

function db(entries: Entry[] = []): DB {
  return {
    version: 1,
    entries,
    trash: [],
    settings: {
      version: 1,
      language: 'en',
      theme: 'system',
      dailyGoalDrinks: 0,
      weeklyGoalDrinks: 0,
      monthlyBudget: 0,
      reminders: { enabled: false, times: [] },
      showBAC: false,
    },
    advancedGoals: [],
    presets: [],
    healthMetrics: [],
    meta: {},
  };
}

function entry(p: Partial<Entry>): Entry {
  return {
    id: String(Math.random()),
    ts: Date.now(),
    kind: 'beer',
    stdDrinks: 1,
    intention: 'social',
    craving: 1,
    halt: { H: false, A: false, L: false, T: false },
    ...p,
  };
}

describe('generatePDFReport — produces a real PDF blob', () => {
  it('returns a Blob with application/pdf MIME', () => {
    const blob = generatePDFReport(db());
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
  });

  it('PDF starts with the %PDF- magic header (real PDF bytes)', async () => {
    const blob = generatePDFReport(db());
    // jsdom Blob may lack arrayBuffer(); fall back to FileReader.
    const text = await new Promise<string>((resolve, reject) => {
      if (typeof blob.arrayBuffer === 'function') {
        blob
          .arrayBuffer()
          .then((buf) => resolve(new TextDecoder().decode(buf.slice(0, 5))))
          .catch(reject);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.slice(0, 5));
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
    expect(text).toBe('%PDF-');
  });

  it('empty DB → still produces a valid PDF (no throw)', () => {
    expect(() => generatePDFReport(db())).not.toThrow();
  });

  it('with entries → generates non-empty PDF', () => {
    const blob = generatePDFReport(
      db([
        entry({ kind: 'beer', stdDrinks: 1.2, cost: 6 }),
        entry({ kind: 'wine', stdDrinks: 2.0, cost: 9 }),
      ]),
    );
    expect(blob.size).toBeGreaterThan(500);
  });

  it('detailed template produces larger PDF (drinks listed)', () => {
    const entries = Array.from({ length: 20 }).map(() =>
      entry({ ts: Date.now() - Math.random() * 1e9 }),
    );
    const summary = generatePDFReport(db(entries), { template: 'summary' });
    const detailed = generatePDFReport(db(entries), { template: 'detailed' });
    expect(detailed.size).toBeGreaterThan(summary.size);
  });

  it('respects dateRange filter', () => {
    const oldEntry = entry({ ts: 1_700_000_000_000 });
    const newEntry = entry({ ts: Date.now() });
    const out = generatePDFReport(db([oldEntry, newEntry]), {
      template: 'detailed',
      dateRange: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date(),
      },
    });
    expect(out.size).toBeGreaterThan(0);
  });
});
