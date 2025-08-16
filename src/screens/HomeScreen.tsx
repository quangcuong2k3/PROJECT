import React, {useRef, useState, useEffect} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ToastAndroid,
  RefreshControl,
} from 'react-native';
import {useStore} from '../store/firebaseStore';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';
import HeaderBar from '../components/HeaderBar';
import CustomIcon from '../components/CustomIcon';
import {FlatList} from 'react-native';
import CoffeeCard from '../components/CoffeeCard';
import {Dimensions} from 'react-native';
import AdvancedSearchModal, {SearchFilters} from '../components/AdvancedSearchModal';
import EnhancedSearchBar from '../components/EnhancedSearchBar';
import SearchResultsHeader from '../components/SearchResultsHeader';
import {
  applyAdvancedFilters,
  getDefaultFilters,
  hasActiveFilters as checkHasActiveFilters,
} from '../utils/searchUtils';
import { quickImageTest, testFirebaseIntegration } from '../utils/runImageTests';
import { updateAllProductImages } from '../utils/updateFirebaseImages';
import { completeImageSetup, testCartAndFavorites } from '../utils/adminTools';

const getCategoriesFromData = (data: any) => {
  let temp: any = {};
  for (let i = 0; i < data.length; i++) {
    if (temp[data[i].name] === undefined) {
      temp[data[i].name] = 1;
    } else {
      temp[data[i].name]++;
    }
  }
  let categories = Object.keys(temp);
  categories.unshift('All');
  return categories;
};

const getCoffeeList = (category: string, data: any) => {
  if (category === 'All') {
    return data;
  } else {
    let coffeelist = data.filter((item: any) => item.name === category);
    return coffeelist;
  }
};

