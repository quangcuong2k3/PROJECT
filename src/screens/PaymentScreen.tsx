import React, {useState, useEffect, useRef} from 'react';
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
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  ActivityIndicator,
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

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

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
    description: 'Fast & secure Vietnamese e-wallet',
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

  // Animation references
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // State management
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodData>(PAYMENT_METHODS[0]);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'delivery' | 'payment' | null>('delivery');

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

  // Animation effects
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
      console.log('Attempting to open MoMo URL:', redirectUrl);
      
      // Try to open MoMo app or web URL
      const canOpen = await Linking.canOpenURL(redirectUrl);
      console.log('Can open URL:', canOpen);
      
      if (canOpen) {
        await Linking.openURL(redirectUrl);
        
        // Give user options after redirect
        setTimeout(() => {
          Alert.alert(
            'Complete Payment in MoMo',
            'Please complete your payment in the MoMo app. Once finished, return to this app.',
            [
              {
                text: 'Cancel Payment',
                style: 'cancel',
                onPress: () => {
                  console.log('Payment cancelled by user');
                  Toast.show({
                    type: 'error',
                    text1: 'Payment Cancelled',
                    text2: 'Your order has been cancelled.',
                    visibilityTime: 3000,
                  });
                },
              },
              {
                text: 'Payment Completed',
                onPress: async () => {
                  try {
                    setIsProcessingPayment(true);
                    // Wait a moment for payment to process
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await verifyPaymentAndCreateOrder(paymentDetails, paymentResult);
                  } catch (error) {
                    console.error('Error verifying payment:', error);
                    Alert.alert(
                      'Verification Failed',
                      'Could not verify your payment. Please contact support if money was deducted.',
                      [{ text: 'OK' }]
                    );
                  } finally {
                    setIsProcessingPayment(false);
                  }
                },
              },
            ]
          );
        }, 1000); // Small delay to let the app switch happen
      } else {
        // Fallback: show URL or instructions
        Alert.alert(
          'MoMo Payment',
          'MoMo app is not installed. Would you like to open the payment in your browser?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Browser',
              onPress: async () => {
                try {
                  await Linking.openURL(redirectUrl);
                } catch (browserError) {
                  console.error('Error opening browser:', browserError);
                  Alert.alert(
                    'Error',
                    'Could not open payment page. Please install MoMo app or check your internet connection.',
                    [{ text: 'OK' }]
                  );
                }
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error handling payment redirect:', error);
      Alert.alert(
        'Payment Error',
        error.message || 'Could not process MoMo payment. Please try again.',
        [{ text: 'OK' }]
      );
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

  const toggleSection = (section: 'delivery' | 'payment') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const SectionHeader = ({
    title,
    subtitle,
    icon,
    expanded,
    onToggle,
    rightElement,
  }: {
    title: string;
    subtitle?: string;
    icon: string;
    expanded: boolean;
    onToggle: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={styles.sectionHeader} 
      onPress={onToggle}
      activeOpacity={0.7}>
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.sectionIconContainer}>
          <CustomIcon
            name={icon as any}
            size={FONTSIZE.size_20}
            color={COLORS.primaryOrangeHex}
          />
        </View>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionHeaderTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.sectionHeaderSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.sectionHeaderRight}>
        {rightElement}
        <CustomIcon
          name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={FONTSIZE.size_20}
          color={COLORS.primaryLightGreyHex}
        />
      </View>
    </TouchableOpacity>
  );

  // Calculate animated header opacity
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });

  return (
    <KeyboardAvoidingView
      style={styles.ScreenContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} barStyle="light-content" />

      {showAnimation && (
        <PopUpAnimation
          style={styles.LottieAnimation}
          source={require('../lottie/successful.json')}
        />
      )}

      {/* Enhanced Header */}
      <Animated.View 
        style={[
          styles.HeaderContainer,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}>
        <TouchableOpacity 
          onPress={() => navigation.pop()}
          style={styles.backButton}
          activeOpacity={0.7}>
          <GradientBGIcon
            name="arrow-back"
            color={COLORS.primaryLightGreyHex}
            size={FONTSIZE.size_16}
          />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.HeaderText}>Payment</Text>
          <Text style={styles.HeaderSubtext}>Secure checkout process</Text>
        </View>
        <View style={styles.EmptyView} />
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewContainer}
        style={[
          styles.ScrollView,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}>
        
        {/* Delivery Information Section */}
        <View style={styles.Section}>
          <SectionHeader
            title="Delivery Information"
            subtitle="Where should we deliver your order?"
            icon="location-outline"
            expanded={expandedSection === 'delivery'}
            onToggle={() => toggleSection('delivery')}
            rightElement={
              deliveryInfo && (
                <View style={styles.deliveryStatusBadge}>
                  <CustomIcon
                    name="checkmark-circle"
                    size={FONTSIZE.size_14}
                    color={'#00D4AA'}
                  />
                </View>
              )
            }
          />
          
          {expandedSection === 'delivery' && (
            <Animated.View style={styles.SectionContent}>
              <View style={styles.FormContainer}>
                <View style={styles.InputGroup}>
                  <Text style={styles.InputLabel}>Full Name *</Text>
                  <TextInput
                    style={styles.TextInput}
                    placeholder="Enter your full name"
                    placeholderTextColor={COLORS.secondaryLightGreyHex}
                    value={customerInfo.name}
                    onChangeText={text =>
                      setCustomerInfo(prev => ({...prev, name: text}))
                    }
                  />
                </View>
                
                <View style={styles.InputRow}>
                  <View style={[styles.InputGroup, styles.InputHalf]}>
                    <Text style={styles.InputLabel}>Email Address *</Text>
                    <TextInput
                      style={styles.TextInput}
                      placeholder="your@email.com"
                      placeholderTextColor={COLORS.secondaryLightGreyHex}
                      value={customerInfo.email}
                      onChangeText={text =>
                        setCustomerInfo(prev => ({...prev, email: text}))
                      }
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  
                  <View style={[styles.InputGroup, styles.InputHalf]}>
                    <Text style={styles.InputLabel}>Phone Number *</Text>
                    <TextInput
                      style={styles.TextInput}
                      placeholder="0901234567"
                      placeholderTextColor={COLORS.secondaryLightGreyHex}
                      value={customerInfo.phone}
                      onChangeText={text =>
                        setCustomerInfo(prev => ({...prev, phone: text}))
                      }
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
                
                <View style={styles.InputGroup}>
                  <Text style={styles.InputLabel}>Delivery Address *</Text>
                  <TextInput
                    style={[styles.TextInput, styles.AddressInput]}
                    placeholder="Enter your complete delivery address"
                    placeholderTextColor={COLORS.secondaryLightGreyHex}
                    value={customerInfo.address}
                    onChangeText={text =>
                      setCustomerInfo(prev => ({...prev, address: text}))
                    }
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  
                  <TouchableOpacity
                    style={styles.LocationButton}
                    onPress={handleUseCurrentLocation}
                    disabled={isLoadingLocation}
                    activeOpacity={0.7}>
                    {isLoadingLocation ? (
                      <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />
                    ) : (
                      <CustomIcon
                        name="location-outline"
                        size={FONTSIZE.size_18}
                        color={COLORS.primaryOrangeHex}
                      />
                    )}
                    <Text style={styles.LocationButtonText}>
                      {isLoadingLocation ? 'Getting location...' : 'Use Current Location'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Enhanced Delivery Information Display */}
              {deliveryInfo && (
                <View style={styles.DeliveryStatsContainer}>
                  <Text style={styles.DeliveryStatsTitle}>Delivery Estimate</Text>
                  <View style={styles.DeliveryStatsGrid}>
                    <View style={styles.DeliveryStat}>
                      <View style={styles.DeliveryStatIcon}>
                        <CustomIcon
                          name="speedometer-outline"
                          size={FONTSIZE.size_20}
                          color={COLORS.primaryOrangeHex}
                        />
                      </View>
                      <Text style={styles.DeliveryStatValue}>{deliveryInfo.distance} km</Text>
                      <Text style={styles.DeliveryStatLabel}>Distance</Text>
                    </View>
                    
                    <View style={styles.DeliveryStat}>
                      <View style={styles.DeliveryStatIcon}>
                        <CustomIcon
                          name="time-outline"
                          size={FONTSIZE.size_20}
                          color={COLORS.primaryOrangeHex}
                        />
                      </View>
                      <Text style={styles.DeliveryStatValue}>{deliveryInfo.estimatedTime}</Text>
                      <Text style={styles.DeliveryStatLabel}>Estimated Time</Text>
                    </View>
                    
                    <View style={styles.DeliveryStat}>
                      <View style={styles.DeliveryStatIcon}>
                        <CustomIcon
                          name="cash-outline"
                          size={FONTSIZE.size_20}
                          color={COLORS.primaryOrangeHex}
                        />
                      </View>
                      <Text style={styles.DeliveryStatValue}>
                        {deliveryInfo.fee.toLocaleString()} VND
                      </Text>
                      <Text style={styles.DeliveryStatLabel}>Delivery Fee</Text>
                    </View>
                  </View>
                </View>
              )}
            </Animated.View>
          )}
        </View>

        {/* Payment Methods Section */}
        <View style={styles.Section}>
          <SectionHeader
            title="Payment Method"
            subtitle="Choose your preferred payment option"
            icon="card-outline"
            expanded={expandedSection === 'payment'}
            onToggle={() => toggleSection('payment')}
            rightElement={
              <View style={styles.selectedMethodBadge}>
                <Text style={styles.selectedMethodText}>
                  {selectedPaymentMethod.displayName}
                </Text>
              </View>
            }
          />
          
          {expandedSection === 'payment' && (
            <Animated.View style={styles.SectionContent}>
              <View style={styles.PaymentMethodsContainer}>
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
            </Animated.View>
          )}
        </View>

        {/* Payment Method Information */}
        {selectedPaymentMethod.id === 'cash' && (
          <View style={styles.InfoContainer}>
            <View style={styles.InfoHeader}>
              <CustomIcon
                name="information-circle-outline"
                size={FONTSIZE.size_20}
                color={COLORS.primaryOrangeHex}
              />
              <Text style={styles.InfoTitle}>Cash on Delivery</Text>
            </View>
            <Text style={styles.InfoText}>
              Please ensure someone is available at the delivery address to receive and pay for the order. 
              Exact change is appreciated for a smooth transaction.
            </Text>
          </View>
        )}

        {selectedPaymentMethod.id === 'momo' && (
          <View style={styles.InfoContainer}>
            <View style={styles.InfoHeader}>
              <CustomIcon
                name="shield-checkmark-outline"
                size={FONTSIZE.size_20}
                color={COLORS.primaryOrangeHex}
              />
              <Text style={styles.InfoTitle}>MoMo Security</Text>
            </View>
            <Text style={styles.InfoText}>
              Your payment is secured by MoMo's banking-grade encryption. 
              You'll be redirected to the MoMo app to complete the transaction safely.
            </Text>
          </View>
        )}
      </Animated.ScrollView>

      {/* Enhanced Payment Footer */}
      <View style={styles.FooterContainer}>
        <PaymentFooter
          buttonTitle={
            isProcessingPayment 
              ? 'Processing...' 
              : `Continue with ${selectedPaymentMethod.displayName}`
          }
          price={{
            price: deliveryInfo 
              ? (parseFloat(route.params.amount) + (deliveryInfo.fee / 23000)).toFixed(2)
              : route.params.amount,
            currency: '$'
          }}
                     buttonPressHandler={handleContinueToPayment}
        />
      </View>

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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  ScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
    paddingTop: SPACING.space_20,
  },
  LottieAnimation: {
    flex: 1,
  },
  HeaderContainer: {
    paddingHorizontal: SPACING.space_24,
    paddingVertical: SPACING.space_20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryBlackHex,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(37, 37, 37, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryDarkGreyHex,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  HeaderText: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
    letterSpacing: 0.5,
  },
  HeaderSubtext: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
    marginTop: 2,
  },
  EmptyView: {
    width: 44,
    height: 44,
  },
  ScrollView: {
    flex: 1,
  },
  ScrollViewContainer: {
    paddingBottom: 100,  
  },
  Section: {
    marginBottom: SPACING.space_20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_24,
    paddingVertical: SPACING.space_20,
    backgroundColor: 'rgba(37, 37, 37, 0.4)',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryOrangeHex,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(209, 120, 66, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.space_16,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionHeaderTitle: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    lineHeight: 24,
  },
  sectionHeaderSubtitle: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    marginTop: 2,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_8,
  },
  deliveryStatusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedMethodBadge: {
    backgroundColor: 'rgba(209, 120, 66, 0.15)',
    paddingHorizontal: SPACING.space_8,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_8,
  },
  selectedMethodText: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
  },
  SectionContent: {
    paddingHorizontal: SPACING.space_24,
    paddingTop: SPACING.space_12,
  },
  FormContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    padding: SPACING.space_24,
    marginBottom: SPACING.space_16,
  },
  InputGroup: {
    marginBottom: SPACING.space_20,
  },
  InputRow: {
    flexDirection: 'row',
    gap: SPACING.space_12,
  },
  InputHalf: {
    flex: 1,
  },
  InputLabel: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_8,
  },
  TextInput: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    borderWidth: 1,
    borderColor: 'rgba(82, 82, 82, 0.3)',
  },
  AddressInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: SPACING.space_16,
  },
  LocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(209, 120, 66, 0.1)',
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_12,
    marginTop: SPACING.space_12,
    borderWidth: 1,
    borderColor: 'rgba(209, 120, 66, 0.2)',
  },
  LocationButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
    marginLeft: SPACING.space_8,
  },
  DeliveryStatsContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    padding: SPACING.space_20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  DeliveryStatsTitle: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_16,
    textAlign: 'center',
  },
  DeliveryStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  DeliveryStat: {
    alignItems: 'center',
    flex: 1,
  },
  DeliveryStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(209, 120, 66, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.space_8,
  },
  DeliveryStatValue: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
  },
  DeliveryStatLabel: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    marginTop: SPACING.space_4,
    textAlign: 'center',
  },
  PaymentMethodsContainer: {
    gap: SPACING.space_12,
  },
  InfoContainer: {
    backgroundColor: 'rgba(209, 120, 66, 0.1)',
    borderRadius: BORDERRADIUS.radius_20,
    padding: SPACING.space_20,
    marginHorizontal: SPACING.space_24,
    marginBottom: SPACING.space_16,
    borderWidth: 1,
    borderColor: 'rgba(209, 120, 66, 0.2)',
  },
  InfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_12,
  },
  InfoTitle: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryOrangeHex,
    marginLeft: SPACING.space_12,
  },
  InfoText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryOrangeHex,
    lineHeight: 18,
    opacity: 0.9,
  },
  FooterContainer: {
    backgroundColor: COLORS.primaryBlackHex,
    borderTopWidth: 1,
    borderTopColor: 'rgba(37, 37, 37, 0.5)',
    paddingTop: SPACING.space_12,
  },
});

export default PaymentScreen;
