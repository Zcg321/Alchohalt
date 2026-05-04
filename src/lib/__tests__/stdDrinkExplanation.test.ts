import { describe, it, expect } from 'vitest';
import {
  STD_DRINK_EXPLANATIONS,
  getStdDrinkExplanation,
  getStdDrinkExplanationLocalized,
  listMissingExplanations,
} from '../stdDrinkExplanation';
import { STD_DRINK_GRAMS } from '../calc';

describe('[R26-A] stdDrinkExplanation', () => {
  it('every STD_DRINK_GRAMS jurisdiction has an explanation entry', () => {
    expect(listMissingExplanations()).toEqual([]);
  });

  it('each explanation grams matches STD_DRINK_GRAMS', () => {
    for (const sys of Object.keys(STD_DRINK_GRAMS) as (keyof typeof STD_DRINK_GRAMS)[]) {
      expect(STD_DRINK_EXPLANATIONS[sys].grams).toBe(STD_DRINK_GRAMS[sys]);
    }
  });

  it('each explanation has at least 2 equivalences', () => {
    for (const sys of Object.keys(STD_DRINK_EXPLANATIONS) as (keyof typeof STD_DRINK_EXPLANATIONS)[]) {
      expect(STD_DRINK_EXPLANATIONS[sys].equivalences.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('UK explanation calls the unit a "unit" not std drink', () => {
    expect(STD_DRINK_EXPLANATIONS.uk.label.toLowerCase()).toContain('unit');
  });

  it('US explanation references NIAAA', () => {
    expect(STD_DRINK_EXPLANATIONS.us.authority).toMatch(/NIAAA|National Institute/i);
  });

  it('AU explanation cites NHMRC', () => {
    expect(STD_DRINK_EXPLANATIONS.au.authority).toMatch(/NHMRC|National Health/);
  });

  it('NZ explanation references HPA / Health Promotion Agency', () => {
    expect(STD_DRINK_EXPLANATIONS.nz.authority).toMatch(/Health Promotion Agency|HPA/i);
  });

  it('getStdDrinkExplanation falls back to US for undefined', () => {
    expect(getStdDrinkExplanation(undefined)).toBe(STD_DRINK_EXPLANATIONS.us);
  });

  it('getStdDrinkExplanation falls back to US for unknown', () => {
    // @ts-expect-error - testing runtime defense-in-depth
    expect(getStdDrinkExplanation('zz')).toBe(STD_DRINK_EXPLANATIONS.us);
  });

  it('getStdDrinkExplanation returns the matching entry for a known system', () => {
    expect(getStdDrinkExplanation('uk').grams).toBe(8);
    expect(getStdDrinkExplanation('ca').grams).toBe(13.6);
  });
});

describe('[R27-B] getStdDrinkExplanationLocalized', () => {
  it('uses English fallback when t() returns the fallback', () => {
    const t = (_k: string, fallback?: string) => fallback ?? '';
    const out = getStdDrinkExplanationLocalized('us', t);
    expect(out.label).toBe(STD_DRINK_EXPLANATIONS.us.label);
    expect(out.equivalences).toEqual(STD_DRINK_EXPLANATIONS.us.equivalences);
    expect(out.authority).toBe(STD_DRINK_EXPLANATIONS.us.authority);
    expect(out.grams).toBe(STD_DRINK_EXPLANATIONS.us.grams);
  });

  it('uses translated values when t() returns a localized string', () => {
    const dict: Record<string, string> = {
      'stdDrink.system.uk.label': '1 unidad (Reino Unido, NHS)',
      'stdDrink.system.uk.equiv1': 'media pinta',
      'stdDrink.system.uk.equiv2': '76 ml de vino',
      'stdDrink.system.uk.equiv3': '25 ml de licor',
      'stdDrink.system.uk.authority': 'NHS UK',
    };
    const t = (k: string, fallback?: string) => dict[k] ?? fallback ?? '';
    const out = getStdDrinkExplanationLocalized('uk', t);
    expect(out.label).toBe('1 unidad (Reino Unido, NHS)');
    expect(out.equivalences).toEqual(['media pinta', '76 ml de vino', '25 ml de licor']);
    expect(out.authority).toBe('NHS UK');
    expect(out.grams).toBe(8);
  });

  it('falls back to US system when given undefined', () => {
    const t = (_k: string, fallback?: string) => fallback ?? '';
    const out = getStdDrinkExplanationLocalized(undefined, t);
    expect(out.grams).toBe(STD_DRINK_EXPLANATIONS.us.grams);
  });

  it('filters out blank equivalences if a locale leaves a slot empty', () => {
    const dict: Record<string, string> = {
      'stdDrink.system.us.equiv1': 'beer',
      'stdDrink.system.us.equiv2': '',
      'stdDrink.system.us.equiv3': 'spirit',
    };
    const t = (k: string, fallback?: string) =>
      k in dict ? dict[k] : fallback ?? '';
    const out = getStdDrinkExplanationLocalized('us', t);
    expect(out.equivalences).toEqual(['beer', 'spirit']);
  });
});
