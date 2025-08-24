// @no-smoke
import React from "react";
import { LazyRecharts as R } from "@/shared/charts";
import { useDB } from "../../store/db";

export default function WeeklyChart() {
  const stats = useDB((s) => s.stats);
  const data = stats.weekly || [];
  if (!data.length)
    return (
      <div className="opacity-70">
        No data yet. <a className="underline" href="/log">Log your first drink</a>.
      </div>
    );
  return (
    <div role="img" aria-label="Weekly drinks and cost chart" className="w-full h-64">
      <React.Suspense fallback={<div data-testid="weekly-loading" />}>
        <R.ResponsiveContainer>
          <R.ComposedChart data={data}>
            <R.CartesianGrid strokeDasharray="3 3" />
            <R.XAxis dataKey="week" />
            <R.YAxis
              yAxisId="left"
              label={{ value: "Std drinks", angle: -90, position: "insideLeft" }}
            />
            <R.YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: "Cost", angle: -90, position: "insideRight" }}
            />
            <R.Tooltip />
            <R.Legend />
            <R.Bar yAxisId="left" dataKey="stdDrinks" name="Drinks" />
            <R.Line yAxisId="right" type="monotone" dataKey="cost" name="Cost" />
          </R.ComposedChart>
        </R.ResponsiveContainer>
      </React.Suspense>
    </div>
  );
}
