const express = require('express');
const router = express.Router();
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.log('⚠️ Stripe not configured - payment disabled');
}
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// Subscription tiers configuration
const SUBSCRIPTION_TIERS = {
  guardian: {
    name: 'Guardian',
    priceId: process.env.STRIPE_GUARDIAN_PRICE_ID,
    amount: 499, // $4.99
    features: ['5 Loved Ones', '20 Time Letters', '50 Memory Items', 'WhatsApp Alerts']
  },
  legacy_pro: {
    name: 'Legacy Pro',
    priceId: process.env.STRIPE_LEGACY_PRO_PRICE_ID,
    amount: 1299, // $12.99
    features: ['Unlimited Everything', 'AI Voice Messages', 'Memoir AI', 'Life Timeline']
  }
};

router.post('/create-checkout-session', protect, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        error: 'Payment service is currently disabled. Please configure STRIPE_SECRET_KEY.'
      });
    }

    const { tier = 'guardian' } = req.body;
    const subscriptionConfig = SUBSCRIPTION_TIERS[tier];
    
    if (!subscriptionConfig) {
      return res.status(400).json({
        error: 'Invalid subscription tier'
      });
    }

    // Create or retrieve Stripe customer
    let customerId = req.user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        metadata: {
          userId: req.user._id.toString()
        }
      });
      customerId = customer.id;
      
      // Save customer ID to user
      await User.findByIdAndUpdate(req.user._id, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: subscriptionConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing?canceled=true`,
      metadata: {
        userId: req.user._id.toString(),
        tier: tier
      },
      subscription_data: {
        metadata: {
          userId: req.user._id.toString(),
          tier: tier
        }
      }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!stripe) {
      console.log('⚠️ Stripe webhook received but Stripe not configured');
      return res.status(400).json({ error: 'Stripe not configured' });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.log('⚠️ STRIPE_WEBHOOK_SECRET not configured');
      return res.status(400).json({ error: 'Webhook secret not configured' });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.log(`⚠️ Webhook signature verification failed:`, err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    console.log(`🔔 Stripe webhook received: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const { userId, tier } = subscription.metadata;
        
        if (userId && tier) {
          await User.findByIdAndUpdate(userId, {
            isPremium: true,
            subscriptionTier: tier,
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status
          });
          console.log(`✅ User ${userId} subscribed to ${tier} plan`);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const { userId } = subscription.metadata;
        
        if (userId) {
          await User.findByIdAndUpdate(userId, {
            isPremium: false,
            subscriptionTier: 'free',
            subscriptionStatus: 'canceled'
          });
          console.log(`✅ User ${userId} subscription canceled`);
        }
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log(`💰 Payment succeeded for customer: ${invoice.customer}`);
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`❌ Payment failed for customer: ${invoice.customer}`);
        // Update user subscription status
        if (invoice.subscription) {
          await User.updateOne(
            { stripeSubscriptionId: invoice.subscription },
            { subscriptionStatus: 'past_due' }
          );
        }
        break;
      }
      
      default:
        console.log(`🤷 Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Cancel subscription
router.post('/cancel-subscription', protect, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        error: 'Payment service is currently disabled'
      });
    }

    const user = req.user;
    if (!user.stripeSubscriptionId) {
      return res.status(400).json({
        error: 'No active subscription found'
      });
    }

    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    await User.findByIdAndUpdate(user._id, {
      subscriptionStatus: 'canceled'
    });

    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      cancelAt: new Date(subscription.cancel_at * 1000)
    });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get subscription status
router.get('/subscription-status', protect, async (req, res) => {
  try {
    const user = req.user;
    
    let subscriptionDetails = null;
    if (user.stripeSubscriptionId && stripe) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        subscriptionDetails = {
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          tier: user.subscriptionTier
        };
      } catch (err) {
        console.error('Failed to retrieve subscription:', err);
      }
    }

    res.json({
      subscriptionTier: user.subscriptionTier,
      isPremium: user.isPremium,
      subscriptionStatus: user.subscriptionStatus,
      stripeSubscription: subscriptionDetails
    });
  } catch (err) {
    console.error('Subscription status error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

