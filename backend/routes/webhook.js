const express = require('express');
const router = express.Router();

const { handleWebhookEvent } = require('../stripe');

// Stripe webhook — needs raw body for signature verification
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // If webhook secret is configured, verify signature
  if (webhookSecret) {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('[Webhook] Signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      await handleWebhookEvent(event);
      res.json({ received: true });
    } catch (err) {
      console.error('[Webhook] Handler error:', err.message);
      res.status(500).send(`Webhook handler error: ${err.message}`);
    }
  } else {
    // No webhook secret — parse payload for development
    console.warn('⚠️  STRIPE_WEBHOOK_SECRET not set — skipping signature verification');
    try {
      const event = JSON.parse(req.body.toString());
      await handleWebhookEvent(event);
      res.json({ received: true });
    } catch (err) {
      console.error('[Webhook] Parse error:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
});

module.exports = router;