import { Alert } from 'react-native';
import {
  initPaymentSheet,
  presentPaymentSheet,
  createToken,
} from '@stripe/stripe-react-native';
import { addOrder, Order } from './firebaseServices';
import authService from './authService';

// Constants for payment configuration
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RX1WA7wRtne0I6D93hoCGp1Rc7TCyTSpEPociAUft1Jpb3CW7xcGPgyxcbm3HU08UJqhdDgqBlV0VMlMlXWbQjE003TZH52Cg';
export const BACKEND_URL = 'http://192.168.90.33:3000'; // Local development server

export interface PaymentDetails {
  paymentMethod: 'stripe' | 'momo' | 'cash';
  amount: number;
  currency: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  orderItems: any[];
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  error?: string;
  requiresAction?: boolean;
  redirectUrl?: string;
}

// Enhanced Order Status Management
export type OrderStatus =
  | 'pending'       // Just created, awaiting payment
  | 'paid'          // Payment confirmed
  | 'confirmed'     // Order confirmed (for COD or after payment)
  | 'preparing'     // Coffee is being prepared
  | 'ready'         // Ready for pickup/delivery
  | 'shipped'       // Out for delivery
  | 'delivered'     // Successfully delivered
  | 'cancelled'     // Order cancelled
  | 'failed';       // Payment failed

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface StripeCustomer {
  id: string;
  ephemeralKey: string;
}

class PaymentService {
  private isInitialized = false;

