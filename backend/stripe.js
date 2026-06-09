const { Stripe } = require('stripe');

// Initialize Stripe with secret key from env
let stripe = null;

function getStripe() {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      console.warn('⚠️  STRIPE_SECRET_KEY not set — Stripe calls will fail');
      return null;
    }
    stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
}

/**
 * Price IDs — these are the Stripe Price IDs for subscription products.
 * Currently using placeholder IDs. Replace with real IDs after creating products in Stripe Dashboard.
 */
const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_monthly_placeholder',
  yearly: process.env.STRIPE_PRICE_YEARLY || 'price_yearly_placeholder',
};

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Create a Stripe Checkout Session for a subscription
 * @param {'monthly'|'yearly'} plan 
 * @returns {Promise<{url: string, sessionId: string}>}
 */
async function createCheckoutSession(plan) {
  const s = getStripe();
  if (!s) throw new Error('Stripe not configured');

  const priceId = PRICE_IDS[plan];
  if (!priceId) throw new Error(`Invalid plan: ${plan}`);

  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${FRONTEND_URL}/payment/cancel`,
    subscription_data: {
      metadata: { plan },
    },
  });

  return { url: session.url, sessionId: session.id };
}

/**
 * Handle Stripe webhook events
 */
async function handleWebhookEvent(event) {
  const s = getStripe();
  if (!s) throw new Error('Stripe not configured');

  console.log(`[Webhook] Received event: ${event.type}`, event.id);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log(`✅ Checkout completed: ${session.id} — customer: ${session.customer}`);
      break;
    }
    case 'customer.subscription.created': {
      const subscription = event.data.object;
      console.log(`🆕 Subscription created: ${subscription.id} — status: ${subscription.status}`);
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      console.log(`🔄 Subscription updated: ${subscription.id} — status: ${subscription.status}`);
      break;
    }
    case 'invoice.paid': {
      const invoice = event.data.object;
      console.log(`💰 Invoice paid: ${invoice.id} — amount: ${invoice.amount_paid / 100} ${invoice.currency}`);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      console.log(`❌ Invoice payment failed: ${invoice.id}`);
      break;
    }
    default:
      console.log(`ℹ️  Unhandled event type: ${event.type}`);
  }
}

module.exports = { createCheckoutSession, handleWebhookEvent, PRICE_IDS };