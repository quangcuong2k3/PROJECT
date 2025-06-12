import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';
import CustomIcon from './CustomIcon';
import {SearchFilters} from './AdvancedSearchModal';

interface EnhancedSearchBarProps {
  searchText: string;
  onSearchTextChange: (text: string) => void;
  onClearSearch: () => void;
  onFilterPress: () => void;
  activeFilters: SearchFilters;
  hasActiveFilters: boolean;
}

const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  searchText,
  onSearchTextChange,
  onClearSearch,
  onFilterPress,
  activeFilters,
  hasActiveFilters,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    
    // Check price range
    if (activeFilters.priceRange.min > 0 || activeFilters.priceRange.max < 50) {
      count++;
    }
    
    // Check rating
    if (activeFilters.minRating > 1) {
      count++;
    }
    
    // Check roast levels
    if (activeFilters.roastLevels.length > 0) {
      count++;
    }
    
    // Check sort (only if not default)
    if (activeFilters.sortBy !== 'popularity') {
      count++;
    }
    
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            borderColor: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [COLORS.primaryGreyHex, COLORS.primaryOrangeHex],
            }),
            shadowOpacity: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            }),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => onSearchTextChange(searchText)}
          style={styles.searchIconContainer}
        >
          <CustomIcon
            name="search"
            size={FONTSIZE.size_18}
            color={
              searchText.length > 0 || isFocused
                ? COLORS.primaryOrangeHex
                : COLORS.primaryLightGreyHex
            }
          />
        </TouchableOpacity>

        <TextInput
          placeholder="Find Your Coffee..."
          value={searchText}
          onChangeText={onSearchTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={COLORS.primaryLightGreyHex}
          style={styles.textInput}
          returnKeyType="search"
          clearButtonMode="never"
        />

        <View style={styles.actionsContainer}>
          {searchText.length > 0 && (
            <TouchableOpacity onPress={onClearSearch} style={styles.actionButton}>
              <CustomIcon
                name="close"
                size={FONTSIZE.size_16}
                color={COLORS.primaryLightGreyHex}
              />
            </TouchableOpacity>
          )}

          {/* Filter Button */}
          <TouchableOpacity
            onPress={onFilterPress}
            style={[
              styles.filterButton,
              hasActiveFilters && styles.filterButtonActive,
            ]}
          >
            {hasActiveFilters ? (
              <LinearGradient
                colors={[COLORS.primaryOrangeHex, '#E68B5B']}
                style={styles.filterButtonGradient}
              >
                <CustomIcon
                  name="options"
                  size={FONTSIZE.size_16}
                  color={COLORS.primaryWhiteHex}
                />
                {activeFiltersCount > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
                  </View>
                )}
              </LinearGradient>
            ) : (
              <View style={styles.filterButtonDefault}>
                <CustomIcon
                  name="options"
                  size={FONTSIZE.size_16}
                  color={COLORS.primaryLightGreyHex}
                />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <View style={styles.filtersPreview}>
          <Text style={styles.filtersPreviewText}>
            Filters: {activeFiltersCount} active
            {activeFilters.priceRange.min > 0 || activeFilters.priceRange.max < 50
              ? ` • $${activeFilters.priceRange.min}-$${activeFilters.priceRange.max}`
              : ''}
            {activeFilters.minRating > 1 ? ` • ${activeFilters.minRating}+ stars` : ''}
            {activeFilters.roastLevels.length > 0
              ? ` • ${activeFilters.roastLevels.length} roast${
                  activeFilters.roastLevels.length > 1 ? 's' : ''
                }`
              : ''}
          </Text>
          <TouchableOpacity onPress={onFilterPress}>
            <Text style={styles.editFiltersText}>Edit</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.space_30,
    marginBottom: SPACING.space_10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_4,
    shadowColor: COLORS.primaryOrangeHex,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 8,
    elevation: 3,
  },
  searchIconContainer: {
    padding: SPACING.space_8,
  },
  textInput: {
    flex: 1,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_8,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_8,
  },
  actionButton: {
    padding: SPACING.space_8,
  },
  filterButton: {
    borderRadius: BORDERRADIUS.radius_15,
    overflow: 'hidden',
  },
  filterButtonActive: {
    shadowColor: COLORS.primaryOrangeHex,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  filterButtonGradient: {
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_4,
    position: 'relative',
  },
  filterButtonDefault: {
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_10,
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.primaryRedHex,
    borderRadius: BORDERRADIUS.radius_10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
  },
  filtersPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.space_8,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_8,
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
  },
  filtersPreviewText: {
    flex: 1,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
  },
  editFiltersText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryOrangeHex,
  },
});

export default EnhancedSearchBar; 