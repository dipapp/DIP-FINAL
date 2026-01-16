import { NextResponse } from 'next/server';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(request: Request) {
  try {
    const { userId, vehicleId, email, name } = await request.json();
    console.log('🚀 Creating subscription');
    
    // Validate Price ID exists
    if (!process.env.STRIPE_PRICE_ID) {
      console.error('❌ STRIPE_PRICE_ID environment variable is not set');
      return NextResponse.json({ error: 'Stripe configuration error' }, { status: 500 });
    }
    
    console.log('🔍 Using Price ID:', process.env.STRIPE_PRICE_ID);

    // Step 1: Create/find customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0] || await stripe.customers.create({ 
      email, 
      name: name || 'DIP Member' 
    });

    // Step 2: Create subscription with payment_behavior: 'default_incomplete'
    // This automatically creates a payment intent for the first invoice
    const subscription: any = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price: process.env.STRIPE_PRICE_ID, // The $20/month price ID
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId,
        vehicleId: vehicleId || '',
        platform: 'iOS',
      },
    });

    console.log('✅ Created Subscription:', subscription.id);
    console.log('🔍 Subscription status:', subscription.status);
    console.log('🔍 Latest invoice exists:', !!subscription.latest_invoice);
    console.log('🔍 Payment intent exists:', !!subscription.latest_invoice?.payment_intent);
    
    // Check if we have the necessary payment intent data
    const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
    
    if (!clientSecret) {
      console.error('❌ No payment intent created for subscription. Check Price ID configuration.');
      console.error('Latest invoice:', subscription.latest_invoice);
      return NextResponse.json({ 
        error: 'No payment intent created for subscription. Please check that the Price ID is configured for recurring billing.' 
      }, { status: 500 });
    }

    console.log('✅ Client secret:', !!clientSecret);

    // Return the client secret from the subscription's first invoice payment intent
    return NextResponse.json({
      clientSecret: clientSecret,
      subscriptionId: subscription.id,
      customerId: customer.id,
    });
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}