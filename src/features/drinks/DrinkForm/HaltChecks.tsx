// @no-smoke
import React from 'react';
import { haltOptions, Halt } from './lib';
import { useLanguage } from '../../../i18n';

interface Props {
  selected: Halt[];
  onChange(next: Halt[]): void;
}

export default function HaltChecks({ selected, onChange }: Props) {
  const { t } = useLanguage();
  return (
    <div>
      <span className="block font-medium">{t('haltLabel')}</span>
      {haltOptions.map((h) => (
        <label key={h} className="mr-2">
          <input
            type="checkbox"
            checked={selected.includes(h)}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? [...selected, h]
                  : selected.filter((x) => x !== h)
              )
            }
          />{' '}
          {t(`halt_${h}`)}
        </label>
      ))}
    </div>
  );
}
