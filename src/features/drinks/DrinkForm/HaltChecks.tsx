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
      {/* [R25-3] Disability-rights / plain-language audit. The bare
          "HALT" acronym is opaque to first-time users, low-literacy
          users, and ESL users. The four-word expansion below names
          the underlying state so the term is self-explaining on every
          render. Renders as caption text under the legend so it
          doesn't change the form layout for returning users. */}
      <p
        id="halt-explanation"
        className="mt-1 mb-2 text-xs text-ink-soft"
        data-testid="halt-explanation"
      >
        {t('haltExplanation', 'Hungry, Angry, Lonely, Tired — common triggers to notice.')}
      </p>
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
            aria-describedby="halt-explanation"
          />{' '}
          {t(`halt_${h}`)}
        </label>
      ))}
    </fieldset>
  );
}
