const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  inactivityDuration: {
    type: Number,
    default: 1 // minutes for testing
  },
  triggerStatus: {
    type: String,
    enum: ['active', 'warning', 'triggered'],
    default: 'active'
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  // Email verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String
  },
  emailVerificationExpiry: {
    type: Date
  },
  // Password reset
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpiry: {
    type: Date
  },
  // Subscription billing
  subscriptionTier: {
    type: String,
    enum: ['free', 'guardian', 'legacy_pro'],
    default: 'free'
  },
  stripeCustomerId: {
    type: String
  },
  stripeSubscriptionId: {
    type: String
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'canceled', 'past_due'],
    default: 'active'
  },
  // Phone for WhatsApp alerts
  phone: {
    type: String
  },
  alertChannels: {
    type: [String],
    enum: ['email', 'whatsapp', 'telegram'],
    default: ['email']
  },
  // Gamification
  streak: {
    type: Number,
    default: 0
  },
  badges: [{
    type: String
  }],
  // Onboarding
  onboardingComplete: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ triggerStatus: 1, lastActive: 1 }); // For CRON query
userSchema.index({ emailVerificationToken: 1 }); // For email verification
userSchema.index({ resetPasswordToken: 1 }); // For password reset
userSchema.index({ stripeCustomerId: 1 }); // For Stripe webhooks
