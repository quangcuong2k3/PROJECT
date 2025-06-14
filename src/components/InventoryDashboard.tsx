import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import {BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING} from '../theme/theme';
import CustomIcon from './CustomIcon';
import {
  InventoryItem,
  StockAlert,
  getInventoryStats,
  formatCurrency,
} from '../services/inventoryService';

const {width} = Dimensions.get('window');

interface InventoryDashboardProps {
  inventoryItems: InventoryItem[];
  stockAlerts: StockAlert[];
  onViewInventory: () => void;
  onViewAlerts: () => void;
  onViewMovements: () => void;
  onAddStock: () => void;
}

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({
  inventoryItems,
  stockAlerts,
  onViewInventory,
  onViewAlerts,
  onViewMovements,
  onAddStock,
}) => {
  const stats = getInventoryStats(inventoryItems);
  const criticalAlerts = stockAlerts.filter(alert => alert.severity === 'critical');
  const highAlerts = stockAlerts.filter(alert => alert.severity === 'high');

  // Enhanced stats cards with gradients and better visuals
  const renderEnhancedStatsCard = (
    title: string,
    value: string | number,
    icon: any,
    gradientColors: string[],
    onPress?: () => void,
    subtitle?: string
  ) => (
    <TouchableOpacity
      style={[styles.enhancedStatsCard, onPress && styles.pressableCard]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}>
      <View style={[styles.cardGradient, {backgroundColor: gradientColors[0]}]}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, {backgroundColor: gradientColors[1]}]}>
              <CustomIcon name={icon} size={24} color={COLORS.primaryWhiteHex} />
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.cardValue}>{value}</Text>
              <Text style={styles.cardTitle}>{title}</Text>
              {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
            </View>
          </View>
          {onPress && (
            <View style={styles.cardArrow}>
              <CustomIcon name="chevron-forward" size={16} color={COLORS.primaryWhiteHex} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Modern alert summary with enhanced design
  const renderModernAlertSummary = () => (
    <View style={styles.modernAlertContainer}>
      <View style={styles.alertHeaderSection}>
        <View style={styles.alertTitleContainer}>
          <View style={styles.alertIconBadge}>
            <CustomIcon name="notifications" size={20} color={COLORS.primaryWhiteHex} />
          </View>
          <View>
            <Text style={styles.modernAlertTitle}>Stock Alerts</Text>
            <Text style={styles.alertSubtext}>Real-time inventory monitoring</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={onViewAlerts}
          activeOpacity={0.7}>
          <Text style={styles.viewAllText}>View All</Text>
          <CustomIcon name="chevron-forward" size={14} color={COLORS.primaryOrangeHex} />
        </TouchableOpacity>
      </View>
      
      {stockAlerts.length > 0 ? (
        <View style={styles.alertMetricsContainer}>
          <View style={styles.alertMetricsGrid}>
            <View style={[styles.alertMetric, styles.criticalMetric]}>
              <Text style={styles.metricNumber}>{criticalAlerts.length}</Text>
              <Text style={styles.metricLabel}>Critical</Text>
            </View>
            <View style={[styles.alertMetric, styles.highMetric]}>
              <Text style={styles.metricNumber}>{highAlerts.length}</Text>
              <Text style={styles.metricLabel}>High</Text>
            </View>
            <View style={[styles.alertMetric, styles.mediumMetric]}>
              <Text style={styles.metricNumber}>
                {stockAlerts.length - criticalAlerts.length - highAlerts.length}
              </Text>
              <Text style={styles.metricLabel}>Other</Text>
            </View>
          </View>
          <View style={styles.alertProgressBar}>
            <View 
              style={[
                styles.alertProgress, 
                styles.criticalProgress,
                {width: `${(criticalAlerts.length / stockAlerts.length) * 100}%`}
              ]} 
            />
            <View 
              style={[
                styles.alertProgress, 
                styles.highProgress,
                {width: `${(highAlerts.length / stockAlerts.length) * 100}%`}
              ]} 
            />
          </View>
        </View>
      ) : (
        <View style={styles.noAlertsContainer}>
          <CustomIcon name="checkmark-circle" size={32} color={COLORS.primaryOrangeHex} />
          <Text style={styles.noAlertsTitle}>All Good!</Text>
          <Text style={styles.noAlertsSubtext}>Your inventory levels are healthy</Text>
        </View>
      )}
    </View>
  );

  // Enhanced quick actions with modern design
  const renderModernQuickActions = () => (
    <View style={styles.quickActionsSection}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity 
          style={[styles.modernActionButton, styles.primaryAction]}
          onPress={onViewInventory}
          activeOpacity={0.8}>
          <View style={styles.actionIconContainer}>
            <CustomIcon name="cube" size={24} color={COLORS.primaryWhiteHex} />
          </View>
          <Text style={styles.actionTitle}>Inventory</Text>
          <Text style={styles.actionSubtitle}>View & manage stock</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.modernActionButton, styles.secondaryAction]}
          onPress={onAddStock}
          activeOpacity={0.8}>
          <View style={styles.actionIconContainer}>
            <CustomIcon name="add-circle" size={24} color={COLORS.primaryWhiteHex} />
          </View>
          <Text style={styles.actionTitle}>Add Stock</Text>
          <Text style={styles.actionSubtitle}>Update quantities</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.modernActionButton, styles.tertiaryAction]}
          onPress={onViewMovements}
          activeOpacity={0.8}>
          <View style={styles.actionIconContainer}>
            <CustomIcon name="swap-horizontal" size={24} color={COLORS.primaryWhiteHex} />
          </View>
          <Text style={styles.actionTitle}>Movements</Text>
          <Text style={styles.actionSubtitle}>Track changes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.modernActionButton, styles.alertAction]}
          onPress={onViewAlerts}
          activeOpacity={0.8}>
          <View style={styles.actionIconContainer}>
            <CustomIcon name="warning" size={24} color={COLORS.primaryWhiteHex} />
          </View>
          <Text style={styles.actionTitle}>Alerts</Text>
          <Text style={styles.actionSubtitle}>Monitor issues</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Enhanced low stock preview with carousel
  const renderEnhancedLowStockPreview = () => {
    const lowStockItems = inventoryItems.filter(item => 
      item.status === 'low_stock' || item.status === 'out_of_stock'
    );
    
    if (lowStockItems.length === 0) return null;

    return (
      <View style={styles.lowStockSection}>
        <View style={styles.lowStockHeader}>
          <View>
            <Text style={styles.sectionTitle}>Attention Required</Text>
            <Text style={styles.sectionSubtitle}>{lowStockItems.length} items need restocking</Text>
          </View>
          <TouchableOpacity onPress={onViewInventory} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <CustomIcon name="chevron-forward" size={14} color={COLORS.primaryOrangeHex} />
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lowStockScroll}>
          {lowStockItems.slice(0, 5).map((item, index) => (
            <View key={index} style={styles.enhancedLowStockCard}>
              <View style={styles.lowStockCardHeader}>
                <View style={[
                  styles.stockStatusBadge, 
                  item.status === 'out_of_stock' ? styles.outOfStockBadge : styles.lowStockBadge
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {item.status === 'out_of_stock' ? 'OUT' : 'LOW'}
                  </Text>
                </View>
                <CustomIcon 
                  name={item.status === 'out_of_stock' ? 'close-circle' : 'warning'} 
                  size={16} 
                  color={item.status === 'out_of_stock' ? COLORS.primaryRedHex : '#FFA500'} 
                />
              </View>
              <Text style={styles.lowStockItemName} numberOfLines={2}>
                {item.productName}
              </Text>
              <View style={styles.stockQuantityContainer}>
                <Text style={styles.stockQuantity}>{item.totalStock}</Text>
                <Text style={styles.stockUnit}>units</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Enhanced stock distribution chart
  const renderEnhancedDistributionChart = () => (
    <View style={styles.distributionSection}>
      <Text style={styles.sectionTitle}>Stock Distribution</Text>
      <View style={styles.enhancedChartContainer}>
        <View style={styles.chartWrapper}>
          <View style={styles.modernChartBar}>
            <View style={[styles.chartSegment, {
              flex: stats.stockPercentage.inStock,
              backgroundColor: COLORS.primaryOrangeHex,
              borderTopLeftRadius: BORDERRADIUS.radius_8,
              borderBottomLeftRadius: BORDERRADIUS.radius_8,
            }]} />
            <View style={[styles.chartSegment, {
              flex: stats.stockPercentage.lowStock,
              backgroundColor: '#FFA500',
            }]} />
            <View style={[styles.chartSegment, {
              flex: stats.stockPercentage.outOfStock,
              backgroundColor: COLORS.primaryRedHex,
              borderTopRightRadius: BORDERRADIUS.radius_8,
              borderBottomRightRadius: BORDERRADIUS.radius_8,
            }]} />
          </View>
          <View style={styles.chartPercentages}>
            <Text style={styles.chartPercentage}>{stats.stockPercentage.inStock.toFixed(0)}%</Text>
            <Text style={styles.chartPercentage}>{stats.stockPercentage.lowStock.toFixed(0)}%</Text>
            <Text style={styles.chartPercentage}>{stats.stockPercentage.outOfStock.toFixed(0)}%</Text>
          </View>
        </View>
        <View style={styles.modernChartLegend}>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, {backgroundColor: COLORS.primaryOrangeHex}]} />
              <Text style={styles.legendText}>In Stock</Text>
            </View>
            <Text style={styles.legendValue}>{stats.inStock} items</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, {backgroundColor: '#FFA500'}]} />
              <Text style={styles.legendText}>Low Stock</Text>
            </View>
            <Text style={styles.legendValue}>{stats.lowStock} items</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, {backgroundColor: COLORS.primaryRedHex}]} />
              <Text style={styles.legendText}>Out of Stock</Text>
            </View>
            <Text style={styles.legendValue}>{stats.outOfStock} items</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section with Key Metrics */}
      <View style={styles.heroSection}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroTitle}>Inventory Overview</Text>
            <Text style={styles.heroSubtitle}>Real-time stock monitoring</Text>
          </View>
          <View style={styles.refreshIndicator}>
            <CustomIcon name="sync" size={16} color={COLORS.primaryOrangeHex} />
          </View>
        </View>
        
        <View style={styles.heroMetrics}>
          {renderEnhancedStatsCard(
            'Total Products',
            stats.totalProducts,
            'cube',
            [COLORS.primaryOrangeHex, '#FF8C00'],
            onViewInventory,
            `${stats.totalStock.toLocaleString()} units`
          )}
          {renderEnhancedStatsCard(
            'Total Value',
            formatCurrency(stats.totalValue),
            'wallet',
            ['#4CAF50', '#45A049'],
            undefined,
            'Current worth'
          )}
        </View>
        
        <View style={styles.statusMetrics}>
          {renderEnhancedStatsCard(
            'In Stock',
            stats.inStock,
            'checkmark-circle',
            ['#2196F3', '#1976D2'],
            undefined,
            `${stats.stockPercentage.inStock.toFixed(1)}%`
          )}
          {renderEnhancedStatsCard(
            'Need Attention',
            stats.lowStock + stats.outOfStock,
            'warning',
            ['#FF6B6B', '#E53E3E'],
            onViewAlerts,
            'Low + Out of stock'
          )}
        </View>
      </View>

      {/* Enhanced Stock Distribution */}
      {renderEnhancedDistributionChart()}

      {/* Modern Alert Summary */}
      {renderModernAlertSummary()}

      {/* Enhanced Low Stock Preview */}
      {renderEnhancedLowStockPreview()}

      {/* Modern Quick Actions */}
      {renderModernQuickActions()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_16,
  },
  sectionSubtitle: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    marginTop: SPACING.space_4,
  },
  viewAllText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
    marginRight: SPACING.space_4,
  },
  pressableCard: {
    opacity: 0.9,
  },
  // Hero Section Styles
  heroSection: {
    padding: SPACING.space_24,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_20,
  },
  heroTitle: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_24,
    color: COLORS.primaryWhiteHex,
  },
  heroSubtitle: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    marginTop: SPACING.space_4,
  },
  refreshIndicator: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.space_16,
  },
  statusMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Enhanced Stats Card Styles
  enhancedStatsCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    overflow: 'hidden',
    width: '48%',
    marginBottom: SPACING.space_12,
    elevation: 4,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardGradient: {
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDERRADIUS.radius_15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.space_12,
  },
  valueContainer: {
    flex: 1,
  },
  cardValue: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_2,
  },
  cardTitle: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
    opacity: 0.8,
  },
  cardSubtitle: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryWhiteHex,
    opacity: 0.6,
    marginTop: SPACING.space_2,
  },
  cardArrow: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
  },
  // Modern Alert Container Styles
  modernAlertContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    padding: SPACING.space_20,
    marginHorizontal: SPACING.space_20,
    marginBottom: SPACING.space_24,
    elevation: 3,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  alertHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_16,
  },
  alertTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIconBadge: {
    backgroundColor: COLORS.primaryRedHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_8,
    marginRight: SPACING.space_12,
  },
  modernAlertTitle: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
  },
  alertSubtext: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    marginTop: SPACING.space_2,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryGreyHex,
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
  },
  alertMetricsContainer: {
    marginTop: SPACING.space_8,
  },
  alertMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.space_16,
  },
  alertMetric: {
    alignItems: 'center',
    backgroundColor: COLORS.primaryGreyHex,
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_15,
    minWidth: 80,
  },
  criticalMetric: {
    backgroundColor: '#FF4444',
  },
  highMetric: {
    backgroundColor: '#FF6B6B',
  },
  mediumMetric: {
    backgroundColor: '#FFA500',
  },
  metricNumber: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
  },
  metricLabel: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryWhiteHex,
    marginTop: SPACING.space_2,
  },
  alertProgressBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    height: 8,
    overflow: 'hidden',
  },
  alertProgress: {
    height: '100%',
  },
  criticalProgress: {
    backgroundColor: COLORS.primaryRedHex,
  },
  highProgress: {
    backgroundColor: '#FF6B6B',
  },
  noAlertsContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.space_32,
  },
  noAlertsTitle: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryOrangeHex,
    marginTop: SPACING.space_12,
    marginBottom: SPACING.space_4,
  },
  noAlertsSubtext: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
  },
  // Quick Actions Section Styles
  quickActionsSection: {
    marginHorizontal: SPACING.space_20,
    marginBottom: SPACING.space_24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modernActionButton: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    padding: SPACING.space_20,
    width: '48%',
    alignItems: 'center',
    marginBottom: SPACING.space_16,
    elevation: 3,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  primaryAction: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  secondaryAction: {
    backgroundColor: '#4CAF50',
  },
  tertiaryAction: {
    backgroundColor: '#FF9800',
  },
  alertAction: {
    backgroundColor: '#F44336',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDERRADIUS.radius_20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.space_12,
  },
  actionTitle: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  actionSubtitle: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryWhiteHex,
    opacity: 0.8,
    textAlign: 'center',
  },
  // Low Stock Section Styles
  lowStockSection: {
    marginHorizontal: SPACING.space_20,
    marginBottom: SPACING.space_24,
  },
  lowStockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.space_16,
  },
  lowStockScroll: {
    paddingVertical: SPACING.space_8,
  },
  enhancedLowStockCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    marginRight: SPACING.space_16,
    width: 140,
    elevation: 2,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  lowStockCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_12,
  },
  stockStatusBadge: {
    paddingHorizontal: SPACING.space_8,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_8,
  },
  outOfStockBadge: {
    backgroundColor: COLORS.primaryRedHex,
  },
  lowStockBadge: {
    backgroundColor: '#FF9800',
  },
  statusBadgeText: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryWhiteHex,
  },
  lowStockItemName: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
    marginBottom: SPACING.space_12,
    lineHeight: 16,
  },
  stockQuantityContainer: {
    alignItems: 'center',
  },
  stockQuantity: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryOrangeHex,
  },
  stockUnit: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryLightGreyHex,
    marginTop: SPACING.space_2,
  },
  // Distribution Section Styles
  distributionSection: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    padding: SPACING.space_20,
    marginHorizontal: SPACING.space_20,
    marginBottom: SPACING.space_24,
    elevation: 3,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  enhancedChartContainer: {
    marginTop: SPACING.space_16,
  },
  chartWrapper: {
    marginBottom: SPACING.space_20,
  },
  modernChartBar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: BORDERRADIUS.radius_8,
    overflow: 'hidden',
    marginBottom: SPACING.space_12,
  },
  chartSegment: {
    height: '100%',
  },
  chartPercentages: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.space_8,
  },
  chartPercentage: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
  modernChartLegend: {
    marginTop: SPACING.space_16,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.space_8,
  },
  legendText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
  legendValue: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
  },
});

export default InventoryDashboard; 