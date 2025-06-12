import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Animated,
  Dimensions,
  BackHandler,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {LinearGradient} from 'expo-linear-gradient';
import {useStore} from '../store/firebaseStore';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';
import CustomIcon from '../components/CustomIcon';
import CoffeeCard from '../components/CoffeeCard';
import AdvancedSearchModal, {SearchFilters} from '../components/AdvancedSearchModal';
import SearchSuggestions from '../components/SearchSuggestions';
import {
  applyAdvancedFilters,
  getDefaultFilters,
  hasActiveFilters as checkHasActiveFilters,
  getSearchSuggestions,
  saveSearchToHistory,
  getSearchHistory,
} from '../utils/searchUtils';

const {width: screenWidth} = Dimensions.get('window');

interface SearchResultsScreenProps {
  navigation: any;
  route: {
    params?: {
      initialSearchText?: string;
      initialFilters?: SearchFilters;
    };
  };
}

const SearchResultsScreen: React.FC<SearchResultsScreenProps> = ({
  navigation,
  route,
}) => {
  const CoffeeList = useStore((state: any) => state.CoffeeList);
  const BeanList = useStore((state: any) => state.BeanList);
  const addToCart = useStore((state: any) => state.addToCart);
  const calculateCartPrice = useStore((state: any) => state.calculateCartPrice);
  const trackProductView = useStore((state: any) => state.trackProductView);
  const useFirebase = useStore((state: any) => state.useFirebase);

  // Search state
  const [searchText, setSearchText] = useState(route.params?.initialSearchText || '');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>(
    route.params?.initialFilters || getDefaultFilters()
  );
  const [allProducts] = useState([...CoffeeList, ...BeanList]);
  const [filteredResults, setFilteredResults] = useState(allProducts);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-50));

  const searchInputRef = useRef<any>(null);
  const hasFiltersActive = checkHasActiveFilters(searchFilters);

  // Initialize screen with animation and load search history
  useEffect(() => {
    const initializeScreen = async () => {
      // Load search history
      const history = await getSearchHistory();
      setRecentSearches(history);

      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Apply initial search if provided
      if (route.params?.initialSearchText || route.params?.initialFilters) {
        applySearch();
      }
    };

    initializeScreen();

    // Handle hardware back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showSuggestions) {
        setShowSuggestions(false);
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, []);

  // Apply search and filters
  const applySearch = async () => {
    const results = applyAdvancedFilters(allProducts, searchFilters, searchText);
    setFilteredResults(results);
    
    // Save to persistent search history if text exists
    if (searchText.trim()) {
      await saveSearchToHistory(searchText.trim());
      const updatedHistory = await getSearchHistory();
      setRecentSearches(updatedHistory);
    }
  };

  // Handle search text change with suggestions
  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    
    if (text.trim()) {
      const newSuggestions = getSearchSuggestions(allProducts, text, 8);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    // Apply search in real-time
    const results = applyAdvancedFilters(allProducts, searchFilters, text);
    setFilteredResults(results);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion: string) => {
    setSearchText(suggestion);
    setShowSuggestions(false);
    searchInputRef.current?.blur();
    
    const results = applyAdvancedFilters(allProducts, searchFilters, suggestion);
    setFilteredResults(results);
    
    // Save to persistent search history
    await saveSearchToHistory(suggestion);
    const updatedHistory = await getSearchHistory();
    setRecentSearches(updatedHistory);
  };

  // Handle filter application
  const handleApplyFilters = (newFilters: SearchFilters) => {
    setSearchFilters(newFilters);
    const results = applyAdvancedFilters(allProducts, newFilters, searchText);
    setFilteredResults(results);
  };

  // Clear all filters and search
  const clearSearch = () => {
    setSearchText('');
    setSearchFilters(getDefaultFilters());
    setFilteredResults(allProducts);
    setShowSuggestions(false);
  };

  // Add to cart handler
  const handleAddToCart = (item: any) => {
    addToCart({
      id: item.id,
      index: item.index,
      name: item.name,
      roasted: item.roasted,
      imagelink_square: item.imagelink_square,
      special_ingredient: item.special_ingredient,
      type: item.type,
      prices: [{...item.prices[2], quantity: 1}],
    });
    calculateCartPrice();

    if (useFirebase) {
      trackProductView(item.id);
    }
  };

  // Navigate to product details
  const handleProductPress = (item: any) => {
    if (useFirebase) {
      trackProductView(item.id);
    }
    navigation.navigate('Details', {
      index: item.index,
      id: item.id,
      type: item.type,
    });
  };

  // Results statistics
  const getResultsText = () => {
    const total = filteredResults.length;
    const allTotal = allProducts.length;
    
    if (searchText.trim() || hasFiltersActive) {
      return `${total} result${total !== 1 ? 's' : ''} found${total < allTotal ? ` of ${allTotal}` : ''}`;
    }
    return `${total} product${total !== 1 ? 's' : ''} available`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} barStyle="light-content" />
      
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{translateY: slideAnim}],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <CustomIcon
            name="arrow-back"
            size={FONTSIZE.size_24}
            color={COLORS.primaryWhiteHex}
          />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <CustomIcon
            name="search"
            size={FONTSIZE.size_18}
            color={COLORS.primaryOrangeHex}
            style={styles.searchIcon}
          />
          
          <Text
            ref={searchInputRef}
            style={styles.searchInput}
            onPress={() => setShowSuggestions(true)}
          >
            {searchText || 'Search coffee, beans...'}
          </Text>

          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <CustomIcon
                name="close"
                size={FONTSIZE.size_16}
                color={COLORS.primaryLightGreyHex}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setShowAdvancedSearch(true)}
            style={[
              styles.filterButton,
              hasFiltersActive && styles.filterButtonActive,
            ]}
          >
            {hasFiltersActive ? (
              <LinearGradient
                colors={[COLORS.primaryOrangeHex, '#E68B5B']}
                style={styles.filterButtonGradient}
              >
                <CustomIcon
                  name="options"
                  size={FONTSIZE.size_16}
                  color={COLORS.primaryWhiteHex}
                />
              </LinearGradient>
            ) : (
              <CustomIcon
                name="options"
                size={FONTSIZE.size_16}
                color={COLORS.primaryLightGreyHex}
              />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Search Suggestions */}
      {showSuggestions && (
        <SearchSuggestions
          suggestions={suggestions}
          recentSearches={recentSearches}
          searchText={searchText}
          onSearchTextChange={handleSearchTextChange}
          onSuggestionSelect={handleSuggestionSelect}
          onClose={() => setShowSuggestions(false)}
          isVisible={showSuggestions}
        />
      )}

      {/* Results Header */}
      <Animated.View 
        style={[
          styles.resultsHeader,
          {opacity: fadeAnim},
        ]}
      >
        <Text style={styles.resultsText}>{getResultsText()}</Text>
        
        {(searchText.trim() || hasFiltersActive) && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearFiltersButton}>
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Active Filters Display */}
      {hasFiltersActive && (
        <Animated.View 
          style={[
            styles.activeFiltersContainer,
            {opacity: fadeAnim},
          ]}
        >
          <Text style={styles.activeFiltersTitle}>Active Filters:</Text>
          <View style={styles.filterChips}>
            {searchFilters.sortBy !== 'popularity' && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>
                  {searchFilters.sortBy === 'rating' ? 'Top Rated' : 
                   searchFilters.sortBy === 'price_low' ? 'Price ↑' :
                   searchFilters.sortBy === 'price_high' ? 'Price ↓' : 'A-Z'}
                </Text>
              </View>
            )}
            
            {(searchFilters.priceRange.min > 0 || searchFilters.priceRange.max < 50) && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>
                  ${searchFilters.priceRange.min}-${searchFilters.priceRange.max}
                </Text>
              </View>
            )}
            
            {searchFilters.minRating > 1 && (
              <View style={styles.filterChip}>
                <CustomIcon
                  name="star"
                  size={FONTSIZE.size_10}
                  color={COLORS.primaryOrangeHex}
                />
                <Text style={styles.filterChipText}>{searchFilters.minRating}+</Text>
              </View>
            )}
            
            {searchFilters.roastLevels.map((roast, index) => (
              <View key={index} style={styles.filterChip}>
                <Text style={styles.filterChipText}>
                  {roast.replace(' Roasted', '')}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Results Grid */}
      <Animated.View 
        style={[
          styles.resultsContainer,
          {opacity: fadeAnim},
        ]}
      >
        <FlatList
          data={filteredResults}
          renderItem={({item}) => (
            <View style={styles.cardContainer}>
              <TouchableOpacity
                onPress={() => handleProductPress(item)}
                activeOpacity={0.8}
              >
                <CoffeeCard
                  id={item.id}
                  index={item.index}
                  type={item.type}
                  roasted={item.roasted}
                  imagelink_square={item.imagelink_square}
                  name={item.name}
                  special_ingredient={item.special_ingredient}
                  average_rating={item.average_rating}
                  price={item.prices[2]}
                  buttonPressHandler={handleAddToCart}
                />
              </TouchableOpacity>
            </View>
          )}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsGrid}
          columnWrapperStyle={styles.row}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CustomIcon
                name="search"
                size={FONTSIZE.size_30}
                color={COLORS.primaryLightGreyHex}
              />
              <Text style={styles.emptyTitle}>No Results Found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search or filters
              </Text>
              <TouchableOpacity onPress={clearSearch} style={styles.resetButton}>
                <Text style={styles.resetButtonText}>Reset Search</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </Animated.View>

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        visible={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={searchFilters}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryGreyHex,
  },
  backButton: {
    padding: SPACING.space_8,
    marginRight: SPACING.space_12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_12,
  },
  searchIcon: {
    marginRight: SPACING.space_12,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
  clearButton: {
    padding: SPACING.space_8,
    marginRight: SPACING.space_8,
  },
  filterButton: {
    padding: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
  },
  filterButtonActive: {
    overflow: 'hidden',
  },
  filterButtonGradient: {
    padding: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_12,
  },
  resultsText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  clearFiltersButton: {
    paddingVertical: SPACING.space_8,
    paddingHorizontal: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_8,
    borderWidth: 1,
    borderColor: COLORS.primaryOrangeHex,
  },
  clearFiltersText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
  },
  activeFiltersContainer: {
    paddingHorizontal: SPACING.space_20,
    paddingBottom: SPACING.space_12,
  },
  activeFiltersTitle: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryGreyHex,
    paddingHorizontal: SPACING.space_10,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_8,
    gap: SPACING.space_4,
  },
  filterChipText: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsGrid: {
    padding: SPACING.space_16,
  },
  row: {
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: (screenWidth - SPACING.space_16 * 3) / 2,
    marginBottom: SPACING.space_16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.space_36 * 2,
  },
  emptyTitle: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginTop: SPACING.space_16,
    marginBottom: SPACING.space_8,
  },
  emptySubtitle: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    marginBottom: SPACING.space_24,
  },
  resetButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingHorizontal: SPACING.space_24,
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_15,
  },
  resetButtonText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
});

export default SearchResultsScreen;