import React from 'react';
import { useDB } from '../../store/db';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function MonthlyTrend() {
  const stats = useDB(s=>s.stats);
  const data = stats.line30 || [];
  if (!data.length) return <div className="opacity-70">No data yet.</div>;
  return (
    <div role="img" aria-label="30-day drinks trend" className="w-full h-64">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="stdDrinks" dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs opacity-70 mt-2">Estimates are educational only; not medical advice.</p>
    </div>
  );
}
