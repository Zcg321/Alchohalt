import React, { useMemo } from 'react';
import { stdDrinks } from '../../lib/calc';
import { Drink } from './DrinkForm';
import { Button } from '../../components/ui/Button';
import { useLanguage } from '../../i18n';

interface Props {
  drinks: Drink[];
  onDelete?: (ts: number) => void;
  onEdit?: (drink: Drink) => void;
  dailyCap?: number;
}

export function DrinkList({ drinks, onDelete, onEdit, dailyCap }: Props) {
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
      {Object.entries(grouped).map(([day, list]) => {
        const dailyTotal = list.reduce(
          (sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct),
          0
        );
        const exceed =
          dailyCap !== undefined && dailyCap > 0 && dailyTotal > dailyCap;
        const pct = dailyCap ? Math.min(1, dailyTotal / dailyCap) * 100 : 0;
        return (
          <div key={day}>
            <div
              className={`font-semibold ${exceed ? 'text-red-600' : ''}`}
            >
              {new Date(day).toLocaleDateString()} – {dailyTotal.toFixed(2)} std
              {dailyCap !== undefined && ` / ${dailyCap}`}
              {dailyCap !== undefined && (
                <div className="mt-1 w-full bg-gray-200 h-1 rounded">
                  <div
                    className={`${exceed ? 'bg-red-600' : 'bg-blue-600'} h-1 rounded`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
            <ul className="mt-1 space-y-1">
              {list.map((d) => (
                <li key={d.ts} className="flex items-center gap-2">
                  <span>
                    {new Date(d.ts).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}- {d.intention} -
                    {stdDrinks(d.volumeMl, d.abvPct).toFixed(2)} std - craving {d.craving}
                    {d.halt.length ? ` HALT: ${d.halt.join(',')}` : ''}
                    {d.alt ? ` alt: ${d.alt}` : ''}
                  </span>
                  {(onEdit || onDelete) && (
                    <div className="ml-auto space-x-1">
                      {onEdit && (
                        <Button
                          variant="secondary"
                          onClick={() => onEdit(d)}
                          className="px-2 py-1 text-xs"
                          aria-label={t('edit')}
                        >
                          {t('edit')}
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="danger"
                          onClick={() =>
                            window.confirm(t('deleteConfirm')) && onDelete(d.ts)
                          }
                          className="px-2 py-1 text-xs"
                          aria-label={t('delete')}
                        >
                          {t('delete')}
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
