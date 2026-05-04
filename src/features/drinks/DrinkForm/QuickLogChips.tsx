import React from 'react';
import { useLanguage } from '../../../i18n';
import { hapticForEvent } from '../../../shared/haptics';
import { CHIPS } from './useDrinkForm';
import type { Drink } from './lib';

/**
 * [R23-D] Quick-log chips: tap-to-log a default-shape drink at the
 * current time without opening the detailed form.
 *
 * Defaults match useDrinkForm CHIPS (Beer 355ml/5%, Wine 150ml/12%,
 * Cocktail 60ml/40%) so the std-drink count is the same as if the
 * user picked the chip in the full form and submitted with empty
 * intention/craving/halt fields.
 *
 * Voice: "Tap to log 1 beer / wine / cocktail" — declarative, no
 * exclamation, follows the trusted-friend tone in voice-guidelines.md.
 *
 * Why three chips, not one: we never want a single ambiguous "+1
 * drink" because the std-drink count varies wildly between beer
 * (1.4 std drinks at 355ml × 5%) and a 40% cocktail (1.9 std
 * drinks at 60ml). The user picks once; the count is honest.
 */

interface Props {
  onLog: (drink: Drink) => void;
}

const QUICK_CHIPS = ['beer', 'wine', 'cocktail'] as const;
type QuickChipId = typeof QUICK_CHIPS[number];

export default function QuickLogChips({ onLog }: Props) {
  const { t } = useLanguage();

  const handleTap = (id: QuickChipId) => {
    const c = CHIPS.find((x) => x.id === id);
    if (!c) return;
    onLog({
      volumeMl: c.volumeMl,
      abvPct: c.abvPct,
      intention: 'social',
      craving: 0,
      halt: [],
      alt: '',
      ts: Date.now(),
    });
    hapticForEvent('drink-logged');
  };

  return (
    <div
      className="grid grid-cols-3 gap-2"
      data-testid="quick-log-chips"
      role="group"
      aria-label={t('drinkLog.quick.groupLabel', 'Quick log a drink')}
    >
      {QUICK_CHIPS.map((id) => {
        const fallbackLabel = id.charAt(0).toUpperCase() + id.slice(1);
        return (
          <button
            key={id}
            type="button"
            onClick={() => handleTap(id)}
            data-testid={`quick-log-${id}`}
            className="rounded-2xl border border-border-soft bg-surface-elevated px-4 py-4 text-center text-sm font-medium text-ink hover:bg-cream-50 dark:hover:bg-charcoal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 transition-colors min-h-[64px]"
          >
            <div className="text-base font-semibold">
              {t(`drinkLog.quick.${id}`, fallbackLabel)}
            </div>
            <div className="text-xs text-ink-soft mt-1">
              {t('drinkLog.quick.tapToLog', 'Tap to log')}
            </div>
          </button>
        );
      })}
    </div>
  );
}
