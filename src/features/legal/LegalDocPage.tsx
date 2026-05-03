/**
 * [SHIP-3.1] Renders a single legal document from docs/legal/*.md as
 * an in-app page at /legal/<slug>. Replaces the GitHub-Pages-on-public-
 * repo path from [SHIP-3] — keeping the source private while still
 * providing the public privacy-policy URL the App Store + Play Store
 * submissions require.
 *
 * The content is the SAME markdown shipped in docs/legal/. The older
 * hardcoded-via-i18n PrivacyPolicy.tsx / TermsOfService.tsx components
 * referenced in earlier comments were retired in [LEGAL-CLARITY-PASS]
 * (round 2 polish) — both were unreachable orphans and only their own
 * smoke tests imported them.
 *
 * Reuse-first: marked is the smallest mainstream md parser; brand
 * styling reuses the prose-* tokens already defined in tailwind/index.css.
 */

import React from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { type LegalSlug } from './slugs';

// Vite's `?raw` suffix imports the file content as a string at build
// time. Pulled into the lazy chunk so the eager bundle stays clean of
// the markdown payload until the user actually visits /legal/<slug>.
import privacyMd from '../../../docs/legal/PRIVACY_POLICY.md?raw';
import termsMd from '../../../docs/legal/TERMS_OF_SERVICE.md?raw';
import eulaMd from '../../../docs/legal/EULA.md?raw';
import subscriptionMd from '../../../docs/legal/SUBSCRIPTION_TERMS.md?raw';
import healthMd from '../../../docs/legal/CONSUMER_HEALTH_DATA_POLICY.md?raw';

export { isLegalSlug, LEGAL_SLUGS, type LegalSlug } from './slugs';

const DOCS: Record<LegalSlug, { title: string; body: string }> = {
  'privacy-policy': { title: 'Privacy Policy', body: privacyMd },
  'terms-of-service': { title: 'Terms of Service', body: termsMd },
  eula: { title: 'End User License Agreement', body: eulaMd },
  'subscription-terms': { title: 'Subscription Terms', body: subscriptionMd },
  'consumer-health-data': { title: 'Consumer Health Data Policy', body: healthMd },
};

interface Props {
  slug: LegalSlug;
}

export default function LegalDocPage({ slug }: Props) {
  const { title, body } = DOCS[slug];
  // marked is configured for GFM by default; we render synchronously
  // since the markdown is bundled, not fetched.
  const rawHtml = marked.parse(body, { async: false }) as string;
  /* [R19-5] Defense-in-depth: even though the markdown source is
   * bundled at build time (not user input), running DOMPurify is
   * cheap and pins us against any future supply-chain compromise of
   * marked or accidental inclusion of an executable string in a legal
   * doc. The cost is one tree walk over a few KB of HTML; runs once
   * per legal page view. */
  const html = DOMPurify.sanitize(rawHtml);
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-3xl px-4 py-section-y-mobile lg:py-section-y-desktop"
    >
      <header className="mb-8">
        <p className="text-caption text-ink-soft">
          <a className="underline-offset-2 hover:underline" href="/?tab=settings">
            ← Back to Settings
          </a>
        </p>
        <h1 className="mt-2 text-h1 text-ink">{title}</h1>
      </header>
      <article
        className="prose prose-sm sm:prose-base dark:prose-invert max-w-none"
        // The markdown source is V1-locked + counsel-reviewed (or in
        // review) and bundled at build time, so this is not arbitrary
        // user input.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </main>
  );
}
