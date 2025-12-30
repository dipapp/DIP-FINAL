import { NextResponse } from 'next/server';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(request: Request) {
  try {
    const { userId, vehicleId, email, name } = await request.json();

    console.log('🚀 Creating subscription');

    // Create customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0] || await stripe.customers.create({ email, name: name || 'DIP Member' });

    // Create subscription
    const subscription: any = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_ID }],
      payment_behavior: 'default_incomplete',
      payment_settings: { payment_method_types: ['card'] },
      expand: ['latest_invoice.payment_intent'],
    });

    // Extract client secret using any types
    const clientSecret = subscription?.latest_invoice?.payment_intent?.client_secret;

    console.log('✅ Got client secret:', !!clientSecret);

    return NextResponse.json({
      clientSecret,
      subscriptionId: subscription.id,
      customerId: customer.id,
      status: subscription.status,
    });
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}