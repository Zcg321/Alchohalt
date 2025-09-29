export interface DrinkInfo {
  id: string;
  name: string;
  category: 'beer' | 'wine' | 'spirits' | 'cocktail' | 'cider' | 'sake' | 'other';
  description: string;
  typicalAbv: number;
  typicalVolumeMl: number;
  alternativeNames: string[];
  origin?: string;
  color: string;
  flavor_profile: string[];
  occasions: string[];
  popularity_score: number;
  health_facts?: {
    calories_per_std: number;
    antioxidants?: boolean;
    gluten_free?: boolean;
    sugar_content?: 'low' | 'medium' | 'high';
  };
  pairing_suggestions?: string[];
  alcohol_free_alternatives?: string[];
}

export const DRINK_DATABASE: DrinkInfo[] = [
  // Popular Beers
  {
    id: 'lager-beer',
    name: 'Lager Beer',
    category: 'beer',
    description: 'Light, crisp, and refreshing beer with clean flavor.',
    typicalAbv: 5.0,
    typicalVolumeMl: 355,
    alternativeNames: ['Light Beer', 'Pilsner'],
    origin: 'Germany',
    color: '#F7DC6F',
    flavor_profile: ['crisp', 'light', 'refreshing'],
    occasions: ['casual', 'social', 'summer'],
    popularity_score: 9,
    health_facts: {
      calories_per_std: 150,
      gluten_free: false,
      sugar_content: 'low'
    },
    alcohol_free_alternatives: ['Non-alcoholic Beer', 'Sparkling Water with Lemon']
  },
  {
    id: 'ipa-beer',
    name: 'IPA (India Pale Ale)',
    category: 'beer',
    description: 'Hoppy, bitter beer with strong flavor and higher alcohol content.',
    typicalAbv: 6.8,
    typicalVolumeMl: 355,
    alternativeNames: ['India Pale Ale', 'Craft IPA'],
    origin: 'England',
    color: '#E67E22',
    flavor_profile: ['hoppy', 'bitter', 'citrusy', 'strong'],
    occasions: ['craft beer', 'dinner', 'social'],
    popularity_score: 8,
    health_facts: {
      calories_per_std: 200,
      gluten_free: false,
      sugar_content: 'low'
    },
    alcohol_free_alternatives: ['Hoppy NA Beer', 'Grapefruit Sparkling Water']
  },
  
  // Wines
  {
    id: 'red-wine',
    name: 'Red Wine',
    category: 'wine',
    description: 'Rich, complex wine made from dark grapes with tannins.',
    typicalAbv: 13.5,
    typicalVolumeMl: 148,
    alternativeNames: ['Cabernet', 'Merlot', 'Pinot Noir'],
    origin: 'Various',
    color: '#8B0000',
    flavor_profile: ['rich', 'complex', 'fruity', 'tannins'],
    occasions: ['dinner', 'romantic', 'celebration'],
    popularity_score: 9,
    health_facts: {
      calories_per_std: 125,
      antioxidants: true,
      sugar_content: 'low'
    },
    pairing_suggestions: ['Red meat', 'Cheese', 'Dark chocolate'],
    alcohol_free_alternatives: ['Grape Juice', 'Pomegranate Juice', 'NA Red Wine']
  },
  {
    id: 'white-wine',
    name: 'White Wine',
    category: 'wine',
    description: 'Light, crisp wine with bright acidity and fresh flavors.',
    typicalAbv: 12.0,
    typicalVolumeMl: 148,
    alternativeNames: ['Chardonnay', 'Sauvignon Blanc', 'Riesling'],
    origin: 'Various',
    color: '#F7DC6F',
    flavor_profile: ['crisp', 'light', 'fruity', 'acidic'],
    occasions: ['lunch', 'seafood', 'summer'],
    popularity_score: 8,
    health_facts: {
      calories_per_std: 120,
      antioxidants: true,
      sugar_content: 'low'
    },
    pairing_suggestions: ['Seafood', 'Poultry', 'Salads'],
    alcohol_free_alternatives: ['White Grape Juice', 'Sparkling Apple Cider', 'NA White Wine']
  },

  // Spirits
  {
    id: 'whiskey',
    name: 'Whiskey',
    category: 'spirits',
    description: 'Distilled spirit aged in wooden barrels with complex flavors.',
    typicalAbv: 40.0,
    typicalVolumeMl: 44,
    alternativeNames: ['Bourbon', 'Scotch', 'Rye'],
    origin: 'Ireland/Scotland',
    color: '#CD853F',
    flavor_profile: ['smoky', 'complex', 'warm', 'oak'],
    occasions: ['evening', 'social', 'celebration'],
    popularity_score: 7,
    health_facts: {
      calories_per_std: 100,
      sugar_content: 'low'
    },
    alcohol_free_alternatives: ['Apple Cider Vinegar Drink', 'Ginger Beer', 'Smoked Tea']
  },
  {
    id: 'vodka',
    name: 'Vodka',
    category: 'spirits',
    description: 'Clear, neutral spirit perfect for mixing in cocktails.',
    typicalAbv: 40.0,
    typicalVolumeMl: 44,
    alternativeNames: ['Premium Vodka', 'Flavored Vodka'],
    origin: 'Russia/Poland',
    color: '#FFFFFF',
    flavor_profile: ['clean', 'neutral', 'smooth'],
    occasions: ['party', 'cocktails', 'social'],
    popularity_score: 8,
    health_facts: {
      calories_per_std: 96,
      sugar_content: 'low'
    },
    alcohol_free_alternatives: ['Sparkling Water', 'Tonic Water', 'Clear Soda']
  },

  // Popular Cocktails
  {
    id: 'margarita',
    name: 'Margarita',
    category: 'cocktail',
    description: 'Classic cocktail with tequila, lime juice, and triple sec.',
    typicalAbv: 15.0,
    typicalVolumeMl: 150,
    alternativeNames: ['Frozen Margarita', 'Strawberry Margarita'],
    origin: 'Mexico',
    color: '#90EE90',
    flavor_profile: ['citrusy', 'tart', 'refreshing'],
    occasions: ['party', 'mexican food', 'summer'],
    popularity_score: 9,
    health_facts: {
      calories_per_std: 200,
      sugar_content: 'medium'
    },
    alcohol_free_alternatives: ['Virgin Margarita', 'Limeade', 'Citrus Mocktail']
  },
  {
    id: 'old-fashioned',
    name: 'Old Fashioned',
    category: 'cocktail',
    description: 'Classic whiskey cocktail with sugar, bitters, and orange.',
    typicalAbv: 30.0,
    typicalVolumeMl: 90,
    alternativeNames: ['Bourbon Old Fashioned'],
    origin: 'United States',
    color: '#D2691E',
    flavor_profile: ['strong', 'sweet', 'complex'],
    occasions: ['evening', 'sophisticated', 'dinner'],
    popularity_score: 7,
    health_facts: {
      calories_per_std: 180,
      sugar_content: 'medium'
    },
    alcohol_free_alternatives: ['Bitters and Soda', 'Smoky Mocktail', 'Orange Bitters Tea']
  },

  // International Options
  {
    id: 'sake',
    name: 'Sake',
    category: 'sake',
    description: 'Japanese rice wine with delicate, smooth flavor.',
    typicalAbv: 15.0,
    typicalVolumeMl: 44,
    alternativeNames: ['Japanese Rice Wine'],
    origin: 'Japan',
    color: '#FFFACD',
    flavor_profile: ['smooth', 'delicate', 'clean'],
    occasions: ['japanese food', 'ceremony', 'dinner'],
    popularity_score: 6,
    health_facts: {
      calories_per_std: 110,
      sugar_content: 'low'
    },
    alcohol_free_alternatives: ['Rice Tea', 'Amazake', 'Green Tea']
  },
  {
    id: 'hard-cider',
    name: 'Hard Cider',
    category: 'cider',
    description: 'Fermented apple beverage, sweet and refreshing.',
    typicalAbv: 5.0,
    typicalVolumeMl: 355,
    alternativeNames: ['Apple Cider', 'Pear Cider'],
    origin: 'England',
    color: '#DAA520',
    flavor_profile: ['sweet', 'fruity', 'refreshing'],
    occasions: ['autumn', 'casual', 'outdoor'],
    popularity_score: 7,
    health_facts: {
      calories_per_std: 160,
      gluten_free: true,
      sugar_content: 'medium'
    },
    alcohol_free_alternatives: ['Apple Cider', 'Sparkling Apple Juice', 'Kombucha']
  }
];

