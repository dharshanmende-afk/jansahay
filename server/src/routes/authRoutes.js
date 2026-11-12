import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { config } from '../config.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import logger from '../utils/logger.js';
import {
  registerSchema,
  loginSchema,
  quickLoginSchema,
  refreshTokenSchema,
  deleteAccountSchema,
  deleteDataSchema
} from '../schemas/validationSchemas.js';

const router = express.Router();

// Helper to sign Access Token (1h)
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

// Helper to sign Refresh Token (7d)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, jti: uuidv4() },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn }
  );
};

// Helper to issue and track rotated token pairs
const issueTokenPair = (user, existingFamily = null) => {
  const family = existingFamily || uuidv4();
  const token = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  db.insert('refresh_tokens', {
    id: uuidv4(),
    userId: user.id,
    token: refreshToken,
    family,
    isRevoked: false,
    createdAt: new Date().toISOString()
  });

  return { token, refreshToken };
};

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Conflict',
        message: 'An account with this email address already exists'
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser = db.insert('users', {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role || 'CITIZEN'
    });

    const { token, refreshToken } = issueTokenPair(newUser);
    logger.info({ userId: newUser.id, role: newUser.role }, 'New citizen account registered');

    return res.status(201).json({
      success: true,
      message: 'Citizen account registered successfully',
      data: {
        token,
        refreshToken,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      }
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Register error');
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: 'Server error during registration'
    });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    const isProduction = process.env.NODE_ENV === 'production';

    // Verify bcrypt hash or development demo passwords
    let isMatch = false;
    if (user.passwordHash) {
      isMatch = bcrypt.compareSync(password, user.passwordHash);
    }

    if (!isMatch && !isProduction) {
      // Development-only fallbacks
      isMatch = (password === 'Admin@123' && user.role === 'ADMIN') ||
        (password === 'Student@123' && user.email === 'student@jansahay.ai') ||
        (password === 'Farmer@123' && user.email === 'farmer@jansahay.ai') ||
        (password === 'Business@123' && user.email === 'business@jansahay.ai') ||
        (password === 'user123');
    }

    if (!isMatch) {
      logger.warn({ email }, 'Failed authentication attempt');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    const { token, refreshToken } = issueTokenPair(user);
    logger.info({ userId: user.id, role: user.role }, 'Citizen login successful');

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Login error');
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: 'Server error during login'
    });
  }
});

// POST /api/auth/refresh (JWT Refresh Token Flow with Rotation & Reuse Protection)
router.post('/refresh', validate(refreshTokenSchema), (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
    const user = db.findById('users', decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or revoked session. Please log in again.'
      });
    }

    const storedToken = db.findOne('refresh_tokens', r => r.token === refreshToken);
    let tokenFamily = uuidv4();

    if (storedToken) {
      tokenFamily = storedToken.family;
      if (storedToken.isRevoked) {
        // Token reuse attempt detected: revoke entire token family
        logger.warn({ userId: user.id, family: storedToken.family }, 'Refresh token reuse detected: invalidating family');
        const familyTokens = db.find('refresh_tokens', r => r.family === storedToken.family);
        familyTokens.forEach(t => db.update('refresh_tokens', t.id, { isRevoked: true }));

        return res.status(401).json({
          success: false,
          error: 'TokenRevoked',
          message: 'Refresh token has already been used. Please log in again.'
        });
      }

      // Invalidate current refresh token (rotation)
      db.update('refresh_tokens', storedToken.id, { isRevoked: true });
    }

    // Issue new rotated token pair
    const { token: newAccessToken, refreshToken: newRefreshToken } = issueTokenPair(user, tokenFamily);

    return res.json({
      success: true,
      message: 'Session refreshed successfully',
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'InvalidToken',
      message: 'Refresh token expired or invalid. Please log in again.'
    });
  }
});

