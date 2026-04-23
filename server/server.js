require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const path = require('path');
const { startInactivityChecker } = require('./jobs/inactivityChecker');

// Environment Variables Check
const REQUIRED_ENV_VARS = [
  'MONGO_URI',
  'JWT_SECRET',
  'NODE_ENV'
];

const missingVars = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('FATAL: Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be at least 32 characters');
  process.exit(1);
}

if (process.env.LEGACY_ENCRYPTION_KEY && process.env.LEGACY_ENCRYPTION_KEY.length < 32) {
  console.error('FATAL: ENCRYPTION_KEY must be at least 32 characters');
  process.exit(1);
}

const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Dev-safe: enable autoIndex in development for faster index creation
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  mongoose.set('autoIndex', true);
}

// Validate environment variables (fails fast)
const { env, getSanitizedEnv } = require('./config/env');

const app = express();
const server = http.createServer(app);

const PORT = Number(env.PORT || 5000);
const MONGO_URI = env.MONGO_URI;

// ------------------------
// Helpers
// ------------------------
function maskMongoUri(uri) {
  // Avoid leaking credentials in logs
  try {
    // mongodb://user:pass@host:port/db?...
    return uri.replace(/\/\/([^@]+)@/g, '//[REDACTED]@');
  } catch {
    return '[REDACTED]';
  }
}

// DEV_FAST_MODE:
// - true  => treat inactivityDuration as minutes (fast demos)
// - false => treat inactivityDuration as days (realistic)
const DEV_FAST_MODE =
  env.NODE_ENV !== 'production' && (process.env.DEV_FAST_MODE === 'true' || process.env.DEV_FAST_MODE === '1');

// ------------------------
// Middleware
// ------------------------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { 
      policy: 'strict-origin-when-cross-origin' 
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

const allowedOrigins =
  env.NODE_ENV === 'production'
    ? [env.FRONTEND_URL].filter(Boolean)
    : [
        'http://localhost:5173',
        'http://127.0.0.1:56563'
      ];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    // IMPORTANT: allow X-Session-Token for beneficiary portal
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token', 'x-session-token']
  })
);

app.use(express.json({ limit: '2mb' }));

// Skip JSON parsing for multipart uploads to avoid multer conflicts
app.use((req, res, next) => {
  if (req.is('multipart/form-data')) {
    return next();
  }
  next();
});

// Input sanitization middleware
const { sanitizeBody } = require('./middleware/sanitize');
app.use(sanitizeBody);

// REMOVED: Public uploads exposure
// All file access must go through authorized endpoints
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ------------------------
// Rate limiting
// ------------------------
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { message: 'Too many login attempts, please try again later' }
});

const beneficiaryAccessLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: 'Too many access requests, please try again later' }
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    status: 'fail',
    message: 'Too many reset attempts. Try again in 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    status: 'fail',
    message: 'Upload limit reached. Try again in 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const scanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    status: 'fail',
    message: 'Scan limit reached. Try again in 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    status: 'fail',
    message: 'Too many requests. Slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  uploadLimiter,
  scanLimiter
};

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', resetLimiter);

// Beneficiary hard limits (auth + portal)
app.use('/api/beneficiary/auth/login', beneficiaryAccessLimiter);
app.use('/api/beneficiary/auth/login/start', beneficiaryAccessLimiter);
app.use('/api/beneficiary/auth/login/verify', beneficiaryAccessLimiter);
app.use('/api/beneficiary/auth/enroll', beneficiaryAccessLimiter);
app.use('/api/beneficiary/auth/check-status', beneficiaryAccessLimiter);
app.use('/api/beneficiary/auth/request-access', beneficiaryAccessLimiter);
app.use('/api/beneficiary/auth/create-session', beneficiaryAccessLimiter);
app.use('/api/beneficiary/auth/logout', beneficiaryAccessLimiter);
app.use('/api/beneficiary/portal/', beneficiaryAccessLimiter);

// SECURITY LAYER 6: Rate limit new token-based portal routes
app.use('/api/portal/', beneficiaryAccessLimiter);

// ------------------------
// Models (used for createIndexes + workers)
// ------------------------
const User = require('./models/User');
const Asset = require('./models/Asset');
const Beneficiary = require('./models/Beneficiary');
const Capsule = require('./models/Capsule');
const LegalDocument = require('./models/LegalDocument');
const EmergencyAccessGrant = require('./models/EmergencyAccessGrant');
const EmergencySession = require('./models/EmergencySession');
const BeneficiaryAccess = require('./models/BeneficiaryAccess');

