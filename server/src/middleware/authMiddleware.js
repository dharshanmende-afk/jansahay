import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db/database.js';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authorization token required in Bearer format.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = db.findById('users', decoded.id || decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User session invalid: user record not found.'
      });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    next();
  } catch (err) {
    const isExpired = err.name === 'TokenExpiredError';
    return res.status(401).json({
      success: false,
      error: isExpired ? 'TokenExpired' : 'InvalidToken',
      message: isExpired
        ? 'Session token expired. Please refresh your token or log in again.'
        : 'Invalid session token provided.'
    });
  }
};

export default authMiddleware;
