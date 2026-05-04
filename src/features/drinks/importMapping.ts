import type { Entry, Intention } from '../../store/db';

/**
 * [R10-1] User-data import — maps a foreign tracker's CSV/JSON columns
 * to Alchohalt Entry fields. Three layers:
 *
 *   1. parseRows: robust CSV/JSON-array parser into a list of rows.
 *   2. detectColumns: auto-detection from common header names used by
 *      Drinkaware, Reframe, Dryy, Sunnyside, generic spreadsheet exports.
 *      Returns null for any field the user must map manually.
 *   3. applyMapping: deterministic transform from rows + mapping to a
 *      list of Entries (without IDs — caller assigns).
 *
 * Edge cases:
 * - Multi-drink rows ("3 beers"): expanded into 3 separate entries.
 * - Missing date: row is dropped + counted in the report.
 * - Free-text drink type: heuristically mapped to beer/wine/spirits/custom.
 */

export interface ColumnMap {
  date: string | null; // header name in source
  drinks: string | null; // numeric count (optional — defaults to 1)
  drinkType: string | null; // beer/wine/spirits/free-text (optional)
  notes: string | null; // optional
  mood: string | null; // optional
  /** [R27-D] Free-form tags column. Cell can be a comma-, pipe-, or
   *  semicolon-separated list. Empty cells are treated as no tags. */
  tags: string | null; // optional
}

export interface ParsedRow {
  [column: string]: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  headers: string[];
  format: 'csv' | 'json';
}

export interface ApplyResult {
  entries: Omit<Entry, 'id'>[];
  skippedRows: number;
  skipReasons: string[];
}

export function parseRows(text: string): ParseResult {
  const trimmed = text.trim();
  if (!trimmed) return { rows: [], headers: [], format: 'csv' };

  // Try JSON array first
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const headers = Array.from(
          new Set(parsed.flatMap((r) => (r && typeof r === 'object' ? Object.keys(r) : []))),
        );
        const rows: ParsedRow[] = parsed.map((r) => {
          const out: ParsedRow = {};
          if (r && typeof r === 'object') {
            for (const k of headers) out[k] = r[k] != null ? String(r[k]) : '';
          }
          return out;
        });
        return { rows, headers, format: 'json' };
      }
    } catch {
      // fall through to CSV
    }
  }

  // CSV with header row
  const lines = trimmed.split(/\r?\n/);
  if (lines.length < 1) return { rows: [], headers: [], format: 'csv' };

  const headers = parseCSVLine(lines[0] ?? '');
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const values = parseCSVLine(line);
    const row: ParsedRow = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    rows.push(row);
  }
  return { rows, headers, format: 'csv' };
}

