import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: Request) {
  try {
    const { userId, vehicleId, email, name } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    console.log('🚀 Creating subscription for:', { userId, vehicleId, email });

    // Step 1: Create or retrieve Stripe customer
    let customer;
    
    const existingCustomers = await stripe.customers.list({
      limit: 1,
      email: email,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log('✅ Found existing customer:', customer.id);
    } else {
      customer = await stripe.customers.create({
        email: email,
        name: name || 'DIP Member',
        metadata: {
          userId: userId,
          vehicleId: vehicleId || '',
          platform: 'iOS',
        },
      });
      console.log('✅ Created new customer:', customer.id);
    }

    // Step 2: Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price: process.env.STRIPE_PRICE_ID!,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: userId,
        vehicleId: vehicleId || '',
        platform: 'iOS',
      },
    });

    console.log('✅ Created subscription:', subscription.id);

    const paymentIntent = subscription.latest_invoice.payment_intent as Stripe.PaymentIntent;
    const clientSecret = paymentIntent.client_secret;

    return NextResponse.json({
      clientSecret: clientSecret,
      subscriptionId: subscription.id,
      customerId: customer.id,
      status: subscription.status,
    });

  } catch (error: any) {
    console.error('❌ Subscription creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
