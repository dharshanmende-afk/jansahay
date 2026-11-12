import { describe, it, beforeAll } from 'vitest';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/server.js';
import db from '../../src/db/database.js';

describe('JanSahay AI - API Integration Test Suite (Vitest)', () => {
  let citizenToken = '';
  let citizenRefreshToken = '';
  let adminToken = '';
  const testEmail = `test.citizen.${Date.now()}@example.com`;
  const testPassword = 'Password@123';

  beforeAll(() => {
    if (db.find('users').length === 0) {
      db.seedInitial();
    }
  });

  // 1. Health Endpoint Check
  it('GET /api/health returns 200 OK with database & service statuses', async () => {
    const res = await request(app).get('/api/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'UP');
    assert.equal(res.body.name, 'JanSahay AI Server');
    assert.ok(res.body.database);
    assert.ok(res.body.services);
  });

  // 2. Authentication Flow
  describe('Authentication Endpoints', () => {
    it('POST /api/auth/register creates a new citizen account and issues JWT pair', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Pooja Kulkarni',
          email: testEmail,
          password: testPassword
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.token, 'Must return access token');
      assert.ok(res.body.data.refreshToken, 'Must return refresh token');
      assert.equal(res.body.data.user.email, testEmail);

      citizenToken = res.body.data.token;
      citizenRefreshToken = res.body.data.refreshToken;
    });

    it('POST /api/auth/register rejects duplicate email with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Citizen',
          email: testEmail,
          password: testPassword
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    it('POST /api/auth/login authenticates registered citizen', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.token);
    });

    it('POST /api/auth/login rejects invalid password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword!99'
        });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    it('POST /api/auth/refresh rotates tokens with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: citizenRefreshToken
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.ok(res.body.data.refreshToken);

      citizenToken = res.body.data.token;
      citizenRefreshToken = res.body.data.refreshToken;
    });

    it('GET /api/auth/me returns citizen profile for valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${citizenToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.user.email, testEmail);
    });

    it('POST /api/auth/quick-login allows role-based dev login', async () => {
      const res = await request(app)
        .post('/api/auth/quick-login')
        .send({ role: 'admin' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.user.role, 'ADMIN');
      adminToken = res.body.data.token;
    });
  });

  // 3. Citizen Profile Management
  describe('Profile Endpoints', () => {
    it('POST /api/profile saves citizen demographic & economic profile', async () => {
      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          category: 'OBC',
          state: 'Maharashtra',
          district: 'Pune',
          occupation: 'Student',
          incomeRange: 'Below 2.5 Lakhs',
          educationLevel: 'Undergraduate',
          course: 'B.Tech Computer Engineering',
          currentYear: 3,
          isStudent: true
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.category, 'OBC');
    });

    it('GET /api/profile retrieves the saved profile', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${citizenToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.state, 'Maharashtra');
    });

    it('POST /api/profile fails with 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          // Missing category, state, incomeRange
          occupation: 'Engineer'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error, 'Validation Error');
    });
  });

  // 4. Schemes & Recommendations
  describe('Schemes & Recommendations Endpoints', () => {
    it('GET /api/schemes returns public catalog with pagination', async () => {
      const res = await request(app).get('/api/schemes');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.content);
      assert.ok(res.body.data.content.length > 0);
    });

    it('GET /api/schemes/:id returns single scheme details', async () => {
      const res = await request(app).get('/api/schemes/1');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.name);
    });

    it('GET /api/schemes/:id returns 404 for non-existent scheme', async () => {
      const res = await request(app).get('/api/schemes/999999');

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
    });

    it('GET /api/recommendations computes eligible schemes for citizen', async () => {
      const res = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${citizenToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
    });
  });

  // 5. Document Preparation & Guides
  describe('Document Preparation Endpoints', () => {
    it('GET /api/documents/guides returns verified 9-point RTS document guides', async () => {
      const res = await request(app).get('/api/documents/guides');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.length >= 10);
    });

    it('PUT /api/documents/status marks document as in-hand', async () => {
      const res = await request(app)
        .put('/api/documents/status')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          documentName: 'Aadhaar Card',
          documentType: 'AADHAAR_CARD',
          status: 'AVAILABLE'
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'AVAILABLE');
    });

    it('GET /api/documents/preparation-dashboard returns consolidated checklist', async () => {
      const res = await request(app)
        .get('/api/documents/preparation-dashboard')
        .set('Authorization', `Bearer ${citizenToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data);
    });
  });

  // 6. Security & Role-Based Access Control (RBAC)
  describe('Security & Admin Protections', () => {
    it('POST /api/realtime/sync rejects unauthenticated requests with 401', async () => {
      const res = await request(app).post('/api/realtime/sync');
      assert.equal(res.status, 401);
    });

    it('POST /api/realtime/sync rejects citizen role with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/realtime/sync')
        .set('Authorization', `Bearer ${citizenToken}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.error, 'Forbidden');
    });

    it('GET /api/admin/dashboard rejects citizen role with 403', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${citizenToken}`);

      assert.equal(res.status, 403);
    });

    it('GET /api/admin/dashboard allows admin role', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.totalUsers >= 1);
    });
  });

  // 7. Phase 3 Security, Feedback & Citizen Privacy Rights
  describe('Phase 3 Security, Feedback & DPDP Privacy Controls', () => {
    it('POST /api/feedback rejects invalid payload via Zod with 400', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .send({ comment: 'x' }); // Too short (< 3 chars)

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    it('POST /api/feedback records citizen correction report', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          schemeId: 1,
          feedbackType: 'CORRECTION',
          comment: 'Test verification feedback report for scheme rules'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'PENDING');
    });

    it('POST /api/auth/refresh revokes reused refresh token family on replay', async () => {
      // 1. Login to get fresh token pair
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });
      assert.equal(loginRes.status, 200);
      const token1 = loginRes.body.data.refreshToken;

      // 2. Rotate once -> valid
      const rot1 = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: token1 });
      assert.equal(rot1.status, 200);
      const token2 = rot1.body.data.refreshToken;

      // 3. Replay token1 -> rejected with 401 TokenRevoked
      const replay = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: token1 });
      assert.equal(replay.status, 401);
      assert.equal(replay.body.error, 'TokenRevoked');

      // 4. Subsequent use of token2 in compromised family -> rejected with 401
      const rot2 = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: token2 });
      assert.equal(rot2.status, 401);
    });

    it('DELETE /api/auth/delete-my-data erases profile & documents while retaining user account', async () => {
      const delRes = await request(app)
        .delete('/api/auth/delete-my-data')
        .set('Authorization', `Bearer ${citizenToken}`);

      assert.equal(delRes.status, 200);
      assert.equal(delRes.body.success, true);

      // Profile should now be null
      const profRes = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${citizenToken}`);
      assert.equal(profRes.status, 200);
      assert.equal(profRes.body.data, null);

      // User account is still accessible
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${citizenToken}`);
      assert.equal(meRes.status, 200);
    });

    it('DELETE /api/auth/delete-my-account permanently purges user account', async () => {
      const delAccRes = await request(app)
        .delete('/api/auth/delete-my-account')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ password: testPassword });

      assert.equal(delAccRes.status, 200);
      assert.equal(delAccRes.body.success, true);

      // Subsequent /api/auth/me must reject with 401
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${citizenToken}`);
      assert.equal(meRes.status, 401);
    });
  });
});
