import { describe, it, expect } from 'vitest';
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import pl from '../locales/pl.json';
import ru from '../locales/ru.json';

/**
 * [R22-A] Extend locale parity beyond es↔en.
 *
 * The existing locale-parity.test.ts asserts es.json matches en.json
 * key-for-key. That coverage didn't extend to fr/de/pl/ru, which means
 * a copy edit landing only in en+es would silently fall back to
 * English for the other four locales (the i18n resolver returns the
 * en fallback when a key is absent in the active dictionary).
 *
 * This test catches that drift across all five non-EN locales.
 *
 * Plural-form note: pl.json and ru.json carry Slavic-specific plural
 * variants (`.few` and `.many`) that en.json doesn't have. Those are
 * legitimate orphans — the orphan check strips `.few` / `.many` keys
 * before comparing.
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

const SLAVIC_PLURAL_SUFFIXES = ['.few', '.many'];

function stripSlavicPluralOrphans(keys: string[]): string[] {
  return keys.filter((k) => !SLAVIC_PLURAL_SUFFIXES.some((suf) => k.endsWith(suf)));
}

const enKeys = Object.keys(flatten(en)).sort();

describe.each([
  ['fr', fr, false],
  ['de', de, false],
  ['pl', pl, true],
  ['ru', ru, true],
])('locale parity (en.json ↔ %s.json)', (name, dict, hasSlavicPlurals) => {
  const dictKeys = Object.keys(flatten(dict)).sort();

  it('every EN key exists in target locale', () => {
    const missing = enKeys.filter((k) => !dictKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it('target locale has no orphan keys not in EN (Slavic plurals exempt)', () => {
    const orphans = dictKeys.filter((k) => !enKeys.includes(k));
    const filtered = hasSlavicPlurals ? stripSlavicPluralOrphans(orphans) : orphans;
    expect(filtered).toEqual([]);
  });
});
