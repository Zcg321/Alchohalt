// @no-smoke
import React from "react";
import { LazyRecharts as R } from "@/shared/charts";
import { Drink } from "./DrinkForm";
import { stdDrinks } from "../../lib/calc";

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

  if (data.every((d) => d.std === 0)) {
    return <div data-testid="drinkchart-empty" className="w-full h-48" />;
  }

  return (
    <div className="w-full h-48">
      <React.Suspense fallback={<div data-testid="drinkchart-loading" />}>
        <R.ResponsiveContainer width="100%" height="100%">
          <R.BarChart data={data}>
            <R.XAxis dataKey="date" />
            <R.YAxis allowDecimals={false} />
            <R.Tooltip />
            <R.Bar dataKey="std" fill="#4f46e5" />
          </R.BarChart>
        </R.ResponsiveContainer>
      </React.Suspense>
    </div>
  );
}
