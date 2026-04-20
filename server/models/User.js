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
    default: 90, // 90 days default (in days, converted to appropriate unit by application)
    min: [1, 'Inactivity duration must be at least 1 day'],
    max: [365, 'Inactivity duration cannot exceed 365 days']
  },
  triggerStatus: {
    type: String,
    enum: ['active', 'warning', 'triggered'],
    default: 'active'
  },
  warningEmailSent: {
    type: Boolean,
    default: false
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
    default: ['email'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one alert channel must be specified'
    }
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
  },
  // Emergency Recovery Passphrase (for beneficiary vault decryption)
  recoveryPassphraseHash: {
    type: String,
    select: false // Never return by default
  },
  recoveryPassphraseSet: {
    type: Boolean,
    default: false
  },
  // WebAuthn/Passkey credentials
  webauthnCredentials: [{
    credentialId: { type: String, required: true },
    publicKey: { type: String, required: true },
    counter: { type: Number, default: 0 },
    deviceName: { type: String },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Hash recovery passphrase before save
userSchema.pre('save', async function() {
  if (this.isModified('recoveryPassphraseHash') && this.recoveryPassphraseHash) {
    this.recoveryPassphraseHash = await bcrypt.hash(this.recoveryPassphraseHash, 12);
  }
});

// Hash password before save
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ triggerStatus: 1, lastActive: 1 }); // For CRON query
userSchema.index({ emailVerificationToken: 1 }); // For email verification
userSchema.index({ resetPasswordToken: 1 }); // For password reset
userSchema.index({ stripeCustomerId: 1 }); // For Stripe webhooks

module.exports = mongoose.model('User', userSchema);
