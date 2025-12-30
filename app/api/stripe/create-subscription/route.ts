import { NextResponse } from 'next/server';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(request: Request) {
  try {
    const { userId, vehicleId, email, name } = await request.json();

    console.log('🚀 Creating subscription');

    // Create customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0] || await stripe.customers.create({ email, name: name || 'DIP Member' });

    // Step 2: Create subscription with add_invoice_items
    const subscription: any = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_ID }],
      payment_behavior: 'default_incomplete',
      payment_settings: { 
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription'
      },
      metadata: { userId, vehicleId: vehicleId || '', platform: 'iOS' },
    });

    console.log('✅ Subscription created:', subscription.id);

    // Step 3: Get the invoice and manually create payment intent
    const invoiceId = typeof subscription.latest_invoice === 'string' 
      ? subscription.latest_invoice 
      : subscription.latest_invoice?.id;

    if (!invoiceId) {
      throw new Error('No invoice created');
    }

    // Finalize the invoice to create payment intent
    const invoice: any = await stripe.invoices.finalizeInvoice(invoiceId);
    console.log('✅ Invoice finalized:', invoice.id);
    console.log('✅ Payment intent:', invoice.payment_intent);

    // Now retrieve the payment intent
    const paymentIntent: any = await stripe.paymentIntents.retrieve(
      typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent.id
    );

    console.log('✅ Got client secret:', !!paymentIntent.client_secret);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
      customerId: customer.id,
      status: subscription.status,
    });
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}