import { describe, it, expect } from 'vitest';
import en from '../locales/en.json';
import es from '../locales/es.json';

/**
 * [I18N-PARITY] Guard rail to keep es.json in lockstep with en.json.
 *
 * Round-1 voice pass touched ~140 EN strings and re-translated all of
 * them to Spanish. Without a parity test, future EN copy edits could
 * land without a Spanish equivalent and the user-visible text would
 * silently fall back to the English fallback string in the i18n
 * resolver — which means a Spanish-locale user gets a mixed-language
 * UI with no warning.
 *
 * This test enforces:
 *   1. Every key in en.json exists in es.json
 *   2. Conversely, es.json has no orphan keys (en.json is the source
 *      of truth; orphans are translation rot)
 *   3. No more than ~5 values are identical between EN and ES
 *      (proper nouns / acronyms only — flag any new mass-untranslated
 *      drift)
 */

function flatten(obj: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  if (obj === null || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix + k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key + '.'));
    } else if (typeof v === 'string') {
      out[key] = v;
    }
  }
  return out;
}

describe('locale parity (en.json ↔ es.json)', () => {
  const enKeys = Object.keys(flatten(en)).sort();
  const esKeys = Object.keys(flatten(es)).sort();

  it('every EN key exists in ES', () => {
    const missing = enKeys.filter((k) => !esKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it('ES has no orphan keys not in EN', () => {
    const orphan = esKeys.filter((k) => !enKeys.includes(k));
    expect(orphan).toEqual([]);
  });

  it('no more than 6 values are identical EN/ES (proper nouns + acronyms only)', () => {
    const E = flatten(en);
    const S = flatten(es);
    const identical = Object.keys(E).filter(
      (k) => typeof E[k] === 'string' && E[k].length > 3 && E[k] === S[k],
    );
    /* Headroom for a couple more proper-noun additions; if this trips,
     * either the new value really is a proper noun (raise the cap by
     * one) or someone forgot to translate (translate it). */
    expect(identical.length).toBeLessThanOrEqual(6);
  });
});
