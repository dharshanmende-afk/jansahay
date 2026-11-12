// ==============================================================================
// JanSahay AI — HTTP Request Logger Middleware (Pino-HTTP)
// Attaches request UUIDs and structured request/response metrics
// ==============================================================================

import pinoHttp from 'pino-http';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.headers['x-request-id'] || uuidv4(),
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} - ${res.statusCode}`,
  customErrorMessage: (req, res, err) => `${req.method} ${req.url} - ${res.statusCode}: ${err.message}`,
  autoLogging: {
    ignore: (req) => req.url === '/api/health' && req.method === 'GET'
  }
});

export default httpLogger;
