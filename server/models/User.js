const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
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
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter valid email']
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'], // match validators
      select: false
    },

    lastActive: {
      type: Date,
      default: Date.now
    },

    // In days (your server fallback cron can treat minutes in DEV_FAST_MODE)
    inactivityDuration: {
      type: Number,
      default: 90,
      min: [7, 'Inactivity duration must be at least 7 days'], // match validators
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
    emailVerificationToken: { type: String },
    emailVerificationExpiry: { type: Date },

    // Password reset
    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date },

    // Subscription billing
    subscriptionTier: {
      type: String,
      enum: ['free', 'guardian', 'legacy_pro'],
      default: 'free'
    },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'canceled', 'past_due'],
      default: 'active'
    },

    // Phone for WhatsApp alerts
    phone: { type: String },

    alertChannels: {
      type: [String],
      enum: ['email', 'whatsapp', 'telegram'],
      default: ['email'],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'At least one alert channel must be specified'
      }
    },

    // Gamification
    streak: { type: Number, default: 0 },
    badges: [{ type: String }],

    onboardingComplete: {
      type: Boolean,
      default: false
    },

    /**
     * Recovery passphrase (hashed)
     * NOTE: keep select:false. Never return it in APIs.
     */
    recoveryPassphraseHash: {
      type: String,
      select: false
    },
    recoveryPassphraseSet: {
      type: Boolean,
      default: false
    },

    // WebAuthn/Passkey credentials
    webauthnCredentials: [
      {
        credentialId: { type: String, required: true },
        publicKey: { type: String, required: true },
        counter: { type: Number, default: 0 },
        deviceName: { type: String },
        createdAt: { type: Date, default: Date.now }
      }
    ],

    // Vault DEK (wrapped with password-derived KEK)
    vault: {
      wrappedDek: {
        saltB64: { type: String },
        iterations: { type: Number, default: 100000 },
        ivB64: { type: String },
        ciphertextB64: { type: String },
        version: { type: String, default: '1' }
      },
      createdAt: { type: Date },
      updatedAt: { type: Date }
    }
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (e) {
    next(e);
  }
});

/**
 * Hash recovery passphrase safely.
 * Backward compatible: if some route sets recoveryPassphraseHash to plaintext,
 * this hashes it. If it already looks like a bcrypt hash, it will not re-hash.
 */
userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('recoveryPassphraseHash') || !this.recoveryPassphraseHash) return next();

    // If already bcrypt hash, do not hash again
    if (typeof this.recoveryPassphraseHash === 'string' && this.recoveryPassphraseHash.startsWith('$2')) {
      return next();
    }

    this.recoveryPassphraseHash = await bcrypt.hash(this.recoveryPassphraseHash, 12);
    this.recoveryPassphraseSet = true;
    next();
  } catch (e) {
    next(e);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Optional helper for future use (nice & clean)
userSchema.methods.verifyRecoveryPassphrase = async function (candidate) {
  if (!this.recoveryPassphraseHash) return false;
  return bcrypt.compare(candidate, this.recoveryPassphraseHash);
};

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ triggerStatus: 1, lastActive: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ resetPasswordToken: 1 });
userSchema.index({ stripeCustomerId: 1 });

module.exports = mongoose.model('User', userSchema);