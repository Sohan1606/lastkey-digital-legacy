/**
 * Beneficiary Access Control Tests
 * 
 * Tests for:
 * - Beneficiary cannot access before triggered
 * - Triggered gating works
 * - Scopes enforced
 * - Non-beneficiary cannot access even after trigger
 */

const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Beneficiary = require('../models/Beneficiary');
const EmergencyAccessGrant = require('../models/EmergencyAccessGrant');
const jwt = require('jsonwebtoken');

describe('Beneficiary Access Control', () => {
  let owner;
  let beneficiary;
  let ownerToken;
  let beneficiaryToken;
  let nonBeneficiary;

  beforeEach(async () => {
    // Create owner
    owner = await User.create({
      name: 'Test Owner',
      email: 'owner@example.com',
      password: 'SecurePass123!',
      triggerStatus: 'active'
    });
    ownerToken = jwt.sign({ id: owner._id }, process.env.JWT_SECRET);

    // Create beneficiary
    beneficiary = await Beneficiary.create({
      userId: owner._id,
      name: 'Test Beneficiary',
      email: 'beneficiary@example.com',
      relationship: 'child',
      enrollmentStatus: 'enrolled',
      unlockSecretHash: await require('bcryptjs').hash('unlock-secret-123', 10)
    });
    beneficiaryToken = jwt.sign({ id: beneficiary._id, type: 'beneficiary' }, process.env.JWT_SECRET);

    // Create non-beneficiary user
    nonBeneficiary = await User.create({
      name: 'Non Beneficiary',
      email: 'nonbeneficiary@example.com',
      password: 'SecurePass123!'
    });
  });

  describe('Access Before Trigger', () => {
    it('should reject beneficiary access request when owner is not triggered', async () => {
      const res = await request(app)
        .post('/api/beneficiary/auth/request-access')
        .set('Authorization', `Bearer ${beneficiaryToken}`)
        .send({ ownerId: owner._id.toString() });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not yet available');
    });

    it('should reject portal data access when owner is not triggered', async () => {
      const res = await request(app)
        .get('/api/beneficiary/portal/assets')
        .set('Authorization', `Bearer ${beneficiaryToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Access After Trigger', () => {
    beforeEach(async () => {
      // Trigger the owner
      owner.triggerStatus = 'triggered';
      await owner.save();
    });

    it('should allow access request when owner is triggered', async () => {
      const res = await request(app)
        .post('/api/beneficiary/auth/request-access')
        .set('Authorization', `Bearer ${beneficiaryToken}`)
        .send({ ownerId: owner._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('granted');
    });

    it('should create access grant with correct scopes', async () => {
      await request(app)
        .post('/api/beneficiary/auth/request-access')
        .set('Authorization', `Bearer ${beneficiaryToken}`)
        .send({ ownerId: owner._id.toString() });

      const grant = await EmergencyAccessGrant.findOne({
        ownerId: owner._id,
        beneficiaryId: beneficiary._id
      });

      expect(grant).toBeDefined();
      expect(grant.scopes.viewAssets).toBe(true);
      expect(grant.scopes.viewDocuments).toBe(true);
      expect(grant.status).toBe('granted');
    });
  });

  describe('Non-Beneficiary Access', () => {
    beforeEach(async () => {
      owner.triggerStatus = 'triggered';
      await owner.save();
    });

    it('should reject access from non-beneficiary even after trigger', async () => {
      const nonBeneficiaryToken = jwt.sign({ id: nonBeneficiary._id }, process.env.JWT_SECRET);

      const res = await request(app)
        .post('/api/beneficiary/auth/request-access')
        .set('Authorization', `Bearer ${nonBeneficiaryToken}`)
        .send({ ownerId: owner._id.toString() });

      // Should fail because this user is not a beneficiary of the owner
      expect(res.status).toBe(401);
    });
  });

  describe('Scope Enforcement', () => {
    let grant;
    let sessionToken;

    beforeEach(async () => {
      owner.triggerStatus = 'triggered';
      await owner.save();

      // Create grant with limited scopes
      grant = await EmergencyAccessGrant.create({
        ownerId: owner._id,
        beneficiaryId: beneficiary._id,
        status: 'granted',
        scopes: {
          viewAssets: true,
          viewDocuments: false,
          viewCapsules: false,
          downloadFiles: false
        }
      });
    });

    it('should enforce viewAssets scope', async () => {
      // Create session
      const sessionRes = await request(app)
        .post('/api/beneficiary/auth/create-session')
        .set('Authorization', `Bearer ${beneficiaryToken}`)
        .send({
          unlockSecret: 'unlock-secret-123',
          grantId: grant._id.toString()
        });

      expect(sessionRes.status).toBe(200);
      sessionToken = sessionRes.body.data.sessionToken;

      // Try to access assets
      const res = await request(app)
        .get('/api/beneficiary/portal/assets')
        .set('Authorization', `Bearer ${sessionToken}`);

      // Should work with viewAssets scope
      expect(res.status).toBe(200);
    });
  });
});
