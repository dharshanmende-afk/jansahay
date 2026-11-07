import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { db } from './db/database.js';

// Import Route Handlers
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

// Middlewares
app.use(cors({
  origin: '*', // Allow local frontend during development
  credentials: true
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString('en-IN')}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    name: 'JanSahay AI Server',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes Mounting
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

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`🇮🇳 JanSahay AI API Server running on port ${config.port}`);
  console.log(`• Health: http://localhost:${config.port}/api/health`);
  console.log(`• Schemes Catalog: http://localhost:${config.port}/api/schemes`);
  console.log(`• Document Guides: http://localhost:${config.port}/api/documents/guides`);
  console.log(`=======================================================`);
});
