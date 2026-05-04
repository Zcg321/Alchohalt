/**
 * [R24-FF1] Quick-log discoverability hint.
 *
 * After the user has logged ≥ 7 drinks while still on the detailed
 * form, surface a one-shot calm banner letting them know quick-log
 * mode exists. Two actions: switch now (sets drinkLogMode='quick'),
 * or dismiss. Either action records a timestamp; the banner never
 * resurfaces. The threshold is high enough that we're not nagging
 * brand-new users — by 7 entries someone's clearly using the app.
 *
 * Voice: factual + a question. No "you should...", no exclamation,
 * no urgency. Mirrors the GoalNudgeBanner pattern from R15-2.
 *
 * Render contract: parent decides when to mount. This component
 * does not gate on the threshold itself — the host (TrackTab) does
 * that, because TrackTab already has drinks, settings, and editing
 * state in scope. Keeping the gate in TrackTab means tests can
 * mount the banner directly without faking a 7-drink history.
 */
import React from 'react';
import { useDB } from '../../../store/db';
import { useLanguage } from '../../../i18n';
import { hapticForEvent } from '../../../shared/haptics';

interface Props {
  /** Optional override so tests don't have to mock Date.now. */
  now?: () => number;
}

export default function QuickLogHintBanner({ now = Date.now }: Props) {
  const setSettings = useDB((s) => s.setSettings);
  const { t } = useLanguage();

  function recordResponse(switchToQuick: boolean) {
    const ts = now();
    if (switchToQuick) {
      setSettings({ drinkLogMode: 'quick', quickLogHintAt: ts });
      hapticForEvent('settings-toggle');
    } else {
      setSettings({ quickLogHintAt: ts });
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="quick-log-hint-banner"
      className="rounded-2xl border border-border-soft bg-surface-elevated p-card space-y-3 mb-4"
    >
      <p className="text-body text-ink">
        {t(
          'drinkLog.quick.hint.body',
          'After a few entries, some people prefer 1-tap chips for everyday drinks. The detailed form stays one tap away.',
        )}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => recordResponse(true)}
          data-testid="quick-log-hint-switch"
          className="rounded-full bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-600 dark:hover:bg-primary-700"
        >
          {t('drinkLog.quick.hint.switch', 'Use quick mode')}
        </button>
        <button
          type="button"
          onClick={() => recordResponse(false)}
          data-testid="quick-log-hint-dismiss"
          className="text-sm text-ink-soft underline underline-offset-2 hover:text-ink"
        >
          {t('drinkLog.quick.hint.dismiss', 'Not now')}
        </button>
      </div>
    </div>
  );
}

const QUICK_LOG_HINT_THRESHOLD = 7;

/**
 * Shared gate so the banner shows in exactly the same conditions
 * everywhere it's used. Parent host (TrackTab) calls this; banner
 * itself doesn't, because the parent already has these values in
 * scope and we don't want a second subscription to useDB.
 */
export function shouldShowQuickLogHint(opts: {
  drinkCount: number;
  drinkLogMode: 'quick' | 'detailed' | undefined;
  quickLogHintAt: number | undefined;
  editing: boolean;
}): boolean {
  if (opts.editing) return false;
  if (opts.drinkLogMode === 'quick') return false;
  if (opts.quickLogHintAt !== undefined) return false;
  return opts.drinkCount >= QUICK_LOG_HINT_THRESHOLD;
}

export { QUICK_LOG_HINT_THRESHOLD };
