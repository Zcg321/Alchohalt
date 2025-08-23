import React from 'react';
import { useDB } from '../store/db';
import { monthlyBreakdown } from '../lib/stats';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export default function Spending() {
  const { db, stats } = useDB(s => ({ db: s.db, stats: s.stats }));
  const budget = db.settings.monthlyBudget || 0;
  const spend = stats.monthlySpend || 0;
  const variance = spend - budget;
  const pct = budget > 0 ? Math.min(100, Math.round(spend / budget * 100)) : (spend>0?100:0);
  const savings = (budget>0) ? Math.max(0, Math.round(((budget/30) * (stats.currentAFStreak ?? 0)))) : 0;
  const data = budget>0 ? [{name:'Spent', value: spend}, {name:'Remaining', value: Math.max(0,budget-spend)}] : [{name:'Spent', value: spend}];
  const top = monthlyBreakdown(db.entries).slice(0,5);

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Spending</h1>

      <section className="p-4 border rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-sm opacity-70">This month spend</div>
            <div className="text-3xl font-bold">${spend.toFixed(2)}</div>
            <div className="mt-1 text-sm">Budget: ${budget.toFixed(2)} • <span className={variance>0?'text-red-600':'text-green-600'}>{variance>0?`Over by $${variance.toFixed(2)}`:`Under by $${Math.abs(variance).toFixed(2)}`}</span></div>
          </div>
          <div className="w-full md:w-64 h-40">
            <ResponsiveContainer>
              <PieChart>
                <Pie dataKey="value" data={data} innerRadius={40} outerRadius={60} paddingAngle={2}>
                  {data.map((_,i)=><Cell key={i} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-3 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-3">
          <div className={`h-3 rounded-full ${variance>0?'bg-red-600':'bg-green-600'}`} style={{ width:`${pct}%` }} />
        </div>
      </section>

      <section className="p-4 border rounded-2xl">
        <h2 className="font-semibold">Estimated AF Savings</h2>
        <p className="text-sm opacity-80">Assumes baseline of budget/30 per AF day.</p>
        <div className="text-2xl font-bold mt-2">${savings.toFixed(0)}</div>
      </section>

      <section className="p-4 border rounded-2xl">
        <h2 className="font-semibold mb-2">Top Cost Days</h2>
        {top.length===0 ? <div className="opacity-70">No cost data yet.</div> :
          <ul className="space-y-1">
            {top.map((d)=>(
              <li key={d.day.toISOString()} className="flex justify-between">
                <span>{d.day.toLocaleDateString()}</span><span className="font-medium">${d.cost.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        }
      </section>
    </div>
  );
}
