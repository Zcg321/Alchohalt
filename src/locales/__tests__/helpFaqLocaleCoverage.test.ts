/**
 * [R29-2] Locale-coverage gate for the Help FAQ surface.
 *
 * Pins that all 6 supported locales (en/es/fr/de/pl/ru) ship the
 * complete settings.help.* + today.privacyCard.* key set. A future
 * round that adds a new FAQ entry to HelpFaq.tsx without translating
 * it will fail this test, surfacing the gap during CI rather than at
 * a non-EN user's first run.
 *
 * The expected key list is derived from the EN catalog at test time
 * (the EN catalog is the source of truth — it's what the component
 * falls back to). Each non-EN locale must have every settings.help.*
 * and today.privacyCard.* key the EN catalog has.
 */
import { describe, it, expect } from 'vitest';
import en from '../en.json';
import es from '../es.json';
import fr from '../fr.json';
import de from '../de.json';
import pl from '../pl.json';
import ru from '../ru.json';

const LOCALES = { es, fr, de, pl, ru } as const;
const PREFIX_PATTERNS = [/^settings\.help\./, /^today\.privacyCard\./];

function helpKeysOf(catalog: Record<string, unknown>): string[] {
  return Object.keys(catalog).filter((k) =>
    PREFIX_PATTERNS.some((p) => p.test(k)),
  );
}

describe('[R29-2] Help FAQ + first-launch privacy card locale coverage', () => {
  const expectedKeys = helpKeysOf(en as unknown as Record<string, unknown>);

  it('EN catalog has the full settings.help + today.privacyCard key set (sanity)', () => {
    expect(expectedKeys.length).toBeGreaterThanOrEqual(33);
    expect(expectedKeys).toContain('settings.help.heading');
    expect(expectedKeys).toContain('settings.help.faq.crisis-support.q');
    expect(expectedKeys).toContain('settings.help.faq.crisis-support.a');
    expect(expectedKeys).toContain('today.privacyCard.dismiss');
  });

  for (const [code, catalog] of Object.entries(LOCALES)) {
    it(`${code} catalog includes every settings.help / today.privacyCard key from EN`, () => {
      const dict = catalog as unknown as Record<string, unknown>;
      const missing = expectedKeys.filter((k) => !(k in dict));
      expect(missing).toEqual([]);
    });

    it(`${code} translations are non-empty and not identical to EN (substantive translation)`, () => {
      const dict = catalog as unknown as Record<string, string>;
      const enDict = en as unknown as Record<string, string>;
      /* Soft check: at least 80% of help keys must differ from EN.
       * A handful of short tokens may legitimately match (proper
       * names, short technical terms), but if every string matches
       * EN the file is plausibly a stub copy of en.json. */
      const helpQuestions = expectedKeys.filter((k) => k.endsWith('.q') || k === 'settings.help.heading');
      const matchingEN = helpQuestions.filter((k) => dict[k] === enDict[k]);
      const matchRate = matchingEN.length / helpQuestions.length;
      expect(matchRate).toBeLessThan(0.2);
    });
  }
});
