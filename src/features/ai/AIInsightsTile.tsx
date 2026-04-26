import React, { useState } from 'react';
import SoftPaywall from '../../components/SoftPaywall';
import { useAIConsent } from '../../lib/ai/consent';
import { deriveTileState } from '../../lib/ai/client';
import AIInsightsConsent from './AIInsightsConsent';

/**
 * Home-screen surface for AI Insights.
 *
 * State machine:
 *   - Free user → SoftPaywall preview (gated by FeatureKey 'ai_insights')
 *   - Premium user, no consent → "Enable AI Insights" inline consent
 *   - Premium user, consent granted, network flag off (v1 default) →
 *     "Coming soon — consent saved, we'll surface insights in v1.1"
 *   - Premium user, consent + network flag on → live insights tile
 *     (proxy backend required; see docs/ai_architecture.md)
 *
 * The architecture is fully wired today; the network call is the
 * one piece deliberately gated until a backend proxy exists.
 */

export default function AIInsightsTile() {
  const { consent } = useAIConsent();
  const [showInlineConsent, setShowInlineConsent] = useState(false);

  const tileState = deriveTileState(consent, false, null);

  return (
    <SoftPaywall feature="ai_insights" label="AI Insights — premium">
      <div
        className="card card-premium"
        data-testid="ai-insights-tile"
        data-tile-state={tileState}
      >
        <div className="card-content space-y-4">
          <header className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h3 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                AI Insights
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                Opt-in. On-device summary first, then sent to Anthropic
                via a server-side proxy. Your raw data never leaves the
                phone — see{' '}
                <a
                  href="/docs/ai_architecture.md"
                  className="underline underline-offset-2 hover:text-primary-700 dark:hover:text-primary-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  how
                </a>
                .
              </p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-accent-100/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent-800 dark:bg-accent-900/40 dark:text-accent-200">
              {tileState === 'needs-consent'
                ? 'Off'
                : tileState === 'network-disabled'
                  ? 'Coming v1.1'
                  : tileState === 'in-flight'
                    ? 'Loading'
                    : tileState === 'error'
                      ? 'Error'
                      : 'On'}
            </span>
          </header>

          {tileState === 'needs-consent' && !showInlineConsent ? (
            <div className="rounded-xl border border-dashed border-neutral-200/70 bg-neutral-50/60 p-4 text-center dark:border-neutral-700/60 dark:bg-neutral-900/40">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Get plain-language reflections on your patterns —
                week-over-week, mood-tag correlation, day-of-week
                tendencies. Off by default; takes one tap to enable.
              </p>
              <button
                type="button"
                onClick={() => setShowInlineConsent(true)}
                className="mt-3 inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 min-h-[44px]"
              >
                Review &amp; enable
              </button>
            </div>
          ) : null}

          {tileState === 'needs-consent' && showInlineConsent ? (
            <AIInsightsConsent
              onGranted={() => setShowInlineConsent(false)}
              onDeclined={() => setShowInlineConsent(false)}
              hideHeading
            />
          ) : null}

          {tileState === 'network-disabled' ? (
            <div className="rounded-xl border border-accent-200/60 bg-accent-50/40 p-4 text-sm leading-relaxed text-neutral-700 dark:border-accent-900/40 dark:bg-accent-950/20 dark:text-neutral-300">
              Consent is saved. The actual AI call is gated behind a
              server-side proxy that we&apos;ll ship in v1.1 — until
              then, no data is sent. You can revoke any time in
              Settings → AI.
            </div>
          ) : null}

          {tileState === 'ready' ? (
            <div className="rounded-xl border border-primary-200/60 bg-primary-50/40 p-4 text-sm text-neutral-700 dark:border-primary-900/40 dark:bg-primary-950/20 dark:text-neutral-300">
              Tap below to refresh insights.
              <button
                type="button"
                className="mt-3 inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 min-h-[44px]"
                disabled
              >
                Generate insights
              </button>
              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                (Live request UI lands in v1.1 alongside the proxy.)
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </SoftPaywall>
  );
}
