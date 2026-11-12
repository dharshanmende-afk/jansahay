import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authMiddleware } from '../../src/middleware/authMiddleware.js';
import { adminMiddleware } from '../../src/middleware/adminMiddleware.js';
import { config } from '../../src/config.js';
import db from '../../src/db/database.js';

const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
};

describe('Auth & RBAC Security Middleware - Unit Tests', () => {
  it('bcrypt hashes and verifies citizen passwords accurately', () => {
    const plain = 'JanSahaySecure#2026';
    const hash = bcrypt.hashSync(plain, 10);
    expect(hash).not.toBe(plain);
    expect(bcrypt.compareSync(plain, hash)).toBe(true);
    expect(bcrypt.compareSync('WrongPassword', hash)).toBe(false);
  });

  it('authMiddleware rejects requests with missing or malformed Authorization header (401)', () => {
    const res1 = createMockRes();
    const next1 = vi.fn();
    authMiddleware({ headers: {} }, res1, next1);
    expect(res1.statusCode).toBe(401);
    expect(res1.body.error).toBe('Unauthorized');
    expect(next1).not.toHaveBeenCalled();

    const res2 = createMockRes();
    const next2 = vi.fn();
    authMiddleware({ headers: { authorization: 'Basic abc123' } }, res2, next2);
    expect(res2.statusCode).toBe(401);
    expect(next2).not.toHaveBeenCalled();
  });

  it('authMiddleware rejects invalid or expired JWT tokens (401)', () => {
    const resInvalid = createMockRes();
    const nextInvalid = vi.fn();
    authMiddleware({ headers: { authorization: 'Bearer invalid.jwt.string' } }, resInvalid, nextInvalid);
    expect(resInvalid.statusCode).toBe(401);
    expect(resInvalid.body.error).toBe('InvalidToken');

    const expiredToken = jwt.sign({ id: 1, role: 'CITIZEN' }, config.jwtSecret, { expiresIn: '-10s' });
    const resExp = createMockRes();
    authMiddleware({ headers: { authorization: `Bearer ${expiredToken}` } }, resExp, nextInvalid);
    expect(resExp.statusCode).toBe(401);
    expect(resExp.body.error).toBe('TokenExpired');
  });

  it('authMiddleware attaches verified user to req.user for valid active user', () => {
    const users = db.find('users');
    expect(users.length).toBeGreaterThan(0);
    const sampleUser = users[0];

    const validToken = jwt.sign({ id: sampleUser.id, email: sampleUser.email, role: sampleUser.role }, config.jwtSecret, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${validToken}` } };
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user.id).toBe(sampleUser.id);
    expect(req.user.email).toBe(sampleUser.email);
  });

  it('adminMiddleware blocks non-admin roles with 403 and permits ADMIN role', () => {
    const resCitizen = createMockRes();
    const nextCitizen = vi.fn();
    adminMiddleware({ user: { id: 2, role: 'CITIZEN' } }, resCitizen, nextCitizen);
    expect(resCitizen.statusCode).toBe(403);
    expect(nextCitizen).not.toHaveBeenCalled();

    const resGuest = createMockRes();
    adminMiddleware({}, resGuest, nextCitizen);
    expect(resGuest.statusCode).toBe(403);

    const resAdmin = createMockRes();
    const nextAdmin = vi.fn();
    adminMiddleware({ user: { id: 1, role: 'ADMIN' } }, resAdmin, nextAdmin);
    expect(nextAdmin).toHaveBeenCalledOnce();
  });
});
