import React, { useState, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import type { Drink } from './DrinkForm';
import {
  type DrinkInfo,
  DRINK_CATEGORIES,
  searchDrinks,
  getDrinksByCategory,
  getPopularDrinks,
} from './drinkDatabase';
import { usePremiumFeatures } from '../subscription/subscriptionStore';
import { useAnalytics } from '../analytics/analytics';
import { DrinkDiscoveryCard } from './DrinkDiscoveryCard';

interface Props {
  onSelectDrink: (drink: Partial<Drink>) => void;
  className?: string;
}

function useDrinkSearch(searchQuery: string, selectedCategory: string, isPremium: boolean) {
  return useMemo(() => {
    if (selectedCategory === 'all' && !searchQuery) {
      return getPopularDrinks(isPremium ? 12 : 6);
    }
    let drinks = searchQuery ? searchDrinks(searchQuery) : [];
    if (selectedCategory !== 'all' && !searchQuery) {
      drinks = getDrinksByCategory(selectedCategory);
    } else if (selectedCategory !== 'all' && searchQuery) {
      drinks = drinks.filter((drink) => drink.category === selectedCategory);
    }
    return drinks.slice(0, isPremium ? 20 : 8);
  }, [searchQuery, selectedCategory, isPremium]);
}

function DiscoveryHeader({
  isPremium,
  resultCount,
}: {
  isPremium: boolean;
  resultCount: number;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          <span aria-hidden="true">🍺</span> Discover Drinks
        </h2>
        {!isPremium && (
          <Badge variant="outline" className="text-xs">
            {resultCount}/6 Free
          </Badge>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Find detailed info about drinks to log accurately
      </p>
    </div>
  );
}

function CategoryFilters({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selected === 'all' ? 'primary' : 'outline'}
          className="text-xs h-8 px-3"
          onClick={() => onSelect('all')}
        >
          All
        </Button>
        {DRINK_CATEGORIES.map((category) => (
          <Button
            key={category.id}
            variant={selected === category.id ? 'primary' : 'outline'}
            className="text-xs h-8 px-3"
            onClick={() => onSelect(category.id)}
          >
            <span aria-hidden="true">{category.icon}</span> {category.name}
          </Button>
        ))}
      </div>
    </div>
  );
}

function NoResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
      <p className="text-lg mb-2" aria-hidden="true">
        🔍
      </p>
      <p>No drinks found matching your criteria.</p>
      <Button variant="outline" className="mt-3 text-sm" onClick={onReset}>
        Show Popular Drinks
      </Button>
    </div>
  );
}

export default function DrinkDiscovery({ onSelectDrink, className = '' }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const { isPremium } = usePremiumFeatures();
  const { trackFeatureUsage } = useAnalytics();

  const filteredDrinks = useDrinkSearch(searchQuery, selectedCategory, isPremium);

  const handleSelectDrink = (drinkInfo: DrinkInfo) => {
    trackFeatureUsage('drink_discovery_select', {
      drink_id: drinkInfo.id,
      category: drinkInfo.category,
      search_query: searchQuery || null,
      is_premium: isPremium,
    });
    onSelectDrink({
      volumeMl: drinkInfo.typicalVolumeMl,
      abvPct: drinkInfo.typicalAbv,
      intention: 'social',
      craving: 0,
      halt: [],
      alt: '',
      ts: Date.now(),
    });
  };

  const showEmpty = filteredDrinks.length === 0 && (searchQuery || selectedCategory !== 'all');

  return (
    <div className={className}>
      <DiscoveryHeader isPremium={isPremium} resultCount={filteredDrinks.length} />
      <div className="mb-4">
        <Input
          type="search"
          placeholder="Search drinks... (e.g., 'hoppy', 'wine', 'cocktail')"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>
      <CategoryFilters selected={selectedCategory} onSelect={setSelectedCategory} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredDrinks.map((drink) => (
          <DrinkDiscoveryCard
            key={drink.id}
            drink={drink}
            expanded={showDetails === drink.id}
            onToggle={() => setShowDetails((prev) => (prev === drink.id ? null : drink.id))}
            onSelect={() => handleSelectDrink(drink)}
            isPremium={isPremium}
          />
        ))}
      </div>
      {showEmpty && (
        <NoResults
          onReset={() => {
            setSearchQuery('');
            setSelectedCategory('all');
          }}
        />
      )}
    </div>
  );
}
