import { describe, it, expect } from 'vitest';
import en from '../locales/en.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import pl from '../locales/pl.json';
import ru from '../locales/ru.json';

/**
 * [R19-A] Voice-drift regression guard.
 *
 * Round 18 caught fr/de drift after the fact: 13 onboarding/support strings
 * had drifted into wellness-marketing voice ("personalized analyses",
 * "motivating streak counters", "wellness journey") while EN had been
 * deliberately rewritten to calm voice ("what changes over time", "you can
 * change either anytime"). The drift sat through R9, R12, R13, R17 because
 * typecheck/lint can't read tone. Native-speaker review would catch it,
 * but R18-3 explicitly deferred that to v1.1.
 *
 * R19-A's premise: most voice drift is detectable mechanically. The
 * banned vocabulary in audit-walkthrough/voice-guidelines.md has direct
 * translations. If a non-EN translation contains the banned phrase AND
 * the matched EN string does NOT, that's drift. Works without a native
 * speaker.
 *
 * What this catches:
 *   - "wellness journey" (FR: parcours bien-être / DE: Wellness-Reise /
 *     ES: viaje de bienestar / PL: podróż wellness / RU: путь оздоровления)
 *   - "motivating" / "personalized" framing
 *   - "Smart" prefix (Smart tracking / Smart insights — marketing tic)
 *   - Exclamation-mark drift on calm-voice surfaces
 *
 * What it doesn't catch (and shouldn't pretend to):
 *   - Subtle tone shifts within calm vocabulary
 *   - Idiom mistranslations
 *   - Cultural register (TU/VOUS, formal/informal)
 *   - Typos / grammar
 *
 * Those still need human review. This guard is the canary, not the cure.
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

/**
 * Per-locale "marketing-voice phrase" lexicon. These are direct
 * translations of EN banned terms from voice-guidelines.md.
 *
 * If you add an EN banned phrase to the guidelines, add its translations
 * here. Patterns are word-boundary-aware where possible (case-insensitive).
 */
const BANNED_MARKETING_PHRASES: Record<string, RegExp[]> = {
  en: [
    /\bwellness journey\b/i,
    /\bwellness companion\b/i,
    /\bpersonal wellness\b/i,
    /\bmindfulness practice\b/i,
    /\byour alcohol-free life\b/i,
    /\bunlock now\b/i,
    /\bget premium!/i,
    /\bupgrade now/i,
    /\bdon't break the chain/i,
    /\bkeep your streak alive/i,
    /\bsmart tracking\b/i,
    /\bsmart insights\b/i,
    /\bmotivating streak/i,
    /\bpersonalized goals\b/i,
    /\bpersonalized analyses\b/i,
    /\bwe're here for (you|your)\b/i,
  ],
  es: [
    /\bviaje de bienestar\b/i,
    /\bcompañero de bienestar\b/i,
    /\bbienestar personal\b/i,
    /\bdesbloquear ahora\b/i,
    /\bobtén premium\b/i,
    /\bactualiza ahora\b/i,
    /\brachas motivadoras\b/i,
    /\bobjetivos personalizados\b/i,
    /\banálisis personalizados\b/i,
    /\bseguimiento inteligente\b/i,
    /\bestamos aquí para ti\b/i,
  ],
  fr: [
    /\bparcours bien-être\b/i,
    /\bvotre parcours\b/i,
    /\bcompagnon bien-être\b/i,
    /\bbien-être personnel\b/i,
    /\bdébloquer maintenant\b/i,
    /\bobtenir premium\b/i,
    /\bmettre à niveau maintenant\b/i,
    /\bséries motivantes\b/i,
    /\bobjectifs personnalisés\b/i,
    /\banalyses personnalisées\b/i,
    /\bsuivi intelligent\b/i,
    /\bnous sommes là pour vous\b/i,
  ],
  de: [
    /\bwellness-reise\b/i,
    /\bwellness-begleiter\b/i,
    /\bpersönliches wellness\b/i,
    /\bjetzt freischalten\b/i,
    /\bpremium holen\b/i,
    /\bjetzt upgraden\b/i,
    /\bmotivierende serien\b/i,
    /\bpersönliche ziele\b/i,
    /\bpersönliche einblicke\b/i,
    /\bsmart-tracking\b/i,
    /\bwir sind für (sie|dich) da\b/i,
  ],
  pl: [
    /\bpodróż wellness\b/i,
    /\btowarzysz wellness\b/i,
    /\bosobiste wellness\b/i,
    /\bodblokuj teraz\b/i,
    /\bzdobądź premium\b/i,
    /\bulepsz teraz\b/i,
    /\binteligentne śledzenie\b/i,
    /\bspersonalizowane cele\b/i,
    /\bspersonalizowane analizy\b/i,
    /\bjesteśmy tutaj dla ciebie\b/i,
  ],
  ru: [
    /\bпуть оздоровления\b/i,
    /\bкомпаньон по оздоровлению\b/i,
    /\bличное оздоровление\b/i,
    /\bразблокировать сейчас\b/i,
    /\bполучить премиум\b/i,
    /\bобновить сейчас\b/i,
    /\bумное отслеживание\b/i,
    /\bперсонализированные цели\b/i,
    /\bперсонализированные аналитики\b/i,
    /\bмы здесь для вас\b/i,
  ],
};

