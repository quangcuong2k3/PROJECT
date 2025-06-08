import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';
import GradientBGIcon from '../components/GradientBGIcon';
import PaymentMethod from '../components/PaymentMethod';
import PaymentFooter from '../components/PaymentFooter';
import {useStore} from '../store/firebaseStore';
import PopUpAnimation from '../components/PopUpAnimation';
import Toast from 'react-native-toast-message';

const PaymentList = [
  {
    name: 'Cash on Delivery',
    icon: 'icon',
    isIcon: true,
  },
];

const PaymentScreen = ({navigation, route}: any) => {
  const calculateCartPrice = useStore((state: any) => state.calculateCartPrice);
  const addToOrderHistoryListFromCart = useStore(
    (state: any) => state.addToOrderHistoryListFromCart,
  );

  const [paymentMode, setPaymentMode] = useState('Cash on Delivery');
  const [showAnimation, setShowAnimation] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const buttonPressHandler = async () => {
    // Show success message for Cash on Delivery
    Toast.show({
      type: 'success',
      text1: 'Order Placed Successfully',
      text2: 'Your order will be prepared and delivered soon!',
      visibilityTime: 3000,
      position: 'top',
    });

    // Add order to history
    setShowAnimation(true);
    await addToOrderHistoryListFromCart({
      paymentMethod: paymentMode,
      paymentId: null, // No payment ID for Cash on Delivery
      customerInfo: customerInfo.name.trim() ? customerInfo : undefined,
    });
    calculateCartPrice();

    setTimeout(() => {
      setShowAnimation(false);
      navigation.navigate('History');
    }, 2000);
  };

  return (
    <View style={styles.ScreenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />

      {showAnimation ? (
        <PopUpAnimation
          style={styles.LottieAnimation}
          source={require('../lottie/successful.json')}
        />
      ) : (
        <></>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}>
        <View style={styles.HeaderContainer}>
          <TouchableOpacity
            onPress={() => {
              navigation.pop();
            }}>
            <GradientBGIcon
              name="left"
              color={COLORS.primaryLightGreyHex}
              size={FONTSIZE.size_16}
            />
          </TouchableOpacity>
          <Text style={styles.HeaderText}>Payments</Text>
          <View style={styles.EmptyView} />
        </View>

        <View style={styles.PaymentOptionsContainer}>
          {/* Customer Information Form - Optional */}
          <View style={styles.CustomerInfoContainer}>
            <Text style={styles.CustomerInfoTitle}>
              Customer Information (Optional)
            </Text>
            <TextInput
              style={styles.TextInput}
              placeholder="Full Name"
              placeholderTextColor={COLORS.secondaryLightGreyHex}
              value={customerInfo.name}
              onChangeText={text =>
                setCustomerInfo(prev => ({...prev, name: text}))
              }
            />
            <TextInput
              style={styles.TextInput}
              placeholder="Email Address"
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
              placeholder="Phone Number"
              placeholderTextColor={COLORS.secondaryLightGreyHex}
              value={customerInfo.phone}
              onChangeText={text =>
                setCustomerInfo(prev => ({...prev, phone: text}))
              }
              keyboardType="phone-pad"
            />
          </View>

          {/* Payment Method Selection */}
          {PaymentList.map((data: any) => (
            <TouchableOpacity
              key={data.name}
              onPress={() => {
                setPaymentMode(data.name);
              }}>
              <PaymentMethod
                paymentMode={paymentMode}
                name={data.name}
                icon={data.icon}
                isIcon={data.isIcon}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <PaymentFooter
        buttonTitle={`Place Order - ${paymentMode}`}
        price={{price: route.params.amount, currency: '$'}}
        buttonPressHandler={buttonPressHandler}
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
  PaymentOptionsContainer: {
    padding: SPACING.space_15,
    gap: SPACING.space_15,
  },
  CustomerInfoContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_15,
    marginBottom: SPACING.space_15,
  },
  CustomerInfoTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_15,
  },
  TextInput: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_15,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
  },
});

export default PaymentScreen;
