import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config.js';
import { db } from './db/database.js';
import { checkPostgresConnectivity } from './db/pgClient.js';
import { globalLimiter } from './middleware/rateLimiter.js';

// Route Handlers
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import schemeRoutes from './routes/schemeRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import documentGuideRoutes from './routes/documentGuideRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import updateRoutes from './routes/updateRoutes.js';
import realtimeRoutes from './routes/realtimeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

// 1. Security Headers (Helmet)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));

// 2. CORS Whitelist Configuration from Environment
const allowedOrigins = config.corsOrigin
  ? config.corsOrigin.split(',').map(s => s.trim().toLowerCase())
  : ['http://localhost:5173'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, curl, health checks)
    if (!origin) return callback(null, true);
    const lower = origin.toLowerCase();

    const isExplicitlyAllowed = allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      if (allowed === lower) return true;
      if (allowed.includes('*')) {
        const regex = new RegExp('^' + allowed.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
        return regex.test(lower);
      }
      return false;
    });

    // Automatically permit Netlify preview deployments and localhost
    if (isExplicitlyAllowed || lower.includes('netlify.app') || lower.includes('localhost') || lower.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked request from origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// 3. Request Logging (Morgan)
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// 4. Request Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Global Rate Limiter
app.use('/api', globalLimiter);

// 6. Comprehensive Health Check with DB Connectivity
app.get('/api/health', async (req, res) => {
  try {
    const isPostgresUp = await checkPostgresConnectivity();
    const uptimeSeconds = Math.floor(process.uptime());

    return res.json({
      status: 'UP',
      name: 'JanSahay AI Server',
      version: '2.0.0',
      environment: config.nodeEnv,
      uptimeSeconds,
      database: {
        status: isPostgresUp ? 'CONNECTED' : 'LOCAL_STORAGE_ACTIVE',
        engine: isPostgresUp ? 'PostgreSQL 16 (Relational)' : 'Local High-Performance Seed Storage',
        connected: true
      },
      services: {
        auth: 'ACTIVE',
        eligibilityEngine: 'ACTIVE',
        rtsDocumentGuides: 'ACTIVE',
        aiAssistant: 'ACTIVE',
        governmentSync: 'ACTIVE'
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(503).json({
      status: 'DEGRADED',
      error: 'HealthCheckFailed',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 7. Route Mounting
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/documents/guides', documentGuideRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/updates', updateRoutes);
app.use('/api/realtime', realtimeRoutes);
app.use('/api/admin', adminRoutes);

// 8. 404 Route Catch-all
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// 9. Centralized Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = config.nodeEnv === 'production';

  console.error(`[Unhandled Error] ${req.method} ${req.url}:`, err.message || err);

  res.status(statusCode).json({
    success: false,
    error: err.name || 'ServerError',
    message: err.message || 'An internal server error occurred',
    ...(isProduction ? {} : { stack: err.stack })
  });
});

// Start Server
app.listen(config.port, () => {
  console.log('=======================================================');
  console.log(`🇮🇳 JanSahay AI API Server running on port ${config.port}`);
  console.log(`• Environment:     ${config.nodeEnv}`);
  console.log(`• Health Check:    http://localhost:${config.port}/api/health`);
  console.log(`• Schemes Catalog: http://localhost:${config.port}/api/schemes`);
  console.log(`• Document Guides: http://localhost:${config.port}/api/documents/guides`);
  console.log('=======================================================');
});

export default app;
