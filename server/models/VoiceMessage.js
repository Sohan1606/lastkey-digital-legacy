const mongoose = require('mongoose');

const voiceMessageSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    default: 'Voice Message'
  },
  recipientName: {
    type: String,
    default: '',
    trim: true
  },
  audioData: {
    type: String,
    default: ''
  },
  audioUrl: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 0
  },
  mimeType: {
    type: String,
    default: 'audio/webm'
  },
  transcript: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('VoiceMessage', voiceMessageSchema);
