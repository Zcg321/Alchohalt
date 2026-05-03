import React from 'react';
import { DEFAULT_PROVIDERS, recentOpenCount, type CounselorProvider } from './escalation';
import { useLanguage } from '../../i18n';
import { pluralNoun } from '../../i18n/plural';

/**
 * [R10-4] Soft escalation prompt — only renders when the user has
 * opened HardTimePanel 3+ times in 24 hours.
 *
 * Voice rule: gentle, low-pressure. Not "you should get help" —
 * "this option exists if it would help". The user remains in the
 * driver's seat.
 */
interface Props {
  openLog: number[] | undefined;
  providers?: CounselorProvider[];
}

export default function EscalationPrompt({ openLog, providers = DEFAULT_PROVIDERS }: Props) {
  const { t, lang } = useLanguage();
  const count = recentOpenCount(openLog);

  return (
    <section
      role="region"
      aria-labelledby="escalation-heading"
      data-testid="escalation-prompt"
      className="rounded-2xl border border-amber-200 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-900/20 p-4 mb-4"
    >
      <h2 id="escalation-heading" className="text-base font-semibold">
        Talking to someone might help
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        You&rsquo;ve come back here {count} {pluralNoun(t, lang, 'unit.time', count, 'time', 'times')} in the last day.
        That&rsquo;s a lot to carry. If you&rsquo;d like to talk to a counselor — voice, text, or video —
        these are some places to start.
      </p>
      <ul className="mt-3 space-y-2">
        {providers.map((p) => (
          <li key={p.id} className="text-sm">
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`provider-${p.id}`}
              className="font-medium underline underline-offset-2 hover:text-primary-700 dark:hover:text-primary-300"
            >
              {p.label}
              {p.free && (
                <span className="ms-2 px-2 py-0.5 text-xs font-normal rounded-full bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100">
                  free
                </span>
              )}
            </a>
            <p className="text-xs text-ink-soft mt-0.5">{p.description}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-subtle">
        We don&rsquo;t earn anything from these links. They&rsquo;re starting points — you can
        also search for &ldquo;in-person therapist near me&rdquo; or use your insurance
        provider&rsquo;s directory.
      </p>
    </section>
  );
}
