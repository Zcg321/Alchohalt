/**
 * [R26-1] Real-time per-surface satisfaction signal.
 *
 * Round 24 added a 30-day NPS pulse — useful for trend, slow to
 * surface a concrete "this surface is broken" signal. R26-1 adds an
 * immediate-after-action thumb up/down on each surface (only after
 * the user has actually used it once), aggregated on-device. Owner
 * visibility lives in DiagnosticsAudit.
 *
 * Voice rule: factual, no emoji, no "we'd love your feedback." The
 * micro-form reads "Was this helpful?" with two buttons — thumb up
 * and thumb down. A user who taps either gets a one-shot "Thanks.
 * Stays on this device." confirmation and the chip never re-mounts
 * for that surface for the next 14 days.
 *
 * Why per-surface and not global: a thumb-down on the Insights tab
 * tells a different story than a thumb-down on the Drink Form. The
 * owner needs the granularity to know what to fix.
 *
 * Storage shape: a flat list of records in
 * settings.satisfactionSignals[]. Each record carries the surface
 * key, the response (up/down), and the timestamp. We don't aggregate
 * server-side because there is no server — DiagnosticsAudit reads
 * the list and computes per-surface counts at render time. The
 * store stays simple.
 */

export type SatisfactionResponse = 'up' | 'down';

/**
 * The surfaces we currently allow signals from. Adding a new surface
 * key requires adding it here (not magic strings) so DiagnosticsAudit
 * can render every known surface even if it has zero responses, and
 * so a typo in a host doesn't silently create an orphan bucket.
 */
export type SatisfactionSurface =
  | 'insights-tab'
  | 'drink-form'
  | 'hard-time-panel'
  | 'today-panel'
  | 'settings-privacy'
  | 'onboarding-intent';

export const SATISFACTION_SURFACES: ReadonlyArray<SatisfactionSurface> = [
  'insights-tab',
  'drink-form',
  'hard-time-panel',
  'today-panel',
  'settings-privacy',
  'onboarding-intent',
];

export interface SatisfactionSignal {
  surface: SatisfactionSurface;
  response: SatisfactionResponse;
  ts: number;
}

/**
 * 14-day suppression window after a response (or dismissal). Long
 * enough that a satisfied user isn't re-prompted on every visit;
 * short enough that an experience that flips from good→bad gets
 * a fresh signal within a fortnight.
 */
export const SATISFACTION_SUPPRESS_MS = 14 * 24 * 60 * 60 * 1000;

interface ShouldShowInputs {
  surface: SatisfactionSurface;
  signals: SatisfactionSignal[] | undefined;
  /** Per-surface "user has actually used the surface" timestamp from
   *  somewhere outside this module — we don't fabricate one. */
  surfaceUsedTs: number | undefined;
  now: number;
}

/**
 * Pure gate: the chip surfaces only after the user has actually
 * interacted with the surface (caller passes `surfaceUsedTs`), and
 * only if there is no recent signal/dismissal for that surface.
 *
 * No floor on first-use because the value is per-surface, not
 * per-account — a user who's been here for a year gives a useful
 * signal on a fresh surface they just opened the first time.
 */
export function shouldShowSatisfactionChip(inputs: ShouldShowInputs): boolean {
  const { surface, signals, surfaceUsedTs, now } = inputs;
  if (surfaceUsedTs === undefined) return false;
  const recent = (signals ?? [])
    .filter((s) => s.surface === surface)
    .map((s) => s.ts);
  if (recent.length === 0) return true;
  const lastTs = Math.max(...recent);
  return now - lastTs >= SATISFACTION_SUPPRESS_MS;
}

export interface SurfaceTally {
  surface: SatisfactionSurface;
  up: number;
  down: number;
}

/**
 * Aggregate per-surface up/down counts. Pure; safe to call on every
 * render of DiagnosticsAudit.
 */
export function summarizeSatisfaction(
  signals: SatisfactionSignal[] | undefined,
): SurfaceTally[] {
  return SATISFACTION_SURFACES.map<SurfaceTally>((surface) => {
    const forSurface = (signals ?? []).filter((s) => s.surface === surface);
    return {
      surface,
      up: forSurface.filter((s) => s.response === 'up').length,
      down: forSurface.filter((s) => s.response === 'down').length,
    };
  });
}

/**
 * Total responses across all surfaces. Used by DiagnosticsAudit to
 * decide whether to render the section at all (zero responses → hide
 * the row entirely so owners don't see an empty placeholder).
 */
export function totalSatisfactionCount(
  signals: SatisfactionSignal[] | undefined,
): number {
  return (signals ?? []).length;
}

/**
 * [R27-1] Per-surface "sentiment" — up / (up + down) when there is
 * at least 1 response, undefined when there are no responses. Used
 * by the satisfaction dashboard to render a percentage and a
 * traffic-light indicator. Pure; safe to call on every render.
 *
 * We deliberately do NOT extrapolate from zero responses: a surface
 * with 0 signals reports as `unrated`, not "100% up" or "0% up". The
 * dashboard renders this state distinctly so the owner can tell
 * "nobody used this surface yet" from "everyone is unhappy."
 */
export type SurfaceSentiment =
  | { surface: SatisfactionSurface; rated: false; up: 0; down: 0 }
  | {
      surface: SatisfactionSurface;
      rated: true;
      up: number;
      down: number;
      total: number;
      /** Percent of responses that were thumb-up. 0..100, integer. */
      positivePct: number;
      /** Quick 3-bucket categorization for the traffic-light view. */
      mood: 'good' | 'mixed' | 'concerning';
    };

export function surfaceSentiments(
  signals: SatisfactionSignal[] | undefined,
): SurfaceSentiment[] {
  return summarizeSatisfaction(signals).map((t) => {
    const total = t.up + t.down;
    if (total === 0) {
      return { surface: t.surface, rated: false, up: 0, down: 0 };
    }
    const positivePct = Math.round((t.up / total) * 100);
    const mood: 'good' | 'mixed' | 'concerning' =
      positivePct >= 80 ? 'good' : positivePct >= 50 ? 'mixed' : 'concerning';
    return { surface: t.surface, rated: true, up: t.up, down: t.down, total, positivePct, mood };
  });
}

/**
 * [R27-1] Human-readable label for a surface key. Used by the
 * dashboard so the owner sees "Today panel" rather than "today-panel".
 * Deliberately not localized via the t() function — this view is
 * owner-facing diagnostics, and the surface keys themselves are
 * English identifiers in the codebase.
 */
export function surfaceDisplayLabel(surface: SatisfactionSurface): string {
  switch (surface) {
    case 'insights-tab': return 'Insights tab';
    case 'drink-form': return 'Drink form';
    case 'hard-time-panel': return 'Hard-time panel';
    case 'today-panel': return 'Today panel';
    case 'settings-privacy': return 'Settings → Privacy';
    case 'onboarding-intent': return 'Onboarding (intent beat)';
  }
}
