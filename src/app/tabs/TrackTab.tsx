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
import React, { Suspense } from 'react';
import type { Drink, DrinkPreset, Goals } from '../../types/common';
import { Skeleton } from '../../components/ui/Skeleton';

const DrinkForm = React.lazy(() => import('../../features/drinks/DrinkForm'));
const DrinkList = React.lazy(() => import('../../features/drinks/DrinkList'));
const DrinkDiscovery = React.lazy(() => import('../../features/drinks/DrinkDiscovery'));

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

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-section-y-mobile lg:py-section-y-desktop space-y-8">
      <header className="text-center">
        <h2 className="text-h2 text-ink">Track</h2>
        <p className="mt-1 text-caption text-ink-soft">Log a drink, browse history, or pick from your common pours.</p>
      </header>

      <section aria-labelledby="track-form" className="rounded-2xl border border-border-soft bg-surface-elevated p-card shadow-card">
        <h3 id="track-form" className="text-h3 text-ink mb-4">{editing ? 'Edit drink' : 'Log a drink'}</h3>
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
          <DrinkForm
            onSubmit={editing ? onSaveDrink : onAddDrink}
            initial={editing || undefined}
            submitLabel={editing ? 'Save' : 'Add'}
            onCancel={editing ? onCancelEdit : undefined}
            presets={presets}
          />
        </Suspense>
      </section>

      <section aria-labelledby="track-history" className="space-y-3">
        <h3 id="track-history" className="text-h3 text-ink">History</h3>
        {empty ? (
          <div className="rounded-2xl border border-border-soft bg-surface-elevated p-card text-center">
            <p className="text-body text-ink">No drinks logged yet.</p>
            <p className="mt-1 text-caption text-ink-soft">Today&rsquo;s a fresh start. Add an entry above when you&rsquo;d like.</p>
          </div>
        ) : (
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
            <DrinkList
              drinks={drinks}
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
