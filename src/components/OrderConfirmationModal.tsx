import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';
import CustomIcon from './CustomIcon';

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
  const calculateItemTotal = (item: OrderItem): number => {
    return item.prices.reduce((total, price) => {
      return total + (parseFloat(price.price) * price.quantity);
    }, 0);
  };

  const formatPaymentMethod = (method: string): string => {
    switch (method) {
      case 'stripe':
        return 'Credit/Debit Card (Stripe)';
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
        return 'card';
      case 'momo':
        return 'wallet';
      case 'cash':
        return 'cash';
      default:
        return 'card';
    }
  };

  const subtotal = parseFloat(totalAmount);
  const deliveryFee = deliveryInfo?.fee || 0;
  const grandTotal = subtotal + (deliveryFee / 23000); // Convert VND to USD for display

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Confirm Your Order</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <CustomIcon
                name="close"
                size={FONTSIZE.size_24}
                color={COLORS.primaryLightGreyHex}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollContent}>
            
            {/* Order Items */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Items</Text>
              {orderItems.map((item) => (
                <View key={item.id} style={styles.orderItem}>
                  <Image source={item.imagelink_square} style={styles.itemImage} />
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemIngredient}>{item.special_ingredient}</Text>
                    {item.prices.map((price, index) => (
                      <View key={index} style={styles.priceRow}>
                        <Text style={styles.priceText}>
                          {price.size} x {price.quantity}
                        </Text>
                        <Text style={styles.priceAmount}>
                          ${(parseFloat(price.price) * price.quantity).toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.itemTotal}>
                    ${calculateItemTotal(item).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Customer Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Information</Text>
              <View style={styles.infoContainer}>
                <View style={styles.infoRow}>
                  <CustomIcon
                    name="person"
                    size={FONTSIZE.size_16}
                    color={COLORS.primaryOrangeHex}
                  />
                  <Text style={styles.infoText}>{customerInfo.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <CustomIcon
                    name="call"
                    size={FONTSIZE.size_16}
                    color={COLORS.primaryOrangeHex}
                  />
                  <Text style={styles.infoText}>{customerInfo.phone}</Text>
                </View>
                <View style={styles.infoRow}>
                  <CustomIcon
                    name="mail"
                    size={FONTSIZE.size_16}
                    color={COLORS.primaryOrangeHex}
                  />
                  <Text style={styles.infoText}>{customerInfo.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <CustomIcon
                    name="location"
                    size={FONTSIZE.size_16}
                    color={COLORS.primaryOrangeHex}
                  />
                  <Text style={styles.infoText}>{customerInfo.address}</Text>
                </View>
              </View>
            </View>

            {/* Delivery Information */}
            {deliveryInfo && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Delivery Details</Text>
                <View style={styles.deliveryInfo}>
                  <View style={styles.deliveryRow}>
                    <Text style={styles.deliveryLabel}>Distance:</Text>
                    <Text style={styles.deliveryValue}>{deliveryInfo.distance} km</Text>
                  </View>
                  <View style={styles.deliveryRow}>
                    <Text style={styles.deliveryLabel}>Estimated Time:</Text>
                    <Text style={styles.deliveryValue}>{deliveryInfo.estimatedTime}</Text>
                  </View>
                  <View style={styles.deliveryRow}>
                    <Text style={styles.deliveryLabel}>Delivery Fee:</Text>
                    <Text style={styles.deliveryValue}>
                      {deliveryInfo.fee.toLocaleString()} VND
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Payment Method */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.paymentMethod}>
                <CustomIcon
                  name={getPaymentMethodIcon(paymentMethod)}
                  size={FONTSIZE.size_20}
                  color={COLORS.primaryOrangeHex}
                />
                <Text style={styles.paymentText}>{formatPaymentMethod(paymentMethod)}</Text>
              </View>
            </View>

            {/* Order Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal:</Text>
                  <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
                </View>
                {deliveryInfo && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery Fee:</Text>
                    <Text style={styles.summaryValue}>
                      ${(deliveryFee / 23000).toFixed(2)}
                    </Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>${grandTotal.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {/* Warning for Online Payments */}
            {paymentMethod !== 'cash' && (
              <View style={styles.warningContainer}>
                <CustomIcon
                  name="warning"
                  size={FONTSIZE.size_20}
                  color={COLORS.primaryOrangeHex}
                />
                <Text style={styles.warningText}>
                  Please double-check your order information before proceeding with payment. 
                  Once payment is processed, changes cannot be made.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isLoading}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, isLoading && styles.disabledButton]}
              onPress={onConfirm}
              disabled={isLoading}>
              <Text style={styles.confirmButtonText}>
                {isLoading ? 'Processing...' : 'Confirm Order'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '95%',
    maxHeight: '90%',
    backgroundColor: COLORS.primaryBlackHex,
    borderRadius: BORDERRADIUS.radius_20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.space_20,
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
  scrollContent: {
    flex: 1,
    padding: SPACING.space_20,
  },
  section: {
    marginBottom: SPACING.space_24,
  },
  sectionTitle: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryOrangeHex,
    marginBottom: SPACING.space_12,
  },
  orderItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_15,
    marginBottom: SPACING.space_12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: BORDERRADIUS.radius_10,
  },
  itemDetails: {
    flex: 1,
    marginLeft: SPACING.space_12,
  },
  itemName: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
  itemIngredient: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    marginBottom: SPACING.space_8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.space_4,
  },
  priceText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
  },
  priceAmount: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
  itemTotal: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryOrangeHex,
    alignSelf: 'center',
  },
  infoContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_12,
  },
  infoText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryWhiteHex,
    marginLeft: SPACING.space_12,
    flex: 1,
  },
  deliveryInfo: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_15,
  },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.space_8,
  },
  deliveryLabel: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
  },
  deliveryValue: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_15,
  },
  paymentText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
    marginLeft: SPACING.space_12,
  },
  summaryContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.space_8,
  },
  summaryLabel: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
  },
  summaryValue: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.primaryGreyHex,
    paddingTop: SPACING.space_8,
    marginTop: SPACING.space_8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  totalValue: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryOrangeHex,
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(209, 120, 66, 0.1)',
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_15,
    marginTop: SPACING.space_12,
  },
  warningText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryOrangeHex,
    marginLeft: SPACING.space_12,
    flex: 1,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: SPACING.space_20,
    borderTopWidth: 1,
    borderTopColor: COLORS.primaryGreyHex,
    gap: SPACING.space_15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    paddingVertical: SPACING.space_15,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
  confirmButton: {
    flex: 2,
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_15,
    paddingVertical: SPACING.space_15,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.primaryGreyHex,
  },
  confirmButtonText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
});

export default OrderConfirmationModal; 