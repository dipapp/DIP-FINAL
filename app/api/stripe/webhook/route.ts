import { NextResponse } from 'next/server';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    console.log('✅ Webhook received:', event.type);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      console.log('💰 Payment succeeded:', paymentIntent.id);
      
      const metadata = paymentIntent.metadata;
      if (metadata.subscriptionPrice) {
        console.log('🚀 Creating subscription from payment');
        
        const subscription = await stripe.subscriptions.create({
          customer: paymentIntent.customer,
          items: [{ price: metadata.subscriptionPrice }],
          default_payment_method: paymentIntent.payment_method,
          metadata: {
            userId: metadata.userId,
            vehicleId: metadata.vehicleId,
            platform: metadata.platform,
            paymentIntentId: paymentIntent.id,
          },
        });
        
        console.log('✅ Subscription created:', subscription.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}