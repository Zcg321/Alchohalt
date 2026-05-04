/**
 * [R28-1] In-app Help / FAQ surface.
 *
 * Why this exists
 * ---------------
 * Round-27 investor judge + ex-competitor judge both flagged the
 * same gap: a curious user who has a question right now has only
 * two paths — read the App Store description (off-app) or the
 * contact form (delayed). R28-1 closes that loop with an in-app,
 * searchable FAQ that lives in Settings.
 *
 * Design constraints
 * ------------------
 *   - 10 most-likely questions only. Bigger lists go un-skimmed.
 *   - Plain-text answers, no marketing voice.
 *   - Each answer links to the Settings anchor (or a stable
 *     external URL for legal docs) where the user can act.
 *   - Searchable client-side; case-insensitive substring match
 *     across both question and answer text.
 *   - Localized via the standard t() shim. Every string has an
 *     English fallback so the surface is never blank.
 *   - On-device only — no telemetry on which questions get tapped.
 *
 * The 10 questions were picked from:
 *   - audit-walkthrough/round-26-ex-competitor-judge.md (gaps
 *     ex-Reframe / ex-Sunnyside users would hit)
 *   - audit-walkthrough/round-22-65yo-non-tech-judge.md (jargon
 *     gaps — "what's a standard drink", "what does end-to-end mean")
 *   - audit-walkthrough/round-19-security-researcher-judge.md (the
 *     security-conscious user's first three questions)
 *   - launch/LISTING_NOTES.md (App Store reviewer Q&A)
 */

import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n';

interface FaqEntry {
  /** Stable id for testid + url-fragment + i18n key prefix. */
  id: string;
  /** English-fallback question text. */
  question: string;
  /** English-fallback answer body. May contain plain text only. */
  answer: string;
  /**
   * Optional in-page anchor to deep-link the user to the relevant
   * action (typically a Settings section heading, but can be a
   * Diagnostics surface anchor too).
   */
  link?: { href: string; label: string };
}

const FAQS: ReadonlyArray<FaqEntry> = [
  {
    id: 'delete-my-data',
    question: 'How do I delete all my data?',
    answer:
      'Settings → Privacy and Data → Reset preferences and data. The wipe is local; your data lives only on this device, so deleting it on the device deletes it everywhere. There is no server-side copy unless you have explicitly enabled Sync.',
    link: { href: '#privacy-and-data-heading', label: 'Open Privacy and Data' },
  },
  {
    id: 'standard-drink',
    question: 'What is a "standard drink"?',
    answer:
      'A standard drink is the unit the app uses to compare drinks of different sizes and strengths. The exact size depends on your country (US: 14g pure alcohol; UK: 8g; AU: 10g). Settings → About has the full table with the source for each jurisdiction.',
    link: { href: '#about-heading', label: 'Open About' },
  },
  {
    id: 'end-to-end',
    question: 'What does "end-to-end encrypted" mean for the backup?',
    answer:
      'It means the backup file is encrypted on this device with a passphrase you choose, and the passphrase never leaves the device. Anyone who intercepts the backup file (including us, the cloud you store it in, or a thief who steals your device) cannot read it without that passphrase.',
    link: { href: '#privacy-and-data-heading', label: 'Open Privacy and Data' },
  },
  {
    id: 'export-my-data',
    question: 'How do I export my drink history?',
    answer:
      'Settings → Privacy and Data → Export. You can choose CSV (spreadsheet-readable), JSON (full structured backup), or the encrypted backup file (.alch-backup). Export works fully offline.',
    link: { href: '#privacy-and-data-heading', label: 'Open Privacy and Data' },
  },
  {
    id: 'lost-phone',
    question: 'What if I lose my phone?',
    answer:
      'Your data lives on the device, so a lost phone means lost data — unless you previously made an encrypted backup file (Settings → Privacy and Data → Export → Encrypted backup) and stored it somewhere you can still reach (email to yourself, cloud drive, etc.). On the new phone: install the app, then Settings → Privacy and Data → Import the backup file with your passphrase.',
    link: { href: '#privacy-and-data-heading', label: 'Open Privacy and Data' },
  },
  {
    id: 'differs-from-reframe',
    question: 'How is this different from Reframe / Sunnyside / Drinkaware?',
    answer:
      'Three differences. (1) No third-party analytics — we ship no Segment, Amplitude, Mixpanel, or similar. The Settings → Diagnostics → Audit panel shows what data lives on your device. (2) Local-first — nothing transits servers unless you enable Sync. (3) Verifiable — Settings → About → Trust Receipt lets you hash the build and confirm offline that the binary on your phone matches the audit you are reading.',
    link: { href: '#about-heading', label: 'Open About → Trust Receipt' },
  },
  {
    id: 'data-sold',
    question: 'Can my data be sold or shared with anyone?',
    answer:
      'No. The app does not transmit your data to any server we operate, except the optional Sync feature which transmits encrypted ciphertext only. There is no advertising SDK, no analytics SDK, and no email-capture before value-delivery. Settings → Privacy and Data → Privacy status shows what is currently enabled.',
    link: { href: '#privacy-and-data-heading', label: 'Open Privacy status' },
  },
  {
    id: 'works-offline',
    question: 'Does the app work offline?',
    answer:
      'Yes. Logging drinks, viewing history, setting goals, journaling, exporting data, and reviewing trust documents all work offline. The only feature that needs a network is Sync (optional) and the AI weekly-insights feature (optional). The first launch needs a network to download the app code; subsequent launches work without one.',
    link: { href: '#about-heading', label: 'Open About' },
  },
  {
    /* [R28-5 marketing-director judge follow-up C3] Crisis-support
     * is the single biggest moat in the listing description; it
     * deserves its own discoverable answer in Help. */
    id: 'crisis-support',
    question: 'How do I find crisis support if I need it right now?',
    answer:
      'The "Need help?" pill in the header is on every screen. Tap it for a 1-minute breathing timer plus direct dial to 988 (US Suicide & Crisis Lifeline), Crisis Text Line, and SAMHSA. Region packs cover US, UK, AU, CA, and IE; if your country is not covered, you can paste a local hotline in Settings. Crisis resources are never paid, never gated, and work fully offline.',
  },
  {
    id: 'set-a-goal',
    question: 'How do I set a daily or weekly goal?',
    answer:
      'Goals tab (bottom nav) → set a daily standard-drink target, a weekly target, or both. The home screen shows your current week against the goal. Goals are local; nothing about your goal is shared.',
  },
  {
    id: 'no-analytics',
    question: 'Why no analytics? How do you know what to improve?',
    answer:
      'On-device only. Settings → Diagnostics shows the same surfaces you would see if we sent telemetry — onboarding funnel, satisfaction signal per surface, A/B exposure tally — but the data lives on your device. The owner reviews aggregate trends from a sample of users who export their diagnostics voluntarily. The trade-off: less data, more user trust.',
    link: { href: '#privacy-and-data-heading', label: 'Open Diagnostics' },
  },
] as const;

