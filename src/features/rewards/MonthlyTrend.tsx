// @no-smoke
import React from "react";
import { LazyRecharts as R } from "@/shared/charts";
import { useDB } from "../../store/db";
import { Disclaimer } from "../../components/Disclaimer";

export default function MonthlyTrend() {
  const stats = useDB((s) => s.stats);
  const data = stats.line30 || [];
  if (!data.length) return <div className="opacity-70" data-testid="trend-empty">No data yet.</div>;
  return (
    <div role="img" aria-label="30-day drinks trend" className="w-full h-64">
      <React.Suspense fallback={<div data-testid="trend-loading" />}>
        <R.ResponsiveContainer width="100%" height={200}>
          <R.LineChart data={data}>
            <R.CartesianGrid strokeDasharray="3 3" />
            <R.XAxis dataKey="date" />
            <R.YAxis />
            <R.Tooltip />
            <R.Line type="monotone" dataKey="stdDrinks" dot={false} />
          </R.LineChart>
        </R.ResponsiveContainer>
      </React.Suspense>
      <div className="mt-2">
        <Disclaimer />
      </div>
    </div>
  );
}
