// @no-smoke
import React from 'react';
import { Button } from '../../../components/ui/Button';
import { stdDrinks } from '../../../lib/calc';
import { Drink } from '../DrinkForm';
import { useLanguage } from '../../../i18n';

interface Props {
  drink: Drink;
  onEdit?: (d: Drink) => void;
  onDelete?: (ts: number) => void;
}

export default function DrinkItem({ drink, onEdit, onDelete }: Props) {
  const { t } = useLanguage();
  return (
    <li className="flex items-center gap-2">
      <span>
        {new Date(drink.ts).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}{' '} - {drink.intention} -
        {stdDrinks(drink.volumeMl, drink.abvPct).toFixed(2)} std - craving {drink.craving}
        {drink.halt.length ? ` HALT: ${drink.halt.join(',')}` : ''}
        {drink.alt ? ` alt: ${drink.alt}` : ''}
      </span>
      {(onEdit || onDelete) && (
        <div className="ml-auto space-x-1">
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