const HomeScreen = ({navigation}: any) => {
  const CoffeeList = useStore((state: any) => state.CoffeeList);
  const BeanList = useStore((state: any) => state.BeanList);
  const PopularProducts = useStore((state: any) => state.PopularProducts);
  const addToCart = useStore((state: any) => state.addToCart);
  const calculateCartPrice = useStore((state: any) => state.calculateCartPrice);
  // Firebase integration
  const loadProducts = useStore((state: any) => state.loadProducts);
  const loadPopularProducts = useStore(
    (state: any) => state.loadPopularProducts,
  );
  const trackProductView = useStore((state: any) => state.trackProductView);
  const isLoadingProducts = useStore((state: any) => state.isLoadingProducts);
  const useFirebase = useStore((state: any) => state.useFirebase);
  const error = useStore((state: any) => state.error);
  const clearError = useStore((state: any) => state.clearError);
  
  // Image fixing functions
  const fixCartItemImages = useStore((state: any) => state.fixCartItemImages);
  const fixFavoritesImages = useStore((state: any) => state.fixFavoritesImages);

  const [categories, setCategories] = useState(
    getCategoriesFromData(CoffeeList),
  );
  const [searchText, setSearchText] = useState('');
  const [categoryIndex, setCategoryIndex] = useState({
    index: 0,
    category: categories[0],
  });
  const [sortedCoffee, setSortedCoffee] = useState(
    getCoffeeList(categoryIndex.category, CoffeeList),
  );
  const [refreshing, setRefreshing] = useState(false);
  
  // Advanced search state
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>(getDefaultFilters());
  const [filteredCoffee, setFilteredCoffee] = useState(CoffeeList);
  const hasFiltersActive = checkHasActiveFilters(searchFilters);

  const ListRef: any = useRef<FlatList>(null);
  const tabBarHeight = useBottomTabBarHeight(); // Load Firebase data on component mount
  useEffect(() => {
    console.log('🏠 HomeScreen mounted, useFirebase:', useFirebase);
    if (useFirebase) {
      console.log('🔄 Loading products from Firebase...');
      loadProducts(true); // Force refresh on mount
      loadPopularProducts(); // Load popular products
    }
  }, [useFirebase, loadProducts, loadPopularProducts]);

  // Fix existing cart and favorites images on app load
  useEffect(() => {
    console.log('🔧 Fixing existing cart and favorites images...');
    fixCartItemImages();
    fixFavoritesImages();
  }, [fixCartItemImages, fixFavoritesImages]);

  // Show error message if Firebase loading fails
  useEffect(() => {
    if (error) {
      console.log('❌ Firebase error:', error);
      ToastAndroid.show(`Firebase Error: ${error}`, ToastAndroid.SHORT);
      // Clear error after showing it
      setTimeout(() => clearError(), 3000);
    }
  }, [error, clearError]);

  // Update categories and filtered coffee when CoffeeList changes
  useEffect(() => {
    const newCategories = getCategoriesFromData(CoffeeList);
    setCategories(newCategories);
    setCategoryIndex({
      index: 0,
      category: newCategories[0],
    });
    
    // Apply current filters to new data
    const filtered = applyAdvancedFilters(CoffeeList, searchFilters, searchText);
    setFilteredCoffee(filtered);
    setSortedCoffee(filtered);
  }, [CoffeeList, searchFilters, searchText]);

  // Enhanced search functionality
  const applySearch = () => {
    const filtered = applyAdvancedFilters(CoffeeList, searchFilters, searchText);
    setFilteredCoffee(filtered);
    setSortedCoffee(filtered);
    
    ListRef?.current?.scrollToOffset({
      animated: true,
      offset: 0,
    });
  };

  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    // Apply search in real-time
    const filtered = applyAdvancedFilters(CoffeeList, searchFilters, text);
    setFilteredCoffee(filtered);
    setSortedCoffee(filtered);
  };

  const resetSearchCoffee = () => {
    setSearchText('');
    setSearchFilters(getDefaultFilters());
    setSortedCoffee([...CoffeeList]);
    setFilteredCoffee([...CoffeeList]);
    setCategoryIndex({index: 0, category: categories[0]});
    
    ListRef?.current?.scrollToOffset({
      animated: true,
      offset: 0,
    });
  };

  const handleApplyFilters = (newFilters: SearchFilters) => {
    setSearchFilters(newFilters);
    const filtered = applyAdvancedFilters(CoffeeList, newFilters, searchText);
    setFilteredCoffee(filtered);
    setSortedCoffee(filtered);
  };
  const CoffeCardAddToCart = ({
    id,
    index,
    name,
    roasted,
    imagelink_square,
    special_ingredient,
    type,
    prices,
  }: any) => {
    addToCart({
      id,
      index,
      name,
      roasted,
      imagelink_square,
      special_ingredient,
      type,
      prices,
    });
    calculateCartPrice();

    // Track product popularity when added to cart
    if (useFirebase) {
      trackProductView(id);
    }

    // Show enhanced notification with size info
    const defaultSize = prices && prices.length > 0 ? prices[2]?.size || prices[0]?.size : '';
    ToastAndroid.showWithGravity(
      `${name}${defaultSize ? ` (${defaultSize})` : ''} added to Cart`,
      ToastAndroid.SHORT,
      ToastAndroid.CENTER,
    );
    
    // Quick test to verify cart images are working (remove this after testing)
    console.log('🖼️ Cart item added with image:', imagelink_square);
    console.log('📝 Cart item type:', typeof imagelink_square);
  };
  // Refresh function for pull-to-refresh with timeout
  const onRefresh = async () => {
    if (!useFirebase) {
      return;
    }

    setRefreshing(true);
    const startTime = Date.now();
    const MIN_REFRESH_TIME = 1000; // Minimum 1 second for better UX
    const MAX_REFRESH_TIME = 10000; // Maximum 10 seconds timeout

    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Refresh timeout')), MAX_REFRESH_TIME);
      });

      // Create refresh promise
      const refreshPromise = (async () => {
        await loadProducts(true);
        await loadPopularProducts();
      })();

      // Race between refresh and timeout
      await Promise.race([refreshPromise, timeoutPromise]);

      // Ensure minimum refresh time for better UX
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < MIN_REFRESH_TIME) {
        await new Promise(resolve => setTimeout(resolve, MIN_REFRESH_TIME - elapsedTime));
      }

      ToastAndroid.show('Data refreshed from Firebase', ToastAndroid.SHORT);
    } catch (refreshError) {
      console.error('Refresh error:', refreshError);
      if (refreshError instanceof Error && refreshError.message === 'Refresh timeout') {
        ToastAndroid.show('Refresh timeout - Please try again', ToastAndroid.SHORT);
      } else {
        ToastAndroid.show('Failed to refresh data', ToastAndroid.SHORT);
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.ScreenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primaryOrangeHex}
            progressBackgroundColor={COLORS.primaryDarkGreyHex}
            colors={[COLORS.primaryOrangeHex]}
            progressViewOffset={100}
            // time out for the refresh
            // timeout={10000}
            // progressViewOffset={100}
            // progressViewOffset={100}
          />
        }>
        <HeaderBar />
        {/* <FirebaseModeToggle
          // eslint-disable-next-line react-native/no-inline-styles
          style={{alignSelf: 'flex-end', marginBottom: SPACING.space_10}}
        />
        {!useFirebase && (
          <View style={styles.OfflineContainer}>
            <CustomIcon
              name="wifi-outline"
              size={FONTSIZE.size_16}
              color={COLORS.primaryLightGreyHex}
            />
            <Text style={styles.OfflineText}>Offline Mode</Text>
          </View>
        )}
        {isLoadingProducts && useFirebase && (
          <View style={styles.LoadingContainer}>
            <Text style={styles.LoadingText}>
              Loading products from Firebase...
            </Text>
          </View>
        )} */}
        <Text style={styles.ScreenTitle}>
          Find the best{'\n'}coffee for you
        </Text>
        
        {/* Enhanced Search Bar */}
        <TouchableOpacity
          onPress={() => navigation.navigate('SearchResults', {
            initialSearchText: searchText,
            initialFilters: searchFilters,
          })}
          style={styles.searchBarContainer}
        >
          <View style={styles.searchBarContent}>
            <CustomIcon
              name="search"
              size={FONTSIZE.size_18}
              color={COLORS.primaryOrangeHex}
              style={styles.searchIcon}
            />
            <Text style={styles.searchPlaceholder}>
              {searchText || 'Search coffee, beans...'}
            </Text>
            
            {/* Quick Action Buttons */}
            <View style={styles.quickActionsContainer}>
              {/* Voice Search Button */}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation(); // Prevent parent TouchableOpacity from firing
                  navigation.navigate('SearchResults', {
                    initialSearchText: searchText,
                    initialFilters: searchFilters,
                    openVoiceSearch: true,
                  });
                }}
                style={styles.quickActionButton}
              >
                <CustomIcon
                  name="mic"
                  size={FONTSIZE.size_14}
                  color={COLORS.primaryLightGreyHex}
                />
              </TouchableOpacity>
              
              {/* Image Search Button */}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation(); // Prevent parent TouchableOpacity from firing
                  navigation.navigate('SearchResults', {
                    initialSearchText: searchText,
                    initialFilters: searchFilters,
                    openImageSearch: true,
                  });
                }}
                style={styles.quickActionButton}
              >
                <CustomIcon
                  name="camera"
                  size={FONTSIZE.size_14}
                  color={COLORS.primaryLightGreyHex}
                />
              </TouchableOpacity>
            </View>
            
            {hasFiltersActive && (
              <View style={styles.filterIndicator}>
                <CustomIcon
                  name="options"
                  size={FONTSIZE.size_14}
                  color={COLORS.primaryWhiteHex}
                />
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        {/* Search Results Header */}
        <SearchResultsHeader
          resultsCount={sortedCoffee.length}
          totalCount={CoffeeList.length}
          searchText={searchText}
          hasActiveFilters={hasFiltersActive}
          onClearFilters={resetSearchCoffee}
          activeFilters={searchFilters}
        />
        
        {/* Popular Products Section - Only show if we have data from Firebase */}
        {useFirebase && PopularProducts && PopularProducts.length > 0 && (
          <>
            <Text style={styles.SectionTitle}>Popular Today</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={PopularProducts.slice(0, 5)} // Show only top 5
              contentContainerStyle={styles.PopularListContainer}
              keyExtractor={item => `popular-${item.id}`}
              renderItem={({item}) => {
                return (
                  <TouchableOpacity
                    onPress={() => {
                      if (useFirebase) {
                        trackProductView(item.id);
                      }
                      navigation.push('Details', {
                        index: item.index,
                        id: item.id,
                        type: item.type,
                      });
                    }}>
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
                      buttonPressHandler={CoffeCardAddToCart}
                    />
                  </TouchableOpacity>
                );
              }}
            />
          </>
        )}
        {/* Category Scroller */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.CategoryScrollViewStyle}>
          {categories.map((data, index) => (
            <View
              key={index.toString()}
              style={styles.CategoryScrollViewContainer}>
              <TouchableOpacity
                style={styles.CategoryScrollViewItem}
                onPress={() => {
                  ListRef?.current?.scrollToOffset({
                    animated: true,
                    offset: 0,
                  });
                  setCategoryIndex({index: index, category: categories[index]});
                  
                  // Apply category filter along with search filters
                  const categoryFiltered = getCoffeeList(categories[index], CoffeeList);
                  const finalFiltered = applyAdvancedFilters(categoryFiltered, searchFilters, searchText);
                  setSortedCoffee(finalFiltered);
                }}>
                <Text
                  style={[
                    styles.CategoryText,
                    categoryIndex.index === index
                      ? {color: COLORS.primaryOrangeHex}
                      : {},
                  ]}>
                  {data}
                </Text>
                {categoryIndex.index === index ? (
                  <View style={styles.ActiveCategory} />
                ) : (
                  <></>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        {/* Coffee Flatlist */}
        <FlatList
          ref={ListRef}
          horizontal
          ListEmptyComponent={
            <View style={styles.EmptyListContainer}>
              <Text style={styles.CategoryText}>No Coffee Available</Text>
            </View>
          }
          showsHorizontalScrollIndicator={false}
          data={sortedCoffee}
          contentContainerStyle={styles.FlatListContainer}
          keyExtractor={item => item.id}
          renderItem={({item}) => {
            return (
              <TouchableOpacity
                onPress={() => {
                  // Track product view when navigating to details
                  if (useFirebase) {
                    trackProductView(item.id);
                  }
                  navigation.push('Details', {
                    index: item.index,
                    id: item.id,
                    type: item.type,
                  });
                }}>
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
                  buttonPressHandler={CoffeCardAddToCart}
                />
              </TouchableOpacity>
            );
          }}
        />
        <Text style={styles.CoffeeBeansTitle}>Coffee Beans</Text>
        {/* Beans Flatlist */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={BeanList}
          contentContainerStyle={[
            styles.FlatListContainer,
            {marginBottom: tabBarHeight},
          ]}
          keyExtractor={item => item.id}
          renderItem={({item}) => {
            return (
              <TouchableOpacity
                onPress={() => {
                  // Track product view when navigating to details
                  if (useFirebase) {
                    trackProductView(item.id);
                  }
                  navigation.push('Details', {
                    index: item.index,
                    id: item.id,
                    type: item.type,
                  });
                }}>
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
                  buttonPressHandler={CoffeCardAddToCart}
                />
              </TouchableOpacity>
            );
          }}
        />
      </ScrollView>
      
      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        visible={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={searchFilters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  ScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  ScrollViewFlex: {
    flexGrow: 1,
  },
  ScreenTitle: {
    fontSize: FONTSIZE.size_28,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    paddingLeft: SPACING.space_30,
  },
  searchBarContainer: {
    marginHorizontal: SPACING.space_20,
    marginBottom: SPACING.space_10,
    marginTop: SPACING.space_10,
    marginVertical: SPACING.space_10,
  },
  searchBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_15,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  searchIcon: {
    marginRight: SPACING.space_12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
  },
  filterIndicator: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_8,
  },
  CategoryScrollViewStyle: {
    paddingHorizontal: SPACING.space_20,
    marginBottom: SPACING.space_20,
  },
  CategoryScrollViewContainer: {
    paddingHorizontal: SPACING.space_15,
  },
  CategoryScrollViewItem: {
    alignItems: 'center',
  },
  CategoryText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_4,
  },
  ActiveCategory: {
    height: SPACING.space_10,
    width: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_10,
    backgroundColor: COLORS.primaryOrangeHex,
  },
  FlatListContainer: {
    gap: SPACING.space_20,
    paddingVertical: SPACING.space_20,
    paddingHorizontal: SPACING.space_30,
  },
  EmptyListContainer: {
    width: Dimensions.get('window').width - SPACING.space_30 * 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_36 * 3.6,
  },
  CoffeeBeansTitle: {
    fontSize: FONTSIZE.size_18,
    marginLeft: SPACING.space_30,
    marginTop: SPACING.space_20,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.secondaryLightGreyHex,
  },
  LoadingContainer: {
    padding: SPACING.space_20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  LoadingText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
  },
  SectionTitle: {
    fontSize: FONTSIZE.size_20,
    marginLeft: SPACING.space_30,
    marginTop: SPACING.space_20,
    marginBottom: SPACING.space_10,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  PopularListContainer: {
    gap: SPACING.space_15,
    paddingVertical: SPACING.space_10,
    paddingHorizontal: SPACING.space_30,
  },
  OfflineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.space_10,
    marginHorizontal: SPACING.space_30,
    marginBottom: SPACING.space_10,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
  },
  OfflineText: {
    marginLeft: SPACING.space_8,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_10,
  },
  quickActionButton: {
    padding: SPACING.space_8,
  },
});

export default HomeScreen;
