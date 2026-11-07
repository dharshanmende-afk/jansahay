import rateLimit from 'express-rate-limit';
import { config } from '../config.js';

// Global API rate limiter (protects against brute-force / DDoS)
export const globalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'RateLimitExceeded',
    message: 'Too many requests from this IP address. Please try again after 15 minutes.'
  }
});

// Stricter limiter on sensitive authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'AuthRateLimitExceeded',
    message: 'Too many authentication attempts. Please wait 15 minutes before retrying.'
  }
});

// Stricter limiter on AI chat drawer to protect LLM quota & prevent abuse
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.aiRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'AIRateLimitExceeded',
    message: 'AI assistant request quota reached for this window. Please wait a few moments.'
  }
});

export default {
  globalLimiter,
  authLimiter,
  aiLimiter
};
