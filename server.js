const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

// Initialize Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'application/webhook' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Coffee House Payment Server is running!' });
});

// Stripe Endpoints
app.post('/create-customer', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    console.log('Creating Stripe customer for:', { email, name });
    
    const customer = await stripe.customers.create({
      email,
      name,
    });
    
    console.log('Stripe customer created:', customer.id);
    
    res.json({ 
      success: true, 
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name
      }
    });
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'vnd', customerId, metadata } = req.body;
    
    console.log('Creating payment intent:', { amount, currency, customerId });
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Stripe expects integer
      currency,
      customer: customerId,
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    console.log('Payment intent created:', paymentIntent.id);
    
    res.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      }
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    console.log('Confirming payment:', paymentIntentId);
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    res.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      }
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// MoMo Endpoints
app.post('/momo/create-payment', async (req, res) => {
  try {
    const { amount, orderInfo, orderId, extraData, redirectUrl, ipnUrl } = req.body;
    
    console.log('Creating MoMo payment:', { amount, orderInfo, orderId });
    
    // MoMo configuration
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretkey = process.env.MOMO_SECRET_KEY;
    
    // Validate environment variables
    if (!partnerCode || !accessKey || !secretkey) {
      console.error('Missing MoMo credentials in environment variables');
      return res.status(500).json({
        success: false,
        error: 'MoMo payment configuration is incomplete. Please contact administrator.',
        details: {
          partnerCode: !!partnerCode,
          accessKey: !!accessKey,
          secretkey: !!secretkey
        }
      });
    }
    
    // Validate required parameters
    if (!amount || !orderInfo || !orderId || !redirectUrl || !ipnUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        required: ['amount', 'orderInfo', 'orderId', 'redirectUrl', 'ipnUrl']
      });
    }
    
    const requestId = orderId + new Date().getTime();
    const requestType = "captureWallet";
    const extraDataStr = extraData ? JSON.stringify(extraData) : "";
    
    // Validate amount is positive integer
    const validAmount = parseInt(amount);
    if (isNaN(validAmount) || validAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount. Amount must be a positive integer.',
        providedAmount: amount
      });
    }
    
    // Create signature - MoMo requires specific parameter order
    const rawSignature = `accessKey=${accessKey}&amount=${validAmount}&extraData=${extraDataStr}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto.createHmac('sha256', secretkey).update(rawSignature).digest('hex');
    
    console.log('=== Signature Debug ===');
    console.log('Secret Key Length:', secretkey.length);
    console.log('Raw Signature String:', rawSignature);
    console.log('Generated Signature:', signature);
    console.log('=====================');
    
    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount: validAmount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData: extraDataStr,
      requestType,
      signature,
      lang: 'vi'
    };
    
    console.log('=== MoMo Request Debug ===');
    console.log('Partner Code:', partnerCode);
    console.log('Access Key:', accessKey ? 'SET' : 'NOT SET');
    console.log('Secret Key:', secretkey ? 'SET' : 'NOT SET');
    console.log('Amount:', validAmount);
    console.log('Order ID:', orderId);
    console.log('Request ID:', requestId);
    console.log('Raw Signature String:', rawSignature);
    console.log('Generated Signature:', signature);
    console.log('Full Request Body:', JSON.stringify(requestBody, null, 2));
    console.log('========================');
    
    // Make request to MoMo
    const response = await axios.post('https://test-payment.momo.vn/v2/gateway/api/create', requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('=== MoMo API Response ===');
    console.log('Status Code:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    console.log('========================');
    
    if (response.data.resultCode === 0) {
      res.json({
        success: true,
        payUrl: response.data.payUrl,
        deeplink: response.data.deeplink,
        qrCodeUrl: response.data.qrCodeUrl,
        orderId: response.data.orderId,
        requestId: response.data.requestId,
        amount: response.data.amount
      });
    } else {
      console.error('MoMo payment creation failed with result code:', response.data.resultCode);
      console.error('MoMo error details:', response.data);
      res.status(400).json({
        success: false,
        error: response.data.message || 'MoMo payment creation failed',
        resultCode: response.data.resultCode,
        localMessage: response.data.localMessage,
        momoResponse: response.data // Include full response for debugging
      });
    }
  } catch (error) {
    console.error('Error creating MoMo payment:', error);
    
    // Handle specific axios errors
    if (error.response) {
      console.error('=== MoMo API Error Response ===');
      console.error('Error Status:', error.response.status);
      console.error('Error Headers:', error.response.headers);
      console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
      console.error('==============================');
      
      res.status(500).json({
        success: false,
        error: `MoMo API returned ${error.response.status}: ${error.response.data?.message || 'Unknown error'}`,
        momoErrorCode: error.response.status,
        momoErrorData: error.response.data
      });
    } else if (error.request) {
      console.error('No response from MoMo API - Request details:', error.request);
      res.status(502).json({
        success: false,
        error: 'No response from MoMo payment service. Please try again.'
      });
    } else {
      console.error('MoMo request setup error:', error.message);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Internal server error'
      });
    }
  }
});

app.post('/momo/verify-payment', async (req, res) => {
  try {
    const { orderId, requestId } = req.body;
    
    console.log('Verifying MoMo payment:', { orderId, requestId });
    
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretkey = process.env.MOMO_SECRET_KEY;
    
    // Validate environment variables
    if (!partnerCode || !accessKey || !secretkey) {
      return res.status(500).json({
        success: false,
        error: 'MoMo configuration is incomplete'
      });
    }
    
    // Validate required parameters
    if (!orderId || !requestId) {
      return res.status(400).json({
        success: false,
        error: 'Missing orderId or requestId'
      });
    }
    
    // Create signature for query
    const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${requestId}`;
    const signature = crypto.createHmac('sha256', secretkey).update(rawSignature).digest('hex');
    
    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      orderId,
      signature,
      lang: 'vi'
    };
    
    console.log('MoMo verify request:', requestBody);
    
    // Query payment status
    const response = await axios.post('https://test-payment.momo.vn/v2/gateway/api/query', requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('MoMo verification response:', response.data);
    
    res.json({
      success: response.data.resultCode === 0,
      resultCode: response.data.resultCode,
      message: response.data.message,
      transId: response.data.transId,
      amount: response.data.amount,
      payType: response.data.payType,
      paymentId: orderId
    });
  } catch (error) {
    console.error('Error verifying MoMo payment:', error);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: error.response.data?.message || 'MoMo verification API error',
        details: error.response.data
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Payment verification failed'
      });
    }
  }
});

