import React, {useState, useEffect, useCallback} from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  FlatList,
} from 'react-native';
import {useStore} from '../store/firebaseStore';
import {BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING} from '../theme/theme';
import HeaderBar from '../components/HeaderBar';
import CustomIcon from '../components/CustomIcon';
import {
  fetchStockMovements,
  StockMovement,
} from '../services/inventoryService';

interface StockMovementsScreenProps {
  navigation: any;
  route?: {
    params?: {
      productId?: string;
      productName?: string;
    };
  };
}

const StockMovementsScreen: React.FC<StockMovementsScreenProps> = ({navigation, route}) => {
  const {isAuthenticated} = useStore();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'in' | 'out' | 'adjustment'>('all');

  const productId = route?.params?.productId;
  const productName = route?.params?.productName;

  // Load stock movements
  const loadMovements = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchStockMovements(productId, 100);
      setMovements(data);
    } catch (error) {
      console.error('Error loading stock movements:', error);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  // Refresh data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMovements();
    setRefreshing(false);
  }, [loadMovements]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      loadMovements();
    }
  }, [isAuthenticated, loadMovements]);

  // Filter movements
  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.productName.toLowerCase().includes(searchText.toLowerCase()) ||
                         movement.reason.toLowerCase().includes(searchText.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || movement.movementType === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  // Get movement type color
  const getMovementTypeColor = (type: StockMovement['movementType']) => {
    switch (type) {
      case 'in':
        return COLORS.primaryOrangeHex;
      case 'out':
        return COLORS.primaryRedHex;
      case 'adjustment':
        return '#FFA500';
      case 'transfer':
        return '#6B73FF';
      default:
        return COLORS.primaryLightGreyHex;
    }
  };

  // Get movement type icon
  const getMovementTypeIcon = (type: StockMovement['movementType']) => {
    switch (type) {
      case 'in':
        return 'add';
      case 'out':
        return 'remove';
      case 'adjustment':
        return 'create';
      case 'transfer':
        return 'swap-horizontal';
      default:
        return 'help';
    }
  };

  // Format date
  const formatDate = (timestamp: any) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  };

  // Render stock movement item
  const renderMovementItem = ({item}: {item: StockMovement}) => (
    <View style={styles.movementCard}>
      <View style={styles.movementHeader}>
        <View style={styles.movementInfo}>
          <View style={styles.movementTitleRow}>
            <View style={[styles.movementTypeIcon, {backgroundColor: getMovementTypeColor(item.movementType)}]}>
              <CustomIcon
                name={getMovementTypeIcon(item.movementType)}
                size={16}
                color={COLORS.primaryWhiteHex}
              />
            </View>
            <View style={styles.movementDetails}>
              <Text style={styles.productName}>{item.productName}</Text>
              <Text style={styles.movementType}>{item.movementType.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.movementReason}>{item.reason}</Text>
        </View>
        <View style={styles.movementQuantity}>
          <Text style={[styles.quantityText, {color: getMovementTypeColor(item.movementType)}]}>
            {item.movementType === 'in' ? '+' : item.movementType === 'out' ? '-' : '±'}{item.quantity}
          </Text>
          <Text style={styles.sizeText}>{item.size}</Text>
        </View>
      </View>

      <View style={styles.movementFooter}>
        <View style={styles.stockChange}>
          <Text style={styles.stockChangeText}>
            {item.previousStock} → {item.newStock}
          </Text>
        </View>
        <Text style={styles.movementDate}>{formatDate(item.createdAt)}</Text>
      </View>

      {item.reference && (
        <View style={styles.referenceContainer}>
          <Text style={styles.referenceText}>Ref: {item.reference}</Text>
        </View>
      )}
    </View>
  );

  // Render filter button
  const renderFilterButton = (filter: typeof selectedFilter, label: string) => (
    <TouchableOpacity
      style={[styles.filterButton, selectedFilter === filter && styles.activeFilterButton]}
      onPress={() => setSelectedFilter(filter)}>
      <Text style={[styles.filterButtonText, selectedFilter === filter && styles.activeFilterButtonText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={COLORS.primaryBlackHex} />
        <HeaderBar title="Stock Movements" />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Please log in to access stock movements</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <HeaderBar title={productName ? `${productName} - Stock Movements` : 'Stock Movements'} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.inputContainerComponent}>
          <CustomIcon
            style={styles.inputIcon}
            name="search"
            size={FONTSIZE.size_18}
            color={
              searchText.length > 0
                ? COLORS.primaryOrangeHex
                : COLORS.primaryLightGreyHex
            }
          />
          <TextInput
            placeholder="Search movements..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={COLORS.primaryLightGreyHex}
            style={styles.textInputContainer}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <CustomIcon
                style={styles.inputIcon}
                name="close"
                size={FONTSIZE.size_16}
                color={COLORS.primaryLightGreyHex}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderFilterButton('all', 'All')}
          {renderFilterButton('in', 'Stock In')}
          {renderFilterButton('out', 'Stock Out')}
          {renderFilterButton('adjustment', 'Adjustments')}
        </ScrollView>
      </View>

      {/* Movements List */}
      <FlatList
        data={filteredMovements}
        renderItem={renderMovementItem}
        keyExtractor={(item) => item.id!}
        style={styles.movementsList}
        contentContainerStyle={styles.movementsListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CustomIcon
              name="cube"
              size={64}
              color={COLORS.primaryLightGreyHex}
            />
            <Text style={styles.emptyText}>No stock movements found</Text>
            <Text style={styles.emptySubText}>
              {searchText || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Stock movements will appear here when inventory changes occur'
              }
            </Text>
          </View>
        }
      />

      {/* Summary Stats */}
      {filteredMovements.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {filteredMovements.filter(m => m.movementType === 'in').length}
              </Text>
              <Text style={styles.summaryLabel}>Stock In</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {filteredMovements.filter(m => m.movementType === 'out').length}
              </Text>
              <Text style={styles.summaryLabel}>Stock Out</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {filteredMovements.filter(m => m.movementType === 'adjustment').length}
              </Text>
              <Text style={styles.summaryLabel}>Adjustments</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryLightGreyHex,
  },
  searchContainer: {
    paddingHorizontal: SPACING.space_20,
    paddingTop: SPACING.space_20,
  },
  inputContainerComponent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    paddingHorizontal: SPACING.space_20,
  },
  inputIcon: {
    marginRight: SPACING.space_12,
  },
  textInputContainer: {
    flex: 1,
    height: SPACING.space_40,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  filterContainer: {
    paddingHorizontal: SPACING.space_20,
    paddingTop: SPACING.space_16,
  },
  filterButton: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_20,
    marginRight: SPACING.space_8,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  filterButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
  },
  activeFilterButtonText: {
    color: COLORS.primaryWhiteHex,
  },
  movementsList: {
    flex: 1,
  },
  movementsListContent: {
    paddingHorizontal: SPACING.space_20,
    paddingTop: SPACING.space_16,
    paddingBottom: SPACING.space_40,
  },
  movementCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    marginBottom: SPACING.space_12,
  },
  movementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.space_12,
  },
  movementInfo: {
    flex: 1,
  },
  movementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_8,
  },
  movementTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: BORDERRADIUS.radius_8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.space_12,
  },
  movementDetails: {
    flex: 1,
  },
  productName: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_2,
  },
  movementType: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryOrangeHex,
  },
  movementReason: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
  },
  movementQuantity: {
    alignItems: 'flex-end',
  },
  quantityText: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_18,
    marginBottom: SPACING.space_2,
  },
  sizeText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
  },
  movementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.space_8,
    borderTopWidth: 1,
    borderTopColor: COLORS.primaryGreyHex,
  },
  stockChange: {
    flex: 1,
  },
  stockChangeText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
  movementDate: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.secondaryLightGreyHex,
  },
  referenceContainer: {
    marginTop: SPACING.space_8,
    paddingTop: SPACING.space_8,
    borderTopWidth: 1,
    borderTopColor: COLORS.primaryGreyHex,
  },
  referenceText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryOrangeHex,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.space_40,
  },
  emptyText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryLightGreyHex,
    marginTop: SPACING.space_16,
    marginBottom: SPACING.space_8,
  },
  emptySubText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
    textAlign: 'center',
    paddingHorizontal: SPACING.space_20,
  },
  summaryContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    paddingVertical: SPACING.space_16,
    paddingHorizontal: SPACING.space_20,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryOrangeHex,
    marginBottom: SPACING.space_4,
  },
  summaryLabel: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryLightGreyHex,
  },
});

export default StockMovementsScreen; 