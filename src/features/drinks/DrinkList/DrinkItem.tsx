// @no-smoke
import React from 'react';
import { Button } from '../../../components/ui/Button';
import { stdDrinks } from '../../../lib/calc';
import type { Drink } from '../DrinkForm';
import { useLanguage } from '../../../i18n';
import { formatTime, formatStdDrinks } from '../../../lib/format';
import { useBulkSelection } from './BulkSelectionContext';

interface Props {
  drink: Drink;
  onEdit?: ((d: Drink) => void) | undefined;
  onDelete?: ((ts: number) => void) | undefined;
}

export default function DrinkItem({ drink, onEdit, onDelete }: Props) {
  const { t, lang } = useLanguage();
  const bulk = useBulkSelection();
  const isSelected = bulk?.active ? bulk.selected.has(drink.ts) : false;

  // In bulk mode, the row becomes a checkbox-toggle. The single-row
  // edit/delete buttons hide so the row reads as a selection target,
  // not a per-row action affordance.
  if (bulk?.active) {
    return (
      <li>
        <label
          className={`flex items-center gap-3 rounded-lg px-2 py-2 cursor-pointer transition-colors ${
            isSelected ? 'bg-sage-50' : 'hover:bg-cream-50'
          }`}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => bulk.toggle(drink.ts)}
            aria-label={`Select drink at ${formatTime(drink.ts, lang, { hour: '2-digit', minute: '2-digit' })}`}
            className="h-4 w-4 accent-sage-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500"
            data-testid={`bulk-checkbox-${drink.ts}`}
          />
          <span className="flex-1 text-body">
            {formatTime(drink.ts, lang, { hour: '2-digit', minute: '2-digit' })}{' '} - {drink.intention} -
            {formatStdDrinks(stdDrinks(drink.volumeMl, drink.abvPct), lang)} std - craving {drink.craving}
            {drink.halt.length ? ` HALT: ${drink.halt.join(',')}` : ''}
            {drink.alt ? ` alt: ${drink.alt}` : ''}
            {drink.tags && drink.tags.length > 0 ? (
              <span className="ms-1 text-caption text-ink-soft" data-testid={`drink-tags-${drink.ts}`}>
                {drink.tags.map((tag) => `#${tag}`).join(' ')}
              </span>
            ) : null}
          </span>
        </label>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2">
      <span>
        {formatTime(drink.ts, lang, { hour: '2-digit', minute: '2-digit' })}{' '} - {drink.intention} -
        {formatStdDrinks(stdDrinks(drink.volumeMl, drink.abvPct), lang)} std - craving {drink.craving}
        {drink.halt.length ? ` HALT: ${drink.halt.join(',')}` : ''}
        {drink.alt ? ` alt: ${drink.alt}` : ''}
        {drink.tags && drink.tags.length > 0 ? (
          <span className="ms-1 text-caption text-ink-soft" data-testid={`drink-tags-${drink.ts}`}>
            {drink.tags.map((tag) => `#${tag}`).join(' ')}
          </span>
        ) : null}
      </span>
      {(onEdit || onDelete) && (
        <div className="ms-auto space-x-1">
          {onEdit && (
            <Button
              variant="secondary"
              onClick={() => onEdit(drink)}
              className="px-2 py-1 text-xs"
              aria-label={t('edit')}
            >
              {t('edit')}
            </Button>
          )}
          {onDelete && (
            <Button
              variant="danger"
              onClick={() =>
                window.confirm(t('deleteConfirm')) && onDelete(drink.ts)
              }
              className="px-2 py-1 text-xs"
              aria-label={t('delete')}
            >
              {t('delete')}
            </Button>
          )}
        </div>
      )}
    </li>
  );
}
