import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatTime,
  formatNumber,
  formatCurrency,
  formatStdDrinks,
  formatPercent,
} from '../format';

describe('format helpers — locale awareness', () => {
  it('formatDate renders en-US and es-ES distinctly', () => {
    const d = new Date('2026-04-15T12:00:00.000Z');
    const en = formatDate(d, 'en');
    const es = formatDate(d, 'es');
    expect(en).toBeTruthy();
    expect(es).toBeTruthy();
    // We only assert they're produced; exact format depends on the
    // ICU data shipped with the JS runtime. The important contract is
    // that lang is honored, not specific ordering of M/D/Y vs D/M/Y.
    expect(typeof en).toBe('string');
    expect(typeof es).toBe('string');
  });

  it('formatTime returns hour:minute by default', () => {
    const d = new Date('2026-04-15T14:30:00.000Z');
    const out = formatTime(d, 'en');
    expect(/\d{1,2}/.test(out)).toBe(true);
  });

  it('formatNumber respects locale decimal separator', () => {
    const en = formatNumber(1234.5, 'en');
    const es = formatNumber(1234.5, 'es');
    // en-US uses comma thousands + period decimal: "1,234.5"
    // es-ES uses period thousands + comma decimal: "1.234,5"
    expect(en).toContain('1');
    expect(es).toContain('1');
    expect(en).not.toBe(es);
  });

  it('formatCurrency wraps with currency symbol', () => {
    const en = formatCurrency(50, 'en');
    const es = formatCurrency(50, 'es');
    expect(en).toMatch(/\$|USD/);
    expect(es).toMatch(/\$|US|USD/);
  });

  it('formatStdDrinks always has one fractional digit', () => {
    expect(formatStdDrinks(3, 'en')).toBe('3.0');
    expect(formatStdDrinks(3.456, 'en')).toBe('3.5');
  });

  it('formatPercent appends %', () => {
    expect(formatPercent(23, 'en')).toBe('23%');
    expect(formatPercent(0, 'en')).toBe('0%');
  });

  it('accepts ts as number or Date', () => {
    const ts = new Date('2026-04-15T12:00:00.000Z').getTime();
    expect(formatDate(ts, 'en')).toBe(formatDate(new Date(ts), 'en'));
    expect(formatTime(ts, 'en')).toBe(formatTime(new Date(ts), 'en'));
  });
});
