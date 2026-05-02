import React, { useState } from 'react';
import { useAIConsent } from '../../lib/ai/consent';
import AIInsightsConsent from './AIInsightsConsent';
import { useLanguage } from '../../i18n';
import { formatDate } from '../../lib/format';
import { useDB } from '../../store/db';
import { hapticForEvent } from '../../shared/haptics';

/**
 * Settings → AI panel.
 *
 * Three states:
 *   - No consent yet → shows "Off" with an Enable button that
 *     reveals the inline AIInsightsConsent flow.
 *   - Consent granted → shows "On" with the consented timestamp,
 *     instance ID excerpt, provider, and a Revoke button.
 *   - Consent revoked previously → same as no-consent, but copy
 *     mentions the prior revoke for transparency.
 */

export default function AISettingsPanel() {
  const { lang } = useLanguage();
  const { consent, isValid, revoke } = useAIConsent();
  const [showConsent, setShowConsent] = useState(false);
  /* [R7-A4] Local AI suggestions opt-out. Default value undefined →
   * resolves to "on" via isAIRecommendationsEnabled(). Toggling the
   * checkbox writes db.settings.aiRecommendationsOptOut, which the
   * GoalRecommendations component reads to gate its render. */
  const { aiOptOut, setAIOptOut } = useDB((s) => ({
    aiOptOut: s.db.settings.aiRecommendationsOptOut === true,
    setAIOptOut: (v: boolean) =>
      s.setSettings({ aiRecommendationsOptOut: v }),
  }));

  const grantedDate = consent.grantedAt
    ? formatDate(consent.grantedAt, lang)
    : null;
  const revokedDate = consent.revokedAt
    ? formatDate(consent.revokedAt, lang)
    : null;

  return (
    <section
      aria-labelledby="ai-settings-heading"
      className="card"
      data-testid="ai-settings-panel"
    >
      <div className="card-content space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h3
              id="ai-settings-heading"
              className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
            >
              AI Insights
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              Optional, opt-in feature that sends an anonymized summary
              of your patterns to Anthropic for written reflections.
              Off by default — your raw data never leaves the phone
              unless you turn this on.
            </p>
          </div>
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
              isValid
                ? 'bg-success-100 text-success-700 dark:bg-success-950/40 dark:text-success-300'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
            }`}
          >
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${
                isValid ? 'bg-success-500' : 'bg-neutral-400'
              }`}
            />
            {isValid ? 'On' : 'Off'}
          </span>
        </div>

        {isValid ? (
          <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/60 p-4 text-xs text-neutral-600 dark:border-neutral-700/60 dark:bg-neutral-900/40 dark:text-neutral-400 space-y-1.5">
            <div>
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                Provider:
              </span>{' '}
              {consent.provider}
            </div>
            {grantedDate ? (
              <div>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  Consent granted:
                </span>{' '}
                {grantedDate}
              </div>
            ) : null}
            <div>
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                Anonymous device ID:
              </span>{' '}
              <span className="font-mono">
                {consent.instanceId.slice(0, 8)}…
              </span>{' '}
              <span className="text-neutral-500">(rotates if you revoke)</span>
            </div>
          </div>
        ) : null}

        {!isValid && revokedDate ? (
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            Last revoked: {revokedDate}. Re-enabling generates a fresh
            anonymous device ID.
          </p>
        ) : null}

        {showConsent && !isValid ? (
          <div className="rounded-xl border border-primary-200/60 bg-white p-5 dark:border-primary-900/40 dark:bg-neutral-900">
            <AIInsightsConsent
              onGranted={() => setShowConsent(false)}
              onDeclined={() => setShowConsent(false)}
              hideHeading={false}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap justify-between gap-3">
          {isValid ? (
            <button
              type="button"
              onClick={() => revoke()}
              className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 min-h-[44px]"
            >
              Revoke consent
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowConsent((s) => !s)}
              className="inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 min-h-[44px]"
            >
              {showConsent ? 'Cancel' : 'Enable AI Insights'}
            </button>
          )}

          <a
            href="/docs/legal/CONSUMER_HEALTH_DATA_POLICY.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 underline underline-offset-2"
          >
            WA Consumer Health Data Privacy Policy →
          </a>
        </div>

        {/*
         * [R7-A4] Local AI suggestions toggle. The recommender runs on
         * device, with no network calls — it's heuristic pattern math,
         * not an LLM. The privacy contract is therefore weaker than
         * AI Insights (which sends data) and the default is on. The
         * toggle below honors the same "you decide" posture: one click
         * to opt out, no questions asked.
         */}
        <div className="border-t border-neutral-200/70 pt-4 dark:border-neutral-700/60">
          <label className="flex items-start justify-between gap-3 cursor-pointer">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Local AI suggestions
              </p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Pattern-based goal suggestions on the Goals tab. Runs
                on this device — no data leaves your phone. On by
                default; turn off if you&rsquo;d rather set goals
                yourself.
              </p>
            </div>
            <input
              type="checkbox"
              role="switch"
              aria-label="Local AI suggestions"
              checked={!aiOptOut}
              onChange={(e) => {
                setAIOptOut(!e.target.checked);
                hapticForEvent('settings-toggle');
              }}
              className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-2"
            />
          </label>
        </div>
      </div>
    </section>
  );
}
