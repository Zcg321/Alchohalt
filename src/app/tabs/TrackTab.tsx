/**
 * Track tab — drink log + history + drinks reference.
 *
 * Sprint 2A `[IA-2]`. Surfaces the parts of the prior home dump that
 * are about *recording*: the form, the list of past entries, and the
 * drinks-database picker. The discovery deck was reduced to functional
 * info (ABV %, volume, category) per `[IA-4]`.
 *
 * Empty state: "No drinks logged yet. Today's a fresh start."
 */
import React, { Suspense, useMemo, useState } from 'react';
import type { Drink, DrinkPreset, Goals } from '../../types/common';
import { Skeleton } from '../../components/ui/Skeleton';
import { useDB } from '../../store/db';
import { useLanguage } from '../../i18n';
import DrinkHistorySearch from '../../features/drinks/DrinkHistorySearch';
import QuickLogChips from '../../features/drinks/DrinkForm/QuickLogChips';
import QuickLogHintBanner, {
  shouldShowQuickLogHint,
} from '../../features/drinks/DrinkForm/QuickLogHintBanner';
import {
  filterDrinks,
  isCriteriaEmpty,
  type DrinkSearchCriteria,
} from '../../features/drinks/DrinkHistorySearch/filterDrinks';

const DrinkForm = React.lazy(() => import('../../features/drinks/DrinkForm'));
const DrinkList = React.lazy(() => import('../../features/drinks/DrinkList'));
const DrinkDiscovery = React.lazy(() => import('../../features/drinks/DrinkDiscovery'));

/* [R24-FF1+FF2+FF3] Quick-mode controls: chips + optional backdate
 * link + the disclosure toggle for the detailed form. Extracted so
 * TrackTab itself stays under the line-count gate; behavior identical
 * to the inline version that landed in commit 743a560. */
interface QuickModeControlsProps {
  onLog: (drink: Drink) => void;
  showBackdateLink: boolean;
  mostRecentDrink: Drink | null;
  onBackdate: (drink: Drink) => void;
  showDetailed: boolean;
  onToggleDetailed: () => void;
  t: (key: string, fallback?: string) => string;
}

function QuickModeControls(props: QuickModeControlsProps) {
  const {
    onLog, showBackdateLink, mostRecentDrink, onBackdate,
    showDetailed, onToggleDetailed, t,
  } = props;
  return (
    <div className="mb-4 space-y-3">
      <QuickLogChips onLog={onLog} />
      {showBackdateLink && mostRecentDrink && (
        <button
          type="button"
          onClick={() => onBackdate(mostRecentDrink)}
          data-testid="quick-log-backdate-link"
          className="text-xs text-ink-soft hover:text-ink underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 rounded"
        >
          {t('drinkLog.quick.earlierToday', 'Earlier today? Adjust last entry')}
        </button>
      )}
      {/* [R24-FF3] Disclosure toggle stepped down from primary
          color to ink-soft + caret. Low-vision users zooming in
          still see it (text-sm + underline-on-hover); at 100 % it
          no longer competes with the chips for visual weight. */}
      <button
        type="button"
        onClick={onToggleDetailed}
        aria-expanded={showDetailed}
        aria-controls="track-form"
        data-testid="quick-log-toggle-detailed"
        className="text-sm text-ink-soft hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 rounded"
      >
        {showDetailed
          ? t('drinkLog.quick.hideDetailed', 'Hide detailed form') + ' ▴'
          : t('drinkLog.quick.needMoreDetail', 'Need more detail?') + ' ▾'}
      </button>
    </div>
  );
}

interface Props {
  drinks: Drink[];
  goals: Goals;
  presets: DrinkPreset[];
  editing: Drink | null;
  onAddDrink: (drink: Drink) => void;
  onSaveDrink: (drink: Drink) => void;
  onStartEdit: (drink: Drink) => void;
  onDeleteDrink: (drink: Drink) => void;
  onCancelEdit: () => void;
  /** [R12-2] Bulk-edit handlers, optional for backward compat. */
  onBulkDelete?: ((tsList: number[]) => void) | undefined;
  onBulkShiftTime?: ((tsList: number[], deltaMinutes: number) => void) | undefined;
  onBulkScaleStd?: ((tsList: number[], factor: number) => void) | undefined;
}

interface HistorySectionProps {
  drinks: Drink[];
  filteredDrinks: Drink[];
  noMatches: boolean;
  empty: boolean;
  onCriteriaChange: (c: DrinkSearchCriteria) => void;
  onStartEdit: (d: Drink) => void;
  onDeleteDrink: (d: Drink) => void;
  onBulkDelete?: ((tsList: number[]) => void) | undefined;
  onBulkShiftTime?: ((tsList: number[], deltaMinutes: number) => void) | undefined;
  onBulkScaleStd?: ((tsList: number[], factor: number) => void) | undefined;
}

