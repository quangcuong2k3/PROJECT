import React, {useState, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {BlurView} from 'expo-blur';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';
import CustomIcon from './CustomIcon';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export interface SearchFilters {
  priceRange: {min: number; max: number};
  minRating: number;
  roastLevels: string[];
  sortBy: 'name' | 'price_low' | 'price_high' | 'rating' | 'popularity';
}

interface AdvancedSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: SearchFilters) => void;
  initialFilters: SearchFilters;
}

const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  initialFilters,
}) => {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [animatedValue] = useState(new Animated.Value(0));

  // Price range constants
  const MIN_PRICE = 0;
  const MAX_PRICE = 50;
  const priceSteps = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

  // Available roast levels
  const roastLevels = ['Light Roasted', 'Medium Roasted', 'Dark Roasted'];
  
  // Sort options
  const sortOptions = [
    {key: 'popularity', label: 'Most Popular', icon: 'flame'},
    {key: 'rating', label: 'Highest Rated', icon: 'star'},
    {key: 'price_low', label: 'Price: Low to High', icon: 'chevron-up'},
    {key: 'price_high', label: 'Price: High to Low', icon: 'chevron-down'},
    {key: 'name', label: 'Name (A-Z)', icon: 'text'},
  ];

  useEffect(() => {
    if (visible) {
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();
    } else {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Simplified Price Range Component
  const PriceRangeFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.sectionTitle}>Price Range</Text>
      <View style={styles.priceRangeDisplay}>
        <Text style={styles.priceRangeText}>
          ${filters.priceRange.min} - ${filters.priceRange.max}
        </Text>
      </View>
      
      <View style={styles.pricePresetsContainer}>
        {[
          {label: 'All', range: {min: 0, max: 50}},
          {label: 'Budget', range: {min: 0, max: 5}},
          {label: 'Mid-range', range: {min: 5, max: 20}},
          {label: 'Premium', range: {min: 20, max: 50}},
        ].map((preset, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setFilters(prev => ({...prev, priceRange: preset.range}))}
            style={[
              styles.presetButton,
              filters.priceRange.min === preset.range.min && 
              filters.priceRange.max === preset.range.max && 
              styles.presetButtonActive,
            ]}
          >
            <Text style={[
              styles.presetButtonText,
              filters.priceRange.min === preset.range.min && 
              filters.priceRange.max === preset.range.max && 
              styles.presetButtonTextActive,
            ]}>
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Simplified Rating Filter Component
  const RatingFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.sectionTitle}>Rating</Text>
      <View style={styles.ratingOptionsContainer}>
        {[
          {label: 'Any', value: 1},
          {label: '3+ ⭐', value: 3},
          {label: '4+ ⭐', value: 4},
          {label: '5 ⭐', value: 5},
        ].map((option, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setFilters(prev => ({...prev, minRating: option.value}))}
            style={[
              styles.presetButton,
              filters.minRating === option.value && styles.presetButtonActive,
            ]}
          >
            <Text style={[
              styles.presetButtonText,
              filters.minRating === option.value && styles.presetButtonTextActive,
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Simplified Roast Level Filter Component
  const RoastLevelFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.sectionTitle}>Roast Level</Text>
      <View style={styles.roastOptionsContainer}>
        {['All', ...roastLevels].map((level, index) => {
          const isSelected = level === 'All' 
            ? filters.roastLevels.length === 0 
            : filters.roastLevels.includes(level);
          return (
            <TouchableOpacity
              key={level}
              onPress={() => {
                if (level === 'All') {
                  setFilters(prev => ({...prev, roastLevels: []}));
                } else {
                  setFilters(prev => ({
                    ...prev,
                    roastLevels: isSelected
                      ? prev.roastLevels.filter(r => r !== level)
                      : [level], // Only allow one selection for simplicity
                  }));
                }
              }}
              style={[
                styles.presetButton,
                isSelected && styles.presetButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.presetButtonText,
                  isSelected && styles.presetButtonTextActive,
                ]}
              >
                {level === 'All' ? 'Any' : level.replace(' Roasted', '')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // Simplified Sort Options Component
  const SortOptions = () => (
    <View style={styles.filterSection}>
      <Text style={styles.sectionTitle}>Sort By</Text>
      <View style={styles.sortOptionsContainer}>
        {sortOptions.map(option => {
          const isSelected = filters.sortBy === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              onPress={() => setFilters(prev => ({...prev, sortBy: option.key as any}))}
              style={[
                styles.presetButton,
                isSelected && styles.presetButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.presetButtonText,
                  isSelected && styles.presetButtonTextActive,
                ]}
              >
                {option.label.replace('Price: ', '').replace('Highest ', '').replace('Most ', '')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const resetFilters = () => {
    setFilters({
      priceRange: {min: MIN_PRICE, max: MAX_PRICE},
      minRating: 1,
      roastLevels: [],
      sortBy: 'popularity',
    });
  };

  const applyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                {
                  translateY: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [screenHeight, 0],
                  }),
                },
                {
                  scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
              opacity: animatedValue,
            },
          ]}
        >
          <LinearGradient
            colors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex]}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Advanced Search</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <CustomIcon
                  name="close"
                  size={FONTSIZE.size_20}
                  color={COLORS.primaryWhiteHex}
                />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <PriceRangeFilter />
              <RatingFilter />
              <RoastLevelFilter />
              <SortOptions />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={resetFilters}
                style={[styles.footerButton, styles.resetButton]}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={applyFilters}
                style={[styles.footerButton, styles.applyButton]}
              >
                <LinearGradient
                  colors={[COLORS.primaryOrangeHex, '#E68B5B']}
                  style={styles.applyButtonGradient}
                >
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouch: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: screenHeight * 0.75,
    borderTopLeftRadius: BORDERRADIUS.radius_25,
    borderTopRightRadius: BORDERRADIUS.radius_25,
    overflow: 'hidden',
  },
  modalGradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.space_20,
    paddingTop: SPACING.space_30,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryGreyHex,
  },
  headerTitle: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  closeButton: {
    padding: SPACING.space_8,
  },
  content: {
    flex: 1,
    padding: SPACING.space_20,
  },
  sectionTitle: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_15,
  },
  
  // Simplified Filter Section Styles
  filterSection: {
    marginBottom: SPACING.space_24,
  },
  priceRangeDisplay: {
    backgroundColor: COLORS.primaryBlackHex,
    borderRadius: BORDERRADIUS.radius_10,
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_16,
    marginBottom: SPACING.space_15,
    alignItems: 'center',
  },
  priceRangeText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryOrangeHex,
  },
  pricePresetsContainer: {
    flexDirection: 'row',
    gap: SPACING.space_8,
  },
  presetButton: {
    flex: 1,
    paddingVertical: SPACING.space_10,
    paddingHorizontal: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderColor: COLORS.primaryOrangeHex,
  },
  presetButtonText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
  },
  presetButtonTextActive: {
    color: COLORS.primaryWhiteHex,
  },

  // Rating Filter Styles
  ratingOptionsContainer: {
    flexDirection: 'row',
    gap: SPACING.space_8,
  },

  // Roast Level Filter Styles
  roastOptionsContainer: {
    flexDirection: 'row',
    gap: SPACING.space_8,
  },

  // Sort Options Styles
  sortOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_8,
  },

  // Footer Styles
  footer: {
    flexDirection: 'row',
    padding: SPACING.space_20,
    gap: SPACING.space_15,
    borderTopWidth: 1,
    borderTopColor: COLORS.primaryGreyHex,
  },
  footerButton: {
    flex: 1,
    height: 50,
    borderRadius: BORDERRADIUS.radius_15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButton: {
    borderWidth: 1,
    borderColor: COLORS.primaryLightGreyHex,
  },
  resetButtonText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
  },
  applyButton: {
    flex: 2,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
});

export default AdvancedSearchModal;