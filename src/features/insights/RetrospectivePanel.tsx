import React, { useState } from 'react';
import { useDB } from '../../store/db';
import { useLanguage } from '../../i18n';
import {
  computeRetrospective,
  pickRetrospectiveWindow,
  shouldShowRetrospectivePrompt,
} from './retrospective';

/**
 * [R10-2] Long-term retrospective prompt + view.
 *
 * Behavior:
 *   - If the user has 60+ days of history and hasn't seen a prompt in
 *     30 days, surface the prompt on the Insights tab.
 *   - The user can dismiss (sets retrospectivePromptLastShownTs=now)
 *     or open the retrospective.
 *   - Opening shows the largest available window's deltas.
 *
 * The prompt is intentionally low-friction — one tap dismisses, the
 * data is on-device only, no notification, no badge.
 */
export default function RetrospectivePanel() {
  const { t } = useLanguage();
  const { db, setSettings } = useDB();
  const [open, setOpen] = useState(false);

  const window = pickRetrospectiveWindow(db.entries);
  const shouldPrompt = shouldShowRetrospectivePrompt(db.settings.retrospectivePromptLastShownTs);

  if (!window) return null; // No prior-window data → no retro to show

  const dismiss = () => {
    setSettings({ retrospectivePromptLastShownTs: Date.now() });
  };

  const openRetro = () => {
    setOpen(true);
    setSettings({ retrospectivePromptLastShownTs: Date.now() });
  };

  if (open) {
    const retro = computeRetrospective(db.entries, window);
    return (
      <RetrospectiveView retro={retro} onClose={() => setOpen(false)} />
    );
  }

  if (!shouldPrompt) return null;

  return (
    <section
      aria-labelledby="retro-prompt-heading"
      className="card border-l-4 border-emerald-400 dark:border-emerald-600"
      data-testid="retro-prompt"
    >
      <div className="card-content flex items-start justify-between gap-3">
        <div>
          <h3 id="retro-prompt-heading" className="font-semibold text-base">
            {t('retrospective.promptTitle', "It's been a month")}
          </h3>
          <p className="text-sm text-ink-soft mt-1">
            {t(
              'retrospective.promptBody',
              `Want to see what's changed in the last ${window.label} window?`
            ).replace('{{label}}', window.label)}
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn btn-primary" onClick={openRetro} data-testid="retro-open">
              {t('retrospective.open', 'See it')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={dismiss} data-testid="retro-dismiss">
              {t('retrospective.dismiss', 'Not now')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

interface ViewProps {
  retro: ReturnType<typeof computeRetrospective>;
  onClose: () => void;
}

function RetrospectiveView({ retro, onClose }: ViewProps) {
  const { t } = useLanguage();
  const fmtPct = (n: number | null): string => {
    if (n === null) return '—';
    return `${n > 0 ? '+' : ''}${n.toFixed(0)}%`;
  };
  const dirClass = (n: number | null, lowerIsBetter: boolean) => {
    if (n === null || n === 0) return 'text-ink-soft';
    const better = lowerIsBetter ? n < 0 : n > 0;
    return better ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300';
  };

  return (
    <section className="card" data-testid="retro-view">
      <div className="card-header flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {t('retrospective.viewTitle', '{{label}} retrospective').replace('{{label}}', retro.window.label)}
          </h3>
          <p className="text-sm text-ink-soft mt-1">
            {t('retrospective.viewSubtitle', 'Recent {{n}} days vs the prior {{n}}.').replace(
              /\{\{n\}\}/g,
              String(retro.window.days)
            )}
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-sm" aria-label="Close">
          ✕
        </button>
      </div>
      <div className="card-content space-y-3">
        <Row
          label={t('retrospective.totalDrinks', 'Total drinks')}
          recent={retro.recent.totalStdDrinks.toFixed(0)}
          prior={retro.prior?.totalStdDrinks.toFixed(0) ?? '—'}
          delta={fmtPct(retro.totalDelta.pct)}
          deltaClass={dirClass(retro.totalDelta.pct, true)}
        />
        <Row
          label={t('retrospective.afDays', 'AF days')}
          recent={String(retro.recent.afDays)}
          prior={retro.prior ? String(retro.prior.afDays) : '—'}
          delta={fmtPct(retro.afDelta.pct)}
          deltaClass={dirClass(retro.afDelta.pct, false)}
        />
        <Row
          label={t('retrospective.avgCraving', 'Avg craving')}
          recent={retro.recent.avgCraving.toFixed(1)}
          prior={retro.prior?.avgCraving.toFixed(1) ?? '—'}
          delta={fmtPct(retro.cravingDelta.pct)}
          deltaClass={dirClass(retro.cravingDelta.pct, true)}
        />
      </div>
    </section>
  );
}

interface RowProps {
  label: string;
  recent: string;
  prior: string;
  delta: string;
  deltaClass: string;
}

function Row({ label, recent, prior, delta, deltaClass }: RowProps) {
  return (
    <div className="grid grid-cols-4 gap-2 text-sm items-baseline">
      <div className="text-xs uppercase tracking-wider text-ink-soft col-span-1">{label}</div>
      <div className="tabular-nums">{recent}</div>
      <div className="tabular-nums text-ink-soft">{prior}</div>
      <div className={`tabular-nums font-medium text-right ${deltaClass}`}>{delta}</div>
    </div>
  );
}
