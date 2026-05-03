// @no-smoke
import React from 'react';
import { stdDrinks } from '../../../lib/calc';
import type { Drink } from '../DrinkForm';
import DrinkItem from './DrinkItem';
import { formatDate, formatNumber } from '../../../lib/format';
import { useLanguage } from '../../../i18n';
import type { Lang } from '../../../i18n';
import { useBulkSelection } from './BulkSelectionContext';

interface Props {
  day: string;
  drinks: Drink[];
  dailyCap?: number | undefined;
  onEdit?: ((d: Drink) => void) | undefined;
  onDelete?: ((ts: number) => void) | undefined;
}

// Timezone-safe date formatting to avoid UTC interpretation issues.
// Builds the Date in local TZ from the YYYY-MM-DD components, then
// hands off to the locale-aware formatter so Spanish users see Spanish.
function formatDateSafe(isoDateString: string, lang: Lang): string {
  const [year, month, day] = isoDateString.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    return isoDateString;
  }
  return formatDate(new Date(year, month - 1, day), lang);
}

export default function DayGroup({ day, drinks, dailyCap, onEdit, onDelete }: Props) {
  const { lang } = useLanguage();
  const bulk = useBulkSelection();
  const dailyTotal = drinks.reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);
  const exceed = dailyCap !== undefined && dailyCap > 0 && dailyTotal > dailyCap;
  const pct = dailyCap ? Math.min(1, dailyTotal / dailyCap) * 100 : 0;

  const allSelectedInDay =
    bulk?.active && drinks.every((d) => bulk.selected.has(d.ts));

  function handleSelectDay() {
    if (!bulk) return;
    const tsList = drinks.map((d) => d.ts);
    if (allSelectedInDay) bulk.deselectAll(tsList);
    else bulk.selectAll(tsList);
  }

  return (
    <div>
      <div className={`font-semibold ${exceed ? 'text-red-600' : ''} flex items-center justify-between gap-2`}>
        <span>
          {formatDateSafe(day, lang)} – {formatNumber(dailyTotal, lang, { maximumFractionDigits: 2 })} std
          {dailyCap !== undefined && ` / ${dailyCap}`}
        </span>
        {bulk?.active ? (
          <button
            type="button"
            onClick={handleSelectDay}
            data-testid={`day-select-${day}`}
            className="text-caption font-normal text-ink-soft hover:text-ink underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 rounded"
          >
            {allSelectedInDay ? 'Unselect day' : 'Select day'}
          </button>
        ) : null}
      </div>
      {dailyCap !== undefined && (
        <div className="mt-1 w-full bg-gray-200 h-1 rounded">
          <div
            className={`${exceed ? 'bg-red-600' : 'bg-blue-600'} h-1 rounded`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      <ul className="mt-1 space-y-1">
        {drinks.map((d) => (
          <DrinkItem key={d.ts} drink={d} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </ul>
    </div>
  );
}
