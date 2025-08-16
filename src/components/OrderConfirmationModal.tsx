import React, {useState, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';
import CustomIcon from './CustomIcon';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

interface OrderItem {
  id: string;
  name: string;
  imagelink_square: any;
  special_ingredient: string;
  type: string;
  prices: Array<{
    size: string;
    price: string;
    currency: string;
    quantity: number;
  }>;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface OrderConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderItems: OrderItem[];
  customerInfo: CustomerInfo;
  paymentMethod: string;
  totalAmount: string;
  deliveryInfo?: {
    fee: number;
    estimatedTime: string;
    distance: number;
  };
  isLoading?: boolean;
}

const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  orderItems,
  customerInfo,
  paymentMethod,
  totalAmount,
  deliveryInfo,
  isLoading = false,
}) => {
  // Animation states
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const [overlayOpacity] = useState(new Animated.Value(0));
  const [contentScale] = useState(new Animated.Value(0.9));
  const [buttonScale] = useState(new Animated.Value(1));
  const [expandedSections, setExpandedSections] = useState({
    items: true,
    delivery: true,
    payment: true,
    summary: true,
  });

  // Animation effects
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(contentScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentScale, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const calculateItemTotal = (item: OrderItem): number => {
    return item.prices.reduce((total, price) => {
      return total + (parseFloat(price.price) * price.quantity);
    }, 0);
  };

  const formatPaymentMethod = (method: string): string => {
    switch (method) {
      case 'stripe':
        return 'Credit/Debit Card';
      case 'momo':
        return 'MoMo Wallet';
      case 'cash':
        return 'Cash on Delivery';
      default:
        return method;
    }
  };

  const getPaymentMethodIcon = (method: string): string => {
    switch (method) {
      case 'stripe':
        return 'card-outline';
      case 'momo':
        return 'wallet-outline';
      case 'cash':
        return 'cash-outline';
      default:
        return 'card-outline';
    }
  };

  const subtotal = parseFloat(totalAmount);
  const deliveryFee = deliveryInfo?.fee || 0;
  const grandTotal = subtotal + (deliveryFee / 23000);

  const handleButtonPress = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    callback();
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const SectionHeader = ({
    title,
    icon,
    expanded,
    onToggle,
  }: {
    title: string;
    icon: string;
    expanded: boolean;
    onToggle: () => void;
  }) => (
    <TouchableOpacity style={styles.sectionHeader} onPress={onToggle} activeOpacity={0.7}>
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.iconContainer}>
          <CustomIcon
            name={icon as any}
            size={FONTSIZE.size_20}
            color={COLORS.primaryOrangeHex}
          />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <CustomIcon
        name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
        size={FONTSIZE.size_20}
        color={COLORS.primaryLightGreyHex}
      />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}>
      <StatusBar backgroundColor="rgba(0,0,0,0.8)" barStyle="light-content" />
      
      <Animated.View style={[styles.modalOverlay, {opacity: overlayOpacity}]}>
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          activeOpacity={1}
          onPress={onClose}
        />
        
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                {translateY: slideAnim},
                {scale: contentScale},
              ],
            },
          ]}>
          
          {/* Drag Handle */}
          <View style={styles.dragHandle} />
          
          {/* Enhanced Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <CustomIcon
                  name="receipt-outline"
                  size={FONTSIZE.size_24}
                  color={COLORS.primaryOrangeHex}
                />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Order Summary</Text>
                <Text style={styles.headerSubtitle}>
                  Review your order before confirmation
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => handleButtonPress(onClose)} 
              style={styles.closeButton}
              activeOpacity={0.7}>
              <CustomIcon
                name="close-outline"
                size={FONTSIZE.size_24}
                color={COLORS.primaryLightGreyHex}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}>
            
            {/* Order Items Section */}
            <View style={styles.section}>
              <SectionHeader
                title={`Order Items (${orderItems.length})`}
                icon="bag-outline"
                expanded={expandedSections.items}
                onToggle={() => toggleSection('items')}
              />
              
              {expandedSections.items && (
                <Animated.View style={styles.sectionContent}>
                  {orderItems.map((item, index) => (
                    <Animated.View 
                      key={item.id} 
                      style={[
                        styles.orderItem,
                        index === orderItems.length - 1 && styles.lastItem,
                      ]}>
                      <View style={styles.itemImageContainer}>
                        <Image source={item.imagelink_square} style={styles.itemImage} />
                        <View style={styles.itemTypeIndicator}>
                          <Text style={styles.itemTypeText}>{item.type[0]}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemIngredient}>{item.special_ingredient}</Text>
                        
                        <View style={styles.itemPrices}>
                          {item.prices.map((price, priceIndex) => (
                            <View key={priceIndex} style={styles.priceRow}>
                              <View style={styles.priceInfo}>
                                <View style={styles.sizeIndicator}>
                                  <Text style={styles.sizeText}>{price.size}</Text>
                                </View>
                                <Text style={styles.quantityText}>×{price.quantity}</Text>
                              </View>
                              <Text style={styles.priceAmount}>
                                ${(parseFloat(price.price) * price.quantity).toFixed(2)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      
                      <View style={styles.itemTotalContainer}>
                        <Text style={styles.itemTotal}>
                          ${calculateItemTotal(item).toFixed(2)}
                        </Text>
                      </View>
                    </Animated.View>
                  ))}
                </Animated.View>
              )}
            </View>

            {/* Delivery Information Section */}
            <View style={styles.section}>
              <SectionHeader
                title="Delivery Details"
                icon="location-outline"
                expanded={expandedSections.delivery}
                onToggle={() => toggleSection('delivery')}
              />
              
              {expandedSections.delivery && (
                <Animated.View style={styles.sectionContent}>
                  <View style={styles.deliveryCard}>
                    <View style={styles.customerInfoSection}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                          <CustomIcon
                            name="person-outline"
                            size={FONTSIZE.size_16}
                            color={COLORS.primaryOrangeHex}
                          />
                        </View>
                        <Text style={styles.infoText}>{customerInfo.name}</Text>
                      </View>
                      
                      <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                          <CustomIcon
                            name="call-outline"
                            size={FONTSIZE.size_16}
                            color={COLORS.primaryOrangeHex}
                          />
                        </View>
                        <Text style={styles.infoText}>{customerInfo.phone}</Text>
                      </View>
                      
                      <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                          <CustomIcon
                            name="mail-outline"
                            size={FONTSIZE.size_16}
                            color={COLORS.primaryOrangeHex}
                          />
                        </View>
                        <Text style={styles.infoText}>{customerInfo.email}</Text>
                      </View>
                      
                      <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                          <CustomIcon
                            name="location-outline"
                            size={FONTSIZE.size_16}
                            color={COLORS.primaryOrangeHex}
                          />
                        </View>
                        <Text style={styles.infoTextAddress}>{customerInfo.address}</Text>
                      </View>
                    </View>

                    {deliveryInfo && (
                      <View style={styles.deliveryDetailsSection}>
                        <View style={styles.deliveryStatsRow}>
                          <View style={styles.deliveryStat}>
                            <CustomIcon
                              name="speedometer-outline"
                              size={FONTSIZE.size_18}
                              color={COLORS.primaryOrangeHex}
                            />
                            <Text style={styles.deliveryStatLabel}>Distance</Text>
                            <Text style={styles.deliveryStatValue}>{deliveryInfo.distance} km</Text>
                          </View>
                          
                          <View style={styles.deliveryStat}>
                            <CustomIcon
                              name="time-outline"
                              size={FONTSIZE.size_18}
                              color={COLORS.primaryOrangeHex}
                            />
                            <Text style={styles.deliveryStatLabel}>Est. Time</Text>
                            <Text style={styles.deliveryStatValue}>{deliveryInfo.estimatedTime}</Text>
                          </View>
                          
                          <View style={styles.deliveryStat}>
                            <CustomIcon
                              name="cash-outline"
                              size={FONTSIZE.size_18}
                              color={COLORS.primaryOrangeHex}
                            />
                            <Text style={styles.deliveryStatLabel}>Delivery Fee</Text>
                            <Text style={styles.deliveryStatValue}>
                              {deliveryInfo.fee.toLocaleString()} VND
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </Animated.View>
              )}
            </View>

            {/* Payment Method Section */}
            <View style={styles.section}>
              <SectionHeader
                title="Payment Method"
                icon="card-outline"
                expanded={expandedSections.payment}
                onToggle={() => toggleSection('payment')}
              />
              
              {expandedSections.payment && (
                <Animated.View style={styles.sectionContent}>
                  <View style={styles.paymentMethodCard}>
                    <View style={styles.paymentMethodInfo}>
                      <View style={styles.paymentIconContainer}>
                        <CustomIcon
                          name={getPaymentMethodIcon(paymentMethod) as any}
                          size={FONTSIZE.size_24}
                          color={COLORS.primaryOrangeHex}
                        />
                      </View>
                      <View style={styles.paymentTextContainer}>
                        <Text style={styles.paymentMethodName}>
                          {formatPaymentMethod(paymentMethod)}
                        </Text>
                        <Text style={styles.paymentMethodDescription}>
                          {paymentMethod === 'cash' 
                            ? 'Pay when you receive your order'
                            : paymentMethod === 'momo'
                            ? 'Fast & secure Vietnamese e-wallet'
                            : 'Secure payment processing'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.paymentStatusIndicator}>
                      <CustomIcon
                        name="checkmark-circle-outline"
                        size={FONTSIZE.size_20}
                                                 color={'#00D4AA'}
                      />
                    </View>
                  </View>
                </Animated.View>
              )}
            </View>

            {/* Order Summary Section */}
            <View style={styles.section}>
              <SectionHeader
                title="Order Summary"
                icon="calculator-outline"
                expanded={expandedSections.summary}
                onToggle={() => toggleSection('summary')}
              />
              
              {expandedSections.summary && (
                <Animated.View style={styles.sectionContent}>
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Subtotal</Text>
                      <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
                    </View>
                    
                    {deliveryInfo && (
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Delivery Fee</Text>
                        <Text style={styles.summaryValue}>
                          ${(deliveryFee / 23000).toFixed(2)}
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.summaryDivider} />
                    
                    <View style={[styles.summaryRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Total Amount</Text>
                      <Text style={styles.totalValue}>${grandTotal.toFixed(2)}</Text>
                    </View>
                  </View>
                </Animated.View>
              )}
            </View>

            {/* Important Notice for Online Payments */}
            {paymentMethod !== 'cash' && (
              <View style={styles.warningContainer}>
                <View style={styles.warningIconContainer}>
                  <CustomIcon
                    name="information-circle-outline"
                    size={FONTSIZE.size_20}
                    color={COLORS.primaryOrangeHex}
                  />
                </View>
                <Text style={styles.warningText}>
                  Please review your order carefully. Once payment is processed, changes cannot be made.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Enhanced Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <Animated.View style={[styles.actionButtons, {transform: [{scale: buttonScale}]}]}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleButtonPress(onClose)}
                disabled={isLoading}
                activeOpacity={0.8}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  isLoading && styles.disabledButton,
                ]}
                onPress={() => handleButtonPress(onConfirm)}
                disabled={isLoading}
                activeOpacity={0.8}>
                <View style={styles.confirmButtonContent}>
                  {isLoading ? (
                    <>
                      <CustomIcon
                        name="hourglass-outline"
                        size={FONTSIZE.size_16}
                        color={COLORS.primaryWhiteHex}
                      />
                      <Text style={styles.confirmButtonText}>Processing...</Text>
                    </>
                  ) : (
                    <>
                      <CustomIcon
                        name="checkmark-outline"
                        size={FONTSIZE.size_16}
                        color={COLORS.primaryWhiteHex}
                      />
                      <Text style={styles.confirmButtonText}>Confirm Order</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: COLORS.primaryBlackHex,
    borderTopLeftRadius: BORDERRADIUS.radius_25,
    borderTopRightRadius: BORDERRADIUS.radius_25,
    maxHeight: screenHeight * 0.92,
    minHeight: screenHeight * 0.6,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -10},
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 25,
      },
    }),
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.space_12,
    marginBottom: SPACING.space_8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_24,
    paddingVertical: SPACING.space_20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(37, 37, 37, 0.5)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(209, 120, 66, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.space_12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    lineHeight: 28,
  },
  headerSubtitle: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryDarkGreyHex,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: SPACING.space_20,
  },
  section: {
    marginBottom: SPACING.space_16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_24,
    paddingVertical: SPACING.space_16,
    backgroundColor: 'rgba(37, 37, 37, 0.3)',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(209, 120, 66, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.space_12,
  },
  sectionTitle: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  sectionContent: {
    paddingHorizontal: SPACING.space_24,
    paddingTop: SPACING.space_8,
  },
  orderItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    padding: SPACING.space_20,
    marginBottom: SPACING.space_12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  lastItem: {
    marginBottom: 0,
  },
  itemImageContainer: {
    position: 'relative',
    marginRight: SPACING.space_16,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: BORDERRADIUS.radius_15,
  },
  itemTypeIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryOrangeHex,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTypeText: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    lineHeight: 22,
  },
  itemIngredient: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    marginTop: 2,
    marginBottom: SPACING.space_8,
  },
  itemPrices: {
    gap: SPACING.space_4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sizeIndicator: {
    backgroundColor: 'rgba(209, 120, 66, 0.15)',
    paddingHorizontal: SPACING.space_8,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_8,
    marginRight: SPACING.space_8,
  },
  sizeText: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
  },
  quantityText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
  },
  priceAmount: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  itemTotalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.space_12,
  },
  itemTotal: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryOrangeHex,
  },
  deliveryCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    overflow: 'hidden',
  },
  customerInfoSection: {
    padding: SPACING.space_20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_12,
  },
  infoIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(209, 120, 66, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.space_12,
  },
  infoText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
    flex: 1,
  },
  infoTextAddress: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    flex: 1,
    lineHeight: 20,
  },
  deliveryDetailsSection: {
    backgroundColor: 'rgba(37, 37, 37, 0.5)',
    padding: SPACING.space_20,
  },
  deliveryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deliveryStat: {
    alignItems: 'center',
    flex: 1,
  },
  deliveryStatLabel: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    marginTop: SPACING.space_4,
  },
  deliveryStatValue: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginTop: SPACING.space_2,
  },
  paymentMethodCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    padding: SPACING.space_20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(209, 120, 66, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.space_16,
  },
  paymentTextContainer: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  paymentMethodDescription: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    marginTop: 2,
  },
  paymentStatusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    padding: SPACING.space_20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_12,
  },
  summaryLabel: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
  },
  summaryValue: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(82, 82, 82, 0.5)',
    marginVertical: SPACING.space_12,
  },
  totalRow: {
    marginBottom: 0,
    paddingTop: SPACING.space_8,
  },
  totalLabel: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
  },
  totalValue: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryOrangeHex,
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(209, 120, 66, 0.1)',
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    marginHorizontal: SPACING.space_24,
    marginTop: SPACING.space_16,
    borderWidth: 1,
    borderColor: 'rgba(209, 120, 66, 0.2)',
  },
  warningIconContainer: {
    marginRight: SPACING.space_12,
    marginTop: 2,
  },
  warningText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryOrangeHex,
    flex: 1,
    lineHeight: 18,
  },
  actionButtonsContainer: {
    backgroundColor: COLORS.primaryBlackHex,
    borderTopWidth: 1,
    borderTopColor: 'rgba(37, 37, 37, 0.5)',
    paddingTop: SPACING.space_20,
    paddingBottom: Platform.OS === 'ios' ? SPACING.space_36 : SPACING.space_20,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.space_24,
    gap: SPACING.space_12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    paddingVertical: SPACING.space_18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  cancelButtonText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  confirmButton: {
    flex: 2,
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_20,
    paddingVertical: SPACING.space_18,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primaryOrangeHex,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  disabledButton: {
    backgroundColor: COLORS.primaryGreyHex,
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  confirmButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_8,
  },
  confirmButtonText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
  },
});

export default OrderConfirmationModal; 