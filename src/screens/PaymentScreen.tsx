import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';
import GradientBGIcon from '../components/GradientBGIcon';
import PaymentFooter from '../components/PaymentFooter';
import {useStore} from '../store/firebaseStore';
import PopUpAnimation from '../components/PopUpAnimation';
import Toast from 'react-native-toast-message';
import CustomIcon from '../components/CustomIcon';
import EnhancedPaymentMethod from '../components/EnhancedPaymentMethod';
import OrderConfirmationModal from '../components/OrderConfirmationModal';
import paymentService, {PaymentDetails, PaymentResult} from '../services/paymentService';
import locationService, {DetailedAddress} from '../services/locationService';

interface PaymentMethodData {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  supported: boolean;
  processingFee?: string;
  estimatedTime?: string;
}

const PAYMENT_METHODS: PaymentMethodData[] = [
  {
    id: 'stripe',
    name: 'stripe',
    displayName: 'Credit/Debit Card',
    description: 'Visa, Mastercard, American Express',
    supported: true,
    processingFee: 'Free',
    estimatedTime: 'Instant',
  },
  {
    id: 'momo',
    name: 'momo',
    displayName: 'MoMo Wallet',
    description: 'Vietnamese digital wallet',
    supported: true,
    processingFee: 'Free',
    estimatedTime: 'Instant',
  },
  {
    id: 'cash',
    name: 'cash',
    displayName: 'Cash on Delivery',
    description: 'Pay when you receive your order',
    supported: true,
    processingFee: 'Free',
    estimatedTime: 'On delivery',
  },
];

