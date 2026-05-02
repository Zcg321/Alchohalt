/**
 * Lightweight slug-validation module — split from LegalDocPage so the
 * route resolver in AlcoholCoachApp can statically import the type +
 * predicate without dragging in marked + 5 markdown files. The page
 * component itself is loaded lazily on the /legal/<slug> deep-link.
 */

export type LegalSlug =
  | 'privacy-policy'
  | 'terms-of-service'
  | 'eula'
  | 'subscription-terms'
  | 'consumer-health-data';

export const LEGAL_SLUGS: LegalSlug[] = [
  'privacy-policy',
  'terms-of-service',
  'eula',
  'subscription-terms',
  'consumer-health-data',
];

export function isLegalSlug(s: string): s is LegalSlug {
  return (LEGAL_SLUGS as string[]).includes(s);
}
