import { describe, expect, it } from 'vitest';
import {
  detectRegion,
  getPack,
  US_PACK,
  UK_PACK,
  AU_PACK,
  CA_PACK,
  IE_PACK,
} from '../regions';

describe('detectRegion', () => {
  it('returns US when navigator.language is empty / nullish', () => {
    expect(detectRegion(null)).toBe('US');
    expect(detectRegion(undefined)).toBe('US');
    expect(detectRegion('')).toBe('US');
  });

  it('returns the explicit US-region tag', () => {
    expect(detectRegion('en-US')).toBe('US');
    expect(detectRegion('es-US')).toBe('US');
  });

  it('maps GB / UK to UK', () => {
    expect(detectRegion('en-GB')).toBe('UK');
    expect(detectRegion('en-UK')).toBe('UK');
  });

  it('maps AU, CA, IE explicitly', () => {
    expect(detectRegion('en-AU')).toBe('AU');
    expect(detectRegion('en-CA')).toBe('CA');
    expect(detectRegion('fr-CA')).toBe('CA');
    expect(detectRegion('en-IE')).toBe('IE');
  });

  it('falls back to US for unmapped regions', () => {
    expect(detectRegion('en-NZ')).toBe('US');
    expect(detectRegion('de-DE')).toBe('US');
  });

  it('falls back to US for language-only locales', () => {
    expect(detectRegion('en')).toBe('US');
    expect(detectRegion('es')).toBe('US');
  });

  it('handles underscored locale separators', () => {
    expect(detectRegion('en_GB')).toBe('UK');
  });
});

describe('region packs', () => {
  it('US pack has 988, SAMHSA, Crisis Text Line', () => {
    const ids = US_PACK.immediate.map((r) => r.id);
    expect(ids).toContain('us-988');
    expect(ids).toContain('us-samhsa');
    expect(ids).toContain('us-crisis-text');
  });

  it('UK pack has Samaritans 116 123, Drinkline, NHS 111', () => {
    const phones = UK_PACK.immediate.map((r) => r.phone).filter(Boolean);
    expect(phones).toContain('116 123');
    expect(phones).toContain('0300 123 1110');
    expect(phones).toContain('111');
  });

  it('Australia pack has Lifeline 13 11 14 + DirectLine', () => {
    const phones = AU_PACK.immediate.map((r) => r.phone).filter(Boolean);
    expect(phones).toContain('13 11 14');
    expect(phones).toContain('1800 250 015');
  });

  it('Canada pack has Talk Suicide + ON Drug & Alcohol Helpline', () => {
    const phones = CA_PACK.immediate.map((r) => r.phone).filter(Boolean);
    expect(phones).toContain('1-833-456-4566');
    expect(phones).toContain('1-800-565-8603');
  });

  it('Ireland pack has Samaritans + HSE', () => {
    const phones = IE_PACK.immediate.map((r) => r.phone).filter(Boolean);
    expect(phones).toContain('116 123');
    expect(phones).toContain('1800 459 459');
  });

  it('getPack returns the corresponding pack for each region code', () => {
    expect(getPack('US')).toBe(US_PACK);
    expect(getPack('UK')).toBe(UK_PACK);
    expect(getPack('AU')).toBe(AU_PACK);
    expect(getPack('CA')).toBe(CA_PACK);
    expect(getPack('IE')).toBe(IE_PACK);
  });
});
