// Production-ready AI + Socket.IO module for MERN SaaS
// Drop into existing project

// =====================================================
// 1. ENHANCED AI SUGGESTIONS CONTROLLER
// =====================================================
const getAISuggestions = async (req, res) => {
  try {
    const { user } = req;
    
    // User stats analysis
    const stats = user.stats || {};
    const lastLoginDays = Math.floor((new Date() - new Date(user.lastActive || user.createdAt)) / (1000 * 60 * 60 * 24));
    
    const suggestions = [];
    
    // PRIORITY 3: CRITICAL - No beneficiaries
    if (!stats.beneficiaries || stats.beneficiaries === 0) {
      suggestions.push({
        id: 'beneficiaries-critical',
        title: '🚨 Add Emergency Beneficiaries NOW',
        description: 'No contacts set. Legacy cannot be delivered. Add 2+ trusted people.',
        category: 'setup',
        tone: 'urgent',
        priority: 'critical',
        action: '/beneficiaries',
        icon: 'users',
        priorityScore: 3
      });
    }
    
    // PRIORITY 2: HIGH - Low vault security
    if ((stats.assets || 0) < 3) {
      suggestions.push({
        id: 'vault-low',
        title: '🔒 Strengthen Digital Vault',
        description: `${3 - (stats.assets || 0)} more assets needed (photos/docs/passwords). Current score low.',
        category: 'security',
        tone: 'encouraging',
        priority: 'high',
        action: '/vault',
        icon: 'lock',
        priorityScore: 2
      });
    }
    
    // PRIORITY 1: MEDIUM - No scheduled content
    if ((stats.capsules || 0) === 0) {
      suggestions.push({
        id: 'capsules-empty',
        title: '💌 Create First Time Capsule',
        description: 'No scheduled messages. Craft emotional capsules with AI help.',
        category: 'content',
        tone: 'inspirational',
        priority: 'medium',
        action: '/capsules',
        icon: 'clock',
        priorityScore: 1
      });
    }
    
    // SMART PREMIUM UPSELL (conditional)
    if (!user.isPremium && stats.beneficiaries && stats.beneficiaries >= 2) {
      suggestions.push({
        id: 'premium-upsell-smart',
        title: '✨ Unlock Premium (Recommended)',
        description: 'Unlimited beneficiaries + AI unlimited + analytics. Perfect for your setup.',
        category: 'upgrade',
        tone: 'opportunity',
        priority: 'medium',
        action: '/upgrade',
        icon: 'sparkles',
        priorityScore: 1
      });
    }
    
    // PRIORITY 0: LOW - Maintenance nudge
    if (lastLoginDays > 14) {
      suggestions.push({
        id: 'ping-reminder',
        title: '⚡ Ping Dead Man Switch',
        description: `Reset inactivity timer. Last login ${lastLoginDays} days ago.`,
        category: 'maintenance',
        tone: 'reminder',
        priority: 'low',
        action: 'ping',
        icon: 'zap',
        priorityScore: 0
      });
    }
    
    // Sort by priorityScore DESC + limit top 3
    const sortedSuggestions = suggestions
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 3);
    
    res.json({
      success: true,
      data: sortedSuggestions,           // Top 3
      all: suggestions,                  // Complete list w/ scores
      analysis: {
        totalSuggestions: suggestions.length,
        highestPriority: sortedSuggestions[0]?.priority || 'none',
        beneficiaryCount: stats.beneficiaries || 0,
        premiumStatus: !!user.isPremium
      }
    });
    
  } catch (error) {
    console.error('AI Suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate personalized suggestions',
      data: []
    });
  }
};

// =====================================================
// 2. SOCKET.IO DEAD MAN SWITCH HANDLER
// =====================================================
const setupDeadManSocket = (io) => {
  io.on('connection', (socket) => {
    // Client joins user room on auth
    socket.on('join-user-room', (userId) => {
      socket.join(userId);
      
      // Catch-up: emit current status
      emitCurrentDMSStatus(io, userId);
    });
    
    socket.on('disconnect', () => {
      // Socket disconnected
    });
  });
};

// Helper: Emit current DMS status to room (reconnect fallback)
const emitCurrentDMSStatus = async (io, userId) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (user) {
      const now = new Date();
      const inactiveMinutes = (now - user.lastActive) / (1000 * 60);
      
      io.to(userId).emit('dms-sync', {
        status: user.triggerStatus,
        remainingMinutes: user.inactivityDuration - Math.floor(inactiveMinutes),
        lastActive: user.lastActive,
        message: getStatusMessage(user.triggerStatus),
        timestamp: now.toISOString(),
        isTriggered: user.triggerStatus === 'triggered'
      });
    }
  } catch (error) {
    console.error('DMS sync error:', error);
  }
};

// Status message helper
const getStatusMessage = (status) => {
  switch (status) {
    case 'warning': return '⚠️ DMS Warning - Action required';
    case 'triggered': return '🚨 EMERGENCY - Legacy activated';
    case 'active': return '✅ DMS Active & Secure';
    default: return 'Status unknown';
  }
};

// Cron emit helper (use in server.js cron)
const emitDMSUpdate = (io, user) => {
  const now = new Date();
  const inactiveMinutes = (now - user.lastActive) / (1000 * 60);
  
  io.to(user._id.toString()).emit('dms-update', {
    status: user.triggerStatus,
    remainingMinutes: user.inactivityDuration - Math.floor(inactiveMinutes),
    lastActive: user.lastActive,
    message: getStatusMessage(user.triggerStatus),
    timestamp: now.toISOString()
  });
};

// =====================================================
// EXPORTS
// =====================================================
module.exports = {
  getAISuggestions,
  setupDeadManSocket,
  emitCurrentDMSStatus,
  emitDMSUpdate,
  getStatusMessage
};

// USAGE:
// 1. controllers/aiController.js → export getAISuggestions
// 2. server.js → setupDeadManSocket(io)
// 3. Cron → emitDMSUpdate(global.io, user)
// 4. Client socket.js → 'dms-update' / 'dms-sync' handlers
