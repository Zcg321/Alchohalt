/**
 * [R28-2] Marketing screenshot captions — content + render shape.
 *
 * The captions module lives under tools/marketing/ since it is only
 * executed by Playwright. Tests live here so vitest picks them up
 * via the standard test glob (src/<dir>/__tests__/).
 */
import { describe, it, expect } from 'vitest';
import {
  CAPTIONS,
  buildCaptionInjectScript,
  captionFor,
} from '../../tools/marketing/captions';

describe('[R28-2] screenshot captions', () => {
  it('defines exactly the five marketing surfaces', () => {
    const surfaces = CAPTIONS.map((c) => c.surface);
    expect(surfaces).toEqual(['today', 'track', 'goals', 'insights', 'crisis']);
  });

  it('every caption is at most 8 words (per voice rule)', () => {
    for (const c of CAPTIONS) {
      const wordCount = c.text.trim().split(/\s+/).length;
      expect(wordCount, `${c.surface}: "${c.text}"`).toBeLessThanOrEqual(8);
    }
  });

  it('every caption ends with a period (full-sentence rule)', () => {
    for (const c of CAPTIONS) {
      expect(c.text.endsWith('.'), `${c.surface}: "${c.text}"`).toBe(true);
    }
  });

  it('every caption has a non-empty rationale', () => {
    for (const c of CAPTIONS) {
      expect(c.rationale.trim().length).toBeGreaterThan(20);
    }
  });

  it('captionFor returns the right caption per surface', () => {
    for (const c of CAPTIONS) {
      expect(captionFor(c.surface).text).toBe(c.text);
    }
  });

  it('captionFor throws for an unknown surface', () => {
    expect(() => captionFor('unknown' as never)).toThrow();
  });

  it('buildCaptionInjectScript escapes the text safely', () => {
    const malicious = `</style><script>alert(1)</script>`;
    const script = buildCaptionInjectScript(malicious, 'light');
    // The text is JSON-stringified into a textContent assignment, so
    // the raw < > chars survive but they go into textContent (not
    // innerHTML) — so the </script> end tag must NOT be present in the
    // generated script outside the JSON string literal.
    // JSON.stringify escapes the slash form to "<\/script>" via the
    // standard JSON escaper for forward slash safety. Verify that:
    expect(script).not.toContain('</script>');
    expect(script).toContain('<\\/script>');
  });

  it('buildCaptionInjectScript uses theme-appropriate colors', () => {
    const lightScript = buildCaptionInjectScript('hi', 'light');
    const darkScript = buildCaptionInjectScript('hi', 'dark');
    expect(lightScript).toContain('rgba(255, 255, 255, 0.96)');
    expect(darkScript).toContain('rgba(15, 18, 22, 0.96)');
  });

  it('buildCaptionInjectScript pins overlay top + high z-index', () => {
    const script = buildCaptionInjectScript('hi', 'light');
    expect(script).toContain('position:fixed');
    expect(script).toContain('top:0');
    expect(script).toContain('z-index:999999');
    // Pointer-events must be none so the caption never blocks taps
    // in screenshots that surface modal content underneath.
    expect(script).toContain('pointer-events:none');
  });

  it('buildCaptionInjectScript removes a previous overlay before adding a new one (idempotent)', () => {
    const script = buildCaptionInjectScript('hi', 'light');
    expect(script).toContain("getElementById('__r28_caption')");
    expect(script).toContain('existing.remove()');
  });
});
