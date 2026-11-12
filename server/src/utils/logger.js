// ==============================================================================
// JanSahay AI — Structured JSON Logging Service (Pino)
// Enterprise structured logging with mandatory privacy redaction
// Masks passwords, tokens, Aadhaar, bank accounts, and credentials
// ==============================================================================

import pino from 'pino';
import { config } from '../config.js';

export const logger = pino({
  level: config.logLevel || 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'passwordHash',
      'token',
      'refreshToken',
      'aadhaar',
      'aadhaarNumber',
      'bankAccount',
      'accountNumber',
      'ifsc',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.refreshToken',
      '*.aadhaar',
      '*.aadhaarNumber',
      '*.bankAccount',
      '*.accountNumber',
      '*.ifsc'
    ],
    censor: '[REDACTED_PRIVACY]'
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

export default logger;
