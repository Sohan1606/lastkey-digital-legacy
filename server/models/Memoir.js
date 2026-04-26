const mongoose = require('mongoose');

const memoirSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    default: 'New Chapter',
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  wordCount: {
    type: Number,
    default: 0
  },
  order: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Memoir', memoirSchema);
