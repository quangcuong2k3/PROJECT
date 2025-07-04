# TheCoffee - React Native Coffee Shop App

A complete React Native coffee shop application with Firebase backend and multiple payment integration including Stripe, MoMo Wallet, and Cash on Delivery.

## ✨ Features

- 🛒 **Shopping Cart**: Add/remove items, quantity management
- 📱 **User Authentication**: Sign up, login, profile management
- 💳 **Multiple Payment Methods**:
  - Stripe Payment Sheet (International cards)
  - MoMo Wallet (Vietnamese payment)
  - Cash on Delivery
- 🔥 **Firebase Integration**: Firestore, Authentication, Storage
- 📍 **Location Services**: Auto-detect delivery address
- 📦 **Order Management**: Order history, status tracking
- ⭐ **Favorites**: Save favorite products
- 🎨 **Modern UI**: Dark theme, smooth animations

## 🚀 Enhanced Payment Integration

### Multiple Payment Methods

This app now supports three comprehensive payment methods with full order management:

### 🔵 Stripe Payment Sheet Integration

**Features:**
- ✅ Latest Stripe Payment Sheet with 3D Secure
- ✅ Multiple payment methods (Visa, Mastercard, Amex, Apple Pay, Google Pay)
- ✅ Secure customer management and tokenization
- ✅ Real-time payment confirmation
- ✅ International card support

**Implementation:**
- Payment Sheet with coffee-themed dark UI
- Automatic payment method detection
- Customer billing information pre-fill
- Webhook support for payment confirmation

### 🟣 MoMo Wallet Integration

**Features:**
- ✅ Vietnamese digital wallet integration
- ✅ Deep linking to MoMo app
- ✅ VND currency with USD conversion
- ✅ QR code payment fallback
- ✅ Real-time payment verification via IPN

**Implementation:**
- MoMo branded payment option
- App-to-app payment flow
- Payment status verification
- Automatic order confirmation

### 🟡 Enhanced Cash on Delivery

**Features:**
- ✅ Vietnamese phone number validation
- ✅ Comprehensive address collection
- ✅ GPS location integration
- ✅ Delivery area validation (20km radius)
- ✅ Delivery fee calculation
- ✅ Immediate order confirmation

**Implementation:**
- Address autocomplete with GPS
- Delivery distance and time estimation
- Phone number format validation
- COD-specific order flow validation

## 📱 Getting Started

### Prerequisites

- React Native development environment
- Firebase project setup
- Stripe account (for card payments)
- MoMo Business account (for Vietnamese payments)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd TheCoffee

# Install dependencies
npm install

# iOS specific (if targeting iOS)
cd ios && pod install && cd ..

# Start the development server
npx react-native start

# Run on device/simulator
npx react-native run-ios     # for iOS
npx react-native run-android # for Android
```

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication, Firestore, and Storage
3. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
4. Update `firebaseconfig.js` with your configuration

### Environment Configuration

Create a `.env` file in the root directory:

```env
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# MoMo Configuration (for backend)
MOMO_PARTNER_CODE=...
MOMO_ACCESS_KEY=...
MOMO_SECRET_KEY=...
MOMO_REDIRECT_URL=...
MOMO_IPN_URL=...
```

## 🔧 Backend Requirements

For production use, you'll need to implement backend endpoints for:

### Stripe Endpoints
- `POST /api/stripe/create-customer`
- `POST /api/stripe/create-ephemeral-key`
- `POST /api/stripe/create-payment-intent`

### MoMo Endpoints
- `POST /api/momo/create-payment`
- `POST /api/momo/check-payment-status`

See `checkFirestoreData.js` for complete implementation examples.

## 📱 Stripe Setup for iOS

Add to your `Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>thecoffee.stripe</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>thecoffee</string>
    </array>
  </dict>
</array>
```

## 📱 Stripe Setup for Android

Add to your `android/app/src/main/AndroidManifest.xml`:

```xml
<activity
  android:name="com.stripe.android.paymentsheet.PaymentSheetActivity"
  android:exported="false"
  android:theme="@style/Theme.PaymentSheet" />
```

## 🔒 Security Notes

- **Never expose secret keys** in your frontend code
- **Always validate payments** on your backend
- **Use HTTPS** for all payment communications
- **Implement webhook validation** for payment confirmations
- **Follow PCI compliance** guidelines for card data handling

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── PaymentMethod.tsx          # Payment method selection
│   └── OrderConfirmationModal.tsx # Order confirmation
├── screens/            # Application screens
│   └── PaymentScreen.tsx         # Main payment interface
├── services/           # Business logic
│   ├── firebaseServices.ts      # Firebase & payment services
│   └── locationService.ts       # Location utilities
├── store/              # State management
│   └── firebaseStore.ts         # Zustand store
└── theme/              # Design tokens
```

## 💡 Payment Flow

1. **Cart Review**: User reviews items and proceeds to checkout
2. **Profile Validation**: System checks delivery address completeness
3. **Payment Method Selection**: User chooses between Stripe, MoMo, or COD
4. **Payment Processing**:
   - **Stripe**: Payment Sheet with 3D Secure
   - **MoMo**: Deep link to MoMo app
   - **COD**: Immediate order confirmation
5. **Order Confirmation**: Success screen with order details
6. **Order Tracking**: Real-time status updates

## 🧪 Testing

### Stripe Test Cards
- `4242424242424242` - Successful payment
- `4000002500003155` - Requires 3D Secure
- `4000000000009995` - Declined card

### MoMo Testing
- Use MoMo's sandbox environment
- Download MoMo test app for testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues related to:
- **Stripe Integration**: Check [Stripe Documentation](https://docs.stripe.com/payments/accept-a-payment?platform=react-native)
- **MoMo Integration**: Visit [MoMo Developers](https://developers.momo.vn/)
- **Firebase**: See [Firebase Documentation](https://firebase.google.com/docs)

## 🔄 Version History

- **v1.0.0**: Initial release with basic coffee shop functionality
- **v2.0.0**: Added Stripe Payment Sheet integration
- **v2.1.0**: Added MoMo Wallet support
- **v2.2.0**: Added Cash on Delivery option

---

Built with ❤️ using React Native, Firebase, and Stripe.
