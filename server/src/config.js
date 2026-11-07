import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'jansahay-super-secret-key-for-college-demo-2026',
  jwtExpiresIn: '7d',
  aiProvider: process.env.AI_PROVIDER || 'auto', // 'gemini', 'groq', 'mock', or 'auto'
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  dataDir: process.env.DATA_DIR || './data',
  dataGovApiKey: process.env.DATA_GOV_API_KEY || '',
};
