// @no-smoke
import React from 'react';
import { stdDrinks } from '../../../lib/calc';
import type { Drink } from '../DrinkForm';
import DrinkItem from './DrinkItem';
import { formatDate, formatNumber } from '../../../lib/format';
import { useLanguage } from '../../../i18n';

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
function formatDateSafe(isoDateString: string, lang: 'en' | 'es'): string {
  const [year, month, day] = isoDateString.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    return isoDateString;
  }
  return formatDate(new Date(year, month - 1, day), lang);
}

export default function DayGroup({ day, drinks, dailyCap, onEdit, onDelete }: Props) {
  const { lang } = useLanguage();
  const dailyTotal = drinks.reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);
  const exceed = dailyCap !== undefined && dailyCap > 0 && dailyTotal > dailyCap;
  const pct = dailyCap ? Math.min(1, dailyTotal / dailyCap) * 100 : 0;
  return (
    <div>
      <div className={`font-semibold ${exceed ? 'text-red-600' : ''}`}>
        {formatDateSafe(day, lang)} – {formatNumber(dailyTotal, lang, { maximumFractionDigits: 2 })} std
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
        {drinks.map((d) => (
          <DrinkItem key={d.ts} drink={d} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </ul>
    </div>
  );
}
