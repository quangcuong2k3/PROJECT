# Payment Server Setup Guide

## Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

## Quick Start

### 1. Install Node.js Dependencies
```bash
# In the root directory of your project
npm install express cors stripe axios dotenv nodemon
```

### 2. Set Up Environment Variables
Create a `.env` file in the root directory with your API keys:

```bash
# Copy the example file
cp server.env.example .env
```

Edit the `.env` file with your actual API keys:
- **Stripe**: Get your keys from https://dashboard.stripe.com/apikeys
- **MoMo**: Get your credentials from https://developers.momo.vn/

For testing, you can use the MoMo test credentials provided in the example file.

### 3. Start the Payment Server
```bash
# Start the server (development mode with auto-restart)
node server.js

# OR with nodemon for auto-restart during development
npx nodemon server.js
```

The server will start on `http://localhost:3000`

### 4. Test the Server
Open your browser and go to `http://localhost:3000` - you should see:
```json
{"message": "Coffee House Payment Server is running!"}
```

### 5. Start Your React Native App
In a new terminal, start your React Native app:
```bash
# For iOS
npx react-native run-ios

# For Android
npx react-native run-android

# For Expo
npm start
```

## Testing Payments

### Stripe Test Cards
Use these test card numbers:
- **Success**: 4242 4242 4242 4242
- **Declined**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

### MoMo Testing
The server is configured for MoMo test environment. Test payments will work in the MoMo app sandbox.

## Troubleshooting

### Network Request Failed Error
If you see "Network request failed", check:
1. Server is running on `http://localhost:3000`
2. Your React Native app can reach localhost (use your computer's IP for physical devices)
3. CORS is properly configured

### For Physical Devices
If testing on a physical device, update the `BACKEND_URL` in `src/services/paymentService.ts`:
```javascript
export const BACKEND_URL = 'http://YOUR_COMPUTER_IP:3000';
```

Replace `YOUR_COMPUTER_IP` with your computer's local IP address (e.g., `192.168.1.100`).

### API Key Issues
Make sure your `.env` file has the correct API keys and is in the root directory of your project.

## Server Endpoints

### Stripe
- `POST /create-customer` - Create Stripe customer
- `POST /create-payment-intent` - Create payment intent
- `POST /confirm-payment` - Confirm payment status
- `POST /stripe/webhook` - Stripe webhook handler

### MoMo
- `POST /momo/create-payment` - Create MoMo payment
- `POST /momo/verify-payment` - Verify payment status
- `POST /momo/ipn` - MoMo IPN webhook handler

### Orders
- `POST /orders` - Create order
- `PUT /orders/:orderId/status` - Update order status 