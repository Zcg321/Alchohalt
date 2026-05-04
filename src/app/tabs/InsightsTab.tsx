/**
 * Insights tab — stats, trends, mood correlation, money saved.
 *
 * Sprint 2A `[IA-2]`. Hub for the analytics surfaces that used to be
 * scattered across home. Premium-gating stays where each underlying
 * component already enforces it.
 *
 * Empty state: "Add a few entries and your trends will show up here."
 */
import React, { Suspense } from 'react';
import type { Drink, Goals } from '../../types/common';
import { Skeleton } from '../../components/ui/Skeleton';
import ErrorBoundary from '../../components/ErrorBoundary';
import { stdDrinks } from '../../lib/calc';

const InsightsPanel = React.lazy(() => import('../../features/insights/InsightsPanel'));
const ProgressVisualization = React.lazy(() => import('../../features/insights/ProgressVisualization'));
const SmartRecommendations = React.lazy(() => import('../../features/insights/SmartRecommendations'));
const TagPatternsCard = React.lazy(() => import('../../features/insights/TagPatternsCard'));
const PeakHourCard = React.lazy(() => import('../../features/insights/PeakHourCard'));
const CalorieTile = React.lazy(() => import('../../features/insights/CalorieTile'));
const MoneySavedWidget = React.lazy(() => import('../../features/money/MoneySavedWidget'));
const InsightsEmptyPreview = React.lazy(() => import('../../features/insights/InsightsEmptyPreview'));
const Milestones = React.lazy(() => import('../../features/milestones/Milestones'));
const LoggingTenure = React.lazy(() => import('../../features/milestones/LoggingTenure'));
const PremiumWellnessDashboard = React.lazy(() => import('../../features/wellness/PremiumWellnessDashboard'));
const AIInsightsTile = React.lazy(() => import('../../features/ai/AIInsightsTile'));
const EnhancedMoodTracker = React.lazy(() => import('../../features/mood/EnhancedMoodTracker'));

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface Props {
  drinks: Drink[];
  goals: Goals;
}

