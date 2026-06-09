const express = require('express');
const router = express.Router();

const { createCheckoutSession } = require('../stripe');

/**
 * POST /api/create-checkout-session
 * Body: { plan: 'monthly' | 'yearly' }
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({
        error: 'Invalid plan. Must be "monthly" or "yearly".',
      });
    }

    const session = await createCheckoutSession(plan);

    res.json({ url: session.url });
  } catch (err) {
    console.error('[Checkout Error]', err.message);
    res.status(500).json({
      error: 'Failed to create checkout session. Is Stripe configured?',
    });
  }
});

module.exports = router;