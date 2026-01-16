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

    // Step 2: Create subscription with payment_behavior: 'default_incomplete'
    // Explicitly set payment_method_types to ensure a PaymentIntent is created
    const subscription: any = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price: process.env.STRIPE_PRICE_ID,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'], // Explicitly require card payment
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
    console.log('🔍 Latest invoice ID:', subscription.latest_invoice?.id);
    console.log('🔍 Latest invoice status:', subscription.latest_invoice?.status);
    console.log('🔍 Payment intent from subscription:', subscription.latest_invoice?.payment_intent?.id || 'none');
    
    // Get the client secret from the subscription's latest invoice payment intent
    let clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
    
    // If still no payment intent, the invoice might need to be retrieved separately
    if (!clientSecret && subscription.latest_invoice?.id) {
      console.log('🔧 Payment intent not in subscription response, retrieving invoice...');
      const invoice = await stripe.invoices.retrieve(subscription.latest_invoice.id, {
        expand: ['payment_intent']
      });
      console.log('🔍 Retrieved invoice payment_intent:', invoice.payment_intent?.id || 'none');
      clientSecret = invoice.payment_intent?.client_secret;
    }
    
    // If no PaymentIntent was created (customer has no payment method on file),
    // create ONE PaymentIntent specifically to pay this subscription's first invoice
    if (!clientSecret && subscription.latest_invoice) {
      console.log('🔧 No PaymentIntent from subscription - creating one to pay the invoice...');
      
      const invoice = subscription.latest_invoice;
      
      // Create a PaymentIntent linked to the subscription/invoice
      const paymentIntent = await stripe.paymentIntents.create({
        amount: invoice.amount_due, // $20.00 = 2000 cents
        currency: invoice.currency || 'usd',
        customer: customer.id,
        setup_future_usage: 'off_session', // Save payment method for future subscription charges
        metadata: {
          userId,
          vehicleId: vehicleId || '',
          platform: 'iOS',
          subscription_id: subscription.id,
          invoice_id: invoice.id,
          type: 'subscription_first_payment', // Flag for webhook to know this pays the invoice
        },
      });
      
      console.log('✅ Created PaymentIntent to pay invoice:', paymentIntent.id);
      console.log('🔗 Linked to subscription:', subscription.id);
      console.log('🔗 Linked to invoice:', invoice.id);
      
      clientSecret = paymentIntent.client_secret;
      
      // Return with metadata about the payment setup
      return NextResponse.json({
        clientSecret: clientSecret,
        subscriptionId: subscription.id,
        customerId: customer.id,
        invoiceId: invoice.id,
        paymentIntentId: paymentIntent.id,
      });
    }
    
    if (!clientSecret) {
      console.error('❌ Failed to create payment intent for subscription.');
      return NextResponse.json({ 
        error: 'Failed to create payment intent for subscription.' 
      }, { status: 500 });
    }

    console.log('✅ Client secret obtained successfully');

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
