import express from 'express';
import { AIService } from '../services/aiService.js';
import { db } from '../db/database.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { aiChatSchema, aiExplainSchema } from '../schemas/validationSchemas.js';

const router = express.Router();

const SUPPORTED_LANGUAGES = ['en', 'hi', 'mr'];

// POST /api/ai/chat (Authenticated citizen or guest, rate-limited and Zod-validated)
router.post('/chat', aiLimiter, validate(aiChatSchema), async (req, res) => {
  try {
    const { question, message, schemeId, language = 'en' } = req.body;
    const queryText = (question || message || '').trim();

    // Validate optional schemeId
    let validatedSchemeId = null;
    if (schemeId !== undefined && schemeId !== null && schemeId !== '') {
      const numId = Number(schemeId);
      if (isNaN(numId) || numId <= 0) {
        return res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: 'Invalid scheme identifier. Must be a valid positive number.'
        });
      }
      const existingScheme = db.findById('schemes', numId);
      if (!existingScheme) {
        return res.status(404).json({
          success: false,
          error: 'NotFound',
          message: `Scheme with ID ${schemeId} was not found in the verified directory.`
        });
      }
      validatedSchemeId = numId;
    }

    // Validate language
    let validatedLanguage = 'en';
    if (language) {
      const lowerLang = String(language).toLowerCase().trim();
      if (SUPPORTED_LANGUAGES.includes(lowerLang)) {
        validatedLanguage = lowerLang;
      }
    }

    // Authenticated citizen profile resolution (or guest)
    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = (await import('jsonwebtoken')).default;
        const { config } = await import('../config.js');
        const decoded = jwt.verify(token, config.jwtSecret);
        userId = decoded.id;
      } catch (e) {
        // Guest mode continues
      }
    }

    // Invoke answer engine
    const result = await AIService.answerQuestion(
      queryText,
      validatedSchemeId,
      userId,
      validatedLanguage
    );

    // Ensure predictable, complete response envelope
    return res.json({
      success: true,
      data: {
        answer: result.answer,
        provider: result.provider || 'JanSahay Grounded Engine',
        sources: result.sources || [],
        dataStatus: result.dataStatus || 'knowledge_base',
        generatedAt: result.generatedAt || new Date().toISOString(),
        isVerified: result.isVerified !== undefined ? result.isVerified : true,
        guideId: result.guideId || null,
        officialUrl: result.officialUrl || null
      }
    });
  } catch (err) {
    console.error('[AI] Chat route error:', err);
    return res.status(500).json({
      success: false,
      error: 'AIServiceError',
      message: 'An error occurred while generating your answer. Please try again or consult the official scheme portal.'
    });
  }
});

// POST /api/ai/explain/:id (Explain specific scheme in simple language)
router.post('/explain/:id', validate(aiExplainSchema), async (req, res) => {
  try {
    const schemeId = req.params.id;
    const numId = Number(schemeId);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Invalid scheme ID parameter'
      });
    }

    const { language = 'en' } = req.body;

    const result = await AIService.answerQuestion(
      "Explain this scheme in simple, everyday language including eligibility, benefits, and required documents.",
      numId,
      null,
      language
    );

    return res.json({
      success: true,
      data: {
        answer: result.answer,
        provider: result.provider || 'JanSahay Grounded Engine',
        sources: result.sources || [],
        dataStatus: result.dataStatus || 'knowledge_base',
        generatedAt: result.generatedAt || new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[AI] Explain error:', err);
    return res.status(500).json({
      success: false,
      error: 'AIServiceError',
      message: 'Error generating scheme explanation'
    });
  }
});

export default router;
