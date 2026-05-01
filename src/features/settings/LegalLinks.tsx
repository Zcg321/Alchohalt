import React from 'react';

/**
 * [SHIP-3.1] Legal links go to in-app /legal/<slug> routes (rendered
 * by src/features/legal/LegalDocPage.tsx from the canonical
 * docs/legal/*.md sources). Vercel deployment serves these as part of
 * the same PWA build, so the privacy-policy URL the App Store + Play
 * Store submissions reference is the same origin as the app itself.
 *
 * Pre-fix these pointed at /docs/legal/PRIVACY_POLICY.md raw paths,
 * which only worked if docs/ was published as static assets — it
 * wasn't.
 */
const LINKS: Array<{ slug: string; label: string }> = [
  { slug: 'privacy-policy', label: 'Privacy Policy' },
  { slug: 'consumer-health-data', label: 'Consumer Health Data Privacy Policy (WA / NV / CO / CT)' },
  { slug: 'terms-of-service', label: 'Terms of Service' },
  { slug: 'eula', label: 'End User License Agreement' },
  { slug: 'subscription-terms', label: 'Subscription Terms' },
];

export default function LegalLinks() {
  return (
    <section className="card">
      <div className="card-content">
        <h2 className="text-base font-semibold tracking-tight mb-3">Legal</h2>
        <ul className="space-y-1.5 text-sm">
          {LINKS.map((l) => (
            <li key={l.slug}>
              <a
                className="underline underline-offset-2 hover:text-primary-700 dark:hover:text-primary-300"
                href={`/legal/${l.slug}`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-500">
          Your logs stay on your device by default. Opt-in AI features can change this — see Settings → AI. Not medical advice.
        </p>
      </div>
    </section>
  );
}