function highlightMatch(text: string, query: string): string {
  if (!query) return text;
  return text;
}

function FaqItem({ faq, query }: { faq: FaqEntry; query: string }) {
  const { t } = useLanguage();
  const question = t(`settings.help.faq.${faq.id}.q`, faq.question);
  const answer = t(`settings.help.faq.${faq.id}.a`, faq.answer);
  return (
    <details
      className="rounded-2xl border border-border-soft bg-surface-elevated p-card open:bg-cream-50 open:dark:bg-charcoal-800"
      data-testid={`help-faq-item-${faq.id}`}
    >
      <summary
        className="cursor-pointer text-sm font-medium text-ink"
        data-testid={`help-faq-q-${faq.id}`}
      >
        {highlightMatch(question, query)}
      </summary>
      <div className="mt-2 space-y-2 text-sm text-ink-soft">
        <p data-testid={`help-faq-a-${faq.id}`}>{highlightMatch(answer, query)}</p>
        {faq.link && (
          <a
            href={faq.link.href}
            className="inline-block text-sm font-medium text-primary-700 underline decoration-primary-400 underline-offset-2 hover:decoration-primary-600 dark:text-primary-300"
            data-testid={`help-faq-link-${faq.id}`}
          >
            {t(`settings.help.faq.${faq.id}.link`, faq.link.label)} →
          </a>
        )}
      </div>
    </details>
  );
}

/* [R28-1 fix per Codex review] Search filters against the translated
 * strings the user actually sees. Previously it filtered against the
 * English fallback fields — once locale catalogs added
 * `settings.help.faq.<id>.q` / `.a` entries, a non-English user
 * typing "borrar" would see false "No matches" because the haystack
 * was still English. Resolving via t() per render keeps display +
 * filter in sync. */
function matchesTranslatedQuery(
  faq: FaqEntry,
  query: string,
  resolve: (key: string, fallback: string) => string,
): boolean {
  if (!query) return true;
  const question = resolve(`settings.help.faq.${faq.id}.q`, faq.question);
  const answer = resolve(`settings.help.faq.${faq.id}.a`, faq.answer);
  const haystack = `${question} ${answer}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export default function HelpFaq() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () => FAQS.filter((f) => matchesTranslatedQuery(f, query, t)),
    [query, t],
  );

  return (
    <section
      className="card"
      aria-labelledby="help-heading"
      data-testid="help-faq-section"
    >
      <div className="card-header">
        <h2
          id="help-heading"
          tabIndex={-1}
          className="text-lg font-semibold tracking-tight"
        >
          {t('settings.help.heading', 'Help')}
        </h2>
        <p className="text-sm text-ink-soft mt-1">
          {t(
            'settings.help.intro',
            'Answers to the questions people most often ask. Search or tap a question to expand it.',
          )}
        </p>
      </div>
      <div className="card-content space-y-3">
        <label className="block">
          <span className="sr-only">
            {t('settings.help.searchLabel', 'Search Help')}
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              'settings.help.searchPlaceholder',
              'Search… (e.g. "delete", "export", "encrypted")',
            )}
            className="input w-full"
            data-testid="help-faq-search"
            aria-label={t('settings.help.searchLabel', 'Search Help')}
          />
        </label>
        {filtered.length === 0 ? (
          <p
            className="text-sm text-ink-soft"
            data-testid="help-faq-empty"
          >
            {t(
              'settings.help.noResults',
              'No matches. Try a different word — or tap About below for a longer reference.',
            )}
          </p>
        ) : (
          <ul
            className="space-y-2"
            data-testid="help-faq-list"
          >
            {filtered.map((faq) => (
              <li key={faq.id}>
                <FaqItem faq={faq} query={query} />
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-ink-subtle">
          {t(
            'settings.help.footnote',
            'Still need help? Open About → Contact for the human path.',
          )}
        </p>
      </div>
    </section>
  );
}

/** Exported for tests. */
export const __FAQS = FAQS;
