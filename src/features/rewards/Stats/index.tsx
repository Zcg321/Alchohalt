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
    <>
      <dl className="space-y-2">
        <TopSection data={data} goals={goals} nf1={nf1} t={t} />
        <BehaviorSection data={data} t={t} />
        <SpendSection data={data} goals={goals} cf={cf} t={t} />
      </dl>
      {showCharts && (
        <Suspense fallback={null}>
          <WeeklyChart />
          <MonthlyTrend />
        </Suspense>
      )}
      <div className="mt-4 space-x-2">
        {!showCharts && (
          <Button onClick={() => setShowCharts(true)} aria-label={t('stats.showCharts')}>
            {t('stats.showCharts')}
          </Button>
        )}
        <Button onClick={share} aria-label={t('stats.shareProgressDesc')}>
          {t('stats.shareProgress')}
        </Button>
        <Button
          variant="secondary"
          onClick={exportStats}
          aria-label={t('stats.exportStats')}
        >
          {t('stats.exportStats')}
        </Button>
        <a ref={exportRef} className="hidden" />
      </div>
      {status && (
        <p role="status" className="mt-2 text-sm text-gray-600">
          {status}
        </p>
      )}
    </>
  );
}
