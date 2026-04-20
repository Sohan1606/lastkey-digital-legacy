/**
 * Security Hardening Tests
 * 
 * Tests for:
 * - JWT fallback secret removal
 * - Beneficiary rate limiting
 * - Emergency code feature removal
 * - OTP-based beneficiary authentication
 */

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long';
process.env.MONGO_URI = 'mongodb://localhost:27017/lastkey_test';
process.env.FREE_MODE = 'true';
process.env.EMAIL_MODE = 'console';
process.env.FEATURE_AI = 'false';
process.env.FEATURE_PAYMENTS = 'false';

// Import app after setting env vars
let app;
let server;

// Test data
const testUser = {
  name: 'Test Owner',
  email: 'owner@test.com',
  password: 'password123'
};

const testBeneficiary = {
  name: 'Test Beneficiary',
  email: 'beneficiary@test.com',
  relationship: 'spouse'
};

let authToken;
let beneficiaryId;
let userId;

describe('Security Hardening', () => {
  beforeAll(async () => {
    // Import server
    const serverModule = require('../server');
    app = serverModule.app || serverModule;
    
    // Wait for MongoDB connection
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up test data
    const User = require('../models/User');
    const Beneficiary = require('../models/Beneficiary');
    
    await User.deleteMany({ email: { $in: [testUser.email, testBeneficiary.email] } });
    await Beneficiary.deleteMany({ email: testBeneficiary.email });
  });

  describe('1. JWT Secret Security', () => {
    test('should reject tokens signed with wrong secret', async () => {
      // Create token with wrong secret
      const wrongToken = jwt.sign({ id: 'test123' }, 'wrong-secret', { expiresIn: '1h' });
      
      const res = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${wrongToken}`);
      
      expect(res.status).toBe(401);
    });

    test('should accept tokens signed with correct secret', async () => {
      // Create a test user first
      const User = require('../models/User');
      const user = await User.create({
        name: 'Test',
        email: 'jwt-test@test.com',
        password: 'password123'
      });
      
      const correctToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      const res = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${correctToken}`);
      
      // Should not be 401 (might be 200 or other depending on data)
      expect(res.status).not.toBe(401);
      
      await User.deleteOne({ _id: user._id });
    });
  });

  describe('2. Emergency Code Feature Removal', () => {
    test('should return 404 for /api/emergency/generate-code', async () => {
      const res = await request(app)
        .post('/api/emergency/generate-code')
        .send({ email: 'test@test.com' });
      
      expect(res.status).toBe(404);
    });

    test('should return 404 for /api/emergency/access', async () => {
      const res = await request(app)
        .post('/api/emergency/access')
        .send({ email: 'test@test.com', code: '123456' });
      
      expect(res.status).toBe(404);
    });

    test('should return 404 for /api/emergency/verify', async () => {
      const res = await request(app)
        .post('/api/emergency/verify')
        .send({ email: 'test@test.com', code: '123456' });
      
      expect(res.status).toBe(404);
    });
  });

  describe('3. Beneficiary Rate Limiting', () => {
    test('should apply rate limiting on /api/beneficiary/auth/login/start', async () => {
      // Make multiple rapid requests
      const requests = [];
      for (let i = 0; i < 15; i++) {
        requests.push(
          request(app)
            .post('/api/beneficiary/auth/login/start')
            .send({ email: 'test@test.com' })
        );
      }
      
      const responses = await Promise.all(requests);
      
      // At least some should be rate limited (429)
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    }, 30000);

    test('should apply rate limiting on /api/beneficiary/auth/login/verify', async () => {
      const requests = [];
      for (let i = 0; i < 15; i++) {
        requests.push(
          request(app)
            .post('/api/beneficiary/auth/login/verify')
            .send({ email: 'test@test.com', otp: '000000' })
        );
      }
      
      const responses = await Promise.all(requests);
      
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('4. OTP-Based Beneficiary Authentication', () => {
    test('should return 410 for deprecated /api/beneficiary/auth/login (email only)', async () => {
      const res = await request(app)
        .post('/api/beneficiary/auth/login')
        .send({ email: 'test@test.com' });
      
      expect(res.status).toBe(410);
      expect(res.body.message).toContain('deprecated');
    });

    test('should require OTP for beneficiary login', async () => {
      // Start OTP login
      const startRes = await request(app)
        .post('/api/beneficiary/auth/login/start')
        .send({ email: 'nonexistent@test.com' });
      
      // Should return success even for non-existent (security through obscurity)
      expect(startRes.status).toBe(200);
      expect(startRes.body.success).toBe(true);
    });

    test('should reject invalid OTP', async () => {
      const res = await request(app)
        .post('/api/beneficiary/auth/login/verify')
        .send({ email: 'test@test.com', otp: '000000' });
      
      // Should fail for non-existent or invalid
      expect(res.status).toBe(401);
    });
  });

  describe('5. Beneficiary Portal Security', () => {
    test('should require session token for portal access', async () => {
      const res = await request(app)
        .get('/api/beneficiary/portal/assets');
      
      expect(res.status).toBe(401);
    });

    test('should require beneficiary auth for portal access', async () => {
      const res = await request(app)
        .get('/api/beneficiary/portal/assets')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(res.status).toBe(401);
    });
  });

  describe('6. Feature Flags in FREE_MODE', () => {
    test('should return 501 for AI features when FEATURE_AI=false', async () => {
      // Create a valid token first
      const User = require('../models/User');
      const user = await User.create({
        name: 'Test',
        email: 'ai-test@test.com',
        password: 'password123'
      });
      
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      const res = await request(app)
        .post('/api/ai/generate-message')
        .set('Authorization', `Bearer ${token}`)
        .send({ prompt: 'test' });
      
      expect(res.status).toBe(501);
      expect(res.body.demo).toBe(true);
      
      await User.deleteOne({ _id: user._id });
    });

    test('should return 501 for payments when FEATURE_PAYMENTS=false', async () => {
      const User = require('../models/User');
      const user = await User.create({
        name: 'Test',
        email: 'payment-test@test.com',
        password: 'password123'
      });
      
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      const res = await request(app)
        .post('/api/payment/create-checkout-session')
        .set('Authorization', `Bearer ${token}`)
        .send({ tier: 'guardian' });
      
      expect(res.status).toBe(501);
      expect(res.body.demo).toBe(true);
      
      await User.deleteOne({ _id: user._id });
    });
  });
});
