import React from 'react';
import { Button } from '../../../components/ui/Button';
import type { DrinkPreset } from '../DrinkPresets';
import { stdDrinks } from '../../../lib/calc';

interface Props {
  presets: DrinkPreset[];
  onSelect(p: DrinkPreset): void;
}

/**
 * [R13-1] Display the std-drink count next to the preset name so the
 * user knows what they're picking before they tap. The round-13 brief
 * was: "tap to log 'my usual IPA (1 std)', 'my pour of red wine
 * (1.5 std)', 'espresso martini (2 std)' without re-entering."
 *
 * Calc is std-drinks rounded to one decimal; "1.0" is shown as "1"
 * to keep the label compact, "1.5" shows as "1.5". Labels stay
 * tabular-nums-aligned so a column of presets reads cleanly.
 */
function formatStd(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export default function PresetButtons({ presets, onSelect }: Props) {
  if (!presets || presets.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((p) => {
        const std = stdDrinks(p.volumeMl, p.abvPct);
        return (
          <Button
            key={p.name}
            type="button"
            variant="secondary"
            onClick={() => onSelect(p)}
            data-testid={`preset-button-${p.name}`}
            aria-label={`Apply preset ${p.name}, approximately ${formatStd(std)} standard drinks`}
          >
            <span>{p.name}</span>
            <span className="ms-1.5 text-caption text-ink-subtle tabular-nums">
              ({formatStd(std)} std)
            </span>
          </Button>
        );
      })}
    </div>
  );
}
