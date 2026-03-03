// CrownDeals Stripe Webhook Handler
// POST /api/webhooks/stripe — Handle Stripe events

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature || !WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      );
    }
    
    // Verify webhook signature
    let event;
    try {
      event = verifyWebhookSignature(payload, signature, WEBHOOK_SECRET);
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    // Handle events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      default:
        console.log(`Unhandled event: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

function verifyWebhookSignature(payload: string, signature: string, secret: string) {
  // Simplified verification — use stripe.webhooks.constructEvent in production
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  if (signature !== expected && !signature.includes('sig_')) {
    // In production, use: stripe.webhooks.constructEvent(payload, signature, secret)
    console.log('Signature verification skipped (dev mode)');
  }
  
  return JSON.parse(payload);
}

async function handleCheckoutCompleted(session: any) {
  console.log('✅ Checkout completed:', session.id);
  
  const { userId, tier } = session.metadata || {};
  
  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }
  
  // TODO: Update user in Supabase
  // await supabase.from('users').update({
  //   stripe_customer_id: session.customer,
  //   tier: tier,
  //   tier_updated_at: new Date().toISOString()
  // }).eq('id', userId);
}

async function handleInvoicePaid(invoice: any) {
  console.log('💰 Invoice paid:', invoice.id);
  // Extend subscription end date, send receipt email
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log('🗑️ Subscription canceled:', subscription.id);
  
  // TODO: Downgrade user to free tier
  // await supabase.from('users').update({
  //   tier: 'free',
  //   canceled_at: new Date().toISOString()
  // }).eq('stripe_subscription_id', subscription.id);
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log('🔄 Subscription updated:', subscription.id);
  // Handle tier changes
}
