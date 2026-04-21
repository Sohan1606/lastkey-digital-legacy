/**
 * "Perfect" Workflow Integration Tests
 *
 * Covers:
 * A) JWT fallback secret rejection
 * B) Emergency routes 404
 * C) Beneficiary legal docs (ownerId, meta, file, scopes)
 * D) Legal doc upload encryption flag
 */

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long';
process.env.FREE_MODE = 'true';
process.env.EMAIL_MODE = 'console';
process.env.FEATURE_AI = 'false';
process.env.FEATURE_PAYMENTS = 'false';

const { app } = require('../server');

describe('PERFECT Workflow', () => {
  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }
  });

  // ============================================================
  // A) JWT SECURITY
  // ============================================================
  describe('A) JWT Security - No Fallback Secret', () => {
    test('protect middleware rejects tokens signed with wrong secret', async () => {
      const User = require('../models/User');
      const user = await User.create({
        name: 'Test',
        email: 'jwt-test@test.com',
        password: 'password123'
      });

      // Token signed with WRONG secret
      const wrongToken = jwt.sign({ id: user._id }, 'wrong-secret-12345', { expiresIn: '1h' });

      const res = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${wrongToken}`);

      expect(res.status).toBe(401);

      await User.deleteOne({ _id: user._id });
    });

    test('protect middleware accepts tokens signed with correct secret', async () => {
      const User = require('../models/User');
      const user = await User.create({
        name: 'Test',
        email: 'jwt-good@test.com',
        password: 'password123'
      });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      const res = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${token}`);

      // Should not be 401 (200 or 404 for no assets)
      expect(res.status).not.toBe(401);

      await User.deleteOne({ _id: user._id });
    });
  });

  // ============================================================
  // B) EMERGENCY ROUTES 404
  // ============================================================
  describe('B) Emergency Routes - Dead/Legacy', () => {
    test('/api/emergency/generate-code returns 404', async () => {
      const res = await request(app)
        .post('/api/emergency/generate-code')
        .send({ email: 'test@test.com' });
      expect(res.status).toBe(404);
    });

    test('/api/emergency/access returns 404', async () => {
      const res = await request(app)
        .post('/api/emergency/access')
        .send({ email: 'test@test.com', code: '123456' });
      expect(res.status).toBe(404);
    });

    test('/api/emergency/verify returns 404', async () => {
      const res = await request(app)
        .post('/api/emergency/verify')
        .send({ email: 'test@test.com', code: '123456' });
      expect(res.status).toBe(404);
    });
  });

  // ============================================================
  // C) BENEFICIARY LEGAL DOCUMENTS
  // ============================================================
  describe('C) Beneficiary Legal Documents', () => {
    let owner;
    let beneficiary;
    let legalDoc;
    let ownerToken;
    let beneficiaryToken;
    let sessionToken;
    let grantId;

    beforeEach(async () => {
      const User = require('../models/User');
      const Beneficiary = require('../models/Beneficiary');
      const LegalDocument = require('../models/LegalDocument');
      const EmergencyAccessGrant = require('../models/EmergencyAccessGrant');
      const EmergencySession = require('../models/EmergencySession');

      // Create owner
      owner = await User.create({
        name: 'Test Owner',
        email: 'owner@test.com',
        password: 'password123',
        triggerStatus: 'triggered'
      });

      // Create beneficiary
      beneficiary = await Beneficiary.create({
        userId: owner._id,
        name: 'Test Beneficiary',
        email: 'beneficiary@test.com',
        relationship: 'spouse',
        enrollmentStatus: 'enrolled',
        otpSecret: 'test-otp-secret',
        encryptionKeys: {
          publicKeyJwk: JSON.stringify({ kty: 'RSA' }),
          encryptedPrivateKeyBlob: { iv: 'test', ciphertext: 'test', kdfSalt: 'test', kdfIterations: 100000, algVersion: '1' }
        },
        vaultShare: {
          encryptedDekB64: 'test-dek-share',
          dekShareCreatedAt: new Date()
        }
      });

      // Create legal document with ownerId (not userId)
      legalDoc = await LegalDocument.create({
        ownerId: owner._id,
        type: 'deed',
        title: 'Test Property Deed',
        propertyAddress: '123 Test St',
        originalLocation: { type: 'home_safe', details: 'Under desk' },
        instructionsForBeneficiary: 'Look under the desk',
        visibleToBeneficiaries: true,
        allowedBeneficiaries: [],
        attachments: [{
          filename: 'test-file.pdf',
          originalName: 'property-deed.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          sha256Hash: 'abc123hash',
          encrypted: true,
          storagePath: '/tmp/test-file.pdf',
          uploadedAt: new Date()
        }]
      });

      // Create a fake file for the storage path
      try {
        fs.mkdirSync(path.dirname('/tmp/test-file.pdf'), { recursive: true });
        fs.writeFileSync('/tmp/test-file.pdf', 'test file content');
      } catch (e) {}

      // Tokens
      ownerToken = jwt.sign({ id: owner._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      beneficiaryToken = jwt.sign({ id: beneficiary._id, type: 'beneficiary' }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Create emergency grant with scopes
      const grant = await EmergencyAccessGrant.create({
        ownerId: owner._id,
        beneficiaryId: beneficiary._id,
        status: 'granted',
        scopes: {
          viewAssets: true,
          viewCapsules: true,
          viewDocuments: true,
          downloadFiles: true
        }
      });
      grantId = grant._id;

      // Create emergency session
      const rawSessionToken = 'test-session-token-123';
      const session = await EmergencySession.create({
        ownerId: owner._id,
        beneficiaryId: beneficiary._id,
        grantId: grant._id,
        sessionTokenHash: EmergencySession.hashToken(rawSessionToken),
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
      });
      sessionToken = rawSessionToken;
    });

    afterEach(async () => {
      try { fs.unlinkSync('/tmp/test-file.pdf'); } catch (e) {}
    });

    test('C1) GET /legal-documents uses ownerId (not userId)', async () => {
      const res = await request(app)
        .get('/api/beneficiary/portal/legal-documents')
        .set('Authorization', `Bearer ${beneficiaryToken}`)
        .set('X-Session-Token', sessionToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].title).toBe('Test Property Deed');
    });

    test('C1) Response does NOT expose attachments.storagePath', async () => {
      const res = await request(app)
        .get('/api/beneficiary/portal/legal-documents')
        .set('Authorization', `Bearer ${beneficiaryToken}`)
        .set('X-Session-Token', sessionToken);

      const doc = res.body.data[0];
      expect(doc.attachments[0].storagePath).toBeUndefined();
      expect(doc.attachments[0].sha256Hash).toBe('abc123hash');
      expect(doc.attachments[0].mimeType).toBe('application/pdf');
    });

    test('C2) GET /meta returns correct fields (mimeType, sha256Hash)', async () => {
      const attId = legalDoc.attachments[0]._id;

      const res = await request(app)
        .get(`/api/beneficiary/portal/legal-documents/${legalDoc._id}/attachments/${attId}/meta`)
        .set('Authorization', `Bearer ${beneficiaryToken}`)
        .set('X-Session-Token', sessionToken);

      expect(res.status).toBe(200);
      expect(res.body.data.mimeType).toBe('application/pdf');
      expect(res.body.data.sha256Hash).toBe('abc123hash');
      expect(res.body.data.encrypted).toBe(true);
      expect(res.body.data.filename).toBe('property-deed.pdf');
    });

    test('C2) GET /file streams bytes (200)', async () => {
      const attId = legalDoc.attachments[0]._id;

      const res = await request(app)
        .get(`/api/beneficiary/portal/legal-documents/${legalDoc._id}/attachments/${attId}/file`)
        .set('Authorization', `Bearer ${beneficiaryToken}`)
        .set('X-Session-Token', sessionToken);

      expect(res.status).toBe(200);
      expect(res.headers['x-encrypted']).toBe('true');
      expect(res.headers['x-sha256']).toBe('abc123hash');
    });

    test('C2) GET /file denied when downloadFiles scope missing', async () => {
      // Create a grant without downloadFiles scope
      const EmergencyAccessGrant = require('../models/EmergencyAccessGrant');
      const EmergencySession = require('../models/EmergencySession');

      const restrictedGrant = await EmergencyAccessGrant.create({
        ownerId: owner._id,
        beneficiaryId: beneficiary._id,
        status: 'granted',
        scopes: { viewDocuments: true, downloadFiles: false }
      });

      const restrictedSession = await EmergencySession.create({
        ownerId: owner._id,
        beneficiaryId: beneficiary._id,
        grantId: restrictedGrant._id,
        sessionTokenHash: EmergencySession.hashToken('restricted-token'),
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
      });

      const attId = legalDoc.attachments[0]._id;
      const res = await request(app)
        .get(`/api/beneficiary/portal/legal-documents/${legalDoc._id}/attachments/${attId}/file`)
        .set('Authorization', `Bearer ${beneficiaryToken}`)
        .set('X-Session-Token', 'restricted-token');

      expect(res.status).toBe(403);
    });

    test('C3) Beneficiary docs blocked without session', async () => {
      const res = await request(app)
        .get('/api/beneficiary/portal/legal-documents')
        .set('Authorization', `Bearer ${beneficiaryToken}`);

      expect(res.status).toBe(401);
    });

    test('C3) Beneficiary docs blocked when owner not triggered', async () => {
      const User = require('../models/User');
      const EmergencySession = require('../models/EmergencySession');

      // Change owner status back to active
      await User.findByIdAndUpdate(owner._id, { triggerStatus: 'active' });

      const res = await request(app)
        .get('/api/beneficiary/portal/legal-documents')
        .set('Authorization', `Bearer ${beneficiaryToken}`)
        .set('X-Session-Token', sessionToken);

      expect(res.status).toBe(403);
    });
  });

  // ============================================================
  // D) LEGAL DOCUMENT UPLOAD ENCRYPTION FLAG
  // ============================================================
  describe('D) Legal Document Upload - Encryption Flag', () => {
    test('upload sets encrypted=true when clientEncrypted=true', async () => {
      const User = require('../models/User');
      const LegalDocument = require('../models/LegalDocument');

      const owner = await User.create({
        name: 'Upload Test',
        email: 'upload@test.com',
        password: 'password123'
      });

      const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Create a temporary test file (PDF extension for multer filter)
      const testFilePath = path.join(__dirname, 'test-upload.pdf');
      fs.writeFileSync(testFilePath, '%PDF test content for upload');

      const res = await request(app)
        .post('/api/legal-documents')
        .set('Authorization', `Bearer ${token}`)
        .field('type', 'will')
        .field('title', 'Test Will')
        .field('originalLocation', JSON.stringify({ type: 'home_safe', details: 'safe' }))
        .field('instructionsForBeneficiary', 'Look in safe')
        .field('visibleToBeneficiaries', 'true')
        .field('clientEncrypted', 'true')
        .attach('attachments', testFilePath);

      expect(res.status).toBe(201);
      expect(res.body.data.attachments[0].encrypted).toBe(true);

      // Cleanup
      try { fs.unlinkSync(testFilePath); } catch (e) {}
      // Cleanup uploaded file
      const doc = res.body.data;
      if (doc.attachments && doc.attachments[0] && fs.existsSync(doc.attachments[0].storagePath)) {
        fs.unlinkSync(doc.attachments[0].storagePath);
      }
    });

    test('upload sets encrypted=false when clientEncrypted not set', async () => {
      const User = require('../models/User');

      const owner = await User.create({
        name: 'Upload Test 2',
        email: 'upload2@test.com',
        password: 'password123'
      });

      const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      const testFilePath = path.join(__dirname, 'test-upload2.pdf');
      fs.writeFileSync(testFilePath, '%PDF test content');

      const res = await request(app)
        .post('/api/legal-documents')
        .set('Authorization', `Bearer ${token}`)
        .field('type', 'will')
        .field('title', 'Test Will Plain')
        .field('originalLocation', JSON.stringify({ type: 'home_safe', details: 'safe' }))
        .field('instructionsForBeneficiary', 'Look in safe')
        .field('visibleToBeneficiaries', 'true')
        .attach('attachments', testFilePath);

      expect(res.status).toBe(201);
      expect(res.body.data.attachments[0].encrypted).toBe(false);

      try { fs.unlinkSync(testFilePath); } catch (e) {}
      const doc = res.body.data;
      if (doc.attachments && doc.attachments[0] && fs.existsSync(doc.attachments[0].storagePath)) {
        fs.unlinkSync(doc.attachments[0].storagePath);
      }
    });
  });
});
