const mongoose = require('mongoose');

const memoirSchema = new mongoose.Schema({
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
  stage: {
    type: String,
    enum: ['childhood', 'teenage', 'early_adulthood', 'midlife', 'wisdom'],
    required: true
  },
  chapter: {
    type: String,
    required: true,
    trim: true
  },
  wordCount: {
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
memoirSchema.index({ userId: 1, stage: 1 });
memoirSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Memoir', memoirSchema);
