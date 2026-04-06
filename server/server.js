const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

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

// Dead Man Switch CRON - every minute
const cron = require('node-cron');
const { sendEmail } = require('./utils/email');
const User = require('./models/User');
const Beneficiary = require('./models/Beneficiary');
const Capsule = require('./models/Capsule');

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
      console.log('⏭️ Skipping Dead Man Switch - DB not ready');
      return;
    }
    console.log('Running Dead Man Switch check...');
    
    const now = new Date();
    const users = await User.find({ triggerStatus: { $ne: 'triggered' } });
    
    for (const user of users) {
      const inactiveMinutes = (now - user.lastActive) / (1000 * 60);
      
      if (inactiveMinutes > user.inactivityDuration) {
        const wasTriggered = user.triggerStatus === 'triggered';
        
        if (inactiveMinutes > user.inactivityDuration * 2) {
          user.triggerStatus = 'triggered';
          console.log(`🚨 TRIGGERED for ${user.email}: Legacy protocols activated!`);
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
          message: user.triggerStatus === 'warning' ? `⚠️ Warning: ${user.inactivityDuration - Math.floor(inactiveMinutes)}min remaining` : `🚨 DEAD MAN SWITCH TRIGGERED!`,
          inactiveMinutes: Math.floor(inactiveMinutes),
          inactivityDuration: user.inactivityDuration
        });

        // Send emails ONLY on new trigger (no duplicates)
        if (user.triggerStatus === 'triggered' && !wasTriggered) {
          console.log(`📧 Sending trigger emails for ${user.email}...`);

          const beneficiaries = await Beneficiary.find({ userId: user._id });
          
          for (const beneficiary of beneficiaries) {
            const result = await sendEmail({
              to: beneficiary.email,
              subject: '🚨 LastKey Alert: Digital Legacy Triggered',
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
              console.log(`✅ Trigger email sent to ${beneficiary.email}`);
            } else {
              console.error(`❌ Failed email to ${beneficiary.email}:`, result.error);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('CRON error:', error);
  }
}, {
  scheduled: true,
  timezone: "UTC"
});

// Basic test route (legacy)
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server test OK' });
});

// Wait for MongoDB connection with retry
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('🔄 Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error' });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with Socket.IO`);
});
