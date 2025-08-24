// @no-smoke
import React from 'react';
import { stdDrinks } from '../../../lib/calc';
import { Drink } from '../DrinkForm';
import DrinkItem from './DrinkItem';

interface Props {
  day: string;
  drinks: Drink[];
  dailyCap?: number;
  onEdit?: (d: Drink) => void;
  onDelete?: (ts: number) => void;
}

export default function DayGroup({ day, drinks, dailyCap, onEdit, onDelete }: Props) {
  const dailyTotal = drinks.reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);
  const exceed = dailyCap !== undefined && dailyCap > 0 && dailyTotal > dailyCap;
  const pct = dailyCap ? Math.min(1, dailyTotal / dailyCap) * 100 : 0;
  return (
    <div>
      <div className={`font-semibold ${exceed ? 'text-red-600' : ''}`}>
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
        {drinks.map((d) => (
          <DrinkItem key={d.ts} drink={d} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </ul>
    </div>
  );
}
