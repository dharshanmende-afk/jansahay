import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { config } from '../config.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  quickLoginSchema,
  refreshTokenSchema
} from '../schemas/validationSchemas.js';

const router = express.Router();

// Helper to sign Access Token
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

// Helper to sign Refresh Token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn }
  );
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

    const token = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

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
    console.error('[Auth] Register error:', err);
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
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

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
    console.error('[Auth] Login error:', err);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: 'Server error during login'
    });
  }
});

// POST /api/auth/refresh (JWT Refresh Token flow)
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

    // Issue refreshed token pair
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

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

  const token = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

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

export default router;
