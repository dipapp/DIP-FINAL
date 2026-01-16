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
      
      // NEW FLOW: PaymentIntent was created to pay a subscription's first invoice
      if (metadata.type === 'subscription_first_payment' && metadata.invoice_id && metadata.subscription_id) {
        console.log('🔗 Payment is for subscription first invoice');
        console.log('📄 Invoice ID:', metadata.invoice_id);
        console.log('📋 Subscription ID:', metadata.subscription_id);
        
        try {
          // Attach the payment method to the customer for future subscription payments
          if (paymentIntent.payment_method) {
            await stripe.paymentMethods.attach(paymentIntent.payment_method, {
              customer: paymentIntent.customer,
            });
            console.log('✅ Payment method attached to customer');
            
            // Set as default payment method for the subscription
            await stripe.subscriptions.update(metadata.subscription_id, {
              default_payment_method: paymentIntent.payment_method,
            });
            console.log('✅ Payment method set as default for subscription');
          }
          
          // Pay the invoice to activate the subscription
          const invoice = await stripe.invoices.pay(metadata.invoice_id, {
            paid_out_of_band: true, // Mark as paid (payment already collected via PaymentIntent)
          });
          console.log('✅ Invoice marked as paid:', invoice.id);
          console.log('✅ Invoice status:', invoice.status);
          
          // The subscription should now be active
          const subscription = await stripe.subscriptions.retrieve(metadata.subscription_id);
          console.log('✅ Subscription status after payment:', subscription.status);
          
        } catch (err: any) {
          console.error('❌ Error activating subscription:', err.message);
        }
      }
      // LEGACY FLOW: Old PaymentIntent that needs a subscription created (for backward compatibility)
      // This should NOT be triggered by new payments - remove this block after verifying new flow works
      else if (metadata.subscriptionPrice && !metadata.subscription_id) {
        console.log('⚠️ Legacy flow: Creating subscription from payment (should not happen with new code)');
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