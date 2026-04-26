import React from 'react';
import {
  describeForbiddenShape,
  describeSanitizedShape,
} from '../../lib/ai/sanitize';
import { useAIConsent } from '../../lib/ai/consent';

/**
 * Consent gate for AI Insights. Owner-locked spec:
 *
 *   "Surface a consent screen with:
 *    - Plain-language description of what data will be sent
 *    - Provider name + link to provider privacy policy + retention
 *    - Toggle to enable / disable AI features at any time
 *    - Confirm checkbox + explicit 'I understand' affirmation"
 *
 * This is a controlled inline panel — used both in onboarding (when
 * the user first enters the AI Insights tile) and in Settings → AI.
 */

interface Props {
  /** Called after the user grants consent and clicks Enable. */
  onGranted?: () => void;
  /** Called if the user explicitly declines. Closes the panel. */
  onDeclined?: () => void;
  /** Already-rendered above the form? Suppress the heading. */
  hideHeading?: boolean;
}

export default function AIInsightsConsent({
  onGranted,
  onDeclined,
  hideHeading = false,
}: Props) {
  const [understood, setUnderstood] = React.useState(false);
  const { grant } = useAIConsent();

  function handleEnable() {
    if (!understood) return;
    grant('anthropic');
    onGranted?.();
  }

  return (
    <div className="space-y-5">
      {!hideHeading && (
        <header>
          <h3 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            Enable AI Insights
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            AI Insights uses an anonymized summary of your patterns to
            generate written reflections. Your raw data — journal text,
            notes, exact times — never leaves your device. Read what
            does and does NOT get sent below.
          </p>
        </header>
      )}

      {/* Two-column "what we send / what we never send" — high
          information density without legal-doc paralysis. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-success-200/70 bg-success-50/50 p-4 dark:border-success-900/50 dark:bg-success-950/20">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-success-700 dark:text-success-300">
            What we send
          </div>
          <pre className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 font-sans">
            {describeSanitizedShape()}
          </pre>
        </div>
        <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/60 p-4 dark:border-neutral-700/60 dark:bg-neutral-900/40">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-600 dark:text-neutral-400">
            What we never send
          </div>
          <pre className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 font-sans">
            {describeForbiddenShape()}
          </pre>
        </div>
      </div>

      {/* Provider info — no marketing fluff, just the facts the user
          needs to make a decision. */}
      <div className="rounded-xl border border-primary-200/60 bg-primary-50/40 p-4 dark:border-primary-900/40 dark:bg-primary-950/20">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-700 dark:text-primary-300">
          Provider
        </div>
        <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          Anthropic (Claude). Anthropic does not train on customer
          data and retains prompts for up to 30 days for abuse
          detection only.{' '}
          <a
            href="https://www.anthropic.com/legal/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-primary-700 dark:hover:text-primary-300"
          >
            Anthropic Privacy Policy →
          </a>
        </p>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          Requests are routed through a server-side proxy that holds
          our API key — Alchohalt itself does not embed any AI provider
          credential in the app bundle.
        </p>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-neutral-200/70 bg-white p-4 dark:border-neutral-700/60 dark:bg-neutral-800/60 cursor-pointer">
        <input
          type="checkbox"
          checked={understood}
          onChange={(e) => setUnderstood(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-900"
        />
        <span className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          <strong>I understand</strong> that AI Insights sends an
          anonymized summary of my drink patterns, mood tags, HALT
          counts, and streak length to Anthropic via a server proxy —
          and that I can revoke this consent any time in Settings → AI.
        </span>
      </label>

      <div className="flex flex-wrap justify-end gap-3">
        {onDeclined ? (
          <button
            type="button"
            onClick={onDeclined}
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:text-neutral-300 dark:hover:bg-neutral-800 min-h-[44px]"
          >
            Not now
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleEnable}
          disabled={!understood}
          className="inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 min-h-[44px]"
        >
          Enable AI Insights
        </button>
      </div>
    </div>
  );
}
