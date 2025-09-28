// @no-smoke
import React, { useRef, useState, Suspense } from 'react';
import { Button } from '../../../components/ui/Button';
const WeeklyChart = React.lazy(() => import('../WeeklyChart'));
const MonthlyTrend = React.lazy(() => import('../MonthlyTrend'));
import { useLanguage } from '../../../i18n';
import TopSection from './TopSection';
import BehaviorSection from './BehaviorSection';
import SpendSection from './SpendSection';
import { useStats, useFormatters } from './lib';
import type { Drink } from '../../drinks/DrinkForm';
import type { Goals } from '../../goals/GoalSettings';

interface Props {
  drinks: Drink[];
  goals: Goals;
}

export default function Stats({ drinks, goals }: Props) {
  const { t } = useLanguage();
  const data = useStats(drinks, goals);
  const { nf1, cf } = useFormatters();
  const exportRef = useRef<HTMLAnchorElement>(null);
  const [status, setStatus] = useState('');
  const [showCharts, setShowCharts] = useState(false);

  function exportStats() {
    const summary = {
      streak: data.streak,
      longest: data.longest,
      weekStd: data.weekStd,
      monthStd: data.monthStd,
      avgPerDrinkDay30: data.avgPerDrinkDay30,
      afDays30: data.afDays30,
      daysSinceLast: data.daysSinceLast,
    };
    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    if (exportRef.current) {
      exportRef.current.href = url;
      exportRef.current.download = `alchohalt-stats-${Date.now()}.json`;
      exportRef.current.click();
      URL.revokeObjectURL(url);
      setStatus(t('stats.exportReady'));
    }
  }

  function share() {
    const lines = [
      `${t('stats.share.afStreak')}: ${data.streak} ${t('stats.daysShort')}`,
      `${t('stats.share.week')}: ${nf1.format(data.weekStd)} ${t('stats.std')}`,
      `${t('stats.share.avgPerDay')}: ${nf1.format(data.monthStd / 30)}`,
    ];
    const text = lines.join('\n');
    if (navigator.share) {
      navigator.share({ text });
      setStatus('');
    } else {
      navigator.clipboard
        .writeText(text)
        .then(() => setStatus(t('stats.progressCopied')));
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold flex items-center">
          <span className="w-2 h-2 bg-success-500 rounded-full mr-3"></span>
          {t('stats.title')}
        </h2>
      </div>
      
      <div className="card-content space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TopSection data={data} goals={goals} nf1={nf1} t={t} />
        </div>
        
        <div className="space-y-4">
          <BehaviorSection data={data} t={t} />
          <SpendSection data={data} goals={goals} cf={cf} t={t} />
        </div>
        
        {showCharts && (
          <div className="space-y-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <Suspense fallback={
              <div className="space-y-4">
                <div className="skeleton h-64 w-full rounded-lg"></div>
                <div className="skeleton h-64 w-full rounded-lg"></div>
              </div>
            }>
              <WeeklyChart />
              <MonthlyTrend />
            </Suspense>
          </div>
        )}
      </div>
      
      <div className="card-footer">
        <div className="flex flex-wrap gap-3">
          {!showCharts && (
            <Button 
              onClick={() => setShowCharts(true)} 
              aria-label={t('stats.showCharts')}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            >
              {t('stats.showCharts')}
            </Button>
          )}
          
          <Button 
            variant="secondary"
            onClick={share} 
            aria-label={t('stats.shareProgressDesc')}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            }
          >
            {t('stats.shareProgress')}
          </Button>
          
          <Button
            variant="ghost"
            onClick={exportStats}
            aria-label={t('stats.exportStats')}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          >
            {t('stats.exportStats')}
          </Button>
        </div>
        
        <a ref={exportRef} className="hidden" />
        
        {status && (
          <div className="mt-4 p-3 bg-success-50 border border-success-200 text-success-800 rounded-lg text-sm dark:bg-success-900/50 dark:border-success-800 dark:text-success-300" role="status">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
