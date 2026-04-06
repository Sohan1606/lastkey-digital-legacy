const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

// Generate JWT
const signToken = id => jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret-12345', {
  expiresIn: process.env.JWT_EXPIRES_IN || '90d'
});

exports.register = async (req, res, next) => {
  try {
    console.log('📝 Registration request received:', req.body);
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      console.log('❌ Registration validation failed: missing fields');
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, email, and password'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ Registration failed: Email already exists');
      return res.status(400).json({
        status: 'fail',
        message: 'Email already registered'
      });
    }

    // Create user
    const newUser = await User.create({ name, email, password });
    console.log('✅ User created successfully:', newUser.email);

    // Generate token
    const token = signToken(newUser._id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          triggerStatus: newUser.triggerStatus,
          inactivityDuration: newUser.inactivityDuration,
          isPremium: newUser.isPremium
        }
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    console.log('🔑 Login request received:', req.body.email);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('❌ Login validation failed: missing email or password');
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password'
      });
    }

    // Find user and select password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('❌ Login failed: User not found');
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid credentials'
      });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      console.log('❌ Login failed: Incorrect password');
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid credentials'
      });
    }

    // Update lastActive
    user.lastActive = Date.now();
    await user.save();
    console.log('✅ Login successful:', email);

    // Generate token
    const token = signToken(user._id);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          triggerStatus: user.triggerStatus,
          inactivityDuration: user.inactivityDuration,
          isPremium: user.isPremium
        }
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};
