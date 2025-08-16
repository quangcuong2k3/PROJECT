import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
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

interface SearchResultsHeaderProps {
  resultsCount: number;
  totalCount: number;
  searchText: string;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  activeFilters: SearchFilters;
}

const SearchResultsHeader: React.FC<SearchResultsHeaderProps> = ({
  resultsCount,
  totalCount,
  searchText,
  hasActiveFilters,
  onClearFilters,
  activeFilters,
}) => {
  if (!searchText && !hasActiveFilters) {
    return null;
  }

  const getSortLabel = (sortBy: SearchFilters['sortBy']) => {
    switch (sortBy) {
      case 'name': return 'A-Z';
      case 'price_low': return 'Price ↑';
      case 'price_high': return 'Price ↓';
      case 'rating': return 'Rating ↓';
      case 'popularity': return 'Popular';
      default: return 'Popular';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primaryDarkGreyHex, COLORS.primaryGreyHex]}
        style={styles.gradient}
      >
        {/* Results Info */}
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsCount}>
            {resultsCount} {resultsCount === 1 ? 'result' : 'results'}
            {totalCount > 0 && resultsCount < totalCount && (
              <Text style={styles.totalCount}> of {totalCount}</Text>
            )}
          </Text>
          
          {searchText && (
            <Text style={styles.searchQuery}>
              for "{searchText}"
            </Text>
          )}
        </View>

        {/* Active Filters */}
        {hasActiveFilters && (
          <View style={styles.filtersSection}>
            <View style={styles.activeFiltersContainer}>
              {/* Sort indicator */}
              {activeFilters.sortBy !== 'popularity' && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>
                    {getSortLabel(activeFilters.sortBy)}
                  </Text>
                </View>
              )}
              
              {/* Price filter */}
              {(activeFilters.priceRange.min > 0 || activeFilters.priceRange.max < 50) && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>
                    ${activeFilters.priceRange.min}-${activeFilters.priceRange.max}
                  </Text>
                </View>
              )}
              
              {/* Rating filter */}
              {activeFilters.minRating > 1 && (
                <View style={styles.filterChip}>
                  <CustomIcon
                    name="star"
                    size={FONTSIZE.size_12}
                    color={COLORS.primaryOrangeHex}
                  />
                  <Text style={styles.filterChipText}>
                    {activeFilters.minRating}+
                  </Text>
                </View>
              )}
              
              {/* Roast levels */}
              {activeFilters.roastLevels.map((roast, index) => (
                <View key={index} style={styles.filterChip}>
                  <Text style={styles.filterChipText}>
                    {roast.replace(' Roasted', '')}
                  </Text>
                </View>
              ))}
            </View>

            {/* Clear filters button */}
            <TouchableOpacity
              onPress={onClearFilters}
              style={styles.clearButton}
            >
              <CustomIcon
                name="close-circle"
                size={FONTSIZE.size_16}
                color={COLORS.primaryLightGreyHex}
              />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.space_30,
    marginBottom: SPACING.space_15,
    borderRadius: BORDERRADIUS.radius_15,
    overflow: 'hidden',
  },
  gradient: {
    padding: SPACING.space_15,
  },
  resultsInfo: {
    marginBottom: SPACING.space_8,
  },
  resultsCount: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  totalCount: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
  },
  searchQuery: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    marginTop: SPACING.space_4,
  },
  filtersSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.space_8,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    gap: SPACING.space_8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
    paddingHorizontal: SPACING.space_8,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_10,
    gap: SPACING.space_4,
  },
  filterChipText: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_8,
    paddingVertical: SPACING.space_4,
    gap: SPACING.space_4,
  },
  clearButtonText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
  },
});

export default SearchResultsHeader; 