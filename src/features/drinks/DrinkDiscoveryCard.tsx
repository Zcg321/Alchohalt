import React from 'react';
import { Button } from '../../components/ui/Button';
import { DRINK_CATEGORIES, type DrinkInfo } from './drinkDatabase';

interface Props {
  drink: DrinkInfo;
  expanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  isPremium: boolean;
}

function CardHeader({ drink }: { drink: DrinkInfo }) {
  const icon = DRINK_CATEGORIES.find((c) => c.id === drink.category)?.icon || '🥤';
  return (
    <div className="p-4 pb-2">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{drink.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{drink.description}</p>
        </div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ms-2 flex-shrink-0"
          style={{ backgroundColor: drink.color + '20', color: drink.color }}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs stat-num text-neutral-500 dark:text-neutral-400">
        <span>{drink.typicalAbv}% ABV</span>
        <span aria-hidden>·</span>
        <span>{drink.typicalVolumeMl} ml</span>
      </div>
    </div>
  );
}

function ExpandedDetails({ drink, isPremium }: { drink: DrinkInfo; isPremium: boolean }) {
  return (
    <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="pt-3 space-y-2 text-xs">
        {drink.origin && (
          <div>
            <strong>Origin:</strong> {drink.origin}
          </div>
        )}
        {drink.health_facts && (
          <div>
            <strong>Health Info:</strong> {drink.health_facts.calories_per_std} cal/std drink
            {drink.health_facts.gluten_free && ', Gluten-free'}
            {drink.health_facts.antioxidants && ', Contains antioxidants'}
          </div>
        )}
        {drink.alcohol_free_alternatives && (
          <div>
            <strong>AF Alternatives:</strong> {drink.alcohol_free_alternatives.slice(0, 2).join(', ')}
          </div>
        )}
        {isPremium && drink.pairing_suggestions && (
          <div className="text-primary-600 dark:text-primary-400">
            <strong>
              <span aria-hidden="true">🍴</span> Premium Pairings:
            </strong>{' '}
            {drink.pairing_suggestions.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}

export function DrinkDiscoveryCard({ drink, expanded, onToggle, onSelect, isPremium }: Props) {
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer"
      onClick={onToggle}
    >
      <CardHeader drink={drink} />
      {expanded && <ExpandedDetails drink={drink} isPremium={isPremium} />}
      <div className="p-3 bg-gray-50 dark:bg-gray-800/50">
        <Button
          variant="outline"
          className="w-full text-xs h-8"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          Use This Drink
        </Button>
      </div>
    </div>
  );
}
