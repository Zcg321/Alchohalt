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
    return <div>{t('noDrinks')}</div>;
  }

  return (
    <div className="space-y-2">
      {Object.entries(grouped).map(([day, list]) => (
        <DayGroup key={day} day={day} drinks={list} dailyCap={dailyCap} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

export type { Drink } from '../DrinkForm';
