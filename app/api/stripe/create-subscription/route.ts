import { NextResponse } from 'next/server';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(request: Request) {
  try {
    const { userId, vehicleId, email, name } = await request.json();
    console.log('🚀 Creating subscription');

    // Step 1: Create/find customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0] || await stripe.customers.create({ 
      email, 
      name: name || 'DIP Member' 
    });

    // Step 2: Create a PaymentIntent for the first $20 payment
    const paymentIntent: any = await stripe.paymentIntents.create({
      amount: 2000, // $20.00 in cents
      currency: 'usd',
      customer: customer.id,
      setup_future_usage: 'off_session', // Save for future charges
      metadata: {
        userId,
        vehicleId: vehicleId || '',
        platform: 'iOS',
        subscriptionPrice: process.env.STRIPE_PRICE_ID,
      },
    });

    console.log('✅ Created PaymentIntent:', paymentIntent.id);
    console.log('✅ Client secret:', !!paymentIntent.client_secret);

    // Return the client secret (subscription will be created via webhook after payment)
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id,
      paymentIntentId: paymentIntent.id,
      // Note: Subscription should be created via webhook after payment succeeds
    });
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}