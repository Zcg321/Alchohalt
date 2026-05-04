/**
 * [R26-A] Settings tooltip explaining what "1 std drink" means in the
 * user's chosen jurisdiction.
 *
 * Renders as a `<details>` collapsed by default, so users who already
 * know the term don't pay attention-cost; users who don't can expand
 * inline without leaving the screen. The label changes when the
 * jurisdiction picker changes — keeps the explanation in sync without
 * extra state.
 *
 * Voice: factual + concrete. No marketing, no nudging. The point is
 * a non-specialist reader can answer "1 std drink ≈ what?" in 5
 * seconds without consulting a health-authority website.
 */
import React from 'react';
import { useDB } from '../../store/db';
import { useLanguage } from '../../i18n';
import { getStdDrinkExplanationLocalized } from '../../lib/stdDrinkExplanation';
import type { StdDrinkSystem } from '../../lib/calc';

export default function StdDrinkExplanation() {
  const system = useDB((s) => s.db.settings.stdDrinkSystem) as StdDrinkSystem | undefined;
  const { t } = useLanguage();
  const explanation = getStdDrinkExplanationLocalized(system, t);
  const summary = t(
    'settings.stdDrink.explainSummary',
    'What does "1 std drink" mean here?',
  );
  const equalsLine = t('settings.stdDrink.equalsLine', 'Roughly equal to:');
  const sourcePrefix = t('settings.stdDrink.sourcePrefix', 'Source:');
  const changeHint = t(
    'settings.stdDrink.changeHint',
    'Change the picker above to use a different definition.',
  );
  return (
    <details
      data-testid="stddrink-explainer"
      className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50/60 p-3 text-xs dark:border-neutral-700 dark:bg-neutral-900/40"
    >
      <summary className="cursor-pointer font-medium text-neutral-700 dark:text-neutral-200">
        {summary}
      </summary>
      <div className="mt-2 space-y-2 text-neutral-600 dark:text-neutral-400">
        <p data-testid="stddrink-grams">
          <span className="font-medium">{explanation.label}</span>
          {' = '}
          {explanation.grams}
          {t('settings.stdDrink.gramsSuffix', 'g pure alcohol.')}
        </p>
        <p>{equalsLine}</p>
        <ul className="list-disc list-inside space-y-1" data-testid="stddrink-equivalences">
          {explanation.equivalences.map((eq) => (
            <li key={eq}>{eq}</li>
          ))}
        </ul>
        <p className="text-neutral-500 dark:text-neutral-500">
          {sourcePrefix} {explanation.authority}. {changeHint}
        </p>
      </div>
    </details>
  );
}
