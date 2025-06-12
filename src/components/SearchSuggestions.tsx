import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  ScrollView,
  Dimensions,
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

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

interface SearchSuggestionsProps {
  suggestions: string[];
  recentSearches: string[];
  searchText: string;
  onSearchTextChange: (text: string) => void;
  onSuggestionSelect: (suggestion: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  suggestions,
  recentSearches,
  searchText,
  onSearchTextChange,
  onSuggestionSelect,
  onClose,
  isVisible,
}) => {
  const [animatedValue] = useState(new Animated.Value(0));
  const [inputText, setInputText] = useState(searchText);

  useEffect(() => {
    setInputText(searchText);
  }, [searchText]);

  useEffect(() => {
    if (isVisible) {
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const handleTextChange = (text: string) => {
    setInputText(text);
    onSearchTextChange(text);
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
    onSuggestionSelect(suggestion);
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => {
      const isMatch = part.toLowerCase() === query.toLowerCase();
      return (
        <Text
          key={index}
          style={[
            styles.suggestionText,
            isMatch && styles.highlightedText,
          ]}
        >
          {part}
        </Text>
      );
    });
  };

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.overlayTouch}
        activeOpacity={1}
        onPress={onClose}
      />
      
      <Animated.View
        style={[
          styles.container,
          {
            opacity: animatedValue,
            transform: [
              {
                translateY: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
              {
                scale: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[COLORS.primaryDarkGreyHex, COLORS.primaryGreyHex]}
          style={styles.gradient}
        >
          {/* Search Input */}
          <View style={styles.searchInputContainer}>
            <CustomIcon
              name="search"
              size={FONTSIZE.size_18}
              color={COLORS.primaryOrangeHex}
              style={styles.searchIcon}
            />
            
            <TextInput
              value={inputText}
              onChangeText={handleTextChange}
              placeholder="Search coffee, beans..."
              placeholderTextColor={COLORS.primaryLightGreyHex}
              style={styles.searchInput}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => {
                if (inputText.trim()) {
                  onSuggestionSelect(inputText.trim());
                }
              }}
            />

            {inputText.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setInputText('');
                  onSearchTextChange('');
                }}
                style={styles.clearButton}
              >
                <CustomIcon
                  name="close"
                  size={FONTSIZE.size_16}
                  color={COLORS.primaryLightGreyHex}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Suggestions Content */}
          <ScrollView
            style={styles.suggestionsContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Recent Searches */}
            {recentSearches.length > 0 && !inputText.trim() && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <CustomIcon
                    name="time"
                    size={FONTSIZE.size_14}
                    color={COLORS.primaryLightGreyHex}
                  />
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                </View>
                
                                 {recentSearches.map((search, index) => (
                   <TouchableOpacity
                     key={`recent-${index}`}
                     style={styles.suggestionItem}
                     onPress={() => handleSuggestionPress(search)}
                   >
                     <CustomIcon
                       name="search"
                       size={FONTSIZE.size_16}
                       color={COLORS.primaryLightGreyHex}
                     />
                     <Text style={styles.suggestionText}>{search}</Text>
                     <CustomIcon
                       name="arrow-forward"
                       size={FONTSIZE.size_14}
                       color={COLORS.primaryLightGreyHex}
                     />
                   </TouchableOpacity>
                 ))}
              </View>
            )}

            {/* Auto-Complete Suggestions */}
            {suggestions.length > 0 && inputText.trim() && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <CustomIcon
                    name="bulb"
                    size={FONTSIZE.size_14}
                    color={COLORS.primaryOrangeHex}
                  />
                  <Text style={styles.sectionTitle}>Suggestions</Text>
                </View>
                
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={`suggestion-${index}`}
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestionPress(suggestion)}
                  >
                    <CustomIcon
                      name="search"
                      size={FONTSIZE.size_16}
                      color={COLORS.primaryOrangeHex}
                    />
                    <View style={styles.suggestionTextContainer}>
                      {highlightText(suggestion, inputText)}
                    </View>
                    <CustomIcon
                      name="arrow-up-outline"
                      size={FONTSIZE.size_14}
                      color={COLORS.primaryLightGreyHex}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Popular Searches */}
            {!inputText.trim() && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <CustomIcon
                    name="trending-up"
                    size={FONTSIZE.size_14}
                    color={COLORS.primaryOrangeHex}
                  />
                  <Text style={styles.sectionTitle}>Popular Searches</Text>
                </View>
                
                {['Americano', 'Latte', 'Cappuccino', 'Espresso', 'Arabica Beans'].map((search, index) => (
                  <TouchableOpacity
                    key={`popular-${index}`}
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestionPress(search)}
                  >
                    <CustomIcon
                      name="flame"
                      size={FONTSIZE.size_16}
                      color={COLORS.primaryOrangeHex}
                    />
                                         <Text style={styles.suggestionText}>{search}</Text>
                     <CustomIcon
                       name="arrow-forward"
                       size={FONTSIZE.size_14}
                       color={COLORS.primaryLightGreyHex}
                     />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Quick Filter Suggestions */}
            {!inputText.trim() && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <CustomIcon
                    name="options"
                    size={FONTSIZE.size_14}
                    color={COLORS.primaryLightGreyHex}
                  />
                  <Text style={styles.sectionTitle}>Quick Filters</Text>
                </View>
                
                <View style={styles.quickFiltersContainer}>
                  {[
                    {label: 'Top Rated', icon: 'star'},
                    {label: 'Under $5', icon: 'pricetag'},
                    {label: 'Light Roast', icon: 'sunny'},
                    {label: 'Dark Roast', icon: 'moon'},
                  ].map((filter, index) => (
                    <TouchableOpacity
                      key={`filter-${index}`}
                      style={styles.quickFilterChip}
                      onPress={() => handleSuggestionPress(filter.label)}
                    >
                      <CustomIcon
                        name={filter.icon as any}
                        size={FONTSIZE.size_12}
                        color={COLORS.primaryOrangeHex}
                      />
                      <Text style={styles.quickFilterText}>{filter.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  overlayTouch: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    top: 100,
    left: SPACING.space_20,
    right: SPACING.space_20,
    maxHeight: screenHeight * 0.7,
    borderRadius: BORDERRADIUS.radius_20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
    margin: SPACING.space_15,
    borderRadius: BORDERRADIUS.radius_15,
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
    padding: 0,
  },
  clearButton: {
    padding: SPACING.space_8,
  },
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: SPACING.space_15,
  },
  section: {
    marginBottom: SPACING.space_20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_8,
    marginBottom: SPACING.space_12,
    paddingHorizontal: SPACING.space_8,
  },
  sectionTitle: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_10,
    marginBottom: SPACING.space_4,
    backgroundColor: COLORS.primaryBlackHex,
  },
  suggestionTextContainer: {
    flex: 1,
    marginLeft: SPACING.space_12,
  },
  suggestionText: {
    flex: 1,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryWhiteHex,
    marginLeft: SPACING.space_12,
  },
  highlightedText: {
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_semibold,
  },
  quickFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_8,
    paddingHorizontal: SPACING.space_8,
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_8,
         borderRadius: BORDERRADIUS.radius_20,
     gap: SPACING.space_8,
     borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  quickFilterText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
  footer: {
    padding: SPACING.space_15,
    borderTopWidth: 1,
    borderTopColor: COLORS.primaryGreyHex,
  },
  closeButton: {
    alignSelf: 'center',
    paddingVertical: SPACING.space_8,
    paddingHorizontal: SPACING.space_20,
  },
  closeButtonText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
  },
});

export default SearchSuggestions; 