const PaymentScreen = ({navigation, route}: any) => {
  const calculateCartPrice = useStore((state: any) => state.calculateCartPrice);
  const addToOrderHistoryListFromCart = useStore(
    (state: any) => state.addToOrderHistoryListFromCart,
  );
  const CartList = useStore((state: any) => state.CartList);
  const user = useStore((state: any) => state.user);
  const userProfile = useStore((state: any) => state.userProfile);

  // State management
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodData>(PAYMENT_METHODS[0]);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Customer information state
  const [customerInfo, setCustomerInfo] = useState({
    name: userProfile?.displayName || `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || '',
    email: user?.email || '',
    phone: userProfile?.phone || '',
    address: userProfile?.address || '',
  });

  // Delivery information state
  const [deliveryInfo, setDeliveryInfo] = useState<{
    fee: number;
    estimatedTime: string;
    distance: number;
  } | null>(null);

  const [currentLocation, setCurrentLocation] = useState<DetailedAddress | null>(null);

  // Load user location and calculate delivery info
  useEffect(() => {
    loadUserLocation();
  }, []);

  // Update delivery info when address changes
  useEffect(() => {
    if (customerInfo.address && customerInfo.address.trim().length > 10) {
      calculateDeliveryInfo();
    }
  }, [customerInfo.address]);

  const loadUserLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const location = await locationService.getCurrentDetailedAddress();
      if (location) {
        setCurrentLocation(location);
        if (!customerInfo.address) {
          setCustomerInfo(prev => ({
            ...prev,
            address: location.formattedAddress,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading location:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const calculateDeliveryInfo = async () => {
    try {
      if (!customerInfo.address) return;

      // Search for address coordinates
      const addresses = await locationService.searchAddresses(customerInfo.address);
      if (addresses.length > 0) {
        const targetAddress = addresses[0];
        const deliveryAvailability = await locationService.checkDeliveryAvailability(
          targetAddress.coordinates
        );

        if (deliveryAvailability.available) {
          setDeliveryInfo({
            fee: deliveryAvailability.deliveryFee || 0,
            estimatedTime: deliveryAvailability.estimatedTime || '30-45 minutes',
            distance: deliveryAvailability.distance || 0,
          });
        } else {
          setDeliveryInfo(null);
          if (deliveryAvailability.distance !== undefined) {
            Alert.alert(
              'Delivery Not Available',
              `Sorry, we don't deliver to your area (${deliveryAvailability.distance}km away). Maximum delivery distance is 20km.`,
              [{ text: 'OK' }]
            );
          }
        }
      }
    } catch (error) {
      console.error('Error calculating delivery info:', error);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (currentLocation) {
      setCustomerInfo(prev => ({
        ...prev,
        address: currentLocation.formattedAddress,
      }));
    } else {
      await loadUserLocation();
    }
  };

  const validateCustomerInfo = (): boolean => {
    const {name, phone, address} = customerInfo;

    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter your full name.');
      return false;
    }

    if (!phone.trim()) {
      Alert.alert('Missing Information', 'Please enter your phone number.');
      return false;
    }

    if (!address.trim()) {
      Alert.alert('Missing Information', 'Please enter your delivery address.');
      return false;
    }

    // Vietnamese phone number validation
    const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8,9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      Alert.alert(
        'Invalid Phone Number',
        'Please enter a valid Vietnamese phone number (e.g., 0901234567).'
      );
      return false;
    }

    return true;
  };

  const handlePaymentMethodSelect = (method: PaymentMethodData) => {
    setSelectedPaymentMethod(method);
  };

  const handleContinueToPayment = () => {
    if (!validateCustomerInfo()) {
      return;
    }

    // Show confirmation modal
    setShowConfirmationModal(true);
  };

  const handleConfirmOrder = async () => {
    try {
      setIsProcessingPayment(true);
      setShowConfirmationModal(false);

      const paymentDetails: PaymentDetails = {
        paymentMethod: selectedPaymentMethod.id as 'stripe' | 'momo' | 'cash',
        amount: parseFloat(route.params.amount),
        currency: 'usd',
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: customerInfo.address,
        },
        orderItems: CartList,
      };

      // Process payment
      const paymentResult: PaymentResult = await paymentService.processPayment(paymentDetails);

      if (paymentResult.success) {
        // Handle successful payment
        await handleSuccessfulPayment(paymentDetails, paymentResult);
      } else if (paymentResult.requiresAction && paymentResult.redirectUrl) {
        // Handle payment requiring additional action (like MoMo redirect)
        await handlePaymentRedirect(paymentResult.redirectUrl, paymentDetails, paymentResult);
      } else {
        // Handle payment failure
        throw new Error(paymentResult.error || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert(
        'Payment Failed',
        error.message || 'An error occurred while processing your payment. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSuccessfulPayment = async (
    paymentDetails: PaymentDetails,
    paymentResult: PaymentResult
  ) => {
    try {
      console.log('🔄 Creating order in Firebase for user:', user?.uid || 'default-user');
      console.log('📋 Order will be saved to:');
      console.log('  1. Main orders collection');
      console.log('  2. User orders subcollection (users/{uid}/orders)');
      console.log('  3. User orderHistory array');
      
      // Create order in Firebase
      const orderId = await paymentService.createOrderWithPayment(
        paymentDetails,
        paymentResult,
        user?.uid || 'default-user'
      );

      console.log('✅ Order created with ID:', orderId);
      console.log('🔄 Adding order to local order history...');

      // Add to local order history
      await addToOrderHistoryListFromCart({
        paymentMethod: paymentDetails.paymentMethod,
        paymentId: paymentResult.paymentId,
        customerInfo: paymentDetails.customerInfo,
        orderId: orderId,
      });

      console.log('✅ Order added to local history successfully');

      // Show success animation
      setShowAnimation(true);
      
      // Show success message
      Toast.show({
        type: 'success',
        text1: 'Order Placed Successfully!',
        text2: paymentDetails.paymentMethod === 'cash' 
          ? 'Your order will be prepared and delivered soon!'
          : 'Payment confirmed. Your order is being prepared!',
        visibilityTime: 3000,
        position: 'top',
      });

      calculateCartPrice();

      setTimeout(() => {
        setShowAnimation(false);
        navigation.navigate('Cart');
      }, 2500);
    } catch (error) {
      console.error('❌ Error handling successful payment:', error);
      throw error;
    }
  };

  const handlePaymentRedirect = async (
    redirectUrl: string,
    paymentDetails: PaymentDetails,
    paymentResult: PaymentResult
  ) => {
    try {
      // Open MoMo app or web URL
      const canOpen = await Linking.canOpenURL(redirectUrl);
      if (canOpen) {
        await Linking.openURL(redirectUrl);
        
        // Show instructions to user
        Alert.alert(
          'Complete Payment in MoMo',
          'You will be redirected to MoMo app to complete your payment. Once completed, you will be redirected back to the app.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                // Handle payment cancellation
                console.log('Payment cancelled by user');
              },
            },
            {
              text: 'I have completed payment',
              onPress: async () => {
                // Verify payment status
                await verifyPaymentAndCreateOrder(paymentDetails, paymentResult);
              },
            },
          ]
        );
      } else {
        throw new Error('Cannot open MoMo app. Please install MoMo app first.');
      }
    } catch (error) {
      console.error('Error handling payment redirect:', error);
      throw error;
    }
  };

  const verifyPaymentAndCreateOrder = async (
    paymentDetails: PaymentDetails,
    paymentResult: PaymentResult
  ) => {
    try {
      // Verify payment status with backend
      if (paymentResult.paymentId) {
        const verificationResult = await paymentService.verifyPaymentStatus(
          paymentResult.paymentId,
          paymentDetails.paymentMethod
        );

        if (verificationResult.success) {
          await handleSuccessfulPayment(paymentDetails, verificationResult);
        } else {
          throw new Error('Payment verification failed. Please contact support if money was deducted.');
        }
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  };

  return (
      <View style={styles.ScreenContainer}>
        <StatusBar backgroundColor={COLORS.primaryBlackHex} />

        {showAnimation && (
          <PopUpAnimation
            style={styles.LottieAnimation}
            source={require('../lottie/successful.json')}
          />
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.ScrollViewFlex}>
          {/* Header */}
          <View style={styles.HeaderContainer}>
            <TouchableOpacity onPress={() => navigation.pop()}>
              <GradientBGIcon
                name="arrow-back"
                color={COLORS.primaryLightGreyHex}
                size={FONTSIZE.size_16}
              />
            </TouchableOpacity>
            <Text style={styles.HeaderText}>Payment</Text>
            <View style={styles.EmptyView} />
          </View>

          {/* Customer Information */}
          <View style={styles.SectionContainer}>
            <Text style={styles.SectionTitle}>Delivery Information</Text>
            
            <View style={styles.CustomerInfoContainer}>
              <TextInput
                style={styles.TextInput}
                placeholder="Full Name *"
                placeholderTextColor={COLORS.secondaryLightGreyHex}
                value={customerInfo.name}
                onChangeText={text =>
                  setCustomerInfo(prev => ({...prev, name: text}))
                }
              />
              
              <TextInput
                style={styles.TextInput}
                placeholder="Email Address *"
                placeholderTextColor={COLORS.secondaryLightGreyHex}
                value={customerInfo.email}
                onChangeText={text =>
                  setCustomerInfo(prev => ({...prev, email: text}))
                }
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TextInput
                style={styles.TextInput}
                placeholder="Phone Number *"
                placeholderTextColor={COLORS.secondaryLightGreyHex}
                value={customerInfo.phone}
                onChangeText={text =>
                  setCustomerInfo(prev => ({...prev, phone: text}))
                }
                keyboardType="phone-pad"
              />
              
              <View style={styles.AddressInputContainer}>
                <TextInput
                  style={[styles.TextInput, styles.AddressInput]}
                  placeholder="Delivery Address *"
                  placeholderTextColor={COLORS.secondaryLightGreyHex}
                  value={customerInfo.address}
                  onChangeText={text =>
                    setCustomerInfo(prev => ({...prev, address: text}))
                  }
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity
                  style={styles.LocationButton}
                  onPress={handleUseCurrentLocation}
                  disabled={isLoadingLocation}>
                  <CustomIcon
                    name="location"
                    size={FONTSIZE.size_20}
                    color={isLoadingLocation ? COLORS.primaryGreyHex : COLORS.primaryOrangeHex}
                  />
                  <Text style={styles.LocationButtonText}>
                    {isLoadingLocation ? 'Loading...' : 'Use Current Location'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Delivery Information Display */}
            {deliveryInfo && (
              <View style={styles.DeliveryInfoContainer}>
                <Text style={styles.DeliveryInfoTitle}>Delivery Details</Text>
                <View style={styles.DeliveryInfoRow}>
                  <Text style={styles.DeliveryInfoLabel}>Distance:</Text>
                  <Text style={styles.DeliveryInfoValue}>{deliveryInfo.distance} km</Text>
                </View>
                <View style={styles.DeliveryInfoRow}>
                  <Text style={styles.DeliveryInfoLabel}>Estimated Time:</Text>
                  <Text style={styles.DeliveryInfoValue}>{deliveryInfo.estimatedTime}</Text>
                </View>
                <View style={styles.DeliveryInfoRow}>
                  <Text style={styles.DeliveryInfoLabel}>Delivery Fee:</Text>
                  <Text style={styles.DeliveryInfoValue}>
                    {deliveryInfo.fee.toLocaleString()} VND
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Payment Methods */}
          <View style={styles.SectionContainer}>
            <Text style={styles.SectionTitle}>Payment Method</Text>
            {PAYMENT_METHODS.map((method) => (
              <EnhancedPaymentMethod
                key={method.id}
                paymentMethod={method}
                isSelected={selectedPaymentMethod.id === method.id}
                onSelect={handlePaymentMethodSelect}
                disabled={isProcessingPayment}
              />
            ))}
          </View>

          {/* Additional Information for Cash on Delivery */}
          {selectedPaymentMethod.id === 'cash' && (
            <View style={styles.CashInfoContainer}>
              <CustomIcon
                name="information-circle"
                size={FONTSIZE.size_20}
                color={COLORS.primaryOrangeHex}
              />
              <Text style={styles.CashInfoText}>
                Please ensure someone is available at the delivery address to receive and pay for the order. 
                Exact change is appreciated.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Payment Footer */}
        <PaymentFooter
          buttonTitle={`Continue with ${selectedPaymentMethod.displayName}`}
          price={{
            price: deliveryInfo 
              ? (parseFloat(route.params.amount) + (deliveryInfo.fee / 23000)).toFixed(2)
              : route.params.amount,
            currency: '$'
          }}
          buttonPressHandler={handleContinueToPayment}
        />

        {/* Order Confirmation Modal */}
        <OrderConfirmationModal
          visible={showConfirmationModal}
          onClose={() => setShowConfirmationModal(false)}
          onConfirm={handleConfirmOrder}
          orderItems={CartList}
          customerInfo={customerInfo}
          paymentMethod={selectedPaymentMethod.id}
          totalAmount={route.params.amount}
          deliveryInfo={deliveryInfo || undefined}
          isLoading={isProcessingPayment}
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
    flex: 1,
  },
  ScrollViewFlex: {
    flexGrow: 1,
    paddingBottom: SPACING.space_20,
  },
  HeaderContainer: {
    paddingHorizontal: SPACING.space_24,
    paddingVertical: SPACING.space_15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  HeaderText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
  },
  EmptyView: {
    height: SPACING.space_36,
    width: SPACING.space_36,
  },
  SectionContainer: {
    padding: SPACING.space_20,
  },
  SectionTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryOrangeHex,
    marginBottom: SPACING.space_15,
  },
  CustomerInfoContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_15,
    marginBottom: SPACING.space_15,
  },
  TextInput: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_15,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_12,
  },
  AddressInputContainer: {
    marginBottom: 0,
  },
  AddressInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  LocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryBlackHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_12,
    marginTop: SPACING.space_8,
  },
  LocationButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
    marginLeft: SPACING.space_8,
  },
  DeliveryInfoContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_15,
  },
  DeliveryInfoTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
  },
  DeliveryInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.space_8,
  },
  DeliveryInfoLabel: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
  },
  DeliveryInfoValue: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
  CashInfoContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(209, 120, 66, 0.1)',
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_15,
    margin: SPACING.space_20,
    marginTop: 0,
  },
  CashInfoText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
    marginLeft: SPACING.space_12,
    flex: 1,
    lineHeight: 18,
  },
});

export default PaymentScreen;
