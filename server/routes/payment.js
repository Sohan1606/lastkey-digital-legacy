const express = require('express');
const router = express.Router();
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.log('⚠️ Stripe not configured - payment disabled');
}
const { protect } = require('../middleware/auth');

router.post('/create-checkout-session', protect, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        error: 'Payment service is currently disabled. Please configure STRIPE_SECRET_KEY.'
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'LastKey Premium',
            },
            unit_amount: 49900, // $49.90
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/dashboard?success=true`,
      cancel_url: `${req.headers.origin}/dashboard?canceled=true`,
      metadata: {
        userId: req.user._id.toString(),
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

