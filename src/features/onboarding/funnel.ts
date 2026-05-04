import type { OnboardingDiagnostics } from '../../store/db';

/**
 * [R11-1] On-device onboarding funnel.
 *
 * Aggregates the active diagnostics row plus the history of revisions
 * into per-step counts so the owner can see, on-device, where users
 * (or self-experimenters) are dropping out of the three-beat flow.
 *
 * NEVER TRANSMITTED. This is rendered from local state only — the
 * point is to give the owner a way to iterate on onboarding without
 * shipping any analytics. Even console.debug is avoided here.
 */

export interface FunnelStepStat {
  step: 0 | 1 | 2;
  /** Label for the beat (intro/intent, track-style, ready). */
  label: string;
  /** How many attempts reached this step. */
  reached: number;
  /** How many attempts dropped out at this exact step (without advancing). */
  droppedHere: number;
  /** Per-skip-path breakdown of drops at this step. */
  byPath: Partial<Record<NonNullable<OnboardingDiagnostics['skipPath']>, number>>;
}

export interface OnboardingFunnel {
  totalAttempts: number;
  totalCompleted: number;
  totalSkipped: number;
  /** Completion rate as 0..1, or null if no attempts yet. */
  completionRate: number | null;
  steps: [FunnelStepStat, FunnelStepStat, FunnelStepStat];
  /**
   * [R25-2] Intent distribution across all attempts (current + history).
   * 'undecided' counts the R23-C "Decide later" tertiary chip taps.
   * `none` covers attempts that skipped before any chip was tapped.
   */
  intentCounts: {
    'cut-back': number;
    quit: number;
    curious: number;
    undecided: number;
    none: number;
  };
}

const STEP_LABELS = ['Beat 1: intro / intent', 'Beat 2: track style', 'Beat 3: ready'];

/**
 * Combine the live row + history of past attempts into a single list
 * of attempt records. Each row in `onboardingDiagnosticsHistory`
 * represents a previous attempt (because the user revised their
 * intent later — see R10-C). The current `onboardingDiagnostics` is
 * the latest attempt.
 */
function collectAttempts(
  current: OnboardingDiagnostics | undefined,
  history: Array<OnboardingDiagnostics & { revisedAt: number }> | undefined,
): OnboardingDiagnostics[] {
  const attempts: OnboardingDiagnostics[] = [];
  if (history) attempts.push(...history);
  if (current && current.status !== 'not-started') attempts.push(current);
  return attempts;
}

export function computeOnboardingFunnel(
  current: OnboardingDiagnostics | undefined,
  history: Array<OnboardingDiagnostics & { revisedAt: number }> | undefined,
): OnboardingFunnel {
  const attempts = collectAttempts(current, history);
  const steps: [FunnelStepStat, FunnelStepStat, FunnelStepStat] = [
    { step: 0, label: STEP_LABELS[0]!, reached: 0, droppedHere: 0, byPath: {} },
    { step: 1, label: STEP_LABELS[1]!, reached: 0, droppedHere: 0, byPath: {} },
    { step: 2, label: STEP_LABELS[2]!, reached: 0, droppedHere: 0, byPath: {} },
  ];

  let totalCompleted = 0;
  let totalSkipped = 0;
  const intentCounts: OnboardingFunnel['intentCounts'] = {
    'cut-back': 0,
    quit: 0,
    curious: 0,
    undecided: 0,
    none: 0,
  };

  for (const a of attempts) {
    // [R25-2] Tally chosen intent across every recorded attempt
    // regardless of whether it was completed or skipped. The R23-C
    // 'undecided' chip records intent='undecided' before advancing,
    // so a skipped-after-undecided attempt still counts toward the
    // undecided bucket.
    if (a.intent === 'cut-back') intentCounts['cut-back']++;
    else if (a.intent === 'quit') intentCounts.quit++;
    else if (a.intent === 'curious') intentCounts.curious++;
    else if (a.intent === 'undecided') intentCounts.undecided++;
    else intentCounts.none++;

    if (a.status === 'completed') {
      // Completed users reached every step.
      steps[0].reached++;
      steps[1].reached++;
      steps[2].reached++;
      totalCompleted++;
      continue;
    }
    if (a.status === 'skipped') {
      totalSkipped++;
      // skipStep tells us where they dropped. If missing (older row
      // before R11-1 wired this), assume step 0 — least-surprising.
      const drop = (a.skipStep ?? 0) as 0 | 1 | 2;
      // They reached every step up to and including the drop.
      for (let s = 0; s <= drop; s++) {
        steps[s]!.reached++;
      }
      const dropStat = steps[drop]!;
      dropStat.droppedHere++;
      if (a.skipPath) {
        dropStat.byPath[a.skipPath] = (dropStat.byPath[a.skipPath] ?? 0) + 1;
      }
    }
  }

  const totalAttempts = totalCompleted + totalSkipped;
  return {
    totalAttempts,
    totalCompleted,
    totalSkipped,
    completionRate: totalAttempts === 0 ? null : totalCompleted / totalAttempts,
    steps,
    intentCounts,
  };
}
