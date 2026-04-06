const mongoose = require('mongoose');

const capsuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxLength: 100
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxLength: 5000
  },
  unlockAt: {
    type: Date,
    required: [true, 'Unlock date is required']
  },
  isReleased: {
    type: Boolean,
    default: false
  },
  releasedAt: {
    type: Date
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Capsule', capsuleSchema);
