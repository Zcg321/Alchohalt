import React from 'react';
import { useDB } from '../../store/db';
import { useAIConsent } from '../../lib/ai/consent';
import { useSyncStore } from '../../lib/sync/syncStore';
import { isAIRecommendationsEnabled } from '../../config/features';

/**
 * [R7-C] Privacy Status — a "verify this" diagnostic for the privacy
 * claims the rest of the app makes.
 *
 * The app says it's "100% offline" and "your logs stay on this device"
 * — which is true, BUT there are three opt-in features that, when
 * enabled, do talk to a network: AI Insights (Anthropic), Multi-device
 * sync (Supabase), and IAP (RevenueCat). This panel lists each one
 * and shows the current state for THIS device, so a user who wants to
 * confirm that nothing is going out can verify by inspection.
 *
 * The panel does not intercept actual network traffic — that would
 * require a custom fetch wrapper for marginal benefit (browser
 * devtools already show all requests). What it does instead: state
 * what's possible to send, and confirm whether it's currently active.
 *
 * Local AI suggestions appear here too even though they make zero
 * network calls — because the user might reasonably wonder, and the
 * point of this surface is to answer the question.
 */

interface RowProps {
  feature: string;
  description: string;
  active: boolean;
  /** What "active" means for this row — e.g. "your data may be sent". */
  activeMeaning: string;
  /** What "inactive" means — e.g. "no data leaves this device". */
  inactiveMeaning: string;
}

function StatusRow({
  feature,
  description,
  active,
  activeMeaning,
  inactiveMeaning,
}: RowProps) {
  return (
    <li className="flex items-start gap-3 py-3 border-b border-neutral-200/60 last:border-b-0 dark:border-neutral-700/60">
      <span
        aria-hidden
        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
          active ? 'bg-amber-500' : 'bg-success-500'
        }`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {feature}
          </span>
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              active
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-success-700 dark:text-success-400'
            }`}
          >
            {active ? 'Active' : 'Off'}
          </span>
        </div>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          {description}
        </p>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
          {active ? activeMeaning : inactiveMeaning}
        </p>
      </div>
    </li>
  );
}

export default function PrivacyStatus() {
  const settings = useDB((s) => s.db.settings);
  const { isValid: aiInsightsActive } = useAIConsent();
  const syncPhase = useSyncStore((s) => s.phase);
  const syncActive = syncPhase === 'enabled';
  const localAIActive = isAIRecommendationsEnabled(settings.aiRecommendationsOptOut);

  return (
    <section className="card" aria-labelledby="privacy-status-heading">
      <div className="card-header">
        <h2
          id="privacy-status-heading"
          className="text-lg font-semibold tracking-tight"
        >
          Privacy status
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          A snapshot of every feature that might use the network. Off
          means no traffic for that feature; active means it&rsquo;s
          opted-in and may send the data described.
        </p>
      </div>
      <div className="card-content">
        <ul className="space-y-0">
          <StatusRow
            feature="Drink + goal logs"
            description="Your entries — drinks, goals, milestones, presets."
            active={false}
            activeMeaning="(would send entries off-device)"
            inactiveMeaning="Stored only in this device's local storage."
          />
          <StatusRow
            feature="Local AI suggestions"
            description="Pattern-based goal suggestions on the Goals tab."
            active={localAIActive}
            activeMeaning="Runs on this device. No network calls."
            inactiveMeaning="Disabled. No suggestions surface."
          />
          <StatusRow
            feature="AI Insights (Anthropic)"
            description="Optional opt-in. Sends an anonymized pattern summary to Anthropic for written reflections."
            active={aiInsightsActive}
            activeMeaning="An anonymous device ID + pattern summary may be sent on demand. Revoke above."
            inactiveMeaning="No data leaves this device."
          />
          <StatusRow
            feature="Multi-device sync"
            description="Optional opt-in. End-to-end encrypted sync of your entries to your other devices."
            active={syncActive}
            activeMeaning="Encrypted ciphertext is uploaded on a schedule. Server cannot read your data."
            inactiveMeaning="No data leaves this device."
          />
          <StatusRow
            feature="In-app purchases (RevenueCat)"
            description="Active only if you've started a purchase or restore. Talks to App Store / Play Billing + RevenueCat."
            active={false /* this would need an IAPProvider state read; default off in MVP */}
            activeMeaning="Receipt verification calls happen at purchase / restore time only."
            inactiveMeaning="Subscriptions feature disabled in this build."
          />
        </ul>

        <div className="mt-4 rounded-xl bg-neutral-50/80 p-3 text-xs text-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-400">
          <p>
            Want to verify with your eyes? Open your browser&rsquo;s
            developer tools → Network tab → reload the page. With every
            optional feature off, the only requests should be for the
            app&rsquo;s static assets (HTML, JS, CSS, fonts).
          </p>
        </div>
      </div>
    </section>
  );
}
