const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['milestone', 'achievement', 'memory', 'travel', 'family'],
    default: 'milestone'
  },
  location: {
    type: String,
    trim: true
  },
  photos: [{
    type: String,
    trim: true
  }],
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
timelineSchema.index({ userId: 1, date: 1 });
timelineSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Timeline', timelineSchema);