// ------------------------
// Socket.IO
// ------------------------
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

global.io = io;

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) return next(new Error('Authentication error: No token provided'));

    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('+triggerStatus');
    if (!user) return next(new Error('Authentication error: User not found'));

    socket.userId = user._id.toString();
    socket.user = {
      id: user._id.toString(),
      email: user.email,
      triggerStatus: user.triggerStatus
    };

    next();
  } catch (err) {
    console.error('Socket auth error:', err.message);
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userRoom = `user:${socket.userId}`;
  socket.join(userRoom);

  socket.on('disconnect', () => {
    // Client disconnected
  });
});

// ------------------------
// Health
// ------------------------
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    message: 'LastKey Digital Legacy Server Running',
    status: 'OK',
    mongodb: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// ------------------------
// Routes
// ------------------------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/user', require('./routes/user'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/beneficiaries', require('./routes/beneficiaries'));
app.use('/api/capsules', require('./routes/capsules'));

app.use('/api/beneficiary/auth', require('./routes/beneficiaryAuth'));
app.use('/api/beneficiary/portal', require('./routes/beneficiaryPortal'));
app.use('/api/portal', require('./routes/portalRoutes'));

app.use('/api/webauthn', require('./routes/webauthn'));
app.use('/api/migration', require('./routes/migration'));
app.use('/api/timeline', require('./routes/timeline'));
app.use('/api/voice-messages', require('./routes/voice-messages'));

app.use('/api/legal-documents', require('./routes/legalDocuments'));

app.use('/api/dek', require('./routes/dek'));
app.use('/api/vault-key', require('./routes/vaultKey'));

app.use('/api/memoir', require('./routes/memoir'));
app.use('/api/final-message', require('./routes/finalMessage'));

// ------------------------
// Database Connection
// ------------------------
let isConnected = false;

const connectDB = async () => {
  // If already connected, skip
  if (isConnected) {
    return;
  }

  // If mongoose already has a connection
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  try {
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);

    // Test the connection with a ping
    await conn.connection.db.admin().ping();
    console.log('✅ MongoDB ping successful');

    // Fix duplicate index issue in beneficiaryaccesses (only on first connection)
    try {
      const collection = conn.connection.collection('beneficiaryaccesses');
      const indexes = await collection.indexes();
      const tokenIndexes = indexes.filter(idx => idx.name === 'token_1');

      if (tokenIndexes.length > 1) {
        await collection.dropIndex('token_1');
        console.log('✅ Fixed duplicate token_1 index');
      }
    } catch (indexErr) {
      // Index may not exist yet, that's fine
    }

    // Create indexes
    await User.createIndexes();
    await Asset.createIndexes();
    await Beneficiary.createIndexes();
    await Capsule.createIndexes();
    await LegalDocument.createIndexes();
    await EmergencyAccessGrant.createIndexes();
    await EmergencySession.createIndexes();
    await BeneficiaryAccess.createIndexes();

    // Start inactivity checker cron job
    startInactivityChecker();

    return conn;

  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('   URI:', maskMongoUri(MONGO_URI));
    console.error('   Error:', error.message);
    console.error('\nMake sure MongoDB is running:');
    console.error('   Windows: net start MongoDB');
    console.error('   Manual: mongod');

    isConnected = false;

    // Do not exit - server still runs
    // but DB operations will fail
  }
};

// ------------------------
// Startup
// ------------------------
const startServer = async () => {
  try {
    // Connect DB first (called exactly once)
    await connectDB();

    // Then start listening
    server
      .listen(PORT, () => {
        console.log('');
        console.log('🚀 Server running on port ' + PORT);
        console.log('📍 Environment: ' + env.NODE_ENV);
        console.log('🌐 Client URL: ' + env.FRONTEND_URL);
        console.log('📊 Health check: http://localhost:' + PORT + '/health');
        console.log('');
      })
      .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`❌ Port ${PORT} is already in use.`);
          console.error(`💡 Run: npx kill-port ${PORT} or change PORT in .env`);
          process.exit(1);
        } else {
          console.error('❌ Server error:', err);
          process.exit(1);
        }
      });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

