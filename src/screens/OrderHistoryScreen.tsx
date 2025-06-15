import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  RefreshControl,
  Animated,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import React, {useState, useEffect, useRef} from 'react';
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
import EmptyListAnimation from '../components/EmptyListAnimation';
import PopUpAnimation from '../components/PopUpAnimation';
import CustomIcon from '../components/CustomIcon';
import {LinearGradient} from 'expo-linear-gradient';

const {width, height} = Dimensions.get('window');

// Enhanced Order History Card Component
const EnhancedOrderHistoryCard = ({
  order,
  onPress,
  onReorder,
  onDownload,
  index,
}: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return '#4CAF50';
      case 'confirmed':
      case 'paid':
        return '#2196F3';
      case 'processing':
      case 'preparing':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return COLORS.primaryOrangeHex;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'checkmark-circle';
      case 'confirmed':
      case 'paid':
        return 'checkmark';
      case 'processing':
      case 'preparing':
        return 'time';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'cafe';
    }
  };

  return (
    <Animated.View
      style={[
        styles.orderCard,
        {
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}],
        },
      ]}>
      <LinearGradient
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        colors={[COLORS.primaryGreyHex, COLORS.primaryBlackHex]}
        style={styles.orderCardGradient}>
        
        {/* Order Header */}
        <TouchableOpacity
          style={styles.orderHeader}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.8}>
          
          <View style={styles.orderHeaderLeft}>
            <View style={styles.orderIdContainer}>
              <Text style={styles.orderIdLabel}>Order</Text>
              <Text style={styles.orderIdText}>#{order.id || 'N/A'}</Text>
            </View>
            
            <View style={styles.orderDateContainer}>
              <CustomIcon
                name="calendar"
                size={FONTSIZE.size_14}
                color={COLORS.primaryLightGreyHex}
              />
              <Text style={styles.orderDateText}>{order.OrderDate}</Text>
            </View>
          </View>

          <View style={styles.orderHeaderRight}>
            <View style={[styles.statusBadge, {backgroundColor: getStatusColor(order.status)}]}>
              <CustomIcon
                name={getStatusIcon(order.status)}
                size={FONTSIZE.size_12}
                color={COLORS.primaryWhiteHex}
              />
              <Text style={styles.statusText}>{order.status || 'Completed'}</Text>
            </View>
            
            <CustomIcon
              name={expanded ? "chevron-up" : "chevron-down"}
              size={FONTSIZE.size_16}
              color={COLORS.primaryOrangeHex}
            />
          </View>
        </TouchableOpacity>

        {/* Order Summary */}
        <View style={styles.orderSummary}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <CustomIcon
                name="basket"
                size={FONTSIZE.size_16}
                color={COLORS.primaryOrangeHex}
              />
              <Text style={styles.summaryLabel}>Items</Text>
              <Text style={styles.summaryValue}>{order.CartList?.length || 0}</Text>
            </View>
            
            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryItem}>
              <CustomIcon
                name="card"
                size={FONTSIZE.size_16}
                color={COLORS.primaryOrangeHex}
              />
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValuePrice}>${order.CartListPrice}</Text>
            </View>
          </View>
        </View>

        {/* Expandable Order Details */}
        {expanded && (
          <Animated.View style={styles.orderDetails}>
            <View style={styles.orderItemsHeader}>
              <Text style={styles.orderItemsTitle}>Order Items</Text>
            </View>
            
            {order.CartList?.map((item: any, itemIndex: number) => (
              <TouchableOpacity
                key={`${item.id}-${itemIndex}`}
                style={styles.orderItem}
                onPress={() => onPress && onPress({
                  index: item.index,
                  id: item.id,
                  type: item.type,
                })}
                activeOpacity={0.7}>
                
                <View style={styles.orderItemContent}>
                  <View style={styles.orderItemInfo}>
                    <Text style={styles.orderItemName}>{item.name}</Text>
                    <Text style={styles.orderItemDetails}>
                      {item.special_ingredient}
                    </Text>
                    
                    {/* Size and Quantity Info */}
                    <View style={styles.orderItemSizes}>
                      {item.prices?.map((price: any, priceIndex: number) => (
                        <View key={priceIndex} style={styles.sizeInfo}>
                          <Text style={styles.sizeText}>{price.size}</Text>
                          <Text style={styles.quantityText}>×{price.quantity}</Text>
                          <Text style={styles.priceText}>${price.price}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  
                  <Text style={styles.orderItemPrice}>${item.ItemPrice}</Text>
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Action Buttons */}
            <View style={styles.orderActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.reorderButton]}
                onPress={() => onReorder && onReorder(order)}
                activeOpacity={0.8}>
                <CustomIcon
                  name="refresh"
                  size={FONTSIZE.size_16}
                  color={COLORS.primaryWhiteHex}
                />
                <Text style={styles.actionButtonText}>Reorder</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.downloadButton]}
                onPress={() => onDownload && onDownload(order)}
                activeOpacity={0.8}>
                <CustomIcon
                  name="download"
                  size={FONTSIZE.size_16}
                  color={COLORS.primaryOrangeHex}
                />
                <Text style={[styles.actionButtonText, {color: COLORS.primaryOrangeHex}]}>
                  Download
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const OrderHistoryScreen = ({navigation}: any) => {
  const OrderHistoryList = useStore((state: any) => state.OrderHistoryList);
  const isLoadingOrders = useStore((state: any) => state.isLoadingOrders);
  const loadOrderHistory = useStore((state: any) => state.loadOrderHistory);
  const addToCart = useStore((state: any) => state.addToCart);
  const calculateCartPrice = useStore((state: any) => state.calculateCartPrice);
  const clearCart = useStore((state: any) => state.clearCart);
  const useFirebase = useStore((state: any) => state.useFirebase);
  const isAuthenticated = useStore((state: any) => state.isAuthenticated);
  const error = useStore((state: any) => state.error);
  
  const tabBarHeight = useBottomTabBarHeight();
  const [showAnimation, setShowAnimation] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, delivered, processing, cancelled
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, amount

  const headerAnimValue = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // Load order history on mount
  useEffect(() => {
    if (useFirebase && isAuthenticated) {
      loadOrderHistory();
    }
  }, [useFirebase, isAuthenticated, loadOrderHistory]);

  // Header animation
  useEffect(() => {
    Animated.timing(headerAnimValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Filter and sort orders
  const processedOrders = React.useMemo(() => {
    let filtered = [...OrderHistoryList];
    
    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(order => 
        order.status?.toLowerCase() === filter.toLowerCase()
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.OrderDate).getTime() - new Date(b.OrderDate).getTime();
        case 'amount':
          return parseFloat(b.CartListPrice) - parseFloat(a.CartListPrice);
        case 'newest':
        default:
          return new Date(b.OrderDate).getTime() - new Date(a.OrderDate).getTime();
      }
    });
    
    return filtered;
  }, [OrderHistoryList, filter, sortBy]);

  const onRefresh = async () => {
    if (!useFirebase || !isAuthenticated) {
      return;
    }

    setRefreshing(true);
    try {
      await loadOrderHistory();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const navigationHandler = ({index, id, type}: any) => {
    navigation.push('Details', {
      index,
      id,
      type,
    });
  };

  const handleReorder = async (order: any) => {
    try {
      Alert.alert(
        'Reorder Items',
        'This will clear your current cart and add these items. Continue?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Reorder',
            onPress: async () => {
              clearCart();
              
              // Add each item to cart
              order.CartList?.forEach((item: any) => {
                item.prices?.forEach((price: any) => {
                  for (let i = 0; i < (price.quantity || 1); i++) {
                    addToCart({
                      ...item,
                      prices: [price],
                    });
                  }
                });
              });
              
              calculateCartPrice();
              navigation.navigate('Cart');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to reorder items');
    }
  };

  const handleDownload = (order: any) => {
    setShowAnimation(true);
    setTimeout(() => {
      setShowAnimation(false);
    }, 2000);
  };

  const FilterChip = ({label, value, active}: any) => (
    <TouchableOpacity
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={() => setFilter(value)}
      activeOpacity={0.8}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <EmptyListAnimation title="No Order History" />
      <Text style={styles.emptyStateText}>
        {!useFirebase 
          ? 'Enable Firebase to view your order history'
          : !isAuthenticated
          ? 'Sign in to view your order history'
          : 'You haven\'t placed any orders yet'
        }
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => navigation.navigate('Tab', {screen: 'Home'})}
        activeOpacity={0.8}>
        <Text style={styles.emptyStateButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.ScreenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} barStyle="light-content" />

      {showAnimation && (
        <PopUpAnimation
          style={styles.LottieAnimation}
          source={require('../lottie/download.json')}
        />
      )}

      {/* Animated Header */}
      <Animated.View
        style={[
          styles.headerContainer,
          {
            opacity: headerAnimValue,
            transform: [
              {
                translateY: headerAnimValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
          },
        ]}>
        <HeaderBar title="Order History" />
        
        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{OrderHistoryList.length}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
                         <Text style={styles.statNumber}>
               ${OrderHistoryList.reduce((sum: number, order: any) => 
                 sum + parseFloat(order.CartListPrice || '0'), 0
               ).toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}>
          <FilterChip label="All" value="all" active={filter === 'all'} />
          <FilterChip label="Delivered" value="delivered" active={filter === 'delivered'} />
          <FilterChip label="Processing" value="processing" active={filter === 'processing'} />
          <FilterChip label="Confirmed" value="confirmed" active={filter === 'confirmed'} />
        </ScrollView>
      </Animated.View>

      {/* Order List */}
      <FlatList
        data={processedOrders}
        keyExtractor={(item, index) => `order-${index}-${item.OrderDate}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContainer,
          {paddingBottom: tabBarHeight + SPACING.space_20}
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primaryOrangeHex}
            progressBackgroundColor={COLORS.primaryDarkGreyHex}
            colors={[COLORS.primaryOrangeHex]}
          />
        }
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {useNativeDriver: false}
        )}
        ListEmptyComponent={renderEmptyState}
        renderItem={({item, index}) => (
          <EnhancedOrderHistoryCard
            order={item}
            onPress={navigationHandler}
            onReorder={handleReorder}
            onDownload={handleDownload}
            index={index}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  ScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  LottieAnimation: {
    height: 250,
    position: 'absolute',
    top: height / 2 - 125,
    left: width / 2 - 125,
    width: 250,
    zIndex: 1000,
  },
  headerContainer: {
    backgroundColor: COLORS.primaryBlackHex,
    paddingBottom: SPACING.space_15,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.space_30,
    marginTop: SPACING.space_15,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    paddingVertical: SPACING.space_15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryOrangeHex,
  },
  statLabel: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
    marginTop: SPACING.space_4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.primaryGreyHex,
  },
  filtersContainer: {
    paddingHorizontal: SPACING.space_20,
    paddingTop: SPACING.space_15,
    gap: SPACING.space_10,
  },
  filterChip: {
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_20,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderColor: COLORS.primaryOrangeHex,
  },
  filterChipText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
  },
  filterChipTextActive: {
    color: COLORS.primaryWhiteHex,
  },
  listContainer: {
    padding: SPACING.space_20,
    gap: SPACING.space_15,
  },
  orderCard: {
    borderRadius: BORDERRADIUS.radius_20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primaryBlackHex,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  orderCardGradient: {
    padding: SPACING.space_20,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_8,
  },
  orderIdLabel: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
    marginRight: SPACING.space_8,
  },
  orderIdText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
  },
  orderDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_8,
  },
  orderDateText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
  },
  orderHeaderRight: {
    alignItems: 'flex-end',
    gap: SPACING.space_10,
  },
     statusBadge: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: SPACING.space_12,
     paddingVertical: SPACING.space_8,
     borderRadius: BORDERRADIUS.radius_15,
     gap: SPACING.space_8,
   },
  statusText: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    textTransform: 'capitalize',
  },
  orderSummary: {
    marginTop: SPACING.space_15,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_15,
  },
     summaryItem: {
     flex: 1,
     alignItems: 'center',
     gap: SPACING.space_8,
   },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.primaryGreyHex,
  },
  summaryLabel: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
  },
  summaryValue: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
  },
  summaryValuePrice: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryOrangeHex,
  },
  orderDetails: {
    marginTop: SPACING.space_20,
    borderTopWidth: 1,
    borderTopColor: COLORS.primaryGreyHex,
    paddingTop: SPACING.space_20,
  },
  orderItemsHeader: {
    marginBottom: SPACING.space_15,
  },
  orderItemsTitle: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  orderItem: {
    marginBottom: SPACING.space_15,
    backgroundColor: COLORS.primaryBlackHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_15,
  },
  orderItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderItemInfo: {
    flex: 1,
    marginRight: SPACING.space_15,
  },
  orderItemName: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  orderItemDetails: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_10,
  },
  orderItemSizes: {
    gap: SPACING.space_10,
  },
  sizeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_10,
  },
  sizeText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
    minWidth: 30,
  },
  quantityText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
    minWidth: 25,
  },
  priceText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
  orderItemPrice: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryOrangeHex,
  },
  orderActions: {
    flexDirection: 'row',
    gap: SPACING.space_15,
    marginTop: SPACING.space_20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
    gap: SPACING.space_8,
  },
  reorderButton: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  downloadButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primaryOrangeHex,
  },
  actionButtonText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.space_30,
    paddingTop: SPACING.space_36 * 2,
  },
  emptyStateText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    marginTop: SPACING.space_20,
    lineHeight: 24,
  },
  emptyStateButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingHorizontal: SPACING.space_24,
    paddingVertical: SPACING.space_15,
    borderRadius: BORDERRADIUS.radius_20,
    marginTop: SPACING.space_30,
  },
  emptyStateButtonText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
});

export default OrderHistoryScreen;
