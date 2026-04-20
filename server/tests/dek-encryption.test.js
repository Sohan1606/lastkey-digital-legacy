/**
 * DEK Encryption Integration Tests
 * 
 * Tests for:
 * - DEK generation and wrapping
 * - Vault key endpoints
 * - Beneficiary DEK sharing
 * - Ciphertext-only responses
 */

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long';
process.env.FREE_MODE = 'true';
process.env.EMAIL_MODE = 'console';
process.env.FEATURE_AI = 'false';
process.env.FEATURE_PAYMENTS = 'false';

let app;
let mongoServer;

describe('DEK Encryption', () => {
  beforeAll(async () => {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri();
    
    // Import server after setting env
    const serverModule = require('../server');
    app = serverModule.app || serverModule;
    
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    const User = require('../models/User');
    const Beneficiary = require('../models/Beneficiary');
    await User.deleteMany({});
    await Beneficiary.deleteMany({});
  });

  describe('1. Vault Key Endpoints', () => {
    test('should check DEK status (not initialized)', async () => {
      const User = require('../models/User');
      const user = await User.create({
        name: 'Test Owner',
        email: 'owner@test.com',
        password: 'password123'
      });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      const res = await request(app)
        .get('/api/vault-key/status')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasWrappedDek).toBe(false);

      await User.deleteOne({ _id: user._id });
    });

    test('should initialize DEK', async () => {
      const User = require('../models/User');
      const user = await User.create({
        name: 'Test Owner',
        email: 'owner2@test.com',
        password: 'password123'
      });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      const res = await request(app)
        .post('/api/vault-key/initialize')
        .set('Authorization', `Bearer ${token}`)
        .send({
          wrappedDek: {
            saltB64: 'dGVzdHNhbHQ=',
            iterations: 100000,
            ivB64: 'dGVzdGl2MTIzNDU=',
            ciphertextB64: 'dGVzdGNpcGhlcnRleHQ=',
            version: '1'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify DEK was stored
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.vault.wrappedDek).toBeDefined();
      expect(updatedUser.vault.wrappedDek.version).toBe('1');

      await User.deleteOne({ _id: user._id });
    });

    test('should retrieve wrapped DEK', async () => {
      const User = require('../models/User');
      const user = await User.create({
        name: 'Test Owner',
        email: 'owner3@test.com',
        password: 'password123',
        vault: {
          wrappedDek: {
            saltB64: 'dGVzdHNhbHQ=',
            iterations: 100000,
            ivB64: 'dGVzdGl2MTIzNDU=',
            ciphertextB64: 'dGVzdGNpcGhlcnRleHQ=',
            version: '1'
          }
        }
      });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      const res = await request(app)
        .get('/api/vault-key/wrapped-dek')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.wrappedDek).toBeDefined();
      expect(res.body.data.wrappedDek.ciphertextB64).toBe('dGVzdGNpcGhlcnRleHQ=');

      await User.deleteOne({ _id: user._id });
    });
  });

  describe('2. Beneficiary DEK Sharing', () => {
    test('should store beneficiary public key', async () => {
      const User = require('../models/User');
      const Beneficiary = require('../models/Beneficiary');

      const owner = await User.create({
        name: 'Test Owner',
        email: 'owner4@test.com',
        password: 'password123'
      });

      const beneficiary = await Beneficiary.create({
        userId: owner._id,
        name: 'Test Beneficiary',
        email: 'beneficiary@test.com',
        relationship: 'spouse',
        enrollmentStatus: 'enrolled'
      });

      const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      const res = await request(app)
        .post(`/api/beneficiaries/${beneficiary._id}/encryption-keys`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          publicKeyJwk: JSON.stringify({ kty: 'RSA', n: 'test', e: 'AQAB' }),
          encryptedPrivateKeyBlob: {
            iv: 'testiv',
            ciphertext: 'testcipher',
            kdfSalt: 'testsalt',
            kdfIterations: 100000,
            algVersion: '1'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedBeneficiary = await Beneficiary.findById(beneficiary._id);
      expect(updatedBeneficiary.encryptionKeys.publicKeyJwk).toBeDefined();

      await User.deleteOne({ _id: owner._id });
      await Beneficiary.deleteOne({ _id: beneficiary._id });
    });

    test('should create DEK share for beneficiary', async () => {
      const User = require('../models/User');
      const Beneficiary = require('../models/Beneficiary');

      const owner = await User.create({
        name: 'Test Owner',
        email: 'owner5@test.com',
        password: 'password123',
        vault: {
          wrappedDek: {
            saltB64: 'dGVzdHNhbHQ=',
            iterations: 100000,
            ivB64: 'dGVzdGl2MTIzNDU=',
            ciphertextB64: 'dGVzdGNpcGhlcnRleHQ=',
            version: '1'
          }
        }
      });

      const beneficiary = await Beneficiary.create({
        userId: owner._id,
        name: 'Test Beneficiary',
        email: 'beneficiary2@test.com',
        relationship: 'spouse',
        enrollmentStatus: 'enrolled',
        encryptionKeys: {
          publicKeyJwk: JSON.stringify({ kty: 'RSA', n: 'test', e: 'AQAB' }),
          encryptedPrivateKeyBlob: {
            iv: 'testiv',
            ciphertext: 'testcipher',
            kdfSalt: 'testsalt',
            kdfIterations: 100000,
            algVersion: '1'
          }
        }
      });

      const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      const res = await request(app)
        .post(`/api/beneficiaries/${beneficiary._id}/dek-share`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          encryptedDekB64: 'ZW5jcnlwdGVkZGVrc2hhcmU='
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedBeneficiary = await Beneficiary.findById(beneficiary._id);
      expect(updatedBeneficiary.vaultShare.encryptedDekB64).toBe('ZW5jcnlwdGVkZGVrc2hhcmU=');

      await User.deleteOne({ _id: owner._id });
      await Beneficiary.deleteOne({ _id: beneficiary._id });
    });
  });

  describe('3. Ciphertext-Only Responses', () => {
    test('should return encrypted passwords in assets (not plaintext)', async () => {
      const User = require('../models/User');
      const Asset = require('../models/Asset');

      const owner = await User.create({
        name: 'Test Owner',
        email: 'owner6@test.com',
        password: 'password123'
      });

      await Asset.create({
        userId: owner._id,
        platform: 'Test Platform',
        username: 'testuser',
        password: 'encrypted-ciphertext-here',
        clientEncrypted: true,
        instruction: 'share'
      });

      const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      const res = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBeGreaterThan(0);
      
      // Password should be ciphertext, not plaintext
      const asset = res.body.data[0];
      expect(asset.password).toBeDefined();
      expect(asset.password).not.toBe('plaintext-password');
      expect(asset.clientEncrypted).toBe(true);

      await User.deleteOne({ _id: owner._id });
      await Asset.deleteMany({ userId: owner._id });
    });
  });

  describe('4. Security Requirements', () => {
    test('should require authentication for vault-key endpoints', async () => {
      const res = await request(app)
        .get('/api/vault-key/status');

      expect(res.status).toBe(401);
    });

    test('should require authentication for DEK share endpoints', async () => {
      const res = await request(app)
        .post('/api/beneficiaries/123/dek-share')
        .send({ encryptedDekB64: 'test' });

      expect(res.status).toBe(401);
    });

    test('should not allow beneficiaries to access owner vault-key endpoints', async () => {
      // Create a beneficiary token
      const Beneficiary = require('../models/Beneficiary');
      const beneficiary = await Beneficiary.create({
        userId: new mongoose.Types.ObjectId(),
        name: 'Test Beneficiary',
        email: 'benef@test.com',
        relationship: 'spouse',
        enrollmentStatus: 'enrolled'
      });

      const token = jwt.sign({ 
        id: beneficiary._id,
        type: 'beneficiary'
      }, process.env.JWT_SECRET, { expiresIn: '1h' });

      const res = await request(app)
        .get('/api/vault-key/status')
        .set('Authorization', `Bearer ${token}`);

      // Should be rejected - beneficiaries use different endpoints
      expect(res.status).toBe(401);

      await Beneficiary.deleteOne({ _id: beneficiary._id });
    });
  });
});