// POST /api/auth/quick-login (Instant 1-click login for development / demonstration)
router.post('/quick-login', validate(quickLoginSchema), (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Quick login shortcuts are strictly disabled in production mode.'
    });
  }

  const { role = 'student' } = req.body;
  let email = 'student@jansahay.ai';

  if (role.toLowerCase() === 'admin') email = 'admin@jansahay.gov.in';
  else if (role.toLowerCase() === 'farmer') email = 'farmer@jansahay.ai';
  else if (role.toLowerCase() === 'business') email = 'business@jansahay.ai';

  const user = db.findOne('users', u => u.email === email);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'NotFound',
      message: 'Demo profile not found in development seed.'
    });
  }

  const { token, refreshToken } = issueTokenPair(user);

  return res.json({
    success: true,
    message: `Logged in as ${user.name} (${user.role})`,
    data: {
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  return res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

// DELETE /api/auth/delete-my-data (Citizen Data Erasure - Retains Account)
router.delete('/delete-my-data', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    logger.info({ userId }, 'Purging citizen demographic and document records upon request');

    // Purge profile
    const profile = db.findOne('profiles', p => String(p.userId) === String(userId));
    if (profile) db.delete('profiles', profile.id);

    // Purge user documents
    const userDocs = db.find('userDocuments', d => String(d.userId) === String(userId));
    userDocs.forEach(d => db.delete('userDocuments', d.id));

    // Purge chat sessions & messages
    const sessions = db.find('chat_sessions', s => String(s.userId) === String(userId));
    sessions.forEach(s => {
      const msgs = db.find('chat_messages', m => m.sessionId === s.id);
      msgs.forEach(m => db.delete('chat_messages', m.id));
      db.delete('chat_sessions', s.id);
    });

    // Purge recommendations cache
    const recs = db.find('recommendations', r => String(r.userId) === String(userId));
    recs.forEach(r => db.delete('recommendations', r.id));

    // If Prisma is active, purge relational data
    if (db.prisma && await db.isPrismaConnected()) {
      await db.prisma.profile.deleteMany({ where: { userId } }).catch(() => {});
      await db.prisma.userDocument.deleteMany({ where: { userId } }).catch(() => {});
      await db.prisma.chatSession.deleteMany({ where: { userId } }).catch(() => {});
    }

    return res.json({
      success: true,
      message: 'All citizen demographic profile, document checklist, and chat records have been permanently erased.'
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Delete data error');
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: 'Failed to erase citizen personal data.'
    });
  }
});

// DELETE /api/auth/delete-my-account (Permanent Account Termination & Full Erasure)
router.delete('/delete-my-account', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body || {};

    const user = db.findById('users', userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Citizen account record not found.' });
    }

    if (password && user.passwordHash) {
      const isMatch = bcrypt.compareSync(password, user.passwordHash);
      if (!isMatch && process.env.NODE_ENV === 'production') {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Password confirmation failed. Account deletion cancelled.'
        });
      }
    }

    logger.info({ userId }, 'Permanently deleting citizen account');

    // Purge profile
    const profile = db.findOne('profiles', p => String(p.userId) === String(userId));
    if (profile) db.delete('profiles', profile.id);

    // Purge user documents
    const userDocs = db.find('userDocuments', d => String(d.userId) === String(userId));
    userDocs.forEach(d => db.delete('userDocuments', d.id));

    // Purge chat sessions
    const sessions = db.find('chat_sessions', s => String(s.userId) === String(userId));
    sessions.forEach(s => {
      const msgs = db.find('chat_messages', m => m.sessionId === s.id);
      msgs.forEach(m => db.delete('chat_messages', m.id));
      db.delete('chat_sessions', s.id);
    });

    // Purge refresh tokens
    const tokens = db.find('refresh_tokens', t => String(t.userId) === String(userId));
    tokens.forEach(t => db.delete('refresh_tokens', t.id));

    // Purge user
    db.delete('users', userId);

    // If Prisma is active, cascade delete
    if (db.prisma && await db.isPrismaConnected()) {
      await db.prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }

    return res.json({
      success: true,
      message: 'Citizen account and all associated personal data have been permanently purged.'
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Delete account error');
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: 'Failed to delete citizen account.'
    });
  }
});

export default router;
