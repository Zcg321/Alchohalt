import { describe, it, expect } from 'vitest';
import { detectStdDrinkSystem } from '../detectStdDrinkSystem';

describe('[R15-C] detectStdDrinkSystem', () => {
  it('returns us for en-US', () => {
    expect(detectStdDrinkSystem('en-US')).toBe('us');
  });

  it('returns uk for en-GB', () => {
    expect(detectStdDrinkSystem('en-GB')).toBe('uk');
  });

  it('handles legacy uk region tag', () => {
    expect(detectStdDrinkSystem('en-UK')).toBe('uk');
  });

  it('returns au for en-AU', () => {
    expect(detectStdDrinkSystem('en-AU')).toBe('au');
  });

  it('[R25-A] returns nz for en-NZ', () => {
    expect(detectStdDrinkSystem('en-NZ')).toBe('nz');
  });

  it('[R25-A] expanded EU coverage: hu, ro, gr, sk, hr, bg, is', () => {
    expect(detectStdDrinkSystem('hu-HU')).toBe('eu');
    expect(detectStdDrinkSystem('ro-RO')).toBe('eu');
    expect(detectStdDrinkSystem('el-GR')).toBe('eu');
    expect(detectStdDrinkSystem('sk-SK')).toBe('eu');
    expect(detectStdDrinkSystem('hr-HR')).toBe('eu');
    expect(detectStdDrinkSystem('bg-BG')).toBe('eu');
    expect(detectStdDrinkSystem('is-IS')).toBe('eu');
  });

  it('returns ie for en-IE', () => {
    expect(detectStdDrinkSystem('en-IE')).toBe('ie');
  });

  it('returns ca for en-CA', () => {
    expect(detectStdDrinkSystem('en-CA')).toBe('ca');
  });

  it('returns eu for fr-FR', () => {
    expect(detectStdDrinkSystem('fr-FR')).toBe('eu');
  });

  it('returns eu for de-DE', () => {
    expect(detectStdDrinkSystem('de-DE')).toBe('eu');
  });

  it('returns eu for nl-NL', () => {
    expect(detectStdDrinkSystem('nl-NL')).toBe('eu');
  });

  it('falls back to us for language-only tags', () => {
    expect(detectStdDrinkSystem('en')).toBe('us');
    expect(detectStdDrinkSystem('fr')).toBe('us');
  });

  it('falls back to us for unknown regions', () => {
    expect(detectStdDrinkSystem('en-ZZ')).toBe('us');
    expect(detectStdDrinkSystem('ja-JP')).toBe('us');
  });

  it('handles uppercase + mixed case', () => {
    expect(detectStdDrinkSystem('EN-GB')).toBe('uk');
    expect(detectStdDrinkSystem('En-Gb')).toBe('uk');
  });

  it('returns us on undefined or empty', () => {
    expect(detectStdDrinkSystem(undefined)).toBe('us');
    expect(detectStdDrinkSystem('')).toBe('us');
  });
});
