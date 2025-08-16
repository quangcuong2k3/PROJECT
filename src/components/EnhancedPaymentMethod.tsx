import React from 'react';
import {StyleSheet, Text, View, Image, TouchableOpacity} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';
import CustomIcon from './CustomIcon';

interface PaymentMethodData {
  id: string;
  name: string;
  displayName: string;
  icon?: any;
  isIconComponent?: boolean;
  description?: string;
  supported: boolean;
  processingFee?: string;
  estimatedTime?: string;
}

interface EnhancedPaymentMethodProps {
  paymentMethod: PaymentMethodData;
  isSelected: boolean;
  onSelect: (method: PaymentMethodData) => void;
  disabled?: boolean;
}

const EnhancedPaymentMethod: React.FC<EnhancedPaymentMethodProps> = ({
  paymentMethod,
  isSelected,
  onSelect,
  disabled = false,
}) => {
  const handlePress = () => {
    if (!disabled && paymentMethod.supported) {
      onSelect(paymentMethod);
    }
  };

  const getIconComponent = () => {
    switch (paymentMethod.id) {
      case 'stripe':
        return (
          <View style={styles.stripeIconContainer}>
            <CustomIcon
              name="card"
              color={COLORS.primaryWhiteHex}
              size={FONTSIZE.size_20}
            />
          </View>
        );
      case 'momo':
        return (
          <View style={styles.momoIconContainer}>
            <Text style={styles.momoText}>M</Text>
          </View>
        );
      case 'cash':
        return (
          <View style={styles.cashIconContainer}>
            <CustomIcon
              name="cash"
              color={COLORS.primaryOrangeHex}
              size={FONTSIZE.size_24}
            />
          </View>
        );
      default:
        return (
          <CustomIcon
            name="card"
            color={COLORS.primaryOrangeHex}
            size={FONTSIZE.size_20}
          />
        );
    }
  };

  const containerStyle = [
    styles.paymentCardContainer,
    {
      borderColor: isSelected
        ? COLORS.primaryOrangeHex
        : COLORS.primaryGreyHex,
      opacity: (!paymentMethod.supported || disabled) ? 0.5 : 1,
    },
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={handlePress}
      disabled={disabled || !paymentMethod.supported}
      activeOpacity={0.8}>
      <LinearGradient
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        colors={[COLORS.primaryGreyHex, COLORS.primaryBlackHex]}
        style={styles.linearGradient}>
        
        {/* Left Section - Icon and Title */}
        <View style={styles.leftSection}>
          {getIconComponent()}
          <View style={styles.titleContainer}>
            <Text style={styles.paymentTitle}>{paymentMethod.displayName}</Text>
            {paymentMethod.description && (
              <Text style={styles.paymentDescription}>
                {paymentMethod.description}
              </Text>
            )}
            {!paymentMethod.supported && (
              <Text style={styles.unsupportedText}>Coming Soon</Text>
            )}
          </View>
        </View>

        {/* Right Section - Details */}
        <View style={styles.rightSection}>
          {paymentMethod.processingFee && (
            <Text style={styles.feeText}>{paymentMethod.processingFee}</Text>
          )}
          {paymentMethod.estimatedTime && (
            <Text style={styles.timeText}>{paymentMethod.estimatedTime}</Text>
          )}
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <CustomIcon
                name="checkmark"
                color={COLORS.primaryOrangeHex}
                size={FONTSIZE.size_16}
              />
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  paymentCardContainer: {
    borderRadius: BORDERRADIUS.radius_15,
    backgroundColor: COLORS.primaryGreyHex,
    borderWidth: 2,
    marginBottom: SPACING.space_15,
  },
  linearGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.space_15,
    borderRadius: BORDERRADIUS.radius_15,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleContainer: {
    marginLeft: SPACING.space_12,
    flex: 1,
  },
  paymentTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
  paymentDescription: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
    marginTop: SPACING.space_2,
  },
  unsupportedText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
    marginTop: SPACING.space_2,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  feeText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
  },
  timeText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
    marginTop: SPACING.space_2,
  },
  selectedIndicator: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_4,
    marginTop: SPACING.space_8,
  },

  // Icon Containers
  stripeIconContainer: {
    backgroundColor: '#635BFF', // Stripe brand color
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  momoIconContainer: {
    backgroundColor: '#A50064', // MoMo brand color
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  momoText: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
  },
  cashIconContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryOrangeHex,
  },
});

export default EnhancedPaymentMethod; 