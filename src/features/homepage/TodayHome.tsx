/**
 * TodayHome
 * =========
 *
 * Sprint-2A `[IA-1]` home view. Replaces the prior 26-section dump
 * with a calm Today panel + a single drink-log surface revealed on
 * demand by the panel's primary CTA.
 *
 * What lives here (and only here):
 *   - The big calm Day-N hero
 *   - The context-aware primary CTA
 *   - A quiet stats strip (today / 7d / 30d)
 *   - On-demand: the DrinkForm (when user picks "Log a drink")
 *   - On-demand: the EnhancedMoodTracker (when user picks "How are you today?")
 *
 * What MOVED OFF home (delivered as part of `[IA-2]`):
 *   - Drinks Database  → Track tab
 *   - Goals widgets    → Goals tab
 *   - Smart Recs / Streak Milestone / Money / Wellness → Insights tab
 *   - Mood IQ multi-step → Insights tab as a sub-flow
 *
 * What's deprecated (Sprint 2B):
 *   - Community Challenges placeholder (gone for now; full deprecate in `[IA-6]`)
 *   - Levels / Points gamification (gone for now; full strip in `[IA-5]`)
 */

import React, { Suspense, useEffect, useState } from 'react';
import type { Drink, DrinkPreset, Goals } from '../../types/common';
import { Skeleton } from '../../components/ui/Skeleton';
import ErrorBoundary from '../../components/ErrorBoundary';
import TodayPanel from './TodayPanel';
import LongTermActivityRibbon from './LongTermActivityRibbon';
import FirstMonthRibbon from './FirstMonthRibbon';
import { Disclaimer } from '../../components/Disclaimer';
import { useDB } from '../../store/db';

const DrinkForm = React.lazy(() => import('../drinks/DrinkForm'));
const EnhancedMoodTracker = React.lazy(() => import('../mood/EnhancedMoodTracker'));

interface Props {
  drinks: Drink[];
  goals: Goals;
  presets: DrinkPreset[];
  editing: Drink | null;
  onAddDrink: (drink: Drink) => void;
  onSaveDrink: (drink: Drink) => void;
  onCancelEdit: () => void;
  /** Used by the panel "See progress" CTA. */
  onOpenInsights?: (() => void) | undefined;
  /**
   * Tertiary "having a hard time" entry-point that bypasses the normal
   * primary CTA and opens the always-on crisis surface directly. The
   * AppHeader pill is calm-by-design (indigo, "Need help?"); this route
   * is for users who already know they're not okay and want one tap to
   * the resources, not a conversation.
   */
  onRoughNight?: (() => void) | undefined;
}

type Surface = 'panel' | 'log' | 'check-in';

interface LogSectionProps {
  editing: Drink | null;
  presets: DrinkPreset[];
  onSubmit: (drink: Drink) => void;
  onClose: () => void;
}

