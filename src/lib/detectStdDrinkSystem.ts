/**
 * [R15-C] Locale-driven default for std-drink jurisdiction.
 *
 * The user can pick a jurisdiction explicitly in Settings → Std-drink
 * system. When they haven't, we derive a reasonable default from the
 * browser/OS locale instead of always landing on 'us'.
 *
 * Mapping is intentionally conservative — we only override 'us' when
 * the locale clearly maps to a documented health-authority. For
 * anything we can't recognize confidently, we leave 'us' as the
 * fallback (a known wrong answer beats a guessed wrong answer; the
 * Settings callout we surface tells the user how to change it).
 *
 * Source for jurisdiction definitions: src/lib/calc.ts STD_DRINK_GRAMS.
 */
import type { StdDrinkSystem } from './calc';

/**
 * Detect the user's likely std-drink system from a Navigator-shaped
 * input. Pure; takes the language tag explicitly so tests can pin
 * a value without mucking with global navigator.
 */
export function detectStdDrinkSystem(localeTag: string | undefined): StdDrinkSystem {
  if (!localeTag) return 'us';
  const normalized = localeTag.toLowerCase();
  // BCP-47 region subtag is the second segment after a dash. e.g.
  // 'en-GB' → 'gb', 'en-US' → 'us'. If absent, the language alone
  // doesn't pin a region (en, fr, de) — fall through to 'us'.
  const parts = normalized.split('-');
  const region = parts[1];
  if (!region) return 'us';

  switch (region) {
    case 'gb':
    case 'uk':
      return 'uk';
    case 'au':
      return 'au';
    case 'ie':
      return 'ie';
    case 'ca':
      return 'ca';
    case 'fr':
    case 'de':
    case 'nl':
    case 'es':
    case 'it':
    case 'pt':
    case 'be':
    case 'at':
    case 'ch':
    case 'pl':
    case 'cz':
    case 'se':
    case 'no':
    case 'dk':
    case 'fi':
      return 'eu';
    default:
      return 'us';
  }
}

/**
 * Convenience wrapper that reads `navigator.language` if present,
 * else returns 'us'. Pure-ish — only side-effect is reading
 * `navigator`, which is read-only.
 */
export function detectStdDrinkSystemFromNavigator(): StdDrinkSystem {
  if (typeof navigator === 'undefined') return 'us';
  return detectStdDrinkSystem(navigator.language);
}
