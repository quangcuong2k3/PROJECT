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
  ToastAndroid,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {LinearGradient} from 'expo-linear-gradient';
import {useFocusEffect} from '@react-navigation/native';
import {useStore} from '../store/firebaseStore';
import {searchProductsWithAI} from '../services/firebaseServices';
import imageSearchService from '../services/imageSearchService';
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
import ImageSearchModal from '../components/ImageSearchModal';
import VoiceSearchModal from '../components/VoiceSearchModal';
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
      openVoiceSearch?: boolean;
      openImageSearch?: boolean;
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
  const [isSearching, setIsSearching] = useState(false);
  const [searchMetadata, setSearchMetadata] = useState<{
    searchType?: string;
    processedTerms?: string[];
    totalMatches?: number;
  } | null>(null);
  const [relevanceScores, setRelevanceScores] = useState<{ [key: string]: number }>({});
  
  // New search modals state
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  
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

  // Handle auto-opening of search modals from navigation params
  useFocusEffect(
    React.useCallback(() => {
      const handleAutoOpenModals = async () => {
        // Small delay to ensure the screen has fully loaded
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (route.params?.openVoiceSearch) {
          setShowVoiceSearch(true);
          // Clear the param to prevent reopening
          navigation.setParams({ openVoiceSearch: undefined });
        } else if (route.params?.openImageSearch) {
          setShowImageSearch(true);
          // Clear the param to prevent reopening
          navigation.setParams({ openImageSearch: undefined });
        }
      };

      if (route.params?.openVoiceSearch || route.params?.openImageSearch) {
        handleAutoOpenModals();
      }
    }, [route.params?.openVoiceSearch, route.params?.openImageSearch, navigation])
  );

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

  // Handle image search results
  const handleImageSearchResults = async (searchTerms: string[], imageUri?: string, analysisResults?: any) => {
    console.log('📷 Image search results received:', searchTerms);
    console.log('📷 Analysis results:', analysisResults);
    
    try {
      // Show loading state
      setIsSearching(true);
      setFilteredResults([]);
      setSearchMetadata(null);
      
      // Check if we have valid search terms
      if (!searchTerms || searchTerms.length === 0) {
        ToastAndroid.show('No search terms generated from image', ToastAndroid.SHORT);
        setIsSearching(false);
        return;
      }

      // If we have analysis results from Gemini, extract suggested names for focused search
      let searchResults;
      let searchQuery = searchTerms.join(' ');
      
      if (analysisResults && analysisResults.length > 0) {
        console.log('🎯 Using Gemini suggested names for focused database search');
        
        // Extract suggested names from Gemini analysis
        const suggestedNames = imageSearchService.extractSuggestedNamesFromResults(analysisResults);
        console.log('🔍 Gemini suggested names:', suggestedNames);
        
        // Use only the first few suggested names for display (keep it short)
        const displaySearchText = suggestedNames.slice(0, 2).join(', ');
        
        // Show user what we're searching for
        ToastAndroid.show(
          `Searching for: ${displaySearchText}`,
          ToastAndroid.SHORT
        );
        
        // Use the new suggested names search function
        const { products, relevanceScores } = await useStore.getState().searchProductsBySuggestedNames(
          suggestedNames,
          {
            minRelevanceScore: 0.1,
            maxResults: 20,
          }
        );
        
        searchResults = {
          products,
          relevanceScores,
          searchMetadata: {
            originalQuery: displaySearchText, // Use short display text
            processedTerms: suggestedNames,
            searchType: 'image (suggested names)',
            totalMatches: products.length,
          }
        };
        
        console.log(`🎯 Suggested names search found ${products.length} products`);
        
        // Log which products were found and why
        products.forEach(product => {
          const score = relevanceScores[product.id || ''] || 0;
          console.log(`📦 Found: "${product.name}" (${product.type}) - Score: ${score.toFixed(2)}`);
        });
      } else {
        console.log('🔄 Using fallback AI search');
        
        // Fallback to regular AI search
        searchResults = await searchProductsWithAI(
          searchQuery,
          searchTerms,
          'image',
          {
            minRelevanceScore: 0.1,
            maxResults: 20,
            boostPopular: true,
          }
        );
      }
      
      const { products, searchMetadata: metadata, relevanceScores: scores } = searchResults;
      
      console.log(`📷 Found ${products.length} related products for image search`);
      console.log('Search metadata:', metadata);
      
      // Update UI with results
      setSearchText(metadata.originalQuery); // Use short display text
      setFilteredResults(products);
      setSearchMetadata(metadata);
      setRelevanceScores(scores);
      
      // Show appropriate message based on results
      if (products.length === 0) {
        ToastAndroid.show(
          'No matching coffee products found. Try with a different coffee image.',
          ToastAndroid.LONG
        );
      } else {
        ToastAndroid.show(
          `Found ${products.length} products matching your image`,
          ToastAndroid.SHORT
        );
      }
      
      // Save to search history
      if (metadata.originalQuery.trim()) {
        await saveSearchToHistory(metadata.originalQuery.trim());
        const updatedHistory = await getSearchHistory();
        setRecentSearches(updatedHistory);
      }
    } catch (error) {
      console.error('Error processing image search results:', error);
      ToastAndroid.show('Failed to search products. Please try again.', ToastAndroid.SHORT);
      
      // Fallback to local search
      const results = applyAdvancedFilters(allProducts, searchFilters, searchTerms[0] || '');
      setFilteredResults(results);
      setSearchText(searchTerms[0] || '');
      setSearchMetadata({ searchType: 'image (fallback)', totalMatches: results.length });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle voice search results
  const handleVoiceSearchResults = async (searchTerms: string[], transcript: string) => {
    console.log('🎤 Voice search results received:', { searchTerms, transcript });
    
    // Add timeout to prevent hanging
    const searchTimeout = setTimeout(() => {
      console.log('⏰ Voice search processing timeout');
      setIsSearching(false);
      ToastAndroid.show('Search took too long. Showing local results.', ToastAndroid.SHORT);
      
      // Show local results as fallback
      const localResults = applyAdvancedFilters(allProducts, searchFilters, transcript);
      setFilteredResults(localResults);
      setSearchText(transcript);
      setSearchMetadata({ searchType: 'voice (local fallback)', totalMatches: localResults.length });
    }, 10000); // 10 second timeout
    
    try {
      // Show loading state
      setIsSearching(true);
      setFilteredResults([]);
      setSearchMetadata(null);
      
      // Check if we have valid search terms
      if (!searchTerms || searchTerms.length === 0) {
        console.log('❌ No search terms provided');
        clearTimeout(searchTimeout);
        ToastAndroid.show('No search terms generated from voice input', ToastAndroid.SHORT);
        setIsSearching(false);
        
        // Fallback to simple local search with transcript
        if (transcript && transcript.trim()) {
          const localResults = applyAdvancedFilters(allProducts, searchFilters, transcript);
          setFilteredResults(localResults);
          setSearchText(transcript);
          setSearchMetadata({ searchType: 'voice (simple fallback)', totalMatches: localResults.length });
        }
        return;
      }

      console.log('🔍 Starting AI search for voice query...');
      
      // Try AI-enhanced search with timeout protection
      let searchResults;
      if (useFirebase) {
        try {
          searchResults = await Promise.race([
            searchProductsWithAI(
              transcript,
              searchTerms,
              'voice',
              {
                minRelevanceScore: 0.1,
                maxResults: 20,
                boostPopular: true,
              }
            ),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('AI search timeout')), 8000)
            )
          ]);
        } catch (aiError) {
          console.log('⚠️ AI search failed or timed out, using local search:', aiError);
          // Fallback to local search
          const localResults = applyAdvancedFilters(allProducts, searchFilters, transcript);
          searchResults = {
            products: localResults,
            searchMetadata: { 
              originalQuery: transcript,
              searchType: 'voice (local)', 
              totalMatches: localResults.length,
              processedTerms: searchTerms 
            },
            relevanceScores: {}
          };
        }
      } else {
        // Use local search when Firebase is disabled
        console.log('🏠 Using local search (Firebase disabled)');
        const localResults = applyAdvancedFilters(allProducts, searchFilters, transcript);
        searchResults = {
          products: localResults,
          searchMetadata: { 
            originalQuery: transcript,
            searchType: 'voice (local)', 
            totalMatches: localResults.length,
            processedTerms: searchTerms 
          },
          relevanceScores: {}
        };
      }
      
      clearTimeout(searchTimeout);
      
      const { products, searchMetadata: metadata, relevanceScores: scores } = searchResults as {
        products: any[];
        searchMetadata: any;
        relevanceScores: { [key: string]: number };
      };
      
      console.log(`🎤 Found ${products.length} related products for voice search`);
      console.log('Search metadata:', metadata);
      
      // Update UI with results
      setSearchText(transcript);
      setFilteredResults(products);
      setSearchMetadata(metadata);
      setRelevanceScores(scores || {});
      
      // Show success message
      ToastAndroid.show(
        `Found ${products.length} products for "${transcript}"`,
        ToastAndroid.SHORT
      );
      
      // Save to search history
      if (transcript.trim()) {
        await saveSearchToHistory(transcript.trim());
        const updatedHistory = await getSearchHistory();
        setRecentSearches(updatedHistory);
      }
    } catch (error) {
      console.error('Error processing voice search results:', error);
      clearTimeout(searchTimeout);
      ToastAndroid.show('Search failed. Showing local results.', ToastAndroid.SHORT);
      
      // Fallback to local search
      const results = applyAdvancedFilters(allProducts, searchFilters, transcript);
      setFilteredResults(results);
      setSearchText(transcript);
      setSearchMetadata({ searchType: 'voice (error fallback)', totalMatches: results.length });
    } finally {
      setIsSearching(false);
    }
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

          {/* Voice Search Button */}
          <TouchableOpacity
            onPress={() => {
              setShowVoiceSearch(true);
            }}
            style={styles.voiceButton}
          >
            <CustomIcon
              name="mic"
              size={FONTSIZE.size_16}
              color={COLORS.primaryLightGreyHex}
            />
          </TouchableOpacity>

          {/* Image Search Button */}
          <TouchableOpacity
            onPress={() => {
              setShowImageSearch(true);
            }}
            style={styles.imageButton}
          >
            <CustomIcon
              name="camera"
              size={FONTSIZE.size_16}
              color={COLORS.primaryLightGreyHex}
            />
          </TouchableOpacity>

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
        {/* <Text style={styles.resultsText}>{getResultsText()}</Text>
         */}
        {/* Search Metadata Display */}
        {searchMetadata && (
          <View style={styles.searchMetadataContainer}>
            <Text style={styles.searchMetadataText}>
              {searchMetadata.searchType === 'voice' && '🎤 Voice Search'}
              {searchMetadata.searchType === 'image' && '📷 Image Search'}
              {searchMetadata.searchType === 'voice (fallback)' && '🎤 Voice (Local)'}
              {searchMetadata.searchType === 'image (fallback)' && '📷 Image (Local)'}
            </Text>
            {searchMetadata.processedTerms && searchMetadata.processedTerms.length > 0 && (
              <Text style={styles.processedTermsText}>
                Terms: {searchMetadata.processedTerms.slice(0, 3).join(', ')}
                {searchMetadata.processedTerms.length > 3 && ` +${searchMetadata.processedTerms.length - 3} more`}
              </Text>
            )}
          </View>
        )}
        
        {/* Debug indicator */}
        {/* {(__DEV__) && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              Voice: {showVoiceSearch ? '🎤' : '❌'} | Image: {showImageSearch ? '📷' : '❌'}
            </Text>
          </View>
        )} */}
        
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
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <CustomIcon
              name="search"
              size={FONTSIZE.size_30}
              color={COLORS.primaryOrangeHex}
            />
            <Text style={styles.loadingTitle}>Searching Products...</Text>
            <Text style={styles.loadingSubtitle}>
              {searchMetadata?.searchType === 'voice' && 'Processing your voice command'}
              {searchMetadata?.searchType === 'image' && 'Analyzing your image'}
              {!searchMetadata?.searchType && 'Finding the best matches'}
            </Text>
            
            {/* Add a timeout indicator for voice search */}
            {searchMetadata?.searchType === 'voice' && (
              <View style={styles.timeoutContainer}>
                <Text style={styles.timeoutText}>
                  If search takes too long, try using text search instead
                </Text>
                <TouchableOpacity
                  style={styles.timeoutButton}
                  onPress={() => {
                    setIsSearching(false);
                    setShowVoiceSearch(true);
                  }}
                >
                  <Text style={styles.timeoutButtonText}>Switch to Text Search</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
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
                    relevanceScore={relevanceScores[item.id || ''] || 0}
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
        )}
      </Animated.View>

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        visible={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={searchFilters}
      />

      {/* Image Search Modal */}
      <ImageSearchModal
        visible={showImageSearch}
        onClose={() => setShowImageSearch(false)}
        onSearchResults={handleImageSearchResults}
      />

      {/* Voice Search Modal */}
      <VoiceSearchModal
        visible={showVoiceSearch}
        onClose={() => setShowVoiceSearch(false)}
        onSearchResults={handleVoiceSearchResults}
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
  voiceButton: {
    padding: SPACING.space_8,
    marginRight: SPACING.space_8,
  },
  imageButton: {
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
  debugContainer: {
    padding: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
    backgroundColor: COLORS.primaryGreyHex,
    marginRight: SPACING.space_12,
  },
  debugText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
  searchMetadataContainer: {
    padding: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
    backgroundColor: COLORS.primaryGreyHex,
    marginRight: SPACING.space_12,
  },
  searchMetadataText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
  processedTermsText: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.space_36 * 2,
  },
  loadingTitle: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginTop: SPACING.space_16,
    marginBottom: SPACING.space_8,
  },
  loadingSubtitle: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    marginBottom: SPACING.space_24,
  },
  timeoutContainer: {
    marginTop: SPACING.space_16,
    alignItems: 'center',
  },
  timeoutText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    marginBottom: SPACING.space_12,
  },
  timeoutButton: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  timeoutButtonText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
  },
});

export default SearchResultsScreen;