function HistorySection(props: HistorySectionProps) {
  const {
    drinks, filteredDrinks, noMatches, empty,
    onCriteriaChange, onStartEdit, onDeleteDrink,
    onBulkDelete, onBulkShiftTime, onBulkScaleStd,
  } = props;
  if (empty) {
    return (
      <div className="rounded-2xl border border-border-soft bg-surface-elevated p-card text-center">
        <p className="text-body text-ink">No drinks logged yet.</p>
        <p className="mt-1 text-caption text-ink-soft">Today&rsquo;s a fresh start. Add an entry above when you&rsquo;d like.</p>
      </div>
    );
  }
  return (
    <>
      <DrinkHistorySearch
        onCriteriaChange={onCriteriaChange}
        totalCount={drinks.length}
        matchedCount={filteredDrinks.length}
      />
      {noMatches ? (
        <div
          data-testid="track-history-no-matches"
          className="rounded-2xl border border-border-soft bg-surface-elevated p-card text-center"
        >
          <p className="text-body text-ink">No drinks match your search.</p>
          <p className="mt-1 text-caption text-ink-soft">
            Adjust the filters above to widen the range.
          </p>
        </div>
      ) : (
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
          <DrinkList
            drinks={filteredDrinks}
            onEdit={onStartEdit}
            onDelete={(ts: number) => {
              const drink = drinks.find((d) => d.ts === ts);
              if (drink) onDeleteDrink(drink);
            }}
            onBulkDelete={onBulkDelete}
            onBulkShiftTime={onBulkShiftTime}
            onBulkScaleStd={onBulkScaleStd}
          />
        </Suspense>
      )}
    </>
  );
}

/* [R24-FF2] 10 min — typical "I forgot to log earlier" window. Lives
 * outside the component so tests can reference it later if needed. */
const QUICK_BACKDATE_WINDOW_MS = 10 * 60 * 1000;

interface QuickModeState {
  isQuickMode: boolean;
  showQuickLogHint: boolean;
  showBackdateLink: boolean;
  mostRecentDrink: Drink | null;
}

function useQuickModeState(drinks: Drink[], editing: Drink | null, showDetailed: boolean): QuickModeState {
  const drinkLogMode = useDB((s) => s.db.settings.drinkLogMode);
  const quickLogHintAt = useDB((s) => s.db.settings.quickLogHintAt);
  const isQuickMode = drinkLogMode === 'quick' && !editing;
  const showQuickLogHint = shouldShowQuickLogHint({
    drinkCount: drinks.length,
    drinkLogMode,
    quickLogHintAt,
    editing: editing !== null,
  });
  const mostRecentDrink = useMemo(
    () =>
      drinks.length === 0
        ? null
        : drinks.reduce((a, b) => (a.ts > b.ts ? a : b)),
    [drinks],
  );
  const showBackdateLink =
    isQuickMode &&
    !showDetailed &&
    mostRecentDrink !== null &&
    Date.now() - mostRecentDrink.ts <= QUICK_BACKDATE_WINDOW_MS;
  return { isQuickMode, showQuickLogHint, showBackdateLink, mostRecentDrink };
}

export default function TrackTab({
  drinks,
  presets,
  editing,
  onAddDrink,
  onSaveDrink,
  onStartEdit,
  onDeleteDrink,
  onCancelEdit,
  onBulkDelete,
  onBulkShiftTime,
  onBulkScaleStd,
}: Props) {
  const empty = drinks.length === 0;
  const { t } = useLanguage();
  const [showDetailed, setShowDetailed] = useState(false);
  const { isQuickMode, showQuickLogHint, showBackdateLink, mostRecentDrink } =
    useQuickModeState(drinks, editing, showDetailed);
  // [R14-2] History search/filter — bar only emits criteria; list never knows about search.
  const [criteria, setCriteria] = useState<DrinkSearchCriteria>({});
  const filteredDrinks = useMemo(() => filterDrinks(drinks, criteria), [drinks, criteria]);
  const noMatches = !isCriteriaEmpty(criteria) && filteredDrinks.length === 0;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-section-y-mobile lg:py-section-y-desktop space-y-8">
      <header className="text-center">
        <h2 className="text-h2 text-ink">Track</h2>
        <p className="mt-1 text-caption text-ink-soft">Log a drink, browse history, or pick from your common pours.</p>
      </header>

      <section aria-labelledby="track-form" className="rounded-2xl border border-border-soft bg-surface-elevated p-card shadow-card">
        <h3 id="track-form" className="text-h3 text-ink mb-4">{editing ? 'Edit drink' : 'Log a drink'}</h3>
        {showQuickLogHint && <QuickLogHintBanner />}
        {isQuickMode && (
          <QuickModeControls
            onLog={onAddDrink}
            showBackdateLink={showBackdateLink}
            mostRecentDrink={mostRecentDrink}
            onBackdate={onStartEdit}
            showDetailed={showDetailed}
            onToggleDetailed={() => setShowDetailed((v) => !v)}
            t={t}
          />
        )}
        {(!isQuickMode || showDetailed || editing) && (
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
            <DrinkForm
              onSubmit={editing ? onSaveDrink : onAddDrink}
              initial={editing || undefined}
              submitLabel={editing ? 'Save' : 'Add'}
              onCancel={editing ? onCancelEdit : undefined}
              presets={presets}
            />
          </Suspense>
        )}
      </section>

      <section aria-labelledby="track-history" className="space-y-3">
        <h3 id="track-history" className="text-h3 text-ink">History</h3>
        <HistorySection
          drinks={drinks}
          filteredDrinks={filteredDrinks}
          noMatches={noMatches}
          empty={empty}
          onCriteriaChange={setCriteria}
          onStartEdit={onStartEdit}
          onDeleteDrink={onDeleteDrink}
          onBulkDelete={onBulkDelete}
          onBulkShiftTime={onBulkShiftTime}
          onBulkScaleStd={onBulkScaleStd}
        />
      </section>

      <section aria-labelledby="track-discover" className="space-y-3">
        <h3 id="track-discover" className="text-h3 text-ink">Drinks reference</h3>
        <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
          <DrinkDiscovery onSelectDrink={(d) => onAddDrink(d as Drink)} />
        </Suspense>
      </section>
    </main>
  );
}
