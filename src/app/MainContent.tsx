import React, { Suspense } from 'react';
import type { Drink, DrinkPreset, Goals } from '../types/common';
import { useLanguage } from '../i18n';
import ReminderBanner from '../features/coach/ReminderBanner';
import { Disclaimer } from '../components/Disclaimer';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

const DrinkForm = React.lazy(() => import('../features/drinks/DrinkForm'));
const DrinkList = React.lazy(() => import('../features/drinks/DrinkList'));
const InsightsPanel = React.lazy(() => import('../features/insights/InsightsPanel'));
const SmartRecommendations = React.lazy(() => import('../features/insights/SmartRecommendations'));
const QuickActions = React.lazy(() => import('../features/insights/QuickActions'));
const ProgressVisualization = React.lazy(() => import('../features/insights/ProgressVisualization'));

interface MainContentProps {
  drinks: Drink[];
  editing: Drink | null;
  goals: Goals;
  presets: DrinkPreset[];
  lastDeleted: Drink | null;
  onAddDrink: (drink: Drink) => void;
  onSaveDrink: (drink: Drink) => void;
  onStartEdit: (drink: Drink) => void;
  onDeleteDrink: (drink: Drink) => void;
  onUndoDelete: () => void;
  onCancelEdit: () => void;
  onOpenSettings?: () => void;
  onOpenStats?: () => void;
}

export default function MainContent({
  drinks,
  editing,
  goals,
  presets,
  lastDeleted,
  onAddDrink,
  onSaveDrink,
  onStartEdit,
  onDeleteDrink,
  onUndoDelete,
  onCancelEdit,
  onOpenSettings,
  onOpenStats,
}: MainContentProps) {
  const { t } = useLanguage();

  return (
    <main className="container mx-auto px-4 py-6 space-y-8 max-w-4xl">
      <ReminderBanner />
      
      {/* Quick Actions - Priority on mobile */}
      <div className="block lg:hidden">
        <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
          <QuickActions 
            drinks={drinks}
            goals={goals}
            onAddDrink={onAddDrink}
            onOpenSettings={onOpenSettings || (() => {})}
            onOpenStats={onOpenStats || (() => {})}
          />
        </Suspense>
      </div>

      {/* Smart Recommendations */}
      <Suspense fallback={<Skeleton className="h-32 w-full rounded-xl" />}>
        <SmartRecommendations 
          drinks={drinks}
          goals={goals}
        />
      </Suspense>

      {/* Progress Visualization */}
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
        <ProgressVisualization 
          drinks={drinks}
          goals={goals}
        />
      </Suspense>

      {/* Main Grid Layout */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column - Form and Actions */}
        <div className="space-y-6">
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
            <DrinkForm
              onSubmit={editing ? onSaveDrink : onAddDrink}
              initial={editing || undefined}
              submitLabel={editing ? t('save') : t('add')}
              onCancel={editing ? onCancelEdit : undefined}
              presets={presets}
            />
          </Suspense>

          {/* Quick Actions - Desktop */}
          <div className="hidden lg:block">
            <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
              <QuickActions 
                drinks={drinks}
                goals={goals}
                onAddDrink={onAddDrink}
                onOpenSettings={() => {}}
                onOpenStats={() => {}}
              />
            </Suspense>
          </div>
        </div>

        {/* Right Column - Lists and Insights */}
        <div className="space-y-6">
          <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
            <DrinkList
              drinks={drinks}
              onEdit={onStartEdit}
              onDelete={(ts: number) => {
                const drink = drinks.find(d => d.ts === ts);
                if (drink) onDeleteDrink(drink);
              }}
            />
          </Suspense>

          <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
            <InsightsPanel 
              drinks={drinks}
              goals={goals}
            />
          </Suspense>
        </div>
      </div>

      {/* Undo Toast */}
      {lastDeleted && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-slide-up">
          <span className="text-sm">{t('deletedDrink')}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndoDelete}
            className="text-white hover:bg-white/20 text-sm"
          >
            {t('undo')}
          </Button>
        </div>
      )}

      <Disclaimer />
    </main>
  );
}