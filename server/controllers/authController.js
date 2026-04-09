const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const User = require('../models/User');
const { log } = require('../services/auditService');
const { sendEmail } = require('../utils/email');

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

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    newUser.emailVerificationToken = verificationToken;
    newUser.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await newUser.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to LastKey</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Your love, outliving you.</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9; border-radius: 10px; margin: 20px 0;">
          <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
            Thank you for joining LastKey! To secure your digital legacy, please verify your email address by clicking the button below:
          </p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; padding: 15px 30px; text-decoration: none; 
                      border-radius: 50px; font-weight: bold; display: inline-block; 
                      font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center;">
            This link expires in 24 hours. If you didn't create an account, please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; color: #999; font-size: 14px;">
          <p>© 2026 LastKey Digital Legacy. All rights reserved.</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: newUser.email,
      subject: 'Verify Your LastKey Account',
      html: emailHtml
    });

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
          isPremium: newUser.isPremium,
          isEmailVerified: newUser.isEmailVerified
        }
      },
      message: 'Registration successful! Please check your email to verify your account.'
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
    console.log('Login successful:', email);

    // Log login event
    await log('login', { 
      userId: user._id, 
      ip: req.ip, 
      userAgent: req.headers['user-agent'], 
      details: { email: user.email } 
    });

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

// Verify email
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        status: 'fail',
        message: 'Verification token is required'
      });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid or expired verification token'
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    console.log('✅ Email verified successfully:', user.email);

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully! You can now use all features of LastKey.'
    });
  } catch (error) {
    console.error('❌ Email verification error:', error);
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    
    // Always return success to prevent email enumeration attacks
    if (!user) {
      return res.status(200).json({
        status: 'success',
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">Reset Your Password</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">LastKey Digital Legacy</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9; border-radius: 10px; margin: 20px 0;">
          <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
            You requested to reset your password for your LastKey account. Click the button below to set a new password:
          </p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; padding: 15px 30px; text-decoration: none; 
                      border-radius: 50px; font-weight: bold; display: inline-block; 
                      font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
              Reset Password
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center;">
            This link expires in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; color: #999; font-size: 14px;">
          <p>© 2026 LastKey Digital Legacy. All rights reserved.</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Reset Your LastKey Password',
      html: emailHtml
    });

    res.status(200).json({
      status: 'success',
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Reset token and new password are required'
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid or expired reset token'
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    console.log('✅ Password reset successful:', user.email);

    // Generate new token
    const jwtToken = signToken(user._id);

    res.status(200).json({
      status: 'success',
      token: jwtToken,
      message: 'Password reset successful! You can now login with your new password.'
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};