// MoMo IPN endpoint (webhook)
app.post('/momo/ipn', (req, res) => {
  console.log('MoMo IPN received:', req.body);
  
  // Verify signature
  const {
    partnerCode,
    accessKey,
    requestId,
    amount,
    orderId,
    orderInfo,
    orderType,
    transId,
    message,
    localMessage,
    responseTime,
    errorCode,
    payType,
    extraData,
    signature
  } = req.body;
  
  const secretkey = process.env.MOMO_SECRET_KEY;
  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${errorCode}&transId=${transId}`;
  const computedSignature = crypto.createHmac('sha256', secretkey).update(rawSignature).digest('hex');
  
  if (signature === computedSignature && errorCode === 0) {
    console.log('MoMo payment successful:', { orderId, transId, amount });
    // Update order status in your database here
    res.status(200).json({ message: 'OK' });
  } else {
    console.log('MoMo payment failed or invalid signature:', { errorCode, message });
    res.status(400).json({ message: 'Invalid signature or payment failed' });
  }
});

// Stripe webhook endpoint
app.post('/stripe/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      // Update order status in your database here
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      // Update order status in your database here
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  res.json({ received: true });
});

// Order management endpoints
app.post('/orders', async (req, res) => {
  try {
    const orderData = req.body;
    console.log('Creating order:', orderData);
    
    // Here you would typically save to your database
    // For now, we'll just return success
    res.json({
      success: true,
      orderId: orderData.id || 'order_' + Date.now(),
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.put('/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    console.log(`Updating order ${orderId} status to ${status}`);
    
    // Here you would typically update in your database
    res.json({
      success: true,
      orderId,
      status,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Coffee House Payment Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}`);
  console.log(`💳 Stripe endpoints ready`);
  console.log(`📱 MoMo endpoints ready`);
  
  // Check environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️  STRIPE_SECRET_KEY not found in environment variables');
  }
  if (!process.env.MOMO_PARTNER_CODE) {
    console.warn('⚠️  MoMo credentials not found in environment variables');
  }
});

module.exports = app; 