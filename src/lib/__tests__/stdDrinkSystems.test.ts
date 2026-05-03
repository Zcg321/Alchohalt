import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  stdDrinks,
  gramsAlcohol,
  STD_DRINK_GRAMS,
  STD_DRINK_SYSTEM_LABELS,
  setActiveStdDrinkSystem,
  getActiveStdDrinkSystem,
  stdDrinkLabel,
  type StdDrinkSystem,
} from '../calc';

const originalSystem = getActiveStdDrinkSystem();

afterEach(() => {
  setActiveStdDrinkSystem(originalSystem);
});

describe('[R14-6] STD_DRINK_GRAMS constants match published guidance', () => {
  it('US (NIAAA) = 14g', () => expect(STD_DRINK_GRAMS.us).toBe(14));
  it('UK (NHS) = 8g per unit', () => expect(STD_DRINK_GRAMS.uk).toBe(8));
  it('Australia (NHMRC) = 10g', () => expect(STD_DRINK_GRAMS.au).toBe(10));
  it('Europe (10g consensus) = 10g', () => expect(STD_DRINK_GRAMS.eu).toBe(10));
  it('Canada Low-Risk = 13.6g', () => expect(STD_DRINK_GRAMS.ca).toBe(13.6));
  it('Ireland HSE = 10g', () => expect(STD_DRINK_GRAMS.ie).toBe(10));
});

describe('[R14-6] gramsAlcohol unchanged across systems (physics is invariant)', () => {
  it('a UK pint of 5% beer is ~22.4 g of ethanol', () => {
    expect(gramsAlcohol(568, 5)).toBeCloseTo(22.4, 1);
  });
  it('a US 12oz of 5% beer is ~13.8 g of ethanol', () => {
    // 355 ml × 0.05 × 0.789 = 14.0
    expect(gramsAlcohol(355, 5)).toBeCloseTo(14.0, 1);
  });
});

describe('[R14-6] stdDrinks honors explicit system parameter', () => {
  const VOL = 568;
  const ABV = 5;

  it('US: returns ~1.6 std drinks for a UK pint', () => {
    expect(stdDrinks(VOL, ABV, 'us')).toBeCloseTo(1.6, 1);
  });
  it('UK: returns ~2.8 units for a UK pint', () => {
    expect(stdDrinks(VOL, ABV, 'uk')).toBeCloseTo(2.8, 1);
  });
  it('AU: returns ~2.24 std drinks for a UK pint', () => {
    expect(stdDrinks(VOL, ABV, 'au')).toBeCloseTo(2.24, 2);
  });
  it('EU: returns ~2.24 std drinks for a UK pint', () => {
    expect(stdDrinks(VOL, ABV, 'eu')).toBeCloseTo(2.24, 2);
  });
  it('CA: returns ~1.65 std drinks for a UK pint', () => {
    expect(stdDrinks(VOL, ABV, 'ca')).toBeCloseTo(1.65, 2);
  });
  it('IE: returns ~2.24 std drinks for a UK pint (10g system)', () => {
    expect(stdDrinks(VOL, ABV, 'ie')).toBeCloseTo(2.24, 2);
  });
});

describe('[R14-6] stdDrinks honors module-level activeSystem when no param', () => {
  beforeEach(() => {
    setActiveStdDrinkSystem('us');
  });

  it('default activeSystem is US', () => {
    expect(getActiveStdDrinkSystem()).toBe('us');
  });

  it('switching active system changes returned value', () => {
    const VOL = 568;
    const ABV = 5;
    setActiveStdDrinkSystem('us');
    const usVal = stdDrinks(VOL, ABV);
    setActiveStdDrinkSystem('uk');
    const ukVal = stdDrinks(VOL, ABV);
    expect(ukVal).toBeGreaterThan(usVal);
    expect(ukVal / usVal).toBeCloseTo(14 / 8, 2);
  });

  it('explicit param overrides activeSystem', () => {
    setActiveStdDrinkSystem('uk');
    const explicit = stdDrinks(355, 5, 'us');
    expect(explicit).toBeCloseTo(1.0, 1);
  });
});

describe('[R14-6] stdDrinkLabel', () => {
  it('returns "unit" for UK', () => {
    expect(stdDrinkLabel('uk')).toBe('unit');
  });
  it('returns "std" for everywhere else', () => {
    (['us', 'au', 'eu', 'ca', 'ie'] as StdDrinkSystem[]).forEach((sys) => {
      expect(stdDrinkLabel(sys)).toBe('std');
    });
  });
  it('honors active system when no arg', () => {
    setActiveStdDrinkSystem('uk');
    expect(stdDrinkLabel()).toBe('unit');
    setActiveStdDrinkSystem('us');
    expect(stdDrinkLabel()).toBe('std');
  });
});

describe('[R14-6] STD_DRINK_SYSTEM_LABELS', () => {
  it('has a label for every system', () => {
    const systems: StdDrinkSystem[] = ['us', 'uk', 'au', 'eu', 'ca', 'ie'];
    for (const sys of systems) {
      expect(STD_DRINK_SYSTEM_LABELS[sys]).toBeTruthy();
      expect(STD_DRINK_SYSTEM_LABELS[sys]).toMatch(/g/);
    }
  });
});
