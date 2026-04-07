const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Asset = require('./models/Asset');
const Beneficiary = require('./models/Beneficiary');
const Capsule = require('./models/Capsule');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const app = express();

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(express.json());

// Add this line after app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177"],
    methods: ["GET", "POST"]
  }
});

global.io = io;

io.on('connection', (socket) => {
  console.log('⚡ Client connected:', socket.id);
  
  socket.on('join-room', (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined their private room`);
  });

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

// Emergency access routes
const emergencyRouter = require('./routes/emergency');
app.use('/api/emergency', emergencyRouter);

// Timeline routes
const timelineRouter = require('./routes/timeline');
app.use('/api/timeline', timelineRouter);

// Voice messages routes
const voiceMessagesRouter = require('./routes/voice-messages');
app.use('/api/voice-messages', voiceMessagesRouter);

// Memoir routes
const memoirRouter = require('./routes/memoir');
app.use('/api/memoir', memoirRouter);

// Guardian Protocol CRON - every minute
const cron = require('node-cron');
const { sendEmail } = require('./utils/email');

// Time Capsule CRON - every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    if (mongoose.connection.readyState !== 1) return;
    
    console.log('Running Time Capsule check...');
    const now = new Date();
    
    const capsulesToRelease = await Capsule.find({
      isReleased: false,
      unlockAt: { $lte: now }
    });

    for (const capsule of capsulesToRelease) {
      capsule.isReleased = true;
      capsule.releasedAt = now;
      await capsule.save();
      
      console.log(`🔓 Released capsule: ${capsule.title}`);
      
      // Notify user via socket
      global.io.to(capsule.userId.toString()).emit('capsule-released', {
        id: capsule._id,
        title: capsule.title
      });
    }
  } catch (error) {
    console.error('Capsule CRON error:', error);
  }
});

cron.schedule('* * * * *', async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('⏭️ Skipping Guardian Protocol - DB not ready');
      return;
    }
    console.log('Running Guardian Protocol check...');
    
    const now = new Date();
    const users = await User.find({ triggerStatus: { $ne: 'triggered' } });
    
    for (const user of users) {
      const inactiveMinutes = (now - user.lastActive) / (1000 * 60);
      
      if (inactiveMinutes > user.inactivityDuration) {
        const wasTriggered = user.triggerStatus === 'triggered';
        
        if (inactiveMinutes > user.inactivityDuration * 2) {
          user.triggerStatus = 'triggered';
          console.log(`🚨 GUARDIAN PROTOCOL TRIGGERED for ${user.email}: Legacy protocols activated!`);
        } else {
          user.triggerStatus = 'warning';
          console.log(`⚠️  WARNING for ${user.email}: ${Math.floor(inactiveMinutes)}/${user.inactivityDuration} minutes inactive`);
        }
        
        await user.save();

        // Real-time notification to user-specific room
        global.io.to(user._id.toString()).emit('dms-update', {
          userId: user._id.toString(),
          status: user.triggerStatus,
          remainingMinutes: user.inactivityDuration - Math.floor(inactiveMinutes),
          message: user.triggerStatus === 'warning' ? `⚠️ Warning: ${user.inactivityDuration - Math.floor(inactiveMinutes)}min remaining` : `🚨 GUARDIAN PROTOCOL TRIGGERED!`,
          inactiveMinutes: Math.floor(inactiveMinutes),
          inactivityDuration: user.inactivityDuration
        });

        // Send emails ONLY on new trigger (no duplicates)
        if (user.triggerStatus === 'triggered' && !wasTriggered) {
          console.log(`📧 Sending Guardian Protocol emails for ${user.email}...`);

          const beneficiaries = await Beneficiary.find({ userId: user._id });
          
          for (const beneficiary of beneficiaries) {
            const result = await sendEmail({
              to: beneficiary.email,
              subject: '🚨 LastKey Alert: Guardian Protocol Activated',
              html: `
                <h2>Important Notice</h2>
                <p><strong>${user.name}</strong> has been inactive for an extended period.</p>
                <p>Their LastKey Digital Legacy has been <strong>automatically activated</strong>.</p>
                <p>Please check their digital vault and follow their instructions.</p>
                <p><em>They set inactivity duration to ${user.inactivityDuration} minutes.</em></p>
                <hr />
                <p>Access their legacy: <a href="https://lastkey.com/dashboard">LastKey Dashboard</a></p>
              `
            });
            
            if (result.success) {
              console.log(`✅ Guardian Protocol email sent to ${beneficiary.email}`);
            } else {
              console.error(`❌ Failed email to ${beneficiary.email}:`, result.error);
            }
          }
          
          // Send WhatsApp alerts if enabled
          if (user.alertChannels && user.alertChannels.includes('whatsapp') && user.phone) {
            console.log(`📱 Sending WhatsApp alert to ${user.phone}...`);
            // TODO: Implement actual WhatsApp API integration
            // This would require Twilio integration
          }
          
          // Send Telegram alerts if enabled
          if (user.alertChannels && user.alertChannels.includes('telegram')) {
            console.log(`📱 Sending Telegram alert...`);
            // TODO: Implement actual Telegram Bot integration
            // This would require Telegram Bot API setup
          }
        }
      }
    }
  } catch (error) {
    console.error('Guardian Protocol CRON error:', error);
  }
}, {
  scheduled: true,
  timezone: "UTC"
});

// Basic test route (legacy)
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server test OK' });
});

const startServer = async () => {
  try {
    // Load environment variables
    require('dotenv').config();
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lastkey');
    console.log('✅ Database connected successfully');
    
    // Create indexes for performance
    await User.createIndexes();
    await Asset.createIndexes();
    await Beneficiary.createIndexes();
    await Capsule.createIndexes();
    console.log('✅ Database indexes created');
    
    // Start server with error handling
    const PORT = process.env.PORT || 5000;
    
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
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

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

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error' });
});

// Start server - listen already called in startServer()

