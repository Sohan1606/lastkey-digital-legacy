const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Validate environment variables
const { env, getSanitizedEnv } = require('./config/env');

console.log('✅ Environment validated');
console.log('📋 Configuration:', JSON.stringify(getSanitizedEnv(), null, 2));

// Import models
const User = require('./models/User');
const Asset = require('./models/Asset');
const Beneficiary = require('./models/Beneficiary');
const Capsule = require('./models/Capsule');
const LegalDocument = require('./models/LegalDocument');
const EmergencyAccessGrant = require('./models/EmergencyAccessGrant');
const EmergencySession = require('./models/EmergencySession');

const app = express();

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lastkey';

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Add input sanitization middleware
const { sanitizeBody } = require('./middleware/sanitize');
app.use(sanitizeBody);

// REMOVED: Public uploads exposure (S2)
// All file access must go through authorized endpoints
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting - stricter for auth and sensitive endpoints
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests, please try again later' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // stricter limit for auth endpoints
  skipSuccessfulRequests: true, // don't count successful logins
  message: { message: 'Too many login attempts, please try again later' }
});

const beneficiaryAccessLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit access requests
  message: { message: 'Too many access requests, please try again later' }
});

app.use('/api/', standardLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Mount beneficiary access limiter on ALL beneficiary auth endpoints
app.use('/api/beneficiary/auth/login', beneficiaryAccessLimiter);
app.use('/api/beneficiary/auth/login/start', beneficiaryAccessLimiter);
app.use('/api/beneficiary/auth/login/verify', beneficiaryAccessLimiter);
app.use('/api/beneficiary/auth/enroll', beneficiaryAccessLimiter);
app.use('/api/beneficiary/auth/check-status', beneficiaryAccessLimiter);
app.use('/api/beneficiary/auth/request-access', beneficiaryAccessLimiter);
app.use('/api/beneficiary/auth/create-session', beneficiaryAccessLimiter);
app.use('/api/beneficiary/portal/', beneficiaryAccessLimiter);

const jwt = require('jsonwebtoken');

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

global.io = io;

// Socket.IO JWT authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET not configured');
      return next(new Error('Server configuration error'));
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify user exists and is active
    const user = await User.findById(decoded.id).select('+triggerStatus');
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    
    // Attach user data to socket
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
  
  // Auto-join user to their private room based on JWT-derived userId
  const userRoom = `user:${socket.userId}`;
  socket.join(userRoom);
  console.log(`👤 User ${socket.userId} auto-joined room ${userRoom}`);
  
  // Remove insecure join-room that accepts userId from client
  // Clients cannot join arbitrary rooms anymore
  
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Health/Test route
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    message: 'LastKey Digital Legacy Server Running',
    status: 'OK',
    mongodb: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Auth routes
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// Asset routes
const assetRouter = require('./routes/assets');
app.use('/api/assets', assetRouter);

// User routes (dead man switch)
const userRouter = require('./routes/user');
app.use('/api/user', userRouter);

// AI routes
const aiRouter = require('./routes/ai');
app.use('/api/ai', aiRouter);

// Payment routes
const paymentRouter = require('./routes/payment');
app.use('/api/payment', paymentRouter);

// Beneficiaries routes
const beneficiaryRouter = require('./routes/beneficiaries');
app.use('/api/beneficiaries', beneficiaryRouter);

// Capsules routes
const capsuleRouter = require('./routes/capsules');
app.use('/api/capsules', capsuleRouter);

// Beneficiary Portal routes (new secure flow)
const beneficiaryAuthRouter = require('./routes/beneficiaryAuth');
app.use('/api/beneficiary/auth', beneficiaryAuthRouter);

const beneficiaryPortalRouter = require('./routes/beneficiaryPortal');
app.use('/api/beneficiary/portal', beneficiaryPortalRouter);

// WebAuthn/Passkey routes
const webauthnRouter = require('./routes/webauthn');
app.use('/api/webauthn', webauthnRouter);

// Migration routes (for legacy asset migration)
const migrationRouter = require('./routes/migration');
app.use('/api/migration', migrationRouter);

// Timeline routes
const timelineRouter = require('./routes/timeline');
app.use('/api/timeline', timelineRouter);

// Voice messages routes
const voiceMessagesRouter = require('./routes/voice-messages');
app.use('/api/voice-messages', voiceMessagesRouter);

// Legal Documents routes (Property & Legal Binder)
const legalDocumentsRouter = require('./routes/legalDocuments');
app.use('/api/legal-documents', legalDocumentsRouter);

// DEK (Data Encryption Key) routes
const dekRouter = require('./routes/dek');
app.use('/api/dek', dekRouter);

// Vault Key routes (owner DEK management)
const vaultKeyRouter = require('./routes/vaultKey');
app.use('/api/vault-key', vaultKeyRouter);

// Memoir routes
const memoirRouter = require('./routes/memoir');
app.use('/api/memoir', memoirRouter);

// Final Message routes
const finalMessageRouter = require('./routes/finalMessage');
app.use('/api/final-message', finalMessageRouter);

// Basic test route (legacy)
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server test OK' });
});