function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === ',') {
        out.push(cur);
        cur = '';
      } else if (ch === '"') {
        inQuotes = true;
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const DATE_HEADERS = ['date', 'time', 'timestamp', 'datetime', 'when', 'logged at', 'log_date', 'occurred_at'];
const DRINKS_HEADERS = ['drinks', 'count', 'units', 'quantity', 'qty', 'standard drinks', 'std_drinks', 'stddrinks'];
const TYPE_HEADERS = ['type', 'drink', 'drink type', 'drinktype', 'beverage', 'category'];
const NOTES_HEADERS = ['notes', 'note', 'comment', 'comments', 'description'];
const MOOD_HEADERS = ['mood', 'feeling', 'how_felt', 'state'];
/** [R27-D] Tag column header candidates. Common spreadsheet labels
 *  for free-form classification: "tags" (Reframe, Sunnyside),
 *  "labels" (Drinkaware), "categories" (some custom exports). */
const TAGS_HEADERS = ['tags', 'tag', 'labels', 'label', 'categories'];

export function detectColumns(headers: string[]): ColumnMap {
  const lowerToOriginal = new Map<string, string>();
  for (const h of headers) lowerToOriginal.set(h.toLowerCase().trim(), h);

  const find = (candidates: string[]): string | null => {
    for (const c of candidates) {
      const hit = lowerToOriginal.get(c);
      if (hit) return hit;
    }
    // Substring fallback (e.g. "Date Logged" matches "date")
    for (const [low, orig] of lowerToOriginal.entries()) {
      if (candidates.some((c) => low.includes(c))) return orig;
    }
    return null;
  };

  return {
    date: find(DATE_HEADERS),
    drinks: find(DRINKS_HEADERS),
    drinkType: find(TYPE_HEADERS),
    notes: find(NOTES_HEADERS),
    mood: find(MOOD_HEADERS),
    tags: find(TAGS_HEADERS),
  };
}

/** [R27-D] Split a tag-list cell on the most common delimiters and
 *  return cleaned, deduplicated tags. Exported for the test. */
export function parseTagsCell(raw: string | undefined): string[] {
  if (!raw || !raw.trim()) return [];
  const parts = raw
    .split(/[,;|]/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  return Array.from(new Set(parts));
}

function inferKind(raw: string): 'beer' | 'wine' | 'spirits' | 'custom' {
  const s = raw.toLowerCase();
  if (/beer|lager|ale|stout|ipa|pilsner|cider/.test(s)) return 'beer';
  if (/wine|champagne|prosecco|rosé|rose|chardonnay|merlot/.test(s)) return 'wine';
  if (/spirit|whisk|vodka|gin|rum|tequila|cocktail|shot/.test(s)) return 'spirits';
  return 'custom';
}

function inferMood(raw: string): Entry['mood'] | undefined {
  const s = raw.toLowerCase();
  if (/happy|joy|good|great/.test(s)) return 'happy';
  if (/sad|down/.test(s)) return 'sad';
  if (/anxious|nervous|worried/.test(s)) return 'anxious';
  if (/stress|overwhelm/.test(s)) return 'stressed';
  if (/calm|peace|relax/.test(s)) return 'calm';
  if (/excite|thrilled/.test(s)) return 'excited';
  if (/neutral|fine|ok/.test(s)) return 'neutral';
  return undefined;
}

function parseTimestamp(raw: string): number | null {
  if (!raw) return null;
  // ISO and standard formats
  const t = Date.parse(raw);
  if (!Number.isNaN(t)) return t;
  // YYYY-MM-DD only
  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd && ymd[1] && ymd[2] && ymd[3]) {
    return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]), 12, 0, 0).getTime();
  }
  // MM/DD/YYYY
  const mdy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mdy && mdy[1] && mdy[2] && mdy[3]) {
    return new Date(Number(mdy[3]), Number(mdy[1]) - 1, Number(mdy[2]), 12, 0, 0).getTime();
  }
  return null;
}

export function applyMapping(rows: ParsedRow[], mapping: ColumnMap): ApplyResult {
  const entries: Omit<Entry, 'id'>[] = [];
  let skipped = 0;
  const reasons = new Set<string>();

  for (const row of rows) {
    if (!mapping.date) {
      skipped++;
      reasons.add('No date column mapped — every row dropped');
      break;
    }
    const ts = parseTimestamp(row[mapping.date] ?? '');
    if (ts === null) {
      skipped++;
      reasons.add('Unparseable date');
      continue;
    }

    const drinkCount = mapping.drinks
      ? Math.max(1, Math.min(20, parseInt(row[mapping.drinks] ?? '1', 10) || 1))
      : 1;

    const kind = mapping.drinkType ? inferKind(row[mapping.drinkType] ?? '') : 'beer';
    const stdDrinks = mapping.drinks ? Number(row[mapping.drinks]) || 1 : 1;
    const notes = mapping.notes ? row[mapping.notes] : undefined;
    const mood = mapping.mood ? inferMood(row[mapping.mood] ?? '') : undefined;
    /* [R27-D] Tags: optional column. Empty list omitted from the
     * persisted entry so we don't pollute filters with empty arrays. */
    const tags = mapping.tags ? parseTagsCell(row[mapping.tags]) : [];
    const tagsField = tags.length > 0 ? tags : undefined;

    // Multi-drink rows: emit `drinkCount` entries with stdDrinks=1 each
    // unless the source already had a fractional or large stdDrinks
    // value (then preserve as-is).
    const explode = drinkCount > 1 && stdDrinks === drinkCount;
    if (explode) {
      for (let i = 0; i < drinkCount; i++) {
        entries.push(buildEntry(ts + i * 60_000, kind, 1, notes, mood, tagsField));
      }
    } else {
      entries.push(buildEntry(ts, kind, stdDrinks, notes, mood, tagsField));
    }
  }

  return { entries, skippedRows: skipped, skipReasons: Array.from(reasons) };
}

function buildEntry(
  ts: number,
  kind: 'beer' | 'wine' | 'spirits' | 'custom',
  stdDrinks: number,
  notes: string | undefined,
  mood: Entry['mood'] | undefined,
  tags: string[] | undefined,
): Omit<Entry, 'id'> {
  const intention: Intention = 'other';
  const halt = { H: false, A: false, L: false, T: false };
  return {
    ts,
    kind,
    stdDrinks,
    intention,
    craving: 0,
    halt,
    notes: notes && notes.length > 0 ? notes : undefined,
    mood,
    tags,
  };
}
