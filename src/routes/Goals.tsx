import React from 'react';
import { useDB } from '../store/db';
import { useLanguage } from '../i18n';

export default function Goals() {
  const { todayTotal, weekTotal, db, stats } = useDB(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any) => ({ todayTotal: s.todayTotal, weekTotal: s.weekTotal, db: s.db, stats: s.stats })
  );
  const { t } = useLanguage();
  const daily = db.settings.dailyGoalDrinks;
  const weekly = db.settings.weeklyGoalDrinks;
  const dayPct = Math.min(100, daily > 0 ? (todayTotal / daily) * 100 : todayTotal === 0 ? 0 : 100);
  const weekPct = Math.min(100, weekly > 0 ? (weekTotal / weekly) * 100 : weekTotal === 0 ? 0 : 100);
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">{t('goals.title')}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="p-4 rounded-2xl border">
          <div className="flex justify-between mb-2">
            <span className="font-medium">{t('goals.progress.today')}</span>
            <span>{todayTotal} / {daily}</span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-3">
            <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${dayPct}%` }} />
          </div>
          <div className="mt-2 text-sm opacity-80">{t('goals.daily')}</div>
        </div>
        <div className="p-4 rounded-2xl border">
          <div className="flex justify-between mb-2">
            <span className="font-medium">{t('goals.progress.week')}</span>
            <span>{weekTotal} / {weekly}</span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-3">
            <div className="bg-green-600 h-3 rounded-full" style={{ width: `${weekPct}%` }} />
          </div>
          <div className="mt-2 text-sm opacity-80">{t('goals.weekly')}</div>
        </div>
        <div className="p-4 rounded-2xl border">
          <div className="text-sm opacity-80">{t('goals.afStreak')}</div>
          <div className="text-3xl font-bold">{stats.currentAFStreak ?? 0}</div>
        </div>
        <div className="p-4 rounded-2xl border">
          <div className="text-sm opacity-80">{t('goals.longestStreak')}</div>
          <div className="text-3xl font-bold">{stats.longestAFStreak ?? 0}</div>
        </div>
      </div>
    </div>
  );
}
