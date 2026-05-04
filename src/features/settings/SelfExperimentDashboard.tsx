import React from 'react';
import Diagnostics from './Diagnostics';
import DiagnosticsAudit from './DiagnosticsAudit';
import OnboardingFunnelView from './OnboardingFunnelView';
import { useLanguage } from '../../i18n';

/**
 * [R21-3] Self-experiment dashboard.
 *
 * Round 9 (Diagnostics card), round 11 (OnboardingFunnelView), and
 * round 13 (DiagnosticsAudit) each landed on-device, telemetry-free
 * surfaces for the owner / power-user to see what the app has
 * measured *about itself*. Round 21 unifies them under a single
 * section header + jump-nav so:
 *
 *   1. The owner doesn't have to scroll through three separate
 *      cards to find each piece — one landing point.
 *   2. The "everything is on-device, nothing leaves" message is
 *      stated once at the top, not three times in three separate
 *      panel headers.
 *   3. Future on-device measurements (e.g., a notification-effectiveness
 *      audit, a backup-verifier history) drop into the same section
 *      without reshuffling SettingsPanel.
 *
 * Sub-sections retain their existing data-testids and behavior; this
 * is purely a structural reorg + intra-section navigation. No data
 * model change.
 *
 * Voice: factual, no marketing language. The header sentence is
 * "Everything the app measures about itself, on this device." —
 * descriptive, not promotional.
 */

interface JumpLinkProps {
  href: string;
  label: string;
}

function JumpLink({ href, label }: JumpLinkProps) {
  return (
    <a
      href={href}
      className="rounded-full border border-border-soft bg-surface-elevated px-3 py-1 text-xs font-medium text-ink-soft hover:bg-surface hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
    >
      {label}
    </a>
  );
}

export default function SelfExperimentDashboard() {
  const { t } = useLanguage();
  return (
    <section
      aria-labelledby="self-experiment-heading"
      className="space-y-4"
      data-testid="self-experiment-dashboard"
    >
      <header className="card">
        <div className="card-content">
          <h2
            id="self-experiment-heading"
            className="text-lg font-semibold tracking-tight"
          >
            {t(
              'selfExperiment.title',
              'What the app measures about itself',
            )}
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            {t(
              'selfExperiment.description',
              'Everything below is on this device. Nothing is sent off-device, no analytics service touches it. The point is to make the app legible to its own user.',
            )}
          </p>
          <nav
            aria-label={t('selfExperiment.jumpNav', 'Dashboard sections')}
            className="mt-3 flex flex-wrap gap-2"
            data-testid="self-experiment-jumpnav"
          >
            <JumpLink
              href="#diagnostics-heading"
              label={t('selfExperiment.jumpDiagnostics', 'Onboarding diagnostics')}
            />
            <JumpLink
              href="#diagnostics-audit-heading"
              label={t('selfExperiment.jumpAudit', 'Settings audit')}
            />
            <JumpLink
              href="#funnel-heading"
              label={t('selfExperiment.jumpFunnel', 'Onboarding funnel')}
            />
          </nav>
        </div>
      </header>
      <Diagnostics />
      <DiagnosticsAudit />
      <OnboardingFunnelView />
    </section>
  );
}
