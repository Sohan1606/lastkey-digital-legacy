/**
 * Emergency Code Feature Removal Tests
 * 
 * Verifies legacy emergency code endpoints are disabled
 */

const request = require('supertest');
const app = require('../server');

describe('Emergency Code Feature Removal', () => {
  it('should return 404 for /api/emergency/generate-code', async () => {
    const res = await request(app)
      .post('/api/emergency/generate-code')
      .send({ userId: '123', beneficiaryId: '456' });

    expect(res.status).toBe(404);
  });

  it('should return 404 for /api/emergency/access', async () => {
    const res = await request(app)
      .post('/api/emergency/access')
      .send({ code: 'ABC12345' });

    expect(res.status).toBe(404);
  });

  it('should return 404 for /api/emergency/download/:assetId', async () => {
    const res = await request(app)
      .get('/api/emergency/download/123?code=ABC12345');

    expect(res.status).toBe(404);
  });

  it('should return 404 for /api/emergency/notify', async () => {
    const res = await request(app)
      .post('/api/emergency/notify')
      .send({ beneficiaryId: '123', message: 'test' });

    expect(res.status).toBe(404);
  });
});
