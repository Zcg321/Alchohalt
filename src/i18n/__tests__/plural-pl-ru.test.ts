import { describe, expect, it } from 'vitest';
import { pluralCount, pluralNoun } from '../plural';
import pl from '../../locales/pl.json';
import ru from '../../locales/ru.json';

/**
 * [R18-1 / R18-2] Polish + Russian plural correctness.
 *
 * Polish has three plural buckets via Intl.PluralRules:
 *   - one: count = 1                              ("1 dzień")
 *   - few: count in {2,3,4} (excluding 12-14)     ("3 dni")
 *   - many: count = 0, 5+, 12-14, etc.            ("5 dni", "12 dni")
 *
 * Russian has the same three-bucket shape but on different counts.
 * Both languages collapse "few" and "many" to the same word for some
 * nouns (e.g. dzień → dni in PL) but the bucket still selects.
 *
 * These tests assert the buckets resolve correctly so future
 * translators (especially native reviewers per the audit) have a
 * reproducible spec for what each form is.
 */

function flat(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

function makeT(dict: Record<string, string>) {
  return (key: string, fallback?: string) =>
    dict[key] ?? fallback ?? key;
}

describe('[R18-1] Polish plural correctness', () => {
  const t = makeT(flat(pl as unknown as Record<string, unknown>));

  it('selects .one for count=1 (dzień)', () => {
    expect(pluralCount(t, 'pl', 'tenure.days', 1, '')).toBe('1 dzień');
  });

  it('selects .few for counts 2-4 (dni)', () => {
    expect(pluralCount(t, 'pl', 'tenure.days', 2, '')).toBe('2 dni');
    expect(pluralCount(t, 'pl', 'tenure.days', 3, '')).toBe('3 dni');
    expect(pluralCount(t, 'pl', 'tenure.days', 4, '')).toBe('4 dni');
  });

  it('selects .many for counts 5+ (dni in genitive)', () => {
    expect(pluralCount(t, 'pl', 'tenure.days', 5, '')).toBe('5 dni');
    expect(pluralCount(t, 'pl', 'tenure.days', 11, '')).toBe('11 dni');
    expect(pluralCount(t, 'pl', 'tenure.days', 21, '')).toBe('21 dni');
  });

  it('selects .many for the irregular 12-14 range', () => {
    /* Polish 12, 13, 14 are .many — NOT .few, even though 2, 3, 4 are. */
    expect(pluralCount(t, 'pl', 'tenure.days', 12, '')).toBe('12 dni');
    expect(pluralCount(t, 'pl', 'tenure.days', 13, '')).toBe('13 dni');
    expect(pluralCount(t, 'pl', 'tenure.days', 14, '')).toBe('14 dni');
  });

  it('selects .many for count=0 (also dni)', () => {
    expect(pluralCount(t, 'pl', 'tenure.days', 0, '')).toBe('0 dni');
  });

  it('months use distinct forms: 1 miesiąc / 3 miesiące / 5 miesięcy', () => {
    expect(pluralCount(t, 'pl', 'tenure.months', 1, '')).toBe('1 miesiąc');
    expect(pluralCount(t, 'pl', 'tenure.months', 3, '')).toBe('3 miesiące');
    expect(pluralCount(t, 'pl', 'tenure.months', 5, '')).toBe('5 miesięcy');
  });

  it('years use distinct forms: 1 rok / 2 lata / 5 lat', () => {
    expect(pluralCount(t, 'pl', 'tenure.years', 1, '')).toBe('1 rok');
    expect(pluralCount(t, 'pl', 'tenure.years', 2, '')).toBe('2 lata');
    expect(pluralCount(t, 'pl', 'tenure.years', 5, '')).toBe('5 lat');
  });

  it('pluralNoun returns the right unit form', () => {
    expect(pluralNoun(t, 'pl', 'unit.day', 1, 'day', 'days')).toBe('dzień');
    expect(pluralNoun(t, 'pl', 'unit.day', 2, 'day', 'days')).toBe('dni');
    expect(pluralNoun(t, 'pl', 'unit.day', 5, 'day', 'days')).toBe('dni');
  });

  it('drinks: drink / drinki / drinków', () => {
    expect(pluralNoun(t, 'pl', 'unit.drink', 1, 'drink', 'drinks')).toBe('drink');
    expect(pluralNoun(t, 'pl', 'unit.drink', 3, 'drink', 'drinks')).toBe('drinki');
    expect(pluralNoun(t, 'pl', 'unit.drink', 7, 'drink', 'drinks')).toBe('drinków');
  });

  it('entries: wpis / wpisy / wpisów', () => {
    expect(pluralNoun(t, 'pl', 'unit.entry', 1, 'entry', 'entries')).toBe('wpis');
    expect(pluralNoun(t, 'pl', 'unit.entry', 4, 'entry', 'entries')).toBe('wpisy');
    expect(pluralNoun(t, 'pl', 'unit.entry', 12, 'entry', 'entries')).toBe('wpisów');
  });
});

describe('[R18-2] Russian plural correctness', () => {
  const t = makeT(flat(ru as unknown as Record<string, unknown>));

  it('Intl.PluralRules selects .one for count=1, 21, 101', () => {
    const r = new Intl.PluralRules('ru');
    expect(r.select(1)).toBe('one');
    expect(r.select(21)).toBe('one');
    expect(r.select(101)).toBe('one');
  });

  it('Intl.PluralRules selects .few for counts ending in 2-4 (excl. 12-14)', () => {
    const r = new Intl.PluralRules('ru');
    expect(r.select(2)).toBe('few');
    expect(r.select(3)).toBe('few');
    expect(r.select(4)).toBe('few');
    expect(r.select(22)).toBe('few');
    expect(r.select(23)).toBe('few');
  });

  it('Intl.PluralRules selects .many for 0, 5-20, 25-30...', () => {
    const r = new Intl.PluralRules('ru');
    expect(r.select(0)).toBe('many');
    expect(r.select(5)).toBe('many');
    expect(r.select(11)).toBe('many');
    expect(r.select(12)).toBe('many');
    expect(r.select(13)).toBe('many');
    expect(r.select(14)).toBe('many');
    expect(r.select(15)).toBe('many');
  });

  it('selects .one for count=1, 21 (день/год)', () => {
    expect(pluralCount(t, 'ru', 'tenure.days', 1, '')).toBe('1 день');
    expect(pluralCount(t, 'ru', 'tenure.days', 21, '')).toBe('21 день');
    expect(pluralCount(t, 'ru', 'tenure.years', 1, '')).toBe('1 год');
    expect(pluralCount(t, 'ru', 'tenure.years', 21, '')).toBe('21 год');
  });

  it('selects .few for counts ending in 2-4 (дня/года)', () => {
    expect(pluralCount(t, 'ru', 'tenure.days', 2, '')).toBe('2 дня');
    expect(pluralCount(t, 'ru', 'tenure.days', 3, '')).toBe('3 дня');
    expect(pluralCount(t, 'ru', 'tenure.years', 22, '')).toBe('22 года');
  });

  it('selects .many for 0, 5+, irregular 12-14 (дней/лет)', () => {
    expect(pluralCount(t, 'ru', 'tenure.days', 0, '')).toBe('0 дней');
    expect(pluralCount(t, 'ru', 'tenure.days', 5, '')).toBe('5 дней');
    expect(pluralCount(t, 'ru', 'tenure.days', 12, '')).toBe('12 дней');
    expect(pluralCount(t, 'ru', 'tenure.years', 5, '')).toBe('5 лет');
    expect(pluralCount(t, 'ru', 'tenure.years', 13, '')).toBe('13 лет');
  });

  it('months use distinct forms: 1 месяц / 2 месяца / 5 месяцев', () => {
    expect(pluralCount(t, 'ru', 'tenure.months', 1, '')).toBe('1 месяц');
    expect(pluralCount(t, 'ru', 'tenure.months', 2, '')).toBe('2 месяца');
    expect(pluralCount(t, 'ru', 'tenure.months', 5, '')).toBe('5 месяцев');
  });

  it('pluralNoun returns the right unit form for день', () => {
    expect(pluralNoun(t, 'ru', 'unit.day', 1, 'day', 'days')).toBe('день');
    expect(pluralNoun(t, 'ru', 'unit.day', 2, 'day', 'days')).toBe('дня');
    expect(pluralNoun(t, 'ru', 'unit.day', 5, 'day', 'days')).toBe('дней');
  });

  it('drinks: напиток / напитка / напитков', () => {
    expect(pluralNoun(t, 'ru', 'unit.drink', 1, 'drink', 'drinks')).toBe('напиток');
    expect(pluralNoun(t, 'ru', 'unit.drink', 3, 'drink', 'drinks')).toBe('напитка');
    expect(pluralNoun(t, 'ru', 'unit.drink', 7, 'drink', 'drinks')).toBe('напитков');
  });

  it('Polish vs Russian: both 3-bucket but different counts', () => {
    const polish = new Intl.PluralRules('pl');
    const russian = new Intl.PluralRules('ru');
    /* PL: 21 → many ("dwadzieścia jeden DNI"), RU: 21 → one ("двадцать один день"). */
    expect(polish.select(21)).toBe('many');
    expect(russian.select(21)).toBe('one');
  });
});
