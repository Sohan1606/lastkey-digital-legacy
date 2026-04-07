const mongoose = require('mongoose');

const voiceMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  recipient: {
    type: String,
    trim: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  voice: {
    type: String,
    enum: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
    default: 'alloy'
  },
  emotion: {
    type: String,
    enum: ['warm', 'professional', 'playful', 'nostalgic', 'inspirational'],
    default: 'warm'
  },
  audioUrl: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for performance
voiceMessageSchema.index({ userId: 1, createdAt: -1 });
voiceMessageSchema.index({ userId: 1, emotion: 1 });

module.exports = mongoose.model('VoiceMessage', voiceMessageSchema);
