import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  FlatList,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import {useStore} from '../store/firebaseStore';
import {BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING} from '../theme/theme';
import HeaderBar from '../components/HeaderBar';
import CustomIcon from '../components/CustomIcon';
import InventoryDashboard from '../components/InventoryDashboard';
import {
  fetchInventoryItems,
  fetchStockAlerts,
  updateStock,
  markAlertAsRead,
  deleteAlert,
  getInventoryStats,
  formatCurrency,
  subscribeToInventory,
  subscribeToStockAlerts,
  InventoryItem,
  StockAlert,
  StockLevel,
} from '../services/inventoryService';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

interface InventoryScreenProps {
  navigation: any;
}

type TabType = 'dashboard' | 'inventory' | 'alerts' | 'stats';

const InventoryScreen: React.FC<InventoryScreenProps> = ({navigation}) => {
  const {user, isAuthenticated} = useStore();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedTab, setSelectedTab] = useState<TabType>('dashboard');
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [newStockValue, setNewStockValue] = useState('');
  const [stockReason, setStockReason] = useState('');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const searchFocusAnim = useRef(new Animated.Value(0)).current;

  // Tab configuration
  const tabs: Array<{key: TabType; title: string; icon: string; color: string}> = [
    {key: 'dashboard', title: 'Overview', icon: 'home', color: '#4A90E2'},
    {key: 'inventory', title: 'Stock', icon: 'cube', color: COLORS.primaryOrangeHex},
    {key: 'alerts', title: 'Alerts', icon: 'notifications', color: '#FF6B6B'},
    {key: 'stats', title: 'Analytics', icon: 'bar', color: '#50C878'},
  ];

  // Enhanced animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Tab indicator animation
  useEffect(() => {
    const tabIndex = tabs.findIndex(tab => tab.key === selectedTab);
    Animated.spring(tabIndicatorAnim, {
      toValue: tabIndex,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [selectedTab]);

  // Load data with enhanced loading states
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [items, alerts] = await Promise.all([
        fetchInventoryItems(),
        fetchStockAlerts(),
      ]);
      setInventoryItems(items);
      setStockAlerts(alerts);
    } catch (error) {
      console.error('Error loading inventory data:', error);
      Alert.alert('🚫 Connection Issue', 'Unable to load inventory data. Please check your connection and try again.', [
        {text: 'Retry', onPress: loadData},
        {text: 'Cancel', style: 'cancel'}
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enhanced refresh with haptic feedback
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Add haptic feedback if available
    if (Platform.OS === 'ios') {
      const {HapticFeedback} = require('react-native');
      HapticFeedback?.impact?.(HapticFeedback.ImpactFeedbackStyle.Light);
    }
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribeInventory = subscribeToInventory(setInventoryItems);
    const unsubscribeAlerts = subscribeToStockAlerts(setStockAlerts);

    return () => {
      unsubscribeInventory();
      unsubscribeAlerts();
    };
  }, [isAuthenticated]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Enhanced search animation
  const handleSearchFocus = () => {
    Animated.spring(searchFocusAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  const handleSearchBlur = () => {
    Animated.spring(searchFocusAnim, {
      toValue: 0,
      tension: 100,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  // Filter inventory items with enhanced search
  const filteredItems = inventoryItems.filter(item =>
    item.productName.toLowerCase().includes(searchText.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchText.toLowerCase()) ||
    item.supplier.toLowerCase().includes(searchText.toLowerCase()) ||
    item.location.toLowerCase().includes(searchText.toLowerCase())
  );

  // Enhanced dashboard actions
  const handleViewInventory = () => {
    setSelectedTab('inventory');
  };

  const handleViewAlerts = () => {
    setSelectedTab('alerts');
  };

  const handleViewMovements = () => {
    navigation.navigate('StockMovements');
  };

  const handleAddStock = () => {
    if (inventoryItems.length > 0) {
      setSelectedItem(inventoryItems[0]);
      setSelectedSize(inventoryItems[0].stockLevels[0]?.size || '');
      setNewStockValue(inventoryItems[0].stockLevels[0]?.currentStock.toString() || '0');
      setShowStockModal(true);
    }
  };

  // Enhanced stock update with better feedback
  const handleStockUpdate = async () => {
    if (!selectedItem || !selectedSize || !newStockValue || !stockReason) {
      Alert.alert('⚠️ Missing Information', 'Please fill in all required fields to update stock levels.');
      return;
    }

    const stockValue = parseInt(newStockValue);
    if (isNaN(stockValue) || stockValue < 0) {
      Alert.alert('⚠️ Invalid Input', 'Please enter a valid positive number for stock quantity.');
      return;
    }

    try {
      await updateStock(
        selectedItem.id!,
        selectedSize,
        stockValue,
        stockReason,
        user?.uid || 'admin'
      );
      
      setShowStockModal(false);
      setSelectedItem(null);
      setSelectedSize('');
      setNewStockValue('');
      setStockReason('');
      
      Alert.alert('✅ Success', 'Stock levels have been updated successfully!');
    } catch (error) {
      console.error('Error updating stock:', error);
      Alert.alert('❌ Update Failed', 'Unable to update stock. Please try again.');
    }
  };

  // Enhanced alert actions
  const handleMarkAlertRead = async (alertId: string) => {
    try {
      await markAlertAsRead(alertId);
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    Alert.alert(
      '🗑️ Delete Alert',
      'Are you sure you want to remove this alert? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAlert(alertId);
            } catch (error) {
              console.error('Error deleting alert:', error);
            }
          },
        },
      ]
    );
  };

  // Enhanced status colors with gradients
  const getStatusColor = (status: InventoryItem['status']) => {
    switch (status) {
      case 'in_stock':
        return {primary: '#4CAF50', secondary: '#66BB6A'};
      case 'low_stock':
        return {primary: '#FF9800', secondary: '#FFB74D'};
      case 'out_of_stock':
        return {primary: '#F44336', secondary: '#EF5350'};
      case 'discontinued':
        return {primary: '#9E9E9E', secondary: '#BDBDBD'};
      default:
        return {primary: COLORS.primaryGreyHex, secondary: COLORS.primaryLightGreyHex};
    }
  };

  // Enhanced alert colors
  const getAlertColor = (severity: StockAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return {primary: '#D32F2F', secondary: '#FFEBEE'};
      case 'high':
        return {primary: '#F57C00', secondary: '#FFF3E0'};
      case 'medium':
        return {primary: '#FBC02D', secondary: '#FFFDE7'};
      case 'low':
        return {primary: '#388E3C', secondary: '#E8F5E8'};
      default:
        return {primary: COLORS.primaryGreyHex, secondary: COLORS.primaryDarkGreyHex};
    }
  };

  // Enhanced inventory item renderer
  const renderInventoryItem = ({item, index}: {item: InventoryItem; index: number}) => {
    const statusColors = getStatusColor(item.status);
    const animatedStyle = {
      opacity: fadeAnim,
      transform: [
        {
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0],
          }),
        },
        {scale: scaleAnim},
      ],
    };

    return (
      <Animated.View style={[styles.modernInventoryCard, animatedStyle, {
        marginTop: index === 0 ? SPACING.space_16 : SPACING.space_8,
      }]}>
        <View style={styles.cardHeader}>
          <View style={styles.productInfo}>
            <View style={styles.productTitleRow}>
              <Text style={styles.modernProductName}>{item.productName}</Text>
              <View style={[styles.modernStatusBadge, {backgroundColor: statusColors.primary}]}>
                <Text style={styles.statusBadgeText}>
                  {item.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.productSku}>SKU: {item.sku}</Text>
            <Text style={styles.productMetadata}>
              {item.productType} • {item.supplier} • {item.location}
            </Text>
          </View>
        </View>

        <View style={styles.stockMetrics}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{item.totalStock}</Text>
            <Text style={styles.metricLabel}>Total Units</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, {color: '#4CAF50'}]}>
              {formatCurrency(item.totalValue)}
            </Text>
            <Text style={styles.metricLabel}>Total Value</Text>
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.stockLevelsContainer}
          contentContainerStyle={styles.stockLevelsContent}>
          {item.stockLevels.map((level: StockLevel, index: number) => (
            <TouchableOpacity
              key={index}
              style={styles.modernStockLevel}
              onPress={() => {
                setSelectedItem(item);
                setSelectedSize(level.size);
                setNewStockValue(level.currentStock.toString());
                setShowStockModal(true);
              }}
              activeOpacity={0.7}>
              <View style={styles.stockLevelHeader}>
                <Text style={styles.sizeLabel}>{level.size}</Text>
                <View style={styles.editIcon}>
                  <CustomIcon name="create" size={14} color={COLORS.primaryOrangeHex} />
                </View>
              </View>
              <Text style={styles.stockValue}>{level.currentStock}</Text>
              <Text style={styles.stockRange}>
                Min: {level.minStock} • Max: {level.maxStock}
              </Text>
              <View style={[styles.stockProgress, {backgroundColor: statusColors.secondary}]}>
                <View 
                  style={[
                    styles.stockProgressFill,
                    {
                      backgroundColor: statusColors.primary,
                      width: `${Math.min((level.currentStock / level.maxStock) * 100, 100)}%`
                    }
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    );
  };

  // Enhanced alert renderer
  const renderStockAlert = ({item, index}: {item: StockAlert; index: number}) => {
    const alertColors = getAlertColor(item.severity);
    const animatedStyle = {
      opacity: fadeAnim,
      transform: [
        {
          translateX: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 0],
          }),
        },
      ],
    };

    return (
      <Animated.View style={[styles.modernAlertCard, animatedStyle, {
        marginTop: index === 0 ? SPACING.space_16 : SPACING.space_8,
      }]}>
        <View style={[styles.alertSeverityBar, {backgroundColor: alertColors.primary}]} />
        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <View style={styles.alertInfo}>
              <Text style={styles.alertProductName}>{item.productName}</Text>
              <Text style={styles.alertType}>
                {item.alertType.replace('_', ' ').toUpperCase()} • Size: {item.size}
              </Text>
            </View>
            <View style={styles.alertActions}>
              <TouchableOpacity
                style={[styles.alertActionButton, {backgroundColor: '#4CAF50'}]}
                onPress={() => handleMarkAlertRead(item.id!)}
                activeOpacity={0.7}>
                <CustomIcon name="checkmark" size={16} color={COLORS.primaryWhiteHex} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.alertActionButton, {backgroundColor: '#F44336'}]}
                onPress={() => handleDeleteAlert(item.id!)}
                activeOpacity={0.7}>
                <CustomIcon name="trash" size={16} color={COLORS.primaryWhiteHex} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.alertMetrics}>
            <View style={styles.alertMetric}>
              <Text style={styles.alertMetricValue}>{item.currentStock}</Text>
              <Text style={styles.alertMetricLabel}>Current</Text>
            </View>
            <View style={styles.alertMetricDivider} />
            <View style={styles.alertMetric}>
              <Text style={styles.alertMetricValue}>{item.threshold}</Text>
              <Text style={styles.alertMetricLabel}>Threshold</Text>
            </View>
            <View style={styles.alertMetricDivider} />
            <View style={styles.alertMetric}>
              <Text style={[styles.alertMetricValue, {color: alertColors.primary}]}>
                {item.severity.toUpperCase()}
              </Text>
              <Text style={styles.alertMetricLabel}>Priority</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Enhanced stats renderer
  const renderStats = () => {
    const stats = getInventoryStats(inventoryItems);
    
    return (
      <Animated.View style={[styles.statsContainer, {opacity: fadeAnim}]}>
        <View style={styles.modernStatsGrid}>
          <View style={styles.primaryStatCard}>
            <Text style={styles.primaryStatValue}>{stats.totalProducts}</Text>
            <Text style={styles.primaryStatLabel}>Total Products</Text>
            <Text style={styles.primaryStatSubtext}>
              {stats.totalStock.toLocaleString()} total units
            </Text>
          </View>
          
          <View style={styles.primaryStatCard}>
            <Text style={[styles.primaryStatValue, {color: '#4CAF50'}]}>
              {formatCurrency(stats.totalValue)}
            </Text>
            <Text style={styles.primaryStatLabel}>Total Value</Text>
            <Text style={styles.primaryStatSubtext}>Current inventory worth</Text>
          </View>
        </View>

        <View style={styles.statusGrid}>
          {[
            {label: 'In Stock', value: stats.inStock, percentage: stats.stockPercentage.inStock, color: '#4CAF50'},
            {label: 'Low Stock', value: stats.lowStock, percentage: stats.stockPercentage.lowStock, color: '#FF9800'},
            {label: 'Out of Stock', value: stats.outOfStock, percentage: stats.stockPercentage.outOfStock, color: '#F44336'},
          ].map((item, index) => (
            <View key={index} style={styles.statusCard}>
              <View style={styles.statusCardHeader}>
                <Text style={[styles.statusValue, {color: item.color}]}>{item.value}</Text>
                <Text style={styles.statusPercentage}>{item.percentage.toFixed(1)}%</Text>
              </View>
              <Text style={styles.statusLabel}>{item.label}</Text>
              <View style={styles.statusProgress}>
                <View 
                  style={[
                    styles.statusProgressFill,
                    {backgroundColor: item.color, width: `${item.percentage}%`}
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.distributionChart}>
          <Text style={styles.chartTitle}>Stock Distribution</Text>
          <View style={styles.modernChartBar}>
            <View style={[styles.chartSegment, {
              flex: stats.stockPercentage.inStock,
              backgroundColor: '#4CAF50'
            }]} />
            <View style={[styles.chartSegment, {
              flex: stats.stockPercentage.lowStock,
              backgroundColor: '#FF9800'
            }]} />
            <View style={[styles.chartSegment, {
              flex: stats.stockPercentage.outOfStock,
              backgroundColor: '#F44336'
            }]} />
          </View>
        </View>
      </Animated.View>
    );
  };

  // Enhanced tab switcher with swipe gestures
  const renderTabIndicator = () => {
    const tabWidth = screenWidth / tabs.length;
    const translateX = tabIndicatorAnim.interpolate({
      inputRange: [0, tabs.length - 1],
      outputRange: [0, tabWidth * (tabs.length - 1)],
    });

    return (
      <Animated.View
        style={[
          styles.tabIndicator,
          {
            transform: [{translateX}],
            width: tabWidth,
          },
        ]}
      />
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={COLORS.primaryBlackHex} barStyle="light-content" />
        <HeaderBar title="Inventory Management" />
        <Animated.View style={[styles.centerContainer, {opacity: fadeAnim}]}>
          <View style={styles.authPrompt}>
            <CustomIcon name="lock-closed" size={48} color={COLORS.primaryOrangeHex} />
            <Text style={styles.authTitle}>Authentication Required</Text>
            <Text style={styles.authSubtext}>
              Please log in to access inventory management features
            </Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} barStyle="light-content" />
      <HeaderBar title="Inventory Management" />

      {/* Enhanced Tab Navigation */}
      <Animated.View style={[styles.modernTabContainer, {opacity: fadeAnim}]}>
        {renderTabIndicator()}
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.modernTab}
            onPress={() => setSelectedTab(tab.key)}
            activeOpacity={0.7}>
            <View style={[
              styles.tabIconContainer,
              selectedTab === tab.key && {backgroundColor: tab.color + '20'}
            ]}>
              <CustomIcon 
                name={tab.icon} 
                size={20} 
                color={selectedTab === tab.key ? tab.color : COLORS.primaryLightGreyHex} 
              />
            </View>
            <Text style={[
              styles.modernTabText,
              selectedTab === tab.key && {color: tab.color}
            ]}>
              {tab.title}
            </Text>
            {(tab.key === 'alerts' && stockAlerts.length > 0) && (
              <View style={[styles.modernTabBadge, {backgroundColor: '#F44336'}]}>
                <Text style={styles.tabBadgeText}>{stockAlerts.length}</Text>
              </View>
            )}
            {(tab.key === 'inventory' && inventoryItems.length > 0) && (
              <View style={[styles.modernTabBadge, {backgroundColor: COLORS.primaryOrangeHex}]}>
                <Text style={styles.tabBadgeText}>{inventoryItems.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Enhanced Search Bar */}
      {selectedTab === 'inventory' && (
        <Animated.View style={[
          styles.enhancedSearchContainer,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          }
        ]}>
          <Animated.View style={[
            styles.searchInputContainer,
            {
              borderColor: searchFocusAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [COLORS.primaryDarkGreyHex, COLORS.primaryOrangeHex],
              }),
              borderWidth: searchFocusAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 2],
              }),
            }
          ]}>
            <CustomIcon
              style={styles.searchIcon}
              name="search"
              size={FONTSIZE.size_18}
              color={searchText.length > 0 ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex}
            />
            <TextInput
              placeholder="Search products, SKU, supplier..."
              value={searchText}
              onChangeText={setSearchText}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              placeholderTextColor={COLORS.primaryLightGreyHex}
              style={styles.enhancedTextInput}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')} activeOpacity={0.7}>
                <CustomIcon
                  name="close-circle"
                  size={FONTSIZE.size_20}
                  color={COLORS.primaryLightGreyHex}
                />
              </TouchableOpacity>
            )}
          </Animated.View>
        </Animated.View>
      )}

      {/* Enhanced Content Area */}
      <Animated.View style={[
        styles.contentContainer,
        {
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}],
        }
      ]}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={COLORS.primaryOrangeHex}
              colors={[COLORS.primaryOrangeHex]}
            />
          }>
          {selectedTab === 'dashboard' && (
            <InventoryDashboard
              inventoryItems={inventoryItems}
              stockAlerts={stockAlerts}
              onViewInventory={handleViewInventory}
              onViewAlerts={handleViewAlerts}
              onViewMovements={handleViewMovements}
              onAddStock={handleAddStock}
            />
          )}

          {selectedTab === 'inventory' && (
            <FlatList
              data={filteredItems}
              renderItem={renderInventoryItem}
              keyExtractor={(item) => item.id!}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                <Animated.View style={[styles.emptyContainer, {opacity: fadeAnim}]}>
                  <CustomIcon name="cube" size={64} color={COLORS.primaryLightGreyHex} />
                  <Text style={styles.emptyTitle}>No inventory items found</Text>
                  <Text style={styles.emptySubtext}>
                    {searchText ? 'Try adjusting your search terms' : 'Add your first inventory item to get started'}
                  </Text>
                </Animated.View>
              }
            />
          )}

          {selectedTab === 'alerts' && (
            <FlatList
              data={stockAlerts}
              renderItem={renderStockAlert}
              keyExtractor={(item) => item.id!}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                <Animated.View style={[styles.emptyContainer, {opacity: fadeAnim}]}>
                  <CustomIcon name="checkmark-circle" size={64} color={COLORS.primaryOrangeHex} />
                  <Text style={styles.emptyTitle}>All clear!</Text>
                  <Text style={styles.emptySubtext}>
                    No stock alerts at the moment. Your inventory levels are healthy.
                  </Text>
                </Animated.View>
              }
            />
          )}

          {selectedTab === 'stats' && renderStats()}
        </ScrollView>
      </Animated.View>

      {/* Enhanced Stock Update Modal */}
      <Modal
        visible={showStockModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowStockModal(false)}>
        <View style={styles.modernModalOverlay}>
          <Animated.View style={[
            styles.modernModalContainer,
            {
              opacity: fadeAnim,
              transform: [{scale: scaleAnim}],
            }
          ]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Update Stock</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedItem?.productName} • {selectedSize}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowStockModal(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}>
                <CustomIcon name="close" size={24} color={COLORS.primaryLightGreyHex} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>New Stock Quantity</Text>
                <TextInput
                  style={styles.modernModalInput}
                  value={newStockValue}
                  onChangeText={setNewStockValue}
                  keyboardType="numeric"
                  placeholder="Enter quantity"
                  placeholderTextColor={COLORS.primaryLightGreyHex}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Reason for Change</Text>
                <TextInput
                  style={styles.modernModalInput}
                  value={stockReason}
                  onChangeText={setStockReason}
                  placeholder="e.g., Restock, Sale, Adjustment"
                  placeholderTextColor={COLORS.primaryLightGreyHex}
                />
              </View>

              <View style={styles.modernModalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowStockModal(false)}
                  activeOpacity={0.7}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalUpdateButton}
                  onPress={handleStockUpdate}
                  activeOpacity={0.7}>
                  <Text style={styles.modalUpdateText}>Update Stock</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryDarkGreyHex,
    marginHorizontal: SPACING.space_20,
    marginTop: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_8,
  },
  activeTab: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  tabText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
  },
  activeTabText: {
    color: COLORS.primaryWhiteHex,
  },
  tabBadge: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_10,
    paddingHorizontal: SPACING.space_8,
    paddingVertical: SPACING.space_2,
    marginLeft: SPACING.space_8,
  },
  tabBadgeText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryWhiteHex,
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
  scrollView: {
    borderRadius: BORDERRADIUS.radius_20,
    flex: 1,
    paddingHorizontal: SPACING.space_20,
  },
  inventoryCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    marginVertical: SPACING.space_8,
  },
  inventoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.space_12,
  },
  inventoryInfo: {
    flex: 1,
  },
  productName: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  productSku: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_2,
  },
  productType: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
  },
  productMetadata: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
  },
  inventoryStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: SPACING.space_8,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_8,
    marginBottom: SPACING.space_4,
  },
  statusText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryWhiteHex,
  },
  totalStock: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_2,
  },
  totalValue: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
  },
  stockLevels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.space_12,
  },
  stockLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_8,
    marginRight: SPACING.space_8,
    marginBottom: SPACING.space_8,
    minWidth: 100,
  },
  stockInfo: {
    flex: 1,
  },
  sizeText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_2,
  },
  stockText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_2,
  },
  minStockText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.secondaryLightGreyHex,
  },
  stockActions: {
    marginLeft: SPACING.space_8,
  },
  inventoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.space_8,
    borderTopWidth: 1,
    borderTopColor: COLORS.primaryGreyHex,
  },
  supplierText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
  },
  locationText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
  },
  alertCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    marginVertical: SPACING.space_8,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.space_8,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  alertType: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
    marginBottom: SPACING.space_2,
  },
  alertSize: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
  },
  alertActions: {
    flexDirection: 'row',
  },
  alertButton: {
    padding: SPACING.space_8,
    marginLeft: SPACING.space_8,
  },
  alertDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertStock: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
  alertThreshold: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
  },
  alertSeverity: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_12,
  },
  statsContainer: {
    paddingVertical: SPACING.space_20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.space_20,
  },
  statCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    width: '48%',
    alignItems: 'center',
    marginBottom: SPACING.space_12,
  },
  statValue: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_24,
    color: COLORS.primaryOrangeHex,
    marginBottom: SPACING.space_4,
  },
  statLabel: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
  },
  valueStats: {
    marginBottom: SPACING.space_20,
  },
  valueCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_20,
    alignItems: 'center',
    marginBottom: SPACING.space_12,
  },
  valueAmount: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryOrangeHex,
    marginBottom: SPACING.space_4,
  },
  valueLabel: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
  },
  percentageStats: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_20,
  },
  percentageTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_12,
    textAlign: 'center',
  },
  percentageBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: BORDERRADIUS.radius_4,
    overflow: 'hidden',
    marginBottom: SPACING.space_12,
  },
  percentageSegment: {
    height: '100%',
  },
  percentageLabels: {
    alignItems: 'center',
  },
  percentageText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.space_40,
  },
  emptyText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryLightGreyHex,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.secondaryBlackRGBA,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.space_20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryGreyHex,
  },
  modalTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
  },
  modalContent: {
    padding: SPACING.space_20,
  },
  modalProductName: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryOrangeHex,
    marginBottom: SPACING.space_20,
    textAlign: 'center',
  },
  modalInputGroup: {
    marginBottom: SPACING.space_16,
  },
  modalLabel: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_8,
  },
  modalInput: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_12,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.space_20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.primaryGreyHex,
    marginRight: SPACING.space_8,
  },
  updateButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    marginLeft: SPACING.space_8,
  },
  cancelButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
  },
  updateButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  modernInventoryCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    padding: SPACING.space_20,
    marginVertical: SPACING.space_8,
    elevation: 4,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardHeader: {
    marginBottom: SPACING.space_16,
  },
  productInfo: {
    flex: 1,
  },
  productTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_8,
  },
  modernProductName: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
    flex: 1,
  },
  modernStatusBadge: {
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_15,
    marginLeft: SPACING.space_12,
  },
  statusBadgeText: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryWhiteHex,
  },
  stockMetrics: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    marginBottom: SPACING.space_16,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  metricLabel: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
  },
  stockLevelsContainer: {
    marginBottom: SPACING.space_12,
  },
  stockLevelsContent: {
    paddingHorizontal: SPACING.space_4,
  },
  modernStockLevel: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    marginRight: SPACING.space_12,
    minWidth: 120,
  },
  stockLevelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_8,
  },
  sizeLabel: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  editIcon: {
    padding: SPACING.space_4,
  },
  stockValue: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryOrangeHex,
    marginBottom: SPACING.space_4,
  },
  stockRange: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_8,
  },
  stockProgress: {
    height: 6,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_4,
    overflow: 'hidden',
  },
  stockProgressFill: {
    height: '100%',
    borderRadius: BORDERRADIUS.radius_4,
  },
  modernAlertCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    marginVertical: SPACING.space_8,
    elevation: 3,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    overflow: 'hidden',
  },
  alertSeverityBar: {
    height: 4,
    width: '100%',
  },
  alertContent: {
    padding: SPACING.space_20,
  },
  alertProductName: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  alertActionButton: {
    padding: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_10,
    marginLeft: SPACING.space_8,
  },
  alertMetrics: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    marginTop: SPACING.space_12,
  },
  alertMetric: {
    flex: 1,
    alignItems: 'center',
  },
  alertMetricValue: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  alertMetricLabel: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryLightGreyHex,
  },
  alertMetricDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.primaryDarkGreyHex,
    marginHorizontal: SPACING.space_8,
  },
  modernTabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryDarkGreyHex,
    marginHorizontal: SPACING.space_20,
    marginTop: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_4,
    position: 'relative',
  },
  modernTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
  },
  tabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDERRADIUS.radius_10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.space_4,
  },
  modernTabText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
  },
  modernTabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: BORDERRADIUS.radius_10,
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: SPACING.space_4,
    height: 3,
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_20,
  },
  authPrompt: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    padding: SPACING.space_32,
    alignItems: 'center',
    margin: SPACING.space_20,
  },
  authTitle: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
    marginTop: SPACING.space_16,
    marginBottom: SPACING.space_8,
  },
  authSubtext: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    lineHeight: 20,
  },
  enhancedSearchContainer: {
    paddingHorizontal: SPACING.space_20,
    paddingTop: SPACING.space_16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    paddingHorizontal: SPACING.space_20,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: SPACING.space_12,
  },
  enhancedTextInput: {
    flex: 1,
    height: SPACING.space_40,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  contentContainer: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: SPACING.space_20,
  },
  emptyTitle: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
    marginTop: SPACING.space_16,
    marginBottom: SPACING.space_8,
  },
  emptySubtext: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    lineHeight: 20,
  },
  modernModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernModalContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_25,
    width: '90%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalSubtitle: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
    marginTop: SPACING.space_4,
  },
  modalCloseButton: {
    padding: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
  },
  modernModalInput: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modernModalActions: {
    flexDirection: 'row',
    marginTop: SPACING.space_24,
    gap: SPACING.space_12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_15,
    alignItems: 'center',
    backgroundColor: COLORS.primaryGreyHex,
  },
  modalCancelText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
  },
  modalUpdateButton: {
    flex: 1,
    paddingVertical: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_15,
    alignItems: 'center',
    backgroundColor: COLORS.primaryOrangeHex,
  },
  modalUpdateText: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  modernStatsGrid: {
    flexDirection: 'row',
    marginBottom: SPACING.space_20,
    gap: SPACING.space_12,
  },
  primaryStatCard: {
    flex: 1,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    padding: SPACING.space_20,
    alignItems: 'center',
  },
  primaryStatValue: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_24,
    color: COLORS.primaryOrangeHex,
    marginBottom: SPACING.space_8,
  },
  primaryStatLabel: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  primaryStatSubtext: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
  },
  statusGrid: {
    flexDirection: 'row',
    marginBottom: SPACING.space_20,
    gap: SPACING.space_8,
  },
  statusCard: {
    flex: 1,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
  },
  statusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_8,
  },
  statusValue: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
  },
  statusPercentage: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
  },
  statusLabel: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_8,
  },
  statusProgress: {
    height: 4,
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    overflow: 'hidden',
  },
  statusProgressFill: {
    height: '100%',
    borderRadius: BORDERRADIUS.radius_20,
  },
  distributionChart: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    padding: SPACING.space_20,
  },
  chartTitle: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_16,
    textAlign: 'center',
  },
  modernChartBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: BORDERRADIUS.radius_20,
    overflow: 'hidden',
  },
  chartSegment: {
    height: '100%',
  },
});

export default InventoryScreen; 