/**
 * Beneficiary OTP Login Tests
 * 
 * Tests for secure 2-step email OTP authentication
 */

const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Beneficiary = require('../models/Beneficiary');

describe('Beneficiary OTP Login', () => {
  let owner;
  let beneficiary;

  beforeEach(async () => {
    owner = await User.create({
      name: 'Test Owner',
      email: 'owner@example.com',
      password: 'SecurePass123!'
    });

    beneficiary = await Beneficiary.create({
      userId: owner._id,
      name: 'Test Beneficiary',
      email: 'beneficiary@example.com',
      enrollmentStatus: 'enrolled',
      unlockSecretHash: await require('bcryptjs').hash('unlock-secret-123', 10)
    });
  });

  describe('POST /api/beneficiary/auth/login/start', () => {
    it('should initiate OTP login for enrolled beneficiary', async () => {
      const res = await request(app)
        .post('/api/beneficiary/auth/login/start')
        .send({ email: 'beneficiary@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('OTP has been sent');
    });

    it('should return same message for non-existent email (security)', async () => {
      const res = await request(app)
        .post('/api/beneficiary/auth/login/start')
        .send({ email: 'nonexistent@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('OTP has been sent');
    });

    it('should reject non-enrolled beneficiaries', async () => {
      beneficiary.enrollmentStatus = 'invited';
      await beneficiary.save();

      const res = await request(app)
        .post('/api/beneficiary/auth/login/start')
        .send({ email: 'beneficiary@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should apply rate limiting', async () => {
      // Make 6 rapid requests
      const requests = Array(6).fill().map(() =>
        request(app)
          .post('/api/beneficiary/auth/login/start')
          .send({ email: 'beneficiary@example.com' })
      );

      const responses = await Promise.all(requests);
      
      // At least one should be rate limited
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('POST /api/beneficiary/auth/login/verify', () => {
    let otp;

    beforeEach(async () => {
      // Start login to generate OTP
      const startRes = await request(app)
        .post('/api/beneficiary/auth/login/start')
        .send({ email: 'beneficiary@example.com' });
      
      // In development mode, OTP is returned
      otp = startRes.body.devOtp;
    });

    it('should verify OTP and return JWT', async () => {
      const res = await request(app)
        .post('/api/beneficiary/auth/login/verify')
        .send({ 
          email: 'beneficiary@example.com',
          otp: otp
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.data.beneficiary.email).toBe('beneficiary@example.com');
    });

    it('should reject invalid OTP', async () => {
      const res = await request(app)
        .post('/api/beneficiary/auth/login/verify')
        .send({ 
          email: 'beneficiary@example.com',
          otp: '000000'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject after 3 failed attempts', async () => {
      // Make 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/beneficiary/auth/login/verify')
          .send({ 
            email: 'beneficiary@example.com',
            otp: '000000'
          });
      }

      // 4th attempt should be blocked
      const res = await request(app)
        .post('/api/beneficiary/auth/login/verify')
        .send({ 
          email: 'beneficiary@example.com',
          otp: otp // Even with correct OTP
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Too many failed attempts');
    });

    it('should reject expired OTP', async () => {
      // Manually expire the OTP
      beneficiary.loginOtp.expiresAt = new Date(Date.now() - 1000);
      await beneficiary.save();

      const res = await request(app)
        .post('/api/beneficiary/auth/login/verify')
        .send({ 
          email: 'beneficiary@example.com',
          otp: otp
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('expired');
    });
  });

  describe('Deprecated /login endpoint', () => {
    it('should return 410 Gone for old email-only login', async () => {
      const res = await request(app)
        .post('/api/beneficiary/auth/login')
        .send({ email: 'beneficiary@example.com' });

      expect(res.status).toBe(410);
      expect(res.body.message).toContain('deprecated');
    });
  });
});