export function searchDrinks(query: string): DrinkInfo[] {
  if (!query.trim()) return DRINK_DATABASE;
  
  const lowercaseQuery = query.toLowerCase();
  return DRINK_DATABASE.filter(drink =>
    drink.name.toLowerCase().includes(lowercaseQuery) ||
    drink.alternativeNames.some(alt => alt.toLowerCase().includes(lowercaseQuery)) ||
    drink.category.toLowerCase().includes(lowercaseQuery) ||
    drink.flavor_profile.some(flavor => flavor.toLowerCase().includes(lowercaseQuery)) ||
    drink.description.toLowerCase().includes(lowercaseQuery)
  ).sort((a, b) => b.popularity_score - a.popularity_score);
}

export function getDrinksByCategory(category: string): DrinkInfo[] {
  return DRINK_DATABASE
    .filter(drink => drink.category === category)
    .sort((a, b) => b.popularity_score - a.popularity_score);
}

export function getPopularDrinks(limit = 6): DrinkInfo[] {
  return [...DRINK_DATABASE]
    .sort((a, b) => b.popularity_score - a.popularity_score)
    .slice(0, limit);
}

export function getDrinkRecommendations(userPreferences: {
  categories?: string[];
  occasions?: string[];
  alcoholTolerance?: 'low' | 'medium' | 'high';
}): DrinkInfo[] {
  let recommendations = DRINK_DATABASE;

  if (userPreferences.categories?.length) {
    recommendations = recommendations.filter(drink => 
      userPreferences.categories!.includes(drink.category)
    );
  }

  if (userPreferences.occasions?.length) {
    recommendations = recommendations.filter(drink =>
      drink.occasions.some(occasion => 
        userPreferences.occasions!.includes(occasion)
      )
    );
  }

  if (userPreferences.alcoholTolerance) {
    const maxAbv = userPreferences.alcoholTolerance === 'low' ? 5 
                  : userPreferences.alcoholTolerance === 'medium' ? 15 : 50;
    recommendations = recommendations.filter(drink => drink.typicalAbv <= maxAbv);
  }

  return recommendations
    .sort((a, b) => b.popularity_score - a.popularity_score)
    .slice(0, 8);
}

export const DRINK_CATEGORIES = [
  { id: 'beer', name: 'Beer', icon: '🍺', description: 'Light to strong fermented grain beverages' },
  { id: 'wine', name: 'Wine', icon: '🍷', description: 'Fermented grape beverages, red and white' },
  { id: 'spirits', name: 'Spirits', icon: '🥃', description: 'Distilled alcoholic beverages' },
  { id: 'cocktail', name: 'Cocktails', icon: '🍹', description: 'Mixed drinks and classic cocktails' },
  { id: 'cider', name: 'Cider', icon: '🍎', description: 'Fermented apple and fruit beverages' },
  { id: 'sake', name: 'Sake', icon: '🍶', description: 'Japanese rice wine and similar' }
];