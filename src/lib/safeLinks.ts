/**
 * Sanitizers for tel:/sms:/http(s) anchors.
 *
 * Returning an empty string when input is unsafe lets callers render the
 * <a> with `href=""` (becomes inert) instead of falling through to a
 * `javascript:` or other dangerous scheme.
 */

export function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '';
}

export function smsHref(keyword: string, number: string): string {
  const digits = number.replace(/[^\d]/g, '');
  return digits ? `sms:${digits}?&body=${encodeURIComponent(keyword)}` : '';
}

export function safeHttpUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return '';
    return url;
  } catch {
    return '';
  }
}

/**
 * "Text {keyword} to {number}" string → sms: href.
 * Used by therapy-resources data where the SMS hint is one combined string.
 */
export function smsHrefFromTextString(s: string): string {
  if (!s.startsWith('Text ')) return '';
  const parts = s.replace('Text ', '').split(' to ');
  if (parts.length !== 2) return '';
  return smsHref(parts[0].trim(), parts[1].trim());
}
