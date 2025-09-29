import React, { useState, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import type { Drink } from './DrinkForm';
import { 
  DrinkInfo, 
  searchDrinks, 
  getDrinksByCategory, 
  getPopularDrinks,
  DRINK_CATEGORIES 
} from './drinkDatabase';
import { usePremiumFeatures } from '../subscription/subscriptionStore';
import { useAnalytics } from '../analytics/analytics';

interface Props {
  onSelectDrink: (drink: Partial<Drink>) => void;
  className?: string;
}

export default function DrinkDiscovery({ onSelectDrink, className = '' }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const { isPremium, canAccessAIInsights } = usePremiumFeatures();
  const { trackFeatureUsage } = useAnalytics();

  const filteredDrinks = useMemo(() => {
    if (selectedCategory === 'all' && !searchQuery) {
      return getPopularDrinks(isPremium ? 12 : 6);
    }
    
    let drinks = searchQuery ? searchDrinks(searchQuery) : [];
    
    if (selectedCategory !== 'all' && !searchQuery) {
      drinks = getDrinksByCategory(selectedCategory);
    } else if (selectedCategory !== 'all' && searchQuery) {
      drinks = drinks.filter(drink => drink.category === selectedCategory);
    }
    
    return drinks.slice(0, isPremium ? 20 : 8);
  }, [searchQuery, selectedCategory, isPremium]);

  const handleSelectDrink = (drinkInfo: DrinkInfo) => {
    trackFeatureUsage('drink_discovery_select', {
      drink_id: drinkInfo.id,
      category: drinkInfo.category,
      search_query: searchQuery || null,
      is_premium: isPremium
    });

    const drink: Partial<Drink> = {
      volumeMl: drinkInfo.typicalVolumeMl,
      abvPct: drinkInfo.typicalAbv,
      intention: 'social', // Default, user can change
      craving: 0,
      halt: [],
      alt: '',
      ts: Date.now()
    };

    onSelectDrink(drink);
  };

  const DrinkCard = ({ drink }: { drink: DrinkInfo }) => (
    <div 
      key={drink.id}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer"
      onClick={() => showDetails === drink.id ? setShowDetails(null) : setShowDetails(drink.id)}
    >
      {/* Card Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {drink.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {drink.description}
            </p>
          </div>
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ml-2 flex-shrink-0"
            style={{ backgroundColor: drink.color + '20', color: drink.color }}
          >
            {DRINK_CATEGORIES.find(c => c.id === drink.category)?.icon || '🥤'}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>{drink.typicalAbv}% ABV</span>
          <span>{drink.typicalVolumeMl}ml</span>
          <span>⭐ {drink.popularity_score}/10</span>
        </div>

        {/* Flavor Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {drink.flavor_profile.slice(0, 3).map(flavor => (
            <Badge 
              key={flavor} 
              variant="outline" 
              className="text-xs px-2 py-0 text-gray-500"
            >
              {flavor}
            </Badge>
          ))}
        </div>
      </div>

      {/* Expandable Details */}
      {showDetails === drink.id && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="pt-3 space-y-2 text-xs">
            {drink.origin && (
              <div><strong>Origin:</strong> {drink.origin}</div>
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
                <strong>🍴 Premium Pairings:</strong> {drink.pairing_suggestions.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800/50">
        <Button
          variant="outline"
          className="w-full text-xs h-8"
          onClick={(e) => {
            e.stopPropagation();
            handleSelectDrink(drink);
          }}
        >
          Use This Drink
        </Button>
      </div>
    </div>
  );

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            🍺 Discover Drinks
          </h2>
          {!isPremium && (
            <Badge variant="outline" className="text-xs">
              {filteredDrinks.length}/6 Free
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Find detailed info about drinks to log accurately
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          type="search"
          placeholder="Search drinks... (e.g., 'hoppy', 'wine', 'cocktail')"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Category Filters */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'primary' : 'outline'}
            className="text-xs h-8 px-3"
            onClick={() => setSelectedCategory('all')}
          >
            All
          </Button>
          {DRINK_CATEGORIES.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'primary' : 'outline'}
              className="text-xs h-8 px-3"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.icon} {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredDrinks.map(drink => (
          <DrinkCard key={drink.id} drink={drink} />
        ))}
      </div>

      {/* No Results */}
      {filteredDrinks.length === 0 && (searchQuery || selectedCategory !== 'all') && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">🔍</p>
          <p>No drinks found matching your criteria.</p>
          <Button 
            variant="outline" 
            className="mt-3 text-sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
          >
            Show Popular Drinks
          </Button>
        </div>
      )}

      {/* Premium Upsell */}
      {!isPremium && filteredDrinks.length >= 6 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg text-center">
          <h3 className="font-semibold mb-1">🚀 Unlock Full Drink Database</h3>
          <p className="text-sm opacity-90 mb-3">
            Access 100+ drinks with detailed nutrition info, pairing suggestions, and alcohol-free alternatives.
          </p>
          <Button 
            variant="secondary" 
            className="bg-white text-primary-600 hover:bg-gray-100"
            onClick={() => trackFeatureUsage('drink_discovery_upgrade_prompt')}
          >
            Upgrade to Premium
          </Button>
        </div>
      )}
    </div>
  );
}