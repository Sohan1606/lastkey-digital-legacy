const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  relationship: {
    type: String,
    required: true,
    enum: ['spouse', 'child', 'parent', 'sibling', 'friend', 'lawyer', 'other'],
    default: 'other'
  },
  accessLevel: {
    type: String,
    enum: ['view', 'edit', 'full'],
    default: 'view'
  },
  emergencyAccessCode: {
    type: String,
    select: false // Don't include in queries by default for security
  },
  emergencyAccessExpires: {
    type: Date,
    select: false
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Beneficiary', beneficiarySchema);
