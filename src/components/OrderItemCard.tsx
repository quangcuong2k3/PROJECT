import {StyleSheet, Text, View, ImageProps, Image, Animated, TouchableOpacity} from 'react-native';
import React, {useRef, useEffect} from 'react';
import {LinearGradient} from 'expo-linear-gradient';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';
import { updateProductWithLocalImages, getLocalImage } from '../utils/imageMapping';
import CustomIcon from './CustomIcon';

interface OrderItemCardProps {
  type: string;
  name: string;
  imagelink_square: ImageProps;
  special_ingredient: string;
  prices: any;
  ItemPrice: string;
  onPress?: () => void;
  index?: number;
}

const OrderItemCard: React.FC<OrderItemCardProps> = ({
  type,
  name,
  imagelink_square,
  special_ingredient,
  prices,
  ItemPrice,
  onPress,
  index = 0,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Get proper local image using the image mapping utility
  const getProductImage = () => {
    try {
      // Try to get local image based on product name
      const localImage = getLocalImage(name, 'square');
      if (localImage) {
        return localImage;
      }
    } catch (error) {
      console.log('Could not get local image for:', name);
    }
    
    // Fallback to provided image or default
    return imagelink_square || require('../assets/coffee_assets/americano/square/americano_pic_1_square.png');
  };

  const renderPriceItem = (priceData: any, priceIndex: number) => (
    <View key={priceIndex} style={styles.priceRow}>
      <View style={styles.sizeQuantityContainer}>
        <View style={styles.sizeBox}>
          <Text style={[
            styles.sizeText,
            {fontSize: type === 'Bean' ? FONTSIZE.size_12 : FONTSIZE.size_14}
          ]}>
            {priceData.size}
          </Text>
        </View>
        
        <View style={styles.quantityContainer}>
          <CustomIcon
            name="close"
            size={FONTSIZE.size_10}
            color={COLORS.primaryLightGreyHex}
          />
          <Text style={styles.quantityText}>{priceData.quantity}</Text>
        </View>
      </View>
      
      <View style={styles.priceContainer}>
        <Text style={styles.unitPrice}>
          {priceData.currency}{priceData.price}
        </Text>
        <Text style={styles.totalPrice}>
          ${(priceData.quantity * parseFloat(priceData.price)).toFixed(2)}
        </Text>
      </View>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.animatedContainer,
        {
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}],
        },
      ]}>
      <TouchableOpacity
        style={styles.touchableContainer}
        onPress={onPress}
        activeOpacity={0.9}
        disabled={!onPress}>
        <LinearGradient
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          colors={[COLORS.primaryGreyHex, COLORS.primaryBlackHex]}
          style={styles.cardGradient}>
          
          {/* Main Product Info Row */}
          <View style={styles.productInfoRow}>
            <View style={styles.imageContainer}>
              <Image 
                source={getProductImage()} 
                style={styles.productImage}
                resizeMode="cover"
              />
              <View style={styles.typeIndicator}>
                <CustomIcon
                  name={type === 'Bean' ? 'leaf' : 'cafe'}
                  size={FONTSIZE.size_10}
                  color={COLORS.primaryWhiteHex}
                />
              </View>
            </View>
            
            <View style={styles.productDetails}>
              <Text style={styles.productName} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.productSpecial} numberOfLines={2}>
                {special_ingredient}
              </Text>
              
              {/* Quick Stats */}
              <View style={styles.quickStats}>
                <View style={styles.statItem}>
                  <CustomIcon
                    name="basket"
                    size={FONTSIZE.size_12}
                    color={COLORS.primaryOrangeHex}
                  />
                  <Text style={styles.statText}>
                    {prices?.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0)} items
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.totalPriceContainer}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>${ItemPrice}</Text>
            </View>
          </View>

          {/* Detailed Price Breakdown */}
          <View style={styles.priceBreakdown}>
            <Text style={styles.breakdownTitle}>Price Details</Text>
            {prices?.map((priceData: any, priceIndex: number) => 
              renderPriceItem(priceData, priceIndex)
            )}
          </View>
          
          {/* Action Hint */}
          {onPress && (
            <View style={styles.actionHint}>
              <CustomIcon
                name="arrow-forward"
                size={FONTSIZE.size_12}
                color={COLORS.primaryOrangeHex}
              />
              <Text style={styles.actionText}>Tap to view details</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animatedContainer: {
    marginBottom: SPACING.space_15,
  },
  touchableContainer: {
    borderRadius: BORDERRADIUS.radius_20,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: SPACING.space_20,
  },
  productInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.space_20,
  },
  imageContainer: {
    position: 'relative',
    marginRight: SPACING.space_15,
  },
  productImage: {
    height: 80,
    width: 80,
    borderRadius: BORDERRADIUS.radius_15,
  },
  typeIndicator: {
    position: 'absolute',
    top: SPACING.space_8,
    right: SPACING.space_8,
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_4,
  },
  productDetails: {
    flex: 1,
    marginRight: SPACING.space_15,
  },
  productName: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  productSpecial: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    marginBottom: SPACING.space_10,
    lineHeight: 16,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_4,
  },
  statText: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
  },
  totalPriceContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_4,
  },
  totalAmount: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryOrangeHex,
  },
  priceBreakdown: {
    backgroundColor: COLORS.primaryBlackHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_15,
    marginBottom: SPACING.space_15,
  },
  breakdownTitle: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_10,
    paddingHorizontal: SPACING.space_10,
  },
  sizeQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_15,
  },
  sizeBox: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
    minWidth: 50,
    alignItems: 'center',
  },
  sizeText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryOrangeHex,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_4,
  },
  quantityText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  unitPrice: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_2,
  },
  totalPrice: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.space_8,
    paddingVertical: SPACING.space_8,
  },
  actionText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
  },
});

export default OrderItemCard;
