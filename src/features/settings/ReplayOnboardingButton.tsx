/**
 * [R16-4] Replay-onboarding button for Settings.
 *
 * Onboarding shows once on first install (gated by
 * settings.hasCompletedOnboarding). After life changes — moving from
 * "trying to drink less" to "stepping away" — a user might want to
 * re-run the three-beat intent flow without wiping their data.
 *
 * Pressing Replay flips hasCompletedOnboarding back to false. The
 * existing OnboardingFlow effect picks that up on the next render
 * pass and surfaces the modal again.
 *
 * Side-effect contract:
 *   - DOES flip hasCompletedOnboarding → false.
 *   - DOES NOT touch entries, presets, advancedGoals, settings other
 *     than hasCompletedOnboarding. The R10-C diagnostics history
 *     captures any new intent the user picks; previous diagnostics
 *     stays in onboardingDiagnosticsHistory.
 *
 * Voice: "Replay the intro" — past-tense neutral, doesn't presume the
 * user has changed their mind. The description names a use case
 * ("life changes") so the button isn't mysterious.
 *
 * Confirm step: a single confirm() so the user doesn't fire it by
 * accident from a settings-skim. The cancel path is the implicit
 * "no" — same posture as the wipe-all flow but lower-stakes.
 */
import React from 'react';
import { useDB } from '../../store/db';

interface Props {
  /** Test hook — overrides window.confirm for assertion. */
  confirmFn?: (message: string) => boolean;
}

export default function ReplayOnboardingButton({ confirmFn }: Props) {
  const setSettings = useDB((s) => s.setSettings);
  const hasCompleted = useDB((s) => !!s.db.settings.hasCompletedOnboarding);

  function handleReplay() {
    const ask = confirmFn ?? ((m: string) => window.confirm(m));
    const ok = ask(
      "Replay the three-beat intro? Your entries, goals, and presets stay. Only the intro will show again.",
    );
    if (!ok) return;
    setSettings({ hasCompletedOnboarding: false });
  }

  return (
    <div
      data-testid="replay-onboarding-row"
      className="rounded-2xl border border-border-soft bg-surface-elevated p-card space-y-2"
    >
      <h3 className="text-h4 text-ink">Replay the intro</h3>
      <p className="text-caption text-ink-soft">
        If something has shifted — new intent, new tracking style — you can
        re-run the three-beat intro. None of your data is touched.
      </p>
      <button
        type="button"
        onClick={handleReplay}
        disabled={!hasCompleted}
        data-testid="replay-onboarding-button"
        className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-cream-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-charcoal-700"
      >
        Replay onboarding
      </button>
      {!hasCompleted ? (
        <p className="text-caption text-ink-subtle" data-testid="replay-onboarding-hint">
          You haven&apos;t completed the intro yet — it&apos;ll show on next launch.
        </p>
      ) : null}
    </div>
  );
}
