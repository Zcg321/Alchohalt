// @no-smoke
import React from 'react';
import { haltOptions } from './lib';
import type { Halt } from './lib';
import { useLanguage } from '../../../i18n';

interface Props {
  selected: Halt[];
  onChange(next: Halt[]): void;
}

export default function HaltChecks({ selected, onChange }: Props) {
  const { t } = useLanguage();
  return (
    <fieldset>
      <legend className="block font-medium">{t('haltLabel')}</legend>
      {haltOptions.map((h) => (
        <label key={h} className="me-2">
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
    </fieldset>
  );
}
