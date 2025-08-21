import React from 'react';
import { Drink } from './DrinkForm';
import { stdDrinks } from '../../lib/calc';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  drinks: Drink[];
}

export function DrinkChart({ drinks }: Props) {
  const today = new Date();
  const data = [] as { date: string; std: number }[];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const total = drinks
      .filter((dr) => new Date(dr.ts).toISOString().slice(0, 10) === key)
      .reduce((sum, dr) => sum + stdDrinks(dr.volumeMl, dr.abvPct), 0);
    data.push({ date: key.slice(5), std: Number(total.toFixed(2)) });
  }

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="std" fill="#4f46e5" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
