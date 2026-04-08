import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Check, X, Crown, Sparkles, Zap, Shield, Heart, Star } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Pricing = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [loadingTier, setLoadingTier] = useState(null);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      icon: Shield,
      color: 'gray',
      features: [
        '2 Loved Ones',
        '3 Time Letters',
        '5 Memory Vault Items',
        'Basic Guardian Protocol',
        'Email Support'
      ],
      excludedFeatures: [
        'AI Voice Messages',
        'Life Timeline',
        'Memoir AI',
        'WhatsApp Alerts',
        'Priority Support'
      ],
      cta: 'Get Started',
      ctaAction: () => navigate('/register')
    },
    {
      id: 'guardian',
      name: 'Guardian',
      price: '$4.99',
      period: '/month',
      description: 'Most popular for families',
      icon: Crown,
      color: 'indigo',
      popular: true,
      features: [
        'Everything in Free',
        '5 Loved Ones',
        '20 Time Letters',
        '50 Memory Vault Items',
        'WhatsApp Alerts',
        'Advanced Guardian Protocol',
        'Email Support'
      ],
      excludedFeatures: [
        'AI Voice Messages',
        'Life Timeline',
        'Memoir AI'
      ],
      cta: user ? 'Upgrade Now' : 'Start Free Trial',
      ctaAction: () => handleSubscribe('guardian')
    },
    {
      id: 'legacy_pro',
      name: 'Legacy Pro',
      price: '$12.99',
      period: '/month',
      description: 'Complete digital legacy solution',
      icon: Sparkles,
      color: 'purple',
      featured: true,
      features: [
        'Everything in Guardian',
        'Unlimited Loved Ones',
        'Unlimited Time Letters',
        'Unlimited Memory Items',
        'AI Voice Messages',
        'Life Timeline',
        'Memoir AI',
        'WhatsApp & Telegram Alerts',
        'Priority Support',
        'Early Access to New Features'
      ],
      excludedFeatures: [],
      cta: user ? 'Go Pro' : 'Start Free Trial',
      ctaAction: () => handleSubscribe('legacy_pro')
    }
  ];

  const handleSubscribe = async (tier) => {
    if (!user) {
      navigate('/register');
      return;
    }

    setLoadingTier(tier);
    
    try {
      const response = await axios.post(
        `${API_BASE}/payment/create-checkout-session`,
        { tier },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error.response?.data?.error || 'Failed to start subscription');
    } finally {
      setLoadingTier(null);
    }
  };

  const getColorClasses = (color, type) => {
    const colors = {
      gray: {
        bg: 'bg-gray-50 dark:bg-gray-900/30',
        border: 'border-gray-200 dark:border-gray-700',
        text: 'text-gray-900 dark:text-gray-100',
        button: 'bg-gray-600 hover:bg-gray-700 text-white',
        featured: 'bg-gray-100 dark:bg-gray-800'
      },
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/30',
        border: 'border-indigo-200 dark:border-indigo-700',
        text: 'text-indigo-900 dark:text-indigo-100',
        button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        featured: 'bg-indigo-100 dark:bg-indigo-800'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/30',
        border: 'border-purple-200 dark:border-purple-700',
        text: 'text-purple-900 dark:text-purple-100',
        button: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white',
        featured: 'bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30'
      }
    };
    return colors[color]?.[type] || colors.gray[type];
  };

  return (
    <div className="page spatial-bg">
      <div className="stars" />
      <div className="container" style={{ padding: '80px 24px' }}>
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <Heart className="w-8 h-8 text-red-500" />
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Choose Your Legacy Plan
            </h1>
            <Heart className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Select the plan that best fits your needs. Start free, upgrade anytime. 
            Your love deserves to be preserved perfectly.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const colorClasses = getColorClasses(plan.color, 'bg');
            const borderClasses = getColorClasses(plan.color, 'border');
            const textClasses = getColorClasses(plan.color, 'text');
            const buttonClasses = getColorClasses(plan.color, 'button');
            const featuredClasses = getColorClasses(plan.color, 'featured');

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: plan.featured ? 1.05 : 1.02 }}
                className="glass"
                style={{ 
                  padding: 32, 
                  borderRadius: 24, 
                  border: plan.featured ? '2px solid var(--ion)' : '1px solid var(--glass-border)',
                  position: 'relative',
                  transform: plan.featured ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: plan.featured ? 'var(--glow-ion)' : 'none'
                }}
                onMouseEnter={e => { 
                  if (!plan.featured) {
                    e.currentTarget.style.borderColor = 'var(--ion)';
                    e.currentTarget.style.boxShadow = 'var(--glow-ion)';
                  }
                }}
                onMouseLeave={e => { 
                  if (!plan.featured) {
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Featured Badge */}
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Crown className="w-4 h-4" />
                      Best Value
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 ${featuredClasses} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-8 h-8 ${textClasses}`} />
                  </div>
                  <h3 className={`text-2xl font-bold ${textClasses} mb-2`}>
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-4xl font-black ${textClasses}`}>
                      {plan.price}
                    </span>
                    <span className={`text-lg ${textClasses}`}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.excludedFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 opacity-50">
                      <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <X className="w-3 h-3 text-gray-400" />
                      </div>
                      <span className="text-gray-500 dark:text-gray-500 line-through">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={plan.ctaAction}
                  disabled={loadingTier === plan.id}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 ${
                    loadingTier === plan.id ? 'opacity-50 cursor-not-allowed' : ''
                  } ${buttonClasses} ${
                    plan.featured ? 'shadow-lg' : ''
                  }`}
                >
                  {loadingTier === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5 animate-pulse" />
                      Processing...
                    </span>
                  ) : (
                    plan.cta
                  )}
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                q: "Can I change plans anytime?",
                a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately."
              },
              {
                q: "What happens to my data if I cancel?",
                a: "Your data remains safe for 30 days. You can reactivate anytime or export your data."
              },
              {
                q: "Is my payment information secure?",
                a: "Absolutely. We use Stripe for payment processing and never store your credit card details."
              },
              {
                q: "Do you offer refunds?",
                a: "Yes! We offer a 30-day money-back guarantee for new subscriptions."
              },
              {
                q: "Can I use LastKey for free?",
                a: "Yes! Our free plan includes essential features to help you get started with digital legacy planning."
              },
              {
                q: "What's included in AI Voice Messages?",
                a: "Convert your text messages into realistic voice recordings using advanced AI technology."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="text-indigo-600">Q:</span>
                  {faq.q}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  <span className="text-indigo-600 font-medium">A:</span> {faq.a}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-white max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Secure Your Digital Legacy?
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              Join thousands who trust LastKey to preserve their love for generations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-colors"
              >
                Start Free
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSubscribe('guardian')}
                className="bg-indigo-800 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-900 transition-colors border-2 border-white/30"
              >
                Try Guardian Risk-Free
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Pricing;
