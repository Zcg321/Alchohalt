/**
 * [R6-D] Locale-aware date/number formatters.
 *
 * The app's user-facing language lives in db.settings.language ('en' |
 * 'es'). Until this helper landed, every toLocaleDateString() and
 * toLocaleTimeString() call in the codebase passed no locale argument
 * — meaning the browser/WebView default decided the format. On a
 * Spanish-language Capacitor build running in an English-default
 * WebView (or vice versa), dates would render in the wrong language.
 *
 * The functions intentionally accept a Lang directly (not from a hook)
 * so they can be used in pure logic / sync code paths — render code
 * pulls Lang from useLanguage() and passes it in.
 *
 * Intl.NumberFormat is also exposed for the "X std drinks" / "$Y/mo"
 * displays so Spanish locale gets comma decimal separator naturally.
 */

import type { Lang } from '../i18n';

const localeOf = (lang: Lang): string => (lang === 'es' ? 'es-ES' : 'en-US');

export function formatDate(ts: number | Date, lang: Lang, opts?: Intl.DateTimeFormatOptions): string {
  const d = ts instanceof Date ? ts : new Date(ts);
  return d.toLocaleDateString(localeOf(lang), opts);
}

export function formatTime(ts: number | Date, lang: Lang, opts?: Intl.DateTimeFormatOptions): string {
  const d = ts instanceof Date ? ts : new Date(ts);
  return d.toLocaleTimeString(localeOf(lang), opts ?? { hour: 'numeric', minute: '2-digit' });
}

export function formatNumber(n: number, lang: Lang, opts?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(localeOf(lang), opts).format(n);
}

export function formatCurrency(n: number, lang: Lang, currency = 'USD'): string {
  return new Intl.NumberFormat(localeOf(lang), {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

/** "3.5 std" with one fractional digit, locale-aware separator. */
export function formatStdDrinks(n: number, lang: Lang): string {
  return formatNumber(n, lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** Integer percent ("23%"), locale-aware. */
export function formatPercent(n: number, lang: Lang): string {
  return formatNumber(n, lang, { maximumFractionDigits: 0 }) + '%';
}
