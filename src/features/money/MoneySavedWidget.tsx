import React from 'react';
import { useLanguage } from '../../i18n';

/**
 * Money-saved widget — owner-locked spec, FREE feature.
 *
 * "Sum logged drinks × cost into a visible widget on the home screen."
 *
 * Math:
 *   - sum every drink's `cost` field over the last 30 days
 *   - if user set a monthly budget, compute "saved" = max(0, budget - spent)
 *   - if no budget set, just show "spent" so the number is still useful
 *
 * Privacy: pure local computation. No fetch. No analytics ping.
 */

export interface MoneySavedProps {
  /** Last 30 days' drink costs (already filtered by caller). */
  costs: number[];
  /** User's monthly budget from Settings; 0 means "not set". */
  monthlyBudget: number;
  className?: string;
}

const formatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function computeMoneyStats(
  costs: number[],
  monthlyBudget: number,
): { spent: number; saved: number; mode: 'budget' | 'spent-only' } {
  const spent = costs.reduce((s, c) => s + (Number.isFinite(c) ? c : 0), 0);
  if (monthlyBudget > 0) {
    return {
      spent,
      saved: Math.max(0, monthlyBudget - spent),
      mode: 'budget',
    };
  }
  return { spent, saved: 0, mode: 'spent-only' };
}

export default function MoneySavedWidget({
  costs,
  monthlyBudget,
  className = '',
}: MoneySavedProps) {
  const { t } = useLanguage();
  const { spent, saved, mode } = computeMoneyStats(costs, monthlyBudget);

  return (
    <div
      className={`card ${className}`}
      data-testid="money-saved-widget"
    >
      <div className="card-content text-center">
        {mode === 'budget' ? (
          <>
            <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-neutral-500 dark:text-neutral-400">
              {t('money.savedThisMonth')}
            </div>
            <div className="mt-1.5 stat-num text-4xl sm:text-5xl text-success-600 dark:text-success-400 leading-none">
              {formatter.format(saved)}
            </div>
            <div className="mt-3 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              {t('money.spentVsBudget')
                .replace('{{spent}}', formatter.format(spent))
                .replace('{{budget}}', formatter.format(monthlyBudget))}
            </div>
          </>
        ) : (
          <>
            <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-neutral-500 dark:text-neutral-400">
              {t('money.spentLast30')}
            </div>
            <div className="mt-1.5 stat-num text-4xl sm:text-5xl text-neutral-900 dark:text-neutral-50 leading-none">
              {formatter.format(spent)}
            </div>
            <div className="mt-3 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              {t('money.setBudgetHint')}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
