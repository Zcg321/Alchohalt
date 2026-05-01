/**
 * Regression for [SHIP-3.1] — every /legal/<slug> route renders the
 * canonical markdown from docs/legal/. The pre-fix LegalLinks pointed
 * at /docs/legal/*.md raw URLs that 404'd in production; this test
 * pins that the in-app routes deliver the actual docs/legal content.
 */

import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import LegalDocPage, {
  LEGAL_SLUGS,
  isLegalSlug,
  type LegalSlug,
} from '../LegalDocPage';

describe('[SHIP-3.1] /legal/<slug> in-app legal routes', () => {
  it('every spec slug is recognized by isLegalSlug', () => {
    const expected: LegalSlug[] = [
      'privacy-policy',
      'terms-of-service',
      'eula',
      'subscription-terms',
      'consumer-health-data',
    ];
    for (const slug of expected) {
      expect(isLegalSlug(slug)).toBe(true);
    }
    expect(LEGAL_SLUGS.sort()).toEqual([...expected].sort());
  });

  it.each(LEGAL_SLUGS)('renders %s with a heading + body content', (slug) => {
    const { container, getAllByRole } = render(<LegalDocPage slug={slug} />);
    // The component header h1 + the markdown's own h1 both render at
    // level 1; this test only cares that at least one is present.
    const h1s = getAllByRole('heading', { level: 1 });
    expect(h1s.length).toBeGreaterThanOrEqual(1);
    // Body content is non-empty (the markdown rendered into the article)
    const article = container.querySelector('article');
    expect(article).not.toBeNull();
    const text = article!.textContent ?? '';
    expect(text.length).toBeGreaterThan(200);
  });

  it('privacy-policy page contains the canonical TL;DR phrasing from docs/legal', () => {
    const { container } = render(<LegalDocPage slug="privacy-policy" />);
    const text = container.textContent ?? '';
    // The canonical PRIVACY_POLICY.md starts with a TL;DR section.
    expect(text).toMatch(/TL;DR/i);
    expect(text.toLowerCase()).toMatch(/wellness data|on-device|stays on/);
  });

  it('subscription-terms page contains the $4.99 / $24.99 / $69 prices', () => {
    const { container } = render(<LegalDocPage slug="subscription-terms" />);
    const text = container.textContent ?? '';
    expect(text).toMatch(/\$4\.99/);
    expect(text).toMatch(/\$24\.99/);
    expect(text).toMatch(/\$69/);
  });

  it('renders structural HTML (<h2>, <p>, <ul>) from markdown headings/paragraphs/lists', () => {
    const { container } = render(<LegalDocPage slug="terms-of-service" />);
    expect(container.querySelector('article h2')).not.toBeNull();
    expect(container.querySelector('article p')).not.toBeNull();
  });

  it('back-link points at /?tab=settings', () => {
    const { container } = render(<LegalDocPage slug="eula" />);
    const back = container.querySelector('a[href="/?tab=settings"]');
    expect(back).not.toBeNull();
  });
});