export default function InsightsTab({ drinks, goals }: Props) {
  const cutoff = Date.now() - THIRTY_DAYS_MS;
  const pricePerStd = Number.isFinite(goals.pricePerStd) ? goals.pricePerStd : 0;
  const last30Costs = drinks
    .filter((d) => d.ts >= cutoff)
    .map((d) => stdDrinks(d.volumeMl, d.abvPct) * pricePerStd);

  if (drinks.length < 7) {
    return (
      <main id="main" className="mx-auto w-full max-w-2xl md:max-w-3xl px-4 py-section-y-mobile lg:py-section-y-desktop space-y-6">
        <header className="text-center">
          <h2 className="text-h2 text-ink">Insights</h2>
        </header>
        {drinks.length === 0 ? (
          <div
            className="rounded-2xl border border-border-soft bg-surface-elevated p-card text-center"
            data-testid="insights-empty-state"
          >
            {/* [R23-4] Calm empty-state illustration: a quiet horizontal
                axis with three muted markers where bars would appear once
                the user has data. No faces, no exclamation, no
                cheerleader voice — observation, on-brand sage palette,
                decorative only. */}
            <svg
              aria-hidden="true"
              viewBox="0 0 240 90"
              className="mx-auto mb-4 w-32 text-sage-500/60 dark:text-sage-400/60"
            >
              <line x1="20" y1="70" x2="220" y2="70" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="60" cy="55" r="3" fill="currentColor" opacity="0.5" />
              <circle cx="120" cy="40" r="3" fill="currentColor" opacity="0.7" />
              <circle cx="180" cy="50" r="3" fill="currentColor" opacity="0.5" />
              <path
                d="M60 55 Q90 47 120 40 T180 50"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="3 5"
                strokeLinecap="round"
                fill="none"
                opacity="0.4"
              />
            </svg>
            <p className="text-body text-ink">Nothing to chart yet.</p>
            <p className="mt-1 text-caption text-ink-soft">Add a few entries on the Track tab and your trends will show up here.</p>
          </div>
        ) : null}
        {/* [R25-H] Sample-data preview so users see the shape of their
            insights before they have enough entries. Renders for both
            zero-entry and partial-data states (< 7 entries). Always
            labeled "Sample" — no risk of confusing the preview with
            real data. */}
        <Suspense fallback={<Skeleton className="h-72 w-full rounded-xl" />}>
          <InsightsEmptyPreview entryCount={drinks.length} />
        </Suspense>
      </main>
    );
  }

  return (
    <main id="main" className="mx-auto w-full max-w-2xl md:max-w-3xl px-4 py-section-y-mobile lg:py-section-y-desktop space-y-8">
      <header className="text-center">
        <h2 className="text-h2 text-ink">Insights</h2>
        <p className="mt-1 text-caption text-ink-soft">Trends, money saved, mood patterns. Premium where applicable.</p>
      </header>

      <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
        <ProgressVisualization drinks={drinks} goals={goals} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-32 w-full rounded-xl" />}>
        <SmartRecommendations drinks={drinks} goals={goals} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
        <InsightsPanel drinks={drinks} />
      </Suspense>

      {/* [R14-3] Tag-pattern card. Renders only when the user has
          at least one tag appearing on 3+ entries; otherwise hidden. */}
      <Suspense fallback={null}>
        <TagPatternsCard drinks={drinks} />
      </Suspense>

      {/* [R14-5] Peak-hour insight. Renders only when the user has
          enough data to surface a meaningful pattern (≥7 real drinks
          across ≥3 distinct peak-hour days). */}
      <Suspense fallback={null}>
        <PeakHourCard drinks={drinks} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-32 w-full rounded-xl" />}>
        <MoneySavedWidget costs={last30Costs} monthlyBudget={goals.baselineMonthlySpend ?? 0} />
      </Suspense>

      {/* [R25-B] Derived calorie tile. Self-hides when the user
          has not opted in via Settings → Show calorie tile, OR when
          they have zero drinks in the trailing 7 days. */}
      <Suspense fallback={null}>
        <CalorieTile drinks={drinks} />
      </Suspense>

      {/* [IA-5] Real estate freed by stripping the Levels/Points panel
          now goes to a quiet dated-milestone list. No XP, no "next level". */}
      <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
        <Milestones drinks={drinks} />
      </Suspense>

      {/* [R17-1] Tenure surface for long-term users whose pattern is
          irregular — separate from streaks so the through-line of
          "you've been showing up" doesn't reset on a single drink.
          Self-hides under 90 days. */}
      <Suspense fallback={null}>
        <LoggingTenure drinks={drinks} />
      </Suspense>

      {/* Mood IQ moved off home -> Insights sub-flow. */}
      <ErrorBoundary isolate label="Mood patterns">
        <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
          <EnhancedMoodTracker
            onComplete={() => { /* writes to store via component */ }}
            onPatternUpdate={() => { /* surfaces patterns inline */ }}
          />
        </Suspense>
      </ErrorBoundary>

      <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
        <PremiumWellnessDashboard drinks={drinks} />
      </Suspense>

      {/*
       * The ALCH-AI-PRIVACY-FIX workaround wrapped this in an
       * <ErrorBoundary isolate> after a duplicate-React cache-flake
       * crashed the dispatcher in Sprint 1. With BUG-DUPLICATE-REACT-ROOT
       * landing the durable Vite resolve.dedupe + optimizeDeps fix and a
       * cross-component regression test (src/__tests__/duplicate-react-
       * root.test.tsx), the isolation is no longer load-bearing — a real
       * AI-call runtime error will now propagate to the parent boundary
       * in App, which is the right behavior.
       */}
      <Suspense fallback={<Skeleton className="h-32 w-full rounded-xl" />}>
        <AIInsightsTile />
      </Suspense>
    </main>
  );
}
