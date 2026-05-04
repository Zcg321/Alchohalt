/**
 * [R14-4] React hook for reading the current variant of an experiment.
 *
 * Usage (when an experiment is active):
 *
 *   const variant = useExperiment('onboarding-tone-2026Q3');
 *   if (variant === 'crisp') return <CrispCopy />;
 *   return <WarmCopy />; // variant === 'warm' OR null (control)
 *
 * Returns:
 *   - the assigned variant string when the experiment is registered
 *     with status 'active'
 *   - null when the experiment doesn't exist, is in 'draft' or
 *     'archived' status, or when the env can't read localStorage
 *
 * Side effects: when a variant is returned for the first time per
 * mount, an exposure is recorded to localStorage. The hook will not
 * re-record on re-renders.
 */
import { useEffect, useMemo } from 'react';
import { findExperiment } from './registry';
import { assignVariant, getDeviceBucket, recordExposure } from './bucket';
import { useDB } from '../../store/db';

export function useExperiment(key: string): string | null {
  /* [R28-B] Runtime-archive override: if the owner has tapped
   * "Archive losers" for this key in DiagnosticsAudit, treat the
   * experiment as archived even when registry says active. The
   * consumer falls back to its production default branch. */
  const archivedKeys = useDB((s) => s.db.settings.archivedExperimentKeys);
  const isRuntimeArchived = (archivedKeys ?? []).includes(key);

  const variant = useMemo(() => {
    if (isRuntimeArchived) return null;
    const experiment = findExperiment(key);
    if (!experiment || experiment.status !== 'active') return null;
    try {
      const bucket = getDeviceBucket();
      return assignVariant(experiment, bucket);
    } catch {
      // Misconfigured experiment (e.g. bad weights). Return null so
      // the consumer falls back to its control branch instead of
      // crashing the render.
      return null;
    }
  }, [key, isRuntimeArchived]);

  useEffect(() => {
    if (variant !== null) recordExposure(key, variant);
  }, [key, variant]);

  return variant;
}