/**
 * Surfaces where exclamation marks are explicitly banned by
 * voice-guidelines.md (onboarding, empty states, success toasts,
 * premium tiles, milestone copy). If EN never uses '!' and a
 * non-EN translation does, that's drift.
 */
const EXCLAMATION_BANNED_KEY_PREFIXES = [
  'onboarding.',
  'paywall.',
  'milestones.',
  'support.',
  'streakBreak.',
  'firstMonth.',
  'recovery.',
];

interface VoiceFinding {
  locale: string;
  key: string;
  enValue: string;
  localeValue: string;
  reason: string;
}

function findMarketingPhrases(value: string, locale: string): string[] {
  const patterns = BANNED_MARKETING_PHRASES[locale] ?? [];
  const hits: string[] = [];
  for (const re of patterns) {
    if (re.test(value)) hits.push(re.source);
  }
  return hits;
}

function isExclamationBannedKey(key: string): boolean {
  return EXCLAMATION_BANNED_KEY_PREFIXES.some((p) => key.startsWith(p));
}

function auditLocale(
  locale: string,
  enFlat: Record<string, string>,
  localeFlat: Record<string, string>,
): VoiceFinding[] {
  const findings: VoiceFinding[] = [];
  for (const [key, localeValue] of Object.entries(localeFlat)) {
    const enValue = enFlat[key];
    if (typeof enValue !== 'string') continue;

    const enBanned = findMarketingPhrases(enValue, 'en');
    const localeBanned = findMarketingPhrases(localeValue, locale);
    const newBanned = localeBanned.filter((p) => !enBanned.includes(p));

    if (newBanned.length > 0) {
      findings.push({
        locale,
        key,
        enValue,
        localeValue,
        reason: `marketing-voice phrase(s) present in ${locale} but not in EN: ${newBanned.join(', ')}`,
      });
    }

    if (isExclamationBannedKey(key)) {
      const enExclaim = (enValue.match(/!/g) ?? []).length;
      const locExclaim = (localeValue.match(/!/g) ?? []).length;
      if (locExclaim > enExclaim) {
        findings.push({
          locale,
          key,
          enValue,
          localeValue,
          reason: `${locale} adds ${locExclaim - enExclaim} exclamation mark(s) on a calm-voice surface (key prefix banned by voice-guidelines.md)`,
        });
      }
    }
  }
  return findings;
}

describe('[R19-A] Voice-drift regression guard', () => {
  const enFlat = flatten(en);

  it.each([
    ['es', es],
    ['fr', fr],
    ['de', de],
    ['pl', pl],
    ['ru', ru],
  ])('no marketing-voice drift in %s vs en', (locale, source) => {
    const findings = auditLocale(locale, enFlat, flatten(source));
    if (findings.length > 0) {
      const report = findings
        .map(
          (f) =>
            `\n  [${f.locale}] ${f.key}\n    EN: ${f.enValue}\n    ${f.locale.toUpperCase()}: ${f.localeValue}\n    REASON: ${f.reason}`,
        )
        .join('\n');
      throw new Error(
        `Voice drift detected in ${locale}.json (${findings.length} finding${findings.length === 1 ? '' : 's'}):${report}\n\nFix the translation to match EN's calm voice, or — if EN itself uses the phrase legitimately — update the lexicon in voice-drift-guard.test.ts.`,
      );
    }
    expect(findings).toEqual([]);
  });

  it('lexicon covers every locale that the app ships', () => {
    const shipped = ['en', 'es', 'fr', 'de', 'pl', 'ru'];
    for (const loc of shipped) {
      const lex = BANNED_MARKETING_PHRASES[loc];
      expect(lex).toBeDefined();
      expect(lex!.length).toBeGreaterThan(0);
    }
  });

  it('lexicon stays in rough sync — non-EN locales each have at least 8 banned phrases', () => {
    for (const loc of ['es', 'fr', 'de', 'pl', 'ru']) {
      const lex = BANNED_MARKETING_PHRASES[loc];
      expect(lex).toBeDefined();
      expect(lex!.length).toBeGreaterThanOrEqual(8);
    }
  });
});
