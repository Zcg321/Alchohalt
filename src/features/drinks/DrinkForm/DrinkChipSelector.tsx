import React from 'react';
import { CHIPS, type DrinkChipId } from './useDrinkForm';

export function DrinkChipSelector({
  selected,
  onSelect,
}: {
  selected: DrinkChipId;
  onSelect: (id: DrinkChipId) => void;
}) {
  return (
    <div className="space-y-2">
      <span id="drink-type-label" className="block text-caption font-medium text-ink">
        What did you have?
      </span>
      <div role="radiogroup" aria-labelledby="drink-type-label" className="flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={selected === c.id}
            onClick={() => onSelect(c.id)}
            className={`px-4 py-2 rounded-pill text-caption transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px] ${
              selected === c.id
                ? 'bg-sage-700 text-white border-sage-700'
                : 'bg-surface text-ink border border-border-soft hover:bg-cream-50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
