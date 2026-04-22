const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Dev-safe: enable autoIndex in development for faster index creation
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  mongoose.set('autoIndex', true);
}

// Validate environment variables (fails fast)
const { env, getSanitizedEnv } = require('./config/env');

console.log('✅ Environment validated');
console.log('📋 Configuration:', {
  NODE_ENV: env.NODE_ENV || 'development',
  PORT: env.PORT || 5000,
  FREE_MODE: env.FREE_MODE,
  EMAIL_MODE: env.EMAIL_MODE,
  FEATURE_PAYMENTS: env.FEATURE_PAYMENTS,
  FEATURE_AI: env.FEATURE_AI,
  USE_REDIS: process.env.REDIS_ENABLED === 'true'
});

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
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

const allowedOrigins =
  env.NODE_ENV === 'production'
    ? [env.FRONTEND_URL].filter(Boolean)
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:5177',
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

app.use('/api/', standardLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

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
  console.log('⚡ Authenticated client connected:', socket.id, 'User:', socket.userId);

  const userRoom = `user:${socket.userId}`;
  socket.join(userRoom);
  console.log(`👤 User ${socket.userId} auto-joined room ${userRoom}`);

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
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

app.use('/api/webauthn', require('./routes/webauthn'));
app.use('/api/migration', require('./routes/migration'));
app.use('/api/timeline', require('./routes/timeline'));
app.use('/api/voice-messages', require('./routes/voice-messages'));

app.use('/api/legal-documents', require('./routes/legalDocuments'));

app.use('/api/dek', require('./routes/dek'));
app.use('/api/vault-key', require('./routes/vaultKey'));

app.use('/api/memoir', require('./routes/memoir'));
app.use('/api/final-message', require('./routes/finalMessage'));

// Basic test route (legacy)
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server test OK' });
});

// ------------------------
// Startup
// ------------------------
const startServer = async () => {
  try {
    server
      .listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`🌐 Environment: ${env.NODE_ENV}`);
        console.log(`🔗 Socket.IO initialized`);
        console.log(`✉️  Email mode: ${env.EMAIL_MODE}${env.FREE_MODE === 'true' ? ' (FREE_MODE)' : ''}`);
        console.log(`⚙️  Guardian mode: ${DEV_FAST_MODE ? 'DEV_FAST_MODE (minutes)' : 'Standard (days)'}`);
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

    const connectWithRetry = async () => {
      try {
        if (mongoose.connection.readyState === 1) return;

        await mongoose.connect(MONGO_URI);
        console.log('✅ Database connected successfully');

        // Create indexes
        await User.createIndexes();
        await Asset.createIndexes();
        await Beneficiary.createIndexes();
        await Capsule.createIndexes();
        await LegalDocument.createIndexes();
        await EmergencyAccessGrant.createIndexes();
        await EmergencySession.createIndexes();
        console.log('✅ Database indexes created');
      } catch (error) {
        console.warn('⚠️  MongoDB connection failed (server still running).');
        console.warn(`   URI: ${maskMongoUri(MONGO_URI)}`);
        console.warn(`   Error: ${error?.message || error}`);

        if (String(error?.message || '').includes('equivalent index already exists')) {
          console.warn('');
          console.warn('💡 TTL Index Conflict Detected!');
          console.warn('   Run this in MongoDB shell to fix:');
          console.warn('   use lastkey');
          console.warn('   db.emergencysessions.dropIndex("expiresAt_1")');
          console.warn('   Then restart the server.');
          console.warn('');
        }
      }
    };

    await connectWithRetry();
    setInterval(connectWithRetry, 15000);
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

const startWorkers = async () => {
  const { redisClient } = require('./services/queue');

  try {
    if (!redisClient) throw new Error('Redis disabled (set REDIS_ENABLED=true to enable BullMQ)');
    await redisClient.ping();

    const guardianWorker = require('./workers/guardianWorker');
    const capsuleWorker = require('./workers/capsuleWorker');

    if (guardianWorker && capsuleWorker) {
      console.log('BullMQ workers started');

      const { scheduleGuardianJobs } = require('./services/guardianScheduler');
      if (mongoose.connection.readyState !== 1) {
        console.warn('MongoDB not connected; skipping guardian job scheduling for now.');
        return;
      }

      const users = await User.find({ triggerStatus: { $ne: 'triggered' } });
      for (const user of users) {
        await scheduleGuardianJobs(user);
      }
      console.log(`Guardian jobs scheduled for ${users.length} users`);

      const { scheduleCapsuleRelease } = require('./services/capsuleScheduler');
      const pendingCapsules = await Capsule.find({ isReleased: false, unlockAt: { $gte: new Date() } });
      for (const capsule of pendingCapsules) {
        await scheduleCapsuleRelease(capsule);
      }
      console.log(`${pendingCapsules.length} pending capsules scheduled`);
    }
  } catch (redisErr) {
    console.warn('Redis not available — falling back to node-cron (development mode)');
    console.warn('   Install Redis for production use: https://redis.io/download');

    const cron = require('node-cron');
    const { sendEmail } = require('./utils/email');

    cron.schedule('* * * * *', async () => {
      try {
        if (mongoose.connection.readyState !== 1) {
          console.log('Skipping Guardian Protocol — DB not ready');
          return;
        }

        console.log('Running Guardian Protocol check (fallback mode)...');

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
              console.log(`GUARDIAN PROTOCOL TRIGGERED for ${user.email}`);
            } else if (user.triggerStatus !== 'warning') {
              user.triggerStatus = 'warning';
              user.warningEmailSent = false;
              console.log(`WARNING for ${user.email}: inactive ${inactiveValue.toFixed(1)} ${unitLabel}`);
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
              console.log(`Sending Guardian Protocol notifications for ${user.email}...`);

              const beneficiaries = await Beneficiary.find({ userId: user._id });

              for (const beneficiary of beneficiaries) {
                await sendEmail({
                  to: beneficiary.email,
                  subject: 'LastKey Alert: Guardian Protocol Activated',
                  html: `
                    <h2>Important Notice</h2>
                    <p><strong>${user.name}</strong> has been inactive for an extended period.</p>
                    <p>Their LastKey Digital Legacy has been <strong>activated</strong>.</p>
                    <p><em>Inactivity threshold: ${threshold} ${unitLabel}.</em></p>
                    <hr />
                    <p>Login to Beneficiary Portal to claim access:</p>
                    <p><a href="${env.FRONTEND_URL}/beneficiary-portal">${env.FRONTEND_URL}/beneficiary-portal</a></p>
                  `
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Guardian Protocol fallback error:', error);
      }
    });
  }
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
  console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('✅ HTTP server closed');

    try {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error closing MongoDB:', error);
      process.exit(1);
    }
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