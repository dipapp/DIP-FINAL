import { NextResponse } from 'next/server';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(request: Request) {
  try {
    const { userId, vehicleId, email, name } = await request.json();
    console.log('🚀 Creating subscription payment');
    
    // Validate Price ID exists
    if (!process.env.STRIPE_PRICE_ID) {
      console.error('❌ STRIPE_PRICE_ID environment variable is not set');
      return NextResponse.json({ error: 'Stripe configuration error' }, { status: 500 });
    }
    
    console.log('🔍 Using Price ID:', process.env.STRIPE_PRICE_ID);

    // Step 1: Create/find customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customer = customers.data[0];
    
    if (!customer) {
      customer = await stripe.customers.create({ 
        email, 
        name: name || 'DIP Member' 
      });
      console.log('✅ Created new customer:', customer.id);
    } else {
      console.log('✅ Found existing customer:', customer.id);
    }

    // Step 2: Create a PaymentIntent for the first month's payment ($20)
    // The subscription will be created by the webhook after payment succeeds
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000, // $20.00 in cents
      currency: 'usd',
      customer: customer.id,
      setup_future_usage: 'off_session', // Save payment method for future subscription charges
      metadata: {
        userId,
        vehicleId: vehicleId || '',
        platform: 'iOS',
        type: 'subscription_first_payment',
        priceId: process.env.STRIPE_PRICE_ID, // Pass price ID for webhook to create subscription
      },
    });
    
    console.log('✅ Created PaymentIntent:', paymentIntent.id);
    console.log('🔗 Customer ID:', customer.id);
    console.log('💰 Amount: $20.00');

    // Return the client secret for the frontend to confirm payment
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
