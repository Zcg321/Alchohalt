/**
 * [R17-5] Locale-aware plural helper.
 *
 * The pre-R17 codebase had ~25 user-visible strings with hardcoded
 * English plural rules: `${n} day${n === 1 ? '' : 's'}`. These work
 * for English but produce broken output for other locales:
 *
 *   - Spanish "1 days" instead of "1 día"
 *   - French "1 days" instead of "1 jour"
 *   - German "1 days" instead of "1 Tag"
 *   - Russian (not supported yet, but flagged for future) needs three
 *     forms, not two
 *
 * Usage:
 *
 *   pluralCount(t, lang, 'ribbon.afDays', count, `${count} AF days`);
 *
 * The helper looks up `<baseKey>.one` / `<baseKey>.few` / `<baseKey>.many`
 * / `<baseKey>.other` based on `Intl.PluralRules(lang).select(count)`.
 * Falls back to the English-shaped fallback string if no localized key
 * exists for that bucket.
 *
 * Translators add per-locale plural keys to locales/<lang>.json; the
 * fallback covers anything not yet localized so the string never reads
 * "[ribbon.afDays.one]" to a user.
 */

export interface PluralLookup {
  (key: string, fallback?: string): string;
}

const PLURAL_RULES_CACHE = new Map<string, Intl.PluralRules>();

function pluralRulesFor(lang: string): Intl.PluralRules {
  let rules = PLURAL_RULES_CACHE.get(lang);
  if (!rules) {
    try {
      rules = new Intl.PluralRules(lang);
    } catch {
      rules = new Intl.PluralRules('en');
    }
    PLURAL_RULES_CACHE.set(lang, rules);
  }
  return rules;
}

/**
 * Pick the correct plural form for `count` in `lang` from a base i18n
 * key.
 *
 * The base key is augmented with the bucket name from Intl.PluralRules
 * (e.g. baseKey="ribbon.afDays" + count=1 → "ribbon.afDays.one").
 * Token replacement: any `{{count}}` in the resolved string becomes the
 * count value.
 *
 * If no localized key matches and no fallback is provided, returns the
 * lookup default (the key itself), matching the existing t() behavior.
 */
export function pluralCount(
  t: PluralLookup,
  lang: string,
  baseKey: string,
  count: number,
  fallback?: string,
): string {
  const bucket = pluralRulesFor(lang).select(count);
  const fullKey = `${baseKey}.${bucket}`;
  /* The translation lookup falls back through:
   *   1. <baseKey>.<bucket> in the active language
   *   2. <baseKey>.other in the active language (English fallback chain)
   *   3. The provided fallback string (with English plural rules already
   *      applied by the caller via `${count === 1 ? '' : 's'}`)
   *   4. The base key itself (signals an untranslated string in dev) */
  const directHit = t(fullKey, '');
  if (directHit && directHit !== fullKey && directHit !== '') {
    return directHit.replace('{{count}}', String(count));
  }
  const otherHit = t(`${baseKey}.other`, '');
  if (otherHit && otherHit !== `${baseKey}.other` && otherHit !== '') {
    return otherHit.replace('{{count}}', String(count));
  }
  return (fallback ?? baseKey).replace('{{count}}', String(count));
}

/**
 * Convenience helper for the most common pattern: a count + a noun.
 * Returns just the noun (singular or plural) so callers can compose
 * with their own count formatting.
 *
 *   pluralNoun(t, 'en', 'unit.day', 1, 'day', 'days') → "day"
 *   pluralNoun(t, 'en', 'unit.day', 5, 'day', 'days') → "days"
 *   pluralNoun(t, 'fr', 'unit.day', 0, 'day', 'days') → "jour" (via fr locale)
 */
export function pluralNoun(
  t: PluralLookup,
  lang: string,
  baseKey: string,
  count: number,
  singularFallback: string,
  pluralFallback: string,
): string {
  const bucket = pluralRulesFor(lang).select(count);
  const fullKey = `${baseKey}.${bucket}`;
  const directHit = t(fullKey, '');
  if (directHit && directHit !== fullKey && directHit !== '') return directHit;
  const otherHit = t(`${baseKey}.other`, '');
  if (otherHit && otherHit !== `${baseKey}.other` && otherHit !== '') return otherHit;
  return count === 1 ? singularFallback : pluralFallback;
}
