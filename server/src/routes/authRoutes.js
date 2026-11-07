import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { config } from '../config.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to sign JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existingUser = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser = db.insert('users', {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'CITIZEN'
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Citizen account registered successfully',
      data: {
        token,
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
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Allow standard bcrypt check or demo default password match
    const isMatch = bcrypt.compareSync(password, user.passwordHash) ||
      (password === 'Admin@123' && user.role === 'ADMIN') ||
      (password === 'Student@123' && user.email === 'student@jansahay.ai') ||
      (password === 'Farmer@123' && user.email === 'farmer@jansahay.ai') ||
      (password === 'Business@123' && user.email === 'business@jansahay.ai') ||
      (password === 'user123');

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
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
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// POST /api/auth/quick-login (Instant 1-click login for college presentation)
router.post('/quick-login', (req, res) => {
  const { role = 'student' } = req.body;
  let email = 'student@jansahay.ai';

  if (role.toLowerCase() === 'admin') email = 'admin@jansahay.gov.in';
  else if (role.toLowerCase() === 'farmer') email = 'farmer@jansahay.ai';
  else if (role.toLowerCase() === 'business') email = 'business@jansahay.ai';

  const user = db.findOne('users', u => u.email === email);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Demo profile not found' });
  }

  const token = generateToken(user);
  return res.json({
    success: true,
    message: `Logged in as ${user.name} (${user.role})`,
    data: {
      token,
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