const startServer = async () => {
  try {
    // Start server first so the process can boot even if DB is unavailable.
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Socket.IO initialized`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please kill the process or use a different port.`);
        console.error(`💡 Run: npx kill-port ${PORT} or change PORT in .env`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
    });

    // Connect to MongoDB in the background with retry.
    const connectWithRetry = async () => {
      try {
        if (mongoose.connection.readyState === 1) return;
        await mongoose.connect(MONGO_URI);
        console.log('✅ Database connected successfully');

        // Create indexes for performance (safe to run on every successful connect)
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
        console.warn(`   URI: ${MONGO_URI}`);
        console.warn(`   Error: ${error?.message || error}`);
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
  // Check if Redis is available
  const { redisConnection, redisClient } = require('./services/queue');
  
  try {
    if (!redisClient) {
      throw new Error('Redis disabled (set REDIS_ENABLED=true to enable BullMQ)');
    }
    // Use shared client (it has error handlers attached)
    await redisClient.ping();
    
    // Start workers (they will handle null case internally)
    const guardianWorker = require('./workers/guardianWorker');
    const capsuleWorker = require('./workers/capsuleWorker');
    
    if (guardianWorker && capsuleWorker) {
      console.log('BullMQ workers started');
      
      // Schedule guardian jobs for all existing active users on startup
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
      
      // Schedule pending capsules on startup
      const { scheduleCapsuleRelease } = require('./services/capsuleScheduler');
      const pendingCapsules = await Capsule.find({ isReleased: false, unlockAt: { $gte: new Date() } });
      for (const capsule of pendingCapsules) {
        await scheduleCapsuleRelease(capsule);
      }
      console.log(`${pendingCapsules.length} pending capsules scheduled`);
    }
    
  } catch (redisErr) {
    console.warn('Redis not available \u2014 falling back to node-cron (development mode)');
    console.warn('   Install Redis for production use: https://redis.io/download');
    
    // FALLBACK: keep the original cron for development without Redis
    const cron = require('node-cron');
    const { sendEmail } = require('./utils/email');
    
    cron.schedule('* * * * *', async () => {
      try {
        if (mongoose.connection.readyState !== 1) {
          console.log('Skipping Guardian Protocol - DB not ready');
          return;
        }
        console.log('Running Guardian Protocol check (fallback mode)...');
        
        const now = new Date();
        const users = await User.find({ triggerStatus: { $ne: 'triggered' } });
        
        for (const user of users) {
          const inactiveMinutes = (now - user.lastActive) / (1000 * 60);
          
          if (inactiveMinutes > user.inactivityDuration) {
            const wasTriggered = user.triggerStatus === 'triggered';
            
            if (inactiveMinutes > user.inactivityDuration * 2) {
              user.triggerStatus = 'triggered';
              user.warningEmailSent = false;
              console.log(`GUARDIAN PROTOCOL TRIGGERED for ${user.email}: Legacy protocols activated!`);
            } else if (user.triggerStatus !== 'warning') {
              user.triggerStatus = 'warning';
              user.warningEmailSent = false;
              console.log(`WARNING for ${user.email}: ${Math.floor(inactiveMinutes)}/${user.inactivityDuration} minutes inactive`);
            }
            
            await user.save();

            // Real-time notification to user-specific room (only send once per state change)
            if (user.triggerStatus === 'warning' && !user.warningEmailSent) {
              global.io.to(`user:${user._id.toString()}`).emit('dms-update', {
                userId: user._id.toString(),
                status: user.triggerStatus,
                remainingMinutes: user.inactivityDuration - Math.floor(inactiveMinutes),
                message: `Warning: ${user.inactivityDuration - Math.floor(inactiveMinutes)}min remaining`,
                inactiveMinutes: Math.floor(inactiveMinutes),
                inactivityDuration: user.inactivityDuration
              });
              user.warningEmailSent = true;
              await user.save();
            } else if (user.triggerStatus === 'triggered') {
              global.io.to(`user:${user._id.toString()}`).emit('dms-update', {
                userId: user._id.toString(),
                status: user.triggerStatus,
                remainingMinutes: 0,
                message: `GUARDIAN PROTOCOL TRIGGERED!`,
                inactiveMinutes: Math.floor(inactiveMinutes),
                inactivityDuration: user.inactivityDuration
              });
            }

            // Send emails ONLY on new trigger (no duplicates)
            if (user.triggerStatus === 'triggered' && !wasTriggered) {
              console.log(`Sending Guardian Protocol emails for ${user.email}...`);

              const beneficiaries = await Beneficiary.find({ userId: user._id });
              
              for (const beneficiary of beneficiaries) {
                await sendEmail({
                  to: beneficiary.email,
                  subject: 'LastKey Alert: Guardian Protocol Activated',
                  html: `
                    <h2>Important Notice</h2>
                    <p><strong>${user.name}</strong> has been inactive for an extended period.</p>
                    <p>Their LastKey Digital Legacy has been <strong>automatically activated</strong>.</p>
                    <p>Please check their digital vault and follow their instructions.</p>
                    <p><em>They set inactivity duration to ${user.inactivityDuration} days.</em></p>
                    <hr />
                    <p>Login to Beneficiary Portal to claim access: <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/beneficiary-portal">LastKey Beneficiary Portal</a></p>
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

// Start the server (skip auto-start in test mode to avoid port/Mongo conflicts)
if (process.env.NODE_ENV !== 'test') {
  startServer().then(() => startWorkers());
}

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('✅ HTTP server closed');
    
    // Close MongoDB connection
    try {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error closing MongoDB:', error);
      process.exit(1);
    }
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Centralized error handler (S4) - no stack traces in production
app.use((err, req, res, next) => {
  // Log error with request context (but redact sensitive data)
  const logEntry = {
    message: err.message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  };
  
  // In production, don't expose stack traces
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (isDev) {
    console.error('Error:', err);
  } else {
    console.error('Error:', logEntry);
  }
  
  // Send safe error response
  const statusCode = err.statusCode || err.status || 500;
  const message = isDev ? err.message : 'An error occurred. Please try again later.';
  
  res.status(statusCode).json({ 
    success: false,
    message: message,
    ...(isDev && { stack: err.stack })
  });
});

// Start server - listen already called in startServer()

