import type { Entry, Settings } from '../store/db';

export function startOfDay(ts:number){ const d=new Date(ts); d.setHours(0,0,0,0); return d.getTime(); }
export function isSameDay(a:number, b:number){ return startOfDay(a)===startOfDay(b); }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function computeStats(entries: Entry[], _settings: Settings) {
  // Weekly buckets (Mon-Sun)
  const weeks: { week: string; stdDrinks: number; cost: number }[] = [];
  const weeklyMap = new Map<string,{std:number;cost:number}>();
  for (const e of entries) {
    const d = new Date(e.ts);
    const day = d.getDay(); // 0 Sun..6 Sat
    const monday = new Date(e.ts); monday.setDate(d.getDate() - ((day+6)%7)); monday.setHours(0,0,0,0);
    const sunday = new Date(monday.getTime()); sunday.setDate(monday.getDate()+6); sunday.setHours(23,59,59,999);
    const key = monday.toISOString().slice(0,10);
    const obj = weeklyMap.get(key) ?? { std:0, cost:0 };
    obj.std += e.stdDrinks;
    obj.cost += e.cost ?? 0;
    weeklyMap.set(key, obj);
  }
  for (const [key,val] of Array.from(weeklyMap.entries()).sort()) {
    const m = new Date(key); const s = new Date(m.getTime()); s.setDate(m.getDate()+6);
    weeks.push({ week: `${m.toLocaleDateString()}–${s.toLocaleDateString()}`, stdDrinks: val.std, cost: Number(val.cost.toFixed(2)) });
  }

  // 30-day line (sum per day)
  const line: { date: string; stdDrinks: number }[] = [];
  const now = new Date(); const start = new Date(); start.setDate(now.getDate()-29); start.setHours(0,0,0,0);
  const perDay = new Map<number, number>();
  for (let t=start.getTime(); t<=now.getTime(); t+=86400000) perDay.set(t, 0);
  for (const e of entries) {
    const d0 = startOfDay(e.ts);
    if (perDay.has(d0)) perDay.set(d0, (perDay.get(d0) ?? 0) + e.stdDrinks);
  }
  for (const [day,v] of Array.from(perDay.entries()).sort((a,b)=>a[0]-b[0])) {
    line.push({ date: new Date(day).toLocaleDateString(), stdDrinks: v });
  }

  return {
    weekly: weeks,
    line30: line,
    currentAFStreak: calcAFStreak(entries, 0),
    longestAFStreak: calcAFStreak(entries, 1),
    monthlySpend: (entries||[]).filter(e=>isSameMonth(e.ts, Date.now())).reduce((a,b)=>a+(b.cost??0),0)
  };
}

function updateStreakCounters(cur: number, max: number, longest: 0|1, drank: boolean): { cur: number; max: number } {
  if (!drank) {
    cur++;
    if (cur > max) max = cur;
  } else {
    if (longest === 0) {
      cur = 0;
    } else {
      if (cur > max) max = cur;
      cur = 0;
    }
  }
  return { cur, max };
}

function calcAFStreak(entries: Entry[], longest: 0|1) {
  const days = new Map<number, number>();
  entries.forEach(e=>{ const d = startOfDay(e.ts); days.set(d, (days.get(d)??0)+e.stdDrinks); });
  const today0 = startOfDay(Date.now());
  let max=0, cur=0;
  for (let i=1000;i>=0;i--) {
    const day = today0 - i*86400000;
    const drank = (days.get(day) ?? 0) > 0;
    const result = updateStreakCounters(cur, max, longest, drank);
    cur = result.cur;
    max = result.max;
  }
  return longest?max:cur;
}

function isSameMonth(a:number,b:number){ const A=new Date(a),B=new Date(b); return A.getFullYear()===B.getFullYear() && A.getMonth()===B.getMonth(); }

export function monthlyBreakdown(entries: Entry[]) {
  const map = new Map<number, number>();
  for (const e of entries) {
    const d = startOfDay(e.ts);
    if (isSameMonth(d, Date.now())) {
      map.set(d, (map.get(d)??0) + (e.cost??0));
    }
  }
  const arr = Array.from(map.entries()).map(([d,c])=>({ day:new Date(d), cost:Number(c.toFixed(2)) }));
  arr.sort((a,b)=>b.cost-a.cost);
  return arr;
}
