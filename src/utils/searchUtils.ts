import {SearchFilters} from '../components/AdvancedSearchModal';

export interface Product {
  id: string;
  name: string;
  description: string;
  roasted: string;
  imagelink_square: any;
  imagelink_portrait: any;
  ingredients: string;
  special_ingredient: string;
  prices: Array<{size: string; price: string; currency: string}>;
  average_rating: number;
  ratings_count: string;
  favourite: boolean;
  type: string;
  index: number;
  popularity?: number; // For tracking popularity
}

/**
 * Apply advanced filters to a list of products
 */
export const applyAdvancedFilters = (
  products: Product[],
  filters: SearchFilters,
  searchText: string = '',
): Product[] => {
  let filteredProducts = [...products];

  // Text search filter
  if (searchText.trim()) {
    const searchLower = searchText.toLowerCase().trim();
    filteredProducts = filteredProducts.filter(product =>
      product.name.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower) ||
      product.special_ingredient.toLowerCase().includes(searchLower) ||
      product.ingredients.toLowerCase().includes(searchLower)
    );
  }

  // Price range filter
  filteredProducts = filteredProducts.filter(product => {
    const prices = product.prices.map(p => parseFloat(p.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    return minPrice >= filters.priceRange.min && maxPrice <= filters.priceRange.max;
  });

  // Rating filter
  filteredProducts = filteredProducts.filter(product =>
    product.average_rating >= filters.minRating
  );

  // Roast level filter
  if (filters.roastLevels.length > 0) {
    filteredProducts = filteredProducts.filter(product =>
      filters.roastLevels.includes(product.roasted)
    );
  }

  // Apply sorting
  return sortProducts(filteredProducts, filters.sortBy);
};

/**
 * Sort products based on the selected criteria
 */
export const sortProducts = (
  products: Product[],
  sortBy: SearchFilters['sortBy'],
): Product[] => {
  const sorted = [...products];

  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    
    case 'price_low':
      return sorted.sort((a, b) => {
        const aMinPrice = Math.min(...a.prices.map(p => parseFloat(p.price)));
        const bMinPrice = Math.min(...b.prices.map(p => parseFloat(p.price)));
        return aMinPrice - bMinPrice;
      });
    
    case 'price_high':
      return sorted.sort((a, b) => {
        const aMaxPrice = Math.max(...a.prices.map(p => parseFloat(p.price)));
        const bMaxPrice = Math.max(...b.prices.map(p => parseFloat(p.price)));
        return bMaxPrice - aMaxPrice;
      });
    
    case 'rating':
      return sorted.sort((a, b) => b.average_rating - a.average_rating);
    
    case 'popularity':
    default:
      return sorted.sort((a, b) => {
        // Use popularity if available, otherwise fall back to rating * review count
        const aPopularity = a.popularity || 
          (a.average_rating * parseInt(a.ratings_count.replace(/,/g, '') || '0'));
        const bPopularity = b.popularity || 
          (b.average_rating * parseInt(b.ratings_count.replace(/,/g, '') || '0'));
        return bPopularity - aPopularity;
      });
  }
};

/**
 * Get price range from a list of products
 */
export const getPriceRange = (products: Product[]): {min: number; max: number} => {
  if (products.length === 0) {
    return {min: 0, max: 50};
  }

  const allPrices = products.flatMap(product =>
    product.prices.map(p => parseFloat(p.price))
  );

  return {
    min: Math.floor(Math.min(...allPrices)),
    max: Math.ceil(Math.max(...allPrices)),
  };
};

/**
 * Get available roast levels from a list of products
 */
export const getAvailableRoastLevels = (products: Product[]): string[] => {
  const roastLevels = new Set(products.map(product => product.roasted));
  return Array.from(roastLevels).sort();
};

/**
 * Check if any filters are active (different from default)
 */
export const hasActiveFilters = (filters: SearchFilters): boolean => {
  return (
    filters.priceRange.min > 0 ||
    filters.priceRange.max < 50 ||
    filters.minRating > 1 ||
    filters.roastLevels.length > 0 ||
    filters.sortBy !== 'popularity'
  );
};

/**
 * Get default filter state
 */
export const getDefaultFilters = (): SearchFilters => ({
  priceRange: {min: 0, max: 50},
  minRating: 1,
  roastLevels: [],
  sortBy: 'popularity',
});

/**
 * Create search suggestions based on products and search text
 */
export const getSearchSuggestions = (
  products: Product[],
  searchText: string,
  maxSuggestions: number = 5,
): string[] => {
  if (!searchText.trim()) {
    return [];
  }

  const searchLower = searchText.toLowerCase();
  const suggestions = new Set<string>();

  products.forEach(product => {
    // Add product names that match
    if (product.name.toLowerCase().includes(searchLower)) {
      suggestions.add(product.name);
    }

    // Add ingredients that match
    if (product.ingredients.toLowerCase().includes(searchLower)) {
      suggestions.add(product.ingredients);
    }

    // Add special ingredients that match
    if (product.special_ingredient.toLowerCase().includes(searchLower)) {
      suggestions.add(product.special_ingredient);
    }

    // Add roast levels that match
    if (product.roasted.toLowerCase().includes(searchLower)) {
      suggestions.add(product.roasted);
    }
  });

  return Array.from(suggestions).slice(0, maxSuggestions);
};

/**
 * Highlight search terms in text
 */
export const highlightSearchTerms = (
  text: string,
  searchText: string,
): {text: string; isHighlighted: boolean}[] => {
  if (!searchText.trim()) {
    return [{text, isHighlighted: false}];
  }

  const regex = new RegExp(`(${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map(part => ({
    text: part,
    isHighlighted: regex.test(part),
  }));
};

/**
 * Search history management
 */
export const saveSearchToHistory = async (searchText: string): Promise<void> => {
  try {
    if (!searchText.trim()) return;
    
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    const existing = await AsyncStorage.default.getItem('searchHistory');
    let history: string[] = existing ? JSON.parse(existing) : [];
    
    // Remove if already exists and add to beginning
    history = history.filter(item => item !== searchText.trim());
    history.unshift(searchText.trim());
    
    // Keep only last 10 searches
    history = history.slice(0, 10);
    
    await AsyncStorage.default.setItem('searchHistory', JSON.stringify(history));
  } catch (error) {
    console.error('Error saving search history:', error);
  }
};

export const getSearchHistory = async (): Promise<string[]> => {
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    const existing = await AsyncStorage.default.getItem('searchHistory');
    return existing ? JSON.parse(existing) : [];
  } catch (error) {
    console.error('Error getting search history:', error);
    return [];
  }
};

export const clearSearchHistory = async (): Promise<void> => {
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.default.removeItem('searchHistory');
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
}; 