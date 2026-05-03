import { describe, expect, it } from 'vitest';
import { pluralCount, pluralNoun } from '../plural';

/**
 * Mock t() — looks up keys from a flat object, returns fallback (or
 * key) on miss. Mirrors the i18n.tsx contract.
 */
function makeT(dict: Record<string, string>) {
  return (key: string, fallback?: string) =>
    dict[key] ?? fallback ?? key;
}

describe('[R17-5] pluralCount', () => {
  it('selects the .one bucket for count=1 in English', () => {
    const t = makeT({
      'ribbon.afDays.one': '{{count}} AF day',
      'ribbon.afDays.other': '{{count}} AF days',
    });
    expect(pluralCount(t, 'en', 'ribbon.afDays', 1, '')).toBe('1 AF day');
  });

  it('selects the .other bucket for count=2+ in English', () => {
    const t = makeT({
      'ribbon.afDays.one': '{{count}} AF day',
      'ribbon.afDays.other': '{{count}} AF days',
    });
    expect(pluralCount(t, 'en', 'ribbon.afDays', 5, '')).toBe('5 AF days');
  });

  it('falls back to .other when the specific bucket is missing', () => {
    const t = makeT({
      'ribbon.afDays.other': '{{count}} AF days',
      // .one missing
    });
    expect(pluralCount(t, 'en', 'ribbon.afDays', 1, '1 AF day')).toBe('1 AF days');
  });

  it('falls back to the provided fallback when no localized keys exist', () => {
    const t = makeT({});
    expect(pluralCount(t, 'en', 'ribbon.afDays', 1, '1 AF day fallback')).toBe('1 AF day fallback');
  });

  it('replaces {{count}} in the fallback when no key matches', () => {
    const t = makeT({});
    expect(pluralCount(t, 'en', 'ribbon.afDays', 7, '{{count}} days')).toBe('7 days');
  });

  it('falls back to baseKey when no fallback provided and no key matches', () => {
    const t = makeT({});
    expect(pluralCount(t, 'en', 'ribbon.afDays', 7)).toBe('ribbon.afDays');
  });

  it('handles count=0 via the .zero / .other bucket appropriately', () => {
    /* English: zero is .other. */
    const t = makeT({ 'ribbon.afDays.other': '{{count}} AF days' });
    expect(pluralCount(t, 'en', 'ribbon.afDays', 0, '')).toBe('0 AF days');
  });

  it('survives an unknown locale by falling back to English plural rules', () => {
    const t = makeT({ 'ribbon.afDays.other': '{{count}} days' });
    expect(pluralCount(t, 'qq-NOPE', 'ribbon.afDays', 5, '')).toBe('5 days');
  });
});

describe('[R17-5] pluralNoun', () => {
  it('returns singular fallback for count=1 in English', () => {
    expect(pluralNoun(makeT({}), 'en', 'unit.day', 1, 'day', 'days')).toBe('day');
  });

  it('returns plural fallback for count=2+ in English', () => {
    expect(pluralNoun(makeT({}), 'en', 'unit.day', 5, 'day', 'days')).toBe('days');
  });

  it('uses localized noun when present', () => {
    const t = makeT({ 'unit.day.one': 'jour', 'unit.day.other': 'jours' });
    expect(pluralNoun(t, 'fr', 'unit.day', 1, 'day', 'days')).toBe('jour');
    expect(pluralNoun(t, 'fr', 'unit.day', 3, 'day', 'days')).toBe('jours');
  });

  it('falls back to English fallbacks when locale lacks the key', () => {
    /* No localized fr keys. The helper should still return English
     * fallbacks instead of "[unit.day.one]" placeholder. */
    expect(pluralNoun(makeT({}), 'fr', 'unit.day', 1, 'day', 'days')).toBe('day');
  });
});