  // Initialize Stripe
  async initializeStripe(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Stripe is initialized in App.tsx through StripeProvider
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      throw error;
    }
  }

  // Create Stripe Payment Intent on backend
  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    customerId?: string
  ): Promise<PaymentIntent> {
    try {
      const response = await fetch(`${BACKEND_URL}/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          customerId: customerId,
          metadata: {
            coffee_order: 'true'
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  // Create or get Stripe customer
  async createStripeCustomer(
    email: string,
    name: string,
    phone?: string
  ): Promise<StripeCustomer> {
    try {
      const response = await fetch(`${BACKEND_URL}/create-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          phone,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create customer');
      }
      return {
        id: data.customer.id,
        ephemeralKey: '', // We don't need ephemeral key for basic implementation
      };
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  // Process Stripe Payment
  async processStripePayment(paymentDetails: PaymentDetails): Promise<PaymentResult> {
    try {
      await this.initializeStripe();

      // Create customer
      const customer = await this.createStripeCustomer(
        paymentDetails.customerInfo.email,
        paymentDetails.customerInfo.name,
        paymentDetails.customerInfo.phone
      );

      // Create payment intent
      const paymentIntent = await this.createPaymentIntent(
        paymentDetails.amount,
        paymentDetails.currency.toLowerCase(),
        customer.id
      );

      // Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'The Coffee House',
        paymentIntentClientSecret: paymentIntent.client_secret,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: paymentDetails.customerInfo.name,
          email: paymentDetails.customerInfo.email,
          phone: paymentDetails.customerInfo.phone,
        },
        appearance: {
          colors: {
            primary: '#D17842',
            background: '#0C0F14',
            componentBackground: '#252A32',
            componentBorder: '#252A32',
            componentDivider: '#252A32',
            primaryText: '#FFFFFF',
            secondaryText: '#AEAEAE',
            componentText: '#FFFFFF',
            placeholderText: '#AEAEAE',
          },
        },
        returnURL: 'thecoffee://stripe-redirect',
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          return {
            success: false,
            error: 'Payment cancelled by user',
          };
        }
        throw new Error(presentError.message);
      }

      // Payment successful
      return {
        success: true,
        paymentId: paymentIntent.id,
      };

    } catch (error: any) {
      console.error('Stripe payment error:', error);
      return {
        success: false,
        error: error.message || 'Payment failed',
      };
    }
  }

  // Process MoMo Payment
  async processMoMoPayment(paymentDetails: PaymentDetails): Promise<PaymentResult> {
    try {
      // Convert USD to VND (approximate rate: 1 USD = 24,000 VND)
      const vndAmount = Math.round(paymentDetails.amount * 24000);

      // Ensure minimum amount (MoMo requires minimum 1,000 VND)
      const finalAmount = Math.max(vndAmount, 1000);

      const orderId = 'COFFEE_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

      console.log('Creating MoMo payment with:', {
        usdAmount: paymentDetails.amount,
        vndAmount: finalAmount,
        orderId
      });

      const requestBody = {
        amount: finalAmount,
        orderInfo: `The Coffee House - ${paymentDetails.orderItems.length} items`,
        orderId: orderId,
        redirectUrl: 'thecoffee://momo-success',
        ipnUrl: `${BACKEND_URL}/momo/ipn`,
        extraData: {
          customerInfo: paymentDetails.customerInfo,
          orderItems: paymentDetails.orderItems.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.prices?.[0]?.quantity || 1,
            price: item.prices?.[0]?.price || '0.00'
          })),
          originalAmount: paymentDetails.amount,
          currency: paymentDetails.currency
        }
      };

      console.log('MoMo request body:', requestBody);

      const response = await fetch(`${BACKEND_URL}/momo/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log('MoMo response status:', response.status);
      console.log('MoMo response text:', responseText);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error('MoMo API error details:', errorData);
        } catch (parseError) {
          console.error('Could not parse error response:', responseText);
        }
        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);
      console.log('MoMo response data:', data);

      if (data.success) {
        return {
          success: true,
          paymentId: data.orderId,
          redirectUrl: data.payUrl || data.deeplink,
          requiresAction: true,
        };
      } else {
        throw new Error(data.error || data.localMessage || 'MoMo payment creation failed');
      }
    } catch (error: any) {
      console.error('MoMo payment error:', error);
      return {
        success: false,
        error: error.message || 'MoMo payment failed',
      };
    }
  }

  // Process Cash on Delivery
  async processCashOnDelivery(paymentDetails: PaymentDetails): Promise<PaymentResult> {
    try {
      // Validate required information for COD
      const { customerInfo } = paymentDetails;

      if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
        return {
          success: false,
          error: 'Name, phone number, and address are required for Cash on Delivery',
        };
      }

      // Phone validation (basic Vietnamese phone number format)
      const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8,9}$/;
      if (!phoneRegex.test(customerInfo.phone.replace(/\s/g, ''))) {
        return {
          success: false,
          error: 'Please enter a valid Vietnamese phone number',
        };
      }

      // Generate COD order ID
      const codOrderId = `COD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        paymentId: codOrderId,
      };
    } catch (error: any) {
      console.error('COD processing error:', error);
      return {
        success: false,
        error: error.message || 'Failed to process Cash on Delivery order',
      };
    }
  }

  // Main payment processing method
  async processPayment(paymentDetails: PaymentDetails): Promise<PaymentResult> {
    try {
      let result: PaymentResult;

      switch (paymentDetails.paymentMethod) {
        case 'stripe':
          result = await this.processStripePayment(paymentDetails);
          break;
        case 'momo':
          result = await this.processMoMoPayment(paymentDetails);
          break;
        case 'cash':
          result = await this.processCashOnDelivery(paymentDetails);
          break;
        default:
          throw new Error('Invalid payment method');
      }

      return result;
    } catch (error: any) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        error: error.message || 'Payment processing failed',
      };
    }
  }

  // Verify payment status (for async payments like MoMo)
  async verifyPaymentStatus(paymentId: string, method: string): Promise<PaymentResult> {
    try {
      console.log('Verifying payment:', { paymentId, method });

      if (method === 'momo') {
        // For MoMo, we need both orderId and requestId
        // Extract requestId from paymentId if it contains it, or generate one
        const requestId = paymentId + Date.now();

        const response = await fetch(`${BACKEND_URL}/momo/verify-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: paymentId,
            requestId: requestId
          }),
        });

        const responseText = await response.text();
        console.log('MoMo verify response status:', response.status);
        console.log('MoMo verify response text:', responseText);

        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            // Response is not JSON
          }
          throw new Error(errorMessage);
        }

        const data = JSON.parse(responseText);
        console.log('MoMo verify data:', data);

        return {
          success: data.success && data.resultCode === 0,
          paymentId: data.paymentId || paymentId,
          error: data.success ? undefined : (data.message || 'Payment verification failed'),
        };
      } else {
        // For other payment methods (Stripe, etc.)
        const endpoint = `/api/${method}/verify-payment/${paymentId}`;
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
          success: data.success,
          paymentId: data.paymentId,
          error: data.error,
        };
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        error: error.message || 'Payment verification failed',
      };
    }
  }

  // Sanitize cart items to ensure Firebase compatibility
  private sanitizeCartItems(cartItems: any[]): any[] {
    return cartItems.map(item => {
      // Clean and ensure all required fields are present
      const sanitizedItem: any = {
        id: item.id || '',
        name: item.name || '',
        description: item.description || '',
        roasted: item.roasted || '',
        imageUrlSquare: item.imageUrlSquare || item.imagelink_square || '',
        imageUrlPortrait: item.imageUrlPortrait || item.imagelink_portrait || '',
        ingredients: item.ingredients || '',
        special_ingredient: item.special_ingredient || '',
        prices: (item.prices || []).map((price: any) => ({
          size: price.size || '',
          price: price.price || '0.00',
          currency: price.currency || '$',
          quantity: price.quantity || 1,
        })),
        average_rating: item.average_rating || 0,
        ratings_count: item.ratings_count || '0',
        favourite: item.favourite || false,
        type: item.type || 'Coffee',
        index: item.index || 0,
      };

      // Remove any undefined values
      Object.keys(sanitizedItem).forEach(key => {
        if (sanitizedItem[key] === undefined) {
          delete sanitizedItem[key];
        }
      });

      return sanitizedItem;
    });
  }

  // Create order with proper status
  async createOrderWithPayment(
    paymentDetails: PaymentDetails,
    paymentResult: PaymentResult,
    userId: string
  ): Promise<string> {
    try {
      let orderStatus: OrderStatus;

      // Determine initial order status based on payment method and result
      if (paymentDetails.paymentMethod === 'cash') {
        orderStatus = 'confirmed'; // COD orders are immediately confirmed
      } else if (paymentResult.success && !paymentResult.requiresAction) {
        orderStatus = 'paid'; // Online payments that are completed
      } else if (paymentResult.requiresAction) {
        orderStatus = 'pending'; // Payments requiring additional action (like MoMo redirect)
      } else {
        orderStatus = 'failed'; // Failed payments
      }

      // Sanitize cart items to prevent Firebase undefined value errors
      const sanitizedItems = this.sanitizeCartItems(paymentDetails.orderItems);

      const orderData: Omit<Order, 'id'> = {
        userId: userId || 'default-user',
        items: sanitizedItems,
        totalAmount: paymentDetails.amount,
        paymentMethod: paymentDetails.paymentMethod,
        orderDate: new Date(),
        status: orderStatus,
        deliveryAddress: paymentDetails.customerInfo.address || '',
        paymentId: paymentResult.paymentId || null,
        customerInfo: {
          name: paymentDetails.customerInfo.name || '',
          email: paymentDetails.customerInfo.email || '',
          phone: paymentDetails.customerInfo.phone || '',
        },
      };

      // Create order in main orders collection
      const orderId = await addOrder(orderData);

      // Also add the complete order to the user's orders subcollection and orderHistory
      if (userId && userId !== 'default-user') {
        try {
          await authService.addOrderToUserCollection(userId, orderId, {
            ...orderData,
            id: orderId,
          });
          console.log(`✅ Order ${orderId} added to user ${userId} orders subcollection and history`);
        } catch (userUpdateError) {
          console.error('⚠️ Failed to update user order collection:', userUpdateError);
          // Don't throw here - the order was created successfully, this is just additional data
        }
      }

      return orderId;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Update order status (to be called by admin or webhook)
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status,
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }
}

export default new PaymentService(); 