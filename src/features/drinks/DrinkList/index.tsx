// @no-smoke
import React, { useMemo } from 'react';
import { Drink } from '../DrinkForm';
import DayGroup from './DayGroup';
import { useLanguage } from '../../../i18n';

interface Props {
  drinks: Drink[];
  onDelete?: (ts: number) => void;
  onEdit?: (drink: Drink) => void;
  dailyCap?: number;
}

export default function DrinkList({ drinks, onDelete, onEdit, dailyCap }: Props) {
  const { t } = useLanguage();
  const grouped = useMemo(() => {
    const sorted = [...drinks].sort((a, b) => b.ts - a.ts);
    const map: Record<string, Drink[]> = {};
    for (const d of sorted) {
      const day = new Date(d.ts).toISOString().slice(0, 10);
      (map[day] ||= []).push(d);
    }
    return map;
  }, [drinks]);

  if (drinks.length === 0) {
    return (
      <div className="card text-center">
        <div className="card-content py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            {t('noDrinksTitle')}
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            {t('noDrinks')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold flex items-center">
          <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
          {t('drinkHistory')}
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          {drinks.length} {drinks.length === 1 ? t('entry') : t('entries')} total
        </p>
      </div>
      
      <div className="card-content space-y-4">
        {Object.entries(grouped).map(([day, list]) => (
          <DayGroup key={day} day={day} drinks={list} dailyCap={dailyCap} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

export type { Drink } from '../DrinkForm';