function LogSection({ editing, presets, onSubmit, onClose }: LogSectionProps) {
  return (
    <section
      aria-labelledby="log-heading"
      className="mx-auto w-full max-w-2xl px-4 pb-section-y-mobile lg:pb-section-y-desktop"
    >
      <div className="rounded-2xl border border-border-soft bg-surface-elevated p-card shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 id="log-heading" className="text-h3 text-ink">
            {editing ? 'Edit drink' : 'Log a drink'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-caption text-ink-soft hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 rounded"
          >
            Close
          </button>
        </div>
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
          <DrinkForm
            onSubmit={onSubmit}
            initial={editing || undefined}
            submitLabel={editing ? 'Save' : 'Add'}
            onCancel={onClose}
            presets={presets}
          />
        </Suspense>
      </div>
    </section>
  );
}

function CheckInSection({ onClose }: { onClose: () => void }) {
  return (
    <section
      aria-labelledby="checkin-heading"
      className="mx-auto w-full max-w-2xl px-4 pb-section-y-mobile lg:pb-section-y-desktop"
    >
      <div className="rounded-2xl border border-border-soft bg-surface-elevated p-card shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 id="checkin-heading" className="text-h3 text-ink">
            How are you today?
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-caption text-ink-soft hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 rounded"
          >
            Close
          </button>
        </div>
        <ErrorBoundary isolate label="Mood check-in">
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
            <EnhancedMoodTracker
              onComplete={onClose}
              onPatternUpdate={() => { /* handled in Insights tab */ }}
            />
          </Suspense>
        </ErrorBoundary>
      </div>
    </section>
  );
}

/* [HARD-TIME-ROUND-4] Quiet mode: while settings.quietUntilTs is in
 * the future, the home view renders only the Day-N hero + the
 * "Having a hard time?" link (kept available so the user can
 * re-enter the panel). The DrinkForm and EnhancedMoodTracker also
 * stay hidden — quiet mode means quiet, not "log something quietly".
 *
 * [ROUND-4-COPILOT-FIX] Midnight recompute: `Date.now() < quietUntilTs`
 * is computed at render time, but the only thing that triggers a
 * re-render is store changes — and quietUntilTs doesn't change at
 * midnight. A user who keeps the app open across midnight would stay
 * in quiet mode indefinitely. Schedule a re-render at exactly the
 * threshold via setTimeout so the home view comes back the moment
 * quiet expires. The local-state tick is the cheapest force-render. */
function useQuietMode(): boolean {
  const quietUntilTs = useDB((s) => s.db.settings.quietUntilTs ?? 0);
  const [, setNowTick] = useState(0);
  useEffect(() => {
    if (quietUntilTs <= Date.now()) return;
    const ms = quietUntilTs - Date.now();
    const id = window.setTimeout(() => setNowTick((t) => t + 1), ms);
    return () => window.clearTimeout(id);
  }, [quietUntilTs]);
  return Date.now() < quietUntilTs;
}

// [ROUND-5-D] Idle-time prefetch of likely-next tabs. After Today
// mounts, warm the chunk cache for Track + Insights so the next
// tap is instant. Bounded by requestIdleCallback (Chrome / Edge /
// Firefox; falls back to a 1.5s setTimeout on Safari) so we never
// contend with the user's first interaction.
function useIdlePrefetch() {
  React.useEffect(() => {
    const ric = (cb: () => void) => {
      const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
      if (typeof idle === 'function') idle(cb);
      else window.setTimeout(cb, 1500);
    };
    ric(() => {
      void import('../drinks/DrinkForm');
      void import('../mood/EnhancedMoodTracker');
      void import('../insights/InsightsPanel');
      void import('../insights/ProgressVisualization');
    });
  }, []);
}

export default function TodayHome({
  drinks,
  goals,
  presets,
  editing,
  onAddDrink,
  onSaveDrink,
  onCancelEdit,
  onOpenInsights,
  onRoughNight,
}: Props) {
  const [surface, setSurface] = useState<Surface>('panel');
  const quiet = useQuietMode();
  useIdlePrefetch();

  // If the parent flips into edit mode, surface the log form so the
  // user can see the entry they're editing.
  React.useEffect(() => {
    if (editing) setSurface('log');
  }, [editing]);

  function handleDrinkSubmit(drink: Drink) {
    if (editing) onSaveDrink(drink);
    else onAddDrink(drink);
    setSurface('panel');
  }

  function handleMarkAF() {
    // A "mark today AF" entry is a 0-volume / 0-abv entry. The
    // existing data model treats this as a check-in / AF day.
    onAddDrink({
      ts: Date.now(),
      volumeMl: 0,
      abvPct: 0,
      intention: 'social',
      craving: 0,
      halt: [],
      alt: '',
    });
  }

  function closeLog() {
    if (editing) onCancelEdit();
    setSurface('panel');
  }

  return (
    <main id="main">
      <TodayPanel
        drinks={drinks}
        goals={goals}
        onCheckIn={() => setSurface('check-in')}
        onLogDrink={() => setSurface('log')}
        onMarkAF={handleMarkAF}
        onSeeProgress={onOpenInsights}
        onRoughNight={onRoughNight}
        quiet={quiet}
      />

      {/* [R12-A] Long-term-user "last 7 days" ribbon — renders for users
          past 30 days with >= 7 entries. The component handles all gating;
          quiet mode hides it the same way it hides the rest of the home
          surfaces. [R12-1] FirstMonthRibbon is the under-30-day variant,
          rendered just below — both gates are mutually exclusive by
          construction (one needs <30 days, the other needs >=30 days). */}
      {!quiet ? (
        <>
          <LongTermActivityRibbon drinks={drinks} goals={goals} className="mt-3" />
          <FirstMonthRibbon drinks={drinks} className="mt-3" />
        </>
      ) : null}

      {!quiet && surface === 'log' ? (
        <LogSection
          editing={editing}
          presets={presets}
          onSubmit={handleDrinkSubmit}
          onClose={closeLog}
        />
      ) : null}

      {!quiet && surface === 'check-in' ? (
        <CheckInSection onClose={() => setSurface('panel')} />
      ) : null}

      <div className="mx-auto w-full max-w-3xl px-4 pb-section-y-mobile lg:pb-section-y-desktop">
        <Disclaimer />
      </div>
    </main>
  );
}
