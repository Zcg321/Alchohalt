/**
 * DrinkForm — progressive disclosure ([IA-3], Sprint 2B).
 *
 * Default surface = drink-type chip + time. Add button.
 * "Add detail ▾" expands volume + ABV (defaulted from the chip).
 * "More ▾" expands intention chips, craving slider, HALT vector, and
 * the alternative-action input.
 *
 * Disclosure state is session-only — every fresh log starts collapsed
 * at the simplest level. Submitting closes both expansions.
 */

import React from 'react';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Button } from '../../../components/ui/Button';
import { useLanguage } from '../../../i18n';
import PresetButtons from './PresetButtons';
import { useDrinkForm } from './useDrinkForm';
import { DrinkChipSelector } from './DrinkChipSelector';
import { DrinkDetailPanel } from './DrinkDetailPanel';
import { DrinkMorePanel } from './DrinkMorePanel';
import type { Drink } from './lib';
import type { DrinkPreset } from '../DrinkPresets';

interface Props {
  onSubmit(drink: Drink): void;
  initial?: Drink | undefined;
  submitLabel?: string | undefined;
  onCancel?: (() => void) | undefined;
  presets?: DrinkPreset[] | undefined;
}

export default function DrinkForm({ onSubmit, initial, submitLabel, onCancel, presets }: Props) {
  const { t } = useLanguage();
  const label = submitLabel ?? t('add');
  const f = useDrinkForm(initial, onSubmit);

  const submitDisabled = f.chip === 'custom' && (!f.volume || !f.abv);

  return (
    <form id="drink-form" onSubmit={f.submit} className="space-y-6">
      <DrinkChipSelector selected={f.chip} onSelect={f.applyChip} />

      {presets && presets.length > 0 && (
        <div>
          <span className="block text-caption text-ink-soft mb-2">Saved presets</span>
          <PresetButtons presets={presets} onSelect={f.applyPreset} />
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="drink-time">When?</Label>
        <Input
          id="drink-time"
          type="datetime-local"
          value={f.time}
          onChange={(e) => f.setTime(e.target.value)}
        />
      </div>

      <DrinkDetailPanel
        show={f.showDetail}
        onToggle={() => f.setShowDetail((s) => !s)}
        volume={f.volume}
        abv={f.abv}
        onVolumeChange={(v) => {
          f.setVolume(v);
          f.setChip('custom');
        }}
        onAbvChange={(a) => {
          f.setAbv(a);
          f.setChip('custom');
        }}
      />

      <DrinkMorePanel
        show={f.showMore}
        onToggle={() => f.setShowMore((s) => !s)}
        intention={f.intention}
        setIntention={f.setIntention}
        craving={f.craving}
        setCraving={f.setCraving}
        halt={f.halt}
        setHalt={f.setHalt}
        alt={f.alt}
        setAlt={f.setAlt}
      />

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border-soft">
        <Button type="submit" className="flex-1 sm:flex-none min-h-[44px]" disabled={submitDisabled}>
          {label}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="flex-1 sm:flex-none min-h-[44px]"
          >
            {t('cancel')}
          </Button>
        )}
      </div>
    </form>
  );
}

export * from './lib';
