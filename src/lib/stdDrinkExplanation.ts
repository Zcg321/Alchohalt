/**
 * [R26-A] Plain-language explanation of "1 standard drink" per
 * jurisdiction.
 *
 * The Settings picker tells the user which authority's gram-of-ethanol
 * threshold they want; this module turns that threshold into the
 * common-volume equivalences a non-specialist actually thinks in
 * (12oz beer at 5%, 5oz wine at 12%, 1.5oz spirit at 40%, etc).
 *
 * Round 25's Disability Rights Advocate audit flagged "std drink" as
 * unexplained jargon (C2). The fix: a permanent, opt-out tooltip
 * surface in Settings, locale-aware so the equivalences match the
 * jurisdiction's own beer/wine/spirit norms — the UK 8g threshold
 * lines up with "half a pint of regular-strength beer," not the US
 * "12oz can." Calling those equivalences "the same thing" would be
 * arithmetically wrong, so each jurisdiction gets its own line.
 *
 * Pure module, no React imports. The component (Settings) renders the
 * shape into a `<details>` summary so it stays out of the eager render
 * path for users who already know what a std drink is.
 *
 * Sources: each jurisdiction's own health authority website. The same
 * citations the round-14 researcher pass used for STD_DRINK_GRAMS in
 * src/lib/calc.ts. Where authorities give a range (e.g. UK "8-10g
 * varies by drink type") we use the canonical 8g central value.
 */
import type { StdDrinkSystem } from './calc';
import { STD_DRINK_GRAMS } from './calc';

export interface StdDrinkExplanation {
  /** Compact label: e.g. "1 std drink (NIAAA, US)". */
  label: string;
  /** Pure-alcohol grams per the authority's definition. */
  grams: number;
  /** 2-3 common-volume equivalences a non-specialist recognizes. */
  equivalences: string[];
  /** Authority + URL the equivalences cite. URL kept off the surface;
   *  used only by the audit/citation doc. */
  authority: string;
}

/** Authority + grams + equivalences per jurisdiction. */
export const STD_DRINK_EXPLANATIONS: Record<StdDrinkSystem, StdDrinkExplanation> = {
  us: {
    label: '1 std drink (US, NIAAA)',
    grams: 14.0,
    equivalences: [
      '12 oz beer at 5% ABV',
      '5 oz wine at 12% ABV',
      '1.5 oz spirit at 40% ABV',
    ],
    authority: 'US National Institute on Alcohol Abuse and Alcoholism',
  },
  uk: {
    label: '1 unit (UK, NHS)',
    grams: 8.0,
    equivalences: [
      'half a pint of 4% beer',
      '76 ml of 12% wine',
      '25 ml of 40% spirit (single measure)',
    ],
    authority: 'UK NHS / Chief Medical Officers',
  },
  au: {
    label: '1 std drink (AU, NHMRC)',
    grams: 10.0,
    equivalences: [
      '285 ml of 4.8% beer (a "middy"/"pot")',
      '100 ml of 13% wine',
      '30 ml of 40% spirit',
    ],
    authority: 'Australian National Health and Medical Research Council',
  },
  eu: {
    label: '1 std drink (EU, 10g)',
    grams: 10.0,
    equivalences: [
      '250 ml of 5% beer',
      '100 ml of 12.5% wine',
      '30 ml of 40% spirit',
    ],
    authority: 'EU consensus (NL/FR/DE — ICAP report)',
  },
  ca: {
    label: '1 std drink (CA, Health Canada)',
    grams: 13.6,
    equivalences: [
      '341 ml (12 oz) of 5% beer',
      '142 ml (5 oz) of 12% wine',
      '43 ml (1.5 oz) of 40% spirit',
    ],
    authority: 'Health Canada Low-Risk Alcohol Drinking Guidelines',
  },
  ie: {
    label: '1 std drink (IE, HSE)',
    grams: 10.0,
    equivalences: [
      'half-pint of 4.3% lager',
      '100 ml of 12.5% wine',
      '35.5 ml of 40% spirit (Irish single)',
    ],
    authority: 'Irish Health Service Executive',
  },
  nz: {
    label: '1 std drink (NZ, HPA)',
    grams: 10.0,
    equivalences: [
      '330 ml of 4% beer',
      '100 ml of 12.5% wine',
      '30 ml of 40% spirit',
    ],
    authority: 'New Zealand Health Promotion Agency',
  },
};

/**
 * Convenience accessor. Returns the explanation for the given system,
 * or the US fallback when callers pass an unknown system at runtime
 * (defense-in-depth: TypeScript covers compile-time, this covers
 * malformed persisted state).
 */
export function getStdDrinkExplanation(system: StdDrinkSystem | undefined): StdDrinkExplanation {
  if (system && STD_DRINK_EXPLANATIONS[system]) return STD_DRINK_EXPLANATIONS[system];
  return STD_DRINK_EXPLANATIONS.us;
}

/**
 * Sanity-check guard against drift: every system in STD_DRINK_GRAMS
 * must have a matching explanation. Imported by the test so a future
 * addition to STD_DRINK_GRAMS that forgets to add an explanation
 * fails CI rather than silently falling back to US.
 */
export function listMissingExplanations(): StdDrinkSystem[] {
  return (Object.keys(STD_DRINK_GRAMS) as StdDrinkSystem[]).filter(
    (s) => !STD_DRINK_EXPLANATIONS[s],
  );
}

/**
 * [R27-B] Locale-aware variant: same shape, but label / equivalences /
 * authority resolved through the i18n t() function. The English
 * STD_DRINK_EXPLANATIONS values are passed as fallbacks so missing
 * keys don't blank out the surface — they just render in English.
 *
 * Keys follow the pattern `stdDrink.system.{us|uk|...}.{label|equiv1|equiv2|equiv3|authority}`.
 * Three equivalence slots match the canonical English data; if a future
 * locale wants to merge two equivalences for brevity, leave a slot
 * empty — the helper filters falsy entries out.
 */
export type Translator = (key: string, fallback?: string) => string;

export function getStdDrinkExplanationLocalized(
  system: StdDrinkSystem | undefined,
  t: Translator,
): StdDrinkExplanation {
  const base = getStdDrinkExplanation(system);
  const sys = system && STD_DRINK_EXPLANATIONS[system] ? system : 'us';
  const equivalences = (
    base.equivalences.map((eq, i) => t(`stdDrink.system.${sys}.equiv${i + 1}`, eq))
  ).filter((s) => s && s.trim().length > 0);
  return {
    label: t(`stdDrink.system.${sys}.label`, base.label),
    grams: base.grams,
    equivalences,
    authority: t(`stdDrink.system.${sys}.authority`, base.authority),
  };
}
