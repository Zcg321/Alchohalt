import { describe, it, expect } from 'vitest';
import {
  STD_DRINK_EXPLANATIONS,
  getStdDrinkExplanation,
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