const startWorkers = async () => {
  const cron = require('node-cron');
  const { sendEmail } = require('./utils/email');

  // Suppress node-cron verbose warnings in development
  if (process.env.NODE_ENV === 'development') {
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (args[0]?.includes?.('NODE-CRON')) return;
      originalWarn(...args);
    };
  }

  console.log('📅 Starting node-cron scheduler for Guardian Protocol (daily at 9am UTC)');

  cron.schedule('0 9 * * *', async () => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return;
      }

      const now = new Date();
      const users = await User.find({ triggerStatus: { $ne: 'triggered' } });

      for (const user of users) {
        const diffMs = now - user.lastActive;

        const inactiveMinutes = diffMs / (1000 * 60);
        const inactiveDays = diffMs / (1000 * 60 * 60 * 24);

        const inactiveValue = DEV_FAST_MODE ? inactiveMinutes : inactiveDays;
        const unitLabel = DEV_FAST_MODE ? 'minutes' : 'days';

        const threshold = user.inactivityDuration; // interpreted in minutes if DEV_FAST_MODE else days
        const wasTriggered = user.triggerStatus === 'triggered';

        if (inactiveValue > threshold) {
          if (inactiveValue > threshold * 2) {
            user.triggerStatus = 'triggered';
            user.warningEmailSent = false;
          } else if (user.triggerStatus !== 'warning') {
            user.triggerStatus = 'warning';
          }

          await user.save();

          // Realtime status update
          global.io.to(`user:${user._id.toString()}`).emit('dms-update', {
            userId: user._id.toString(),
            status: user.triggerStatus,
            unit: unitLabel,
            inactive: Math.floor(inactiveValue),
            threshold
          });

          // Send warning email only once per warning incident
          if (user.triggerStatus === 'warning' && !user.warningEmailSent) {
            user.warningEmailSent = true;
            await user.save();
          }

          // Send beneficiary notifications ONLY on new trigger
          if (user.triggerStatus === 'triggered' && !wasTriggered) {

            const beneficiaries = await Beneficiary.find({ userId: user._id });
            const BeneficiaryAccess = require('./models/BeneficiaryAccess');

            for (const beneficiary of beneficiaries) {
              // Generate cryptographically secure token (SECURITY LAYER 6: 64 bytes = 128 char hex)
              const token = crypto.randomBytes(64).toString('hex');

              // Get assigned vault items for this beneficiary
              const assignedItems = await Asset.find({
                ownerId: user._id,
                _id: { $in: beneficiary.assignedVaultItems || [] }
              });

              // Create access record
              const access = await BeneficiaryAccess.create({
                token,
                beneficiaryId: beneficiary._id,
                ownerId: user._id,
                assignedItems: assignedItems.map(item => item._id),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              });

              // Send email with portal link
              const portalUrl = `${env.FRONTEND_URL}/portal/${token}`;

              await sendEmail({
                to: beneficiary.email,
                subject: 'LastKey Alert: Guardian Protocol Activated',
                html: `
                  <h2>Important Notice</h2>
                  <p><strong>${user.name}</strong> has been inactive for an extended period.</p>
                  <p>Their LastKey Digital Legacy has been <strong>activated</strong>.</p>
                  <p><em>Inactivity threshold: ${threshold} ${unitLabel}.</em></p>
                  <hr />
                  <p><strong>${assignedItems.length} items</strong> have been left for you.</p>
                  <p><a href="${portalUrl}" style="background: #4f9eff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Access Your Items</a></p>
                  <p style="font-size: 12px; color: #888;">This link expires in 30 days.</p>
                `
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Guardian Protocol error:', error);
    }
  }, {
    scheduled: true,
    runOnInit: false,
    timezone: 'Etc/UTC'
  });
};

// Export for tests
module.exports = { app, server, startServer, startWorkers };

// Auto-start (skip in test)
if (env.NODE_ENV !== 'test') {
  startServer().then(() => startWorkers());
}

// ------------------------
// Graceful shutdown
// ------------------------
const gracefulShutdown = async (signal) => {
  server.close(async () => {

    try {
      await mongoose.connection.close();
    } catch (err) {
      console.error('Error closing MongoDB:', err);
    }
    process.exit(0);
  });

  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error(' Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  console.error(' Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Global error handling middleware
const { globalErrorHandler } = require('./middleware/errorMiddleware');
app.use(globalErrorHandler);