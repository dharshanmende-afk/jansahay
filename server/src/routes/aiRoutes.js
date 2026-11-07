import express from 'express';
import { AIService } from '../services/aiService.js';
import { db } from '../db/database.js';

const router = express.Router();

const SUPPORTED_LANGUAGES = ['en', 'hi', 'mr'];

// POST /api/ai/chat (Authenticated citizen or guest)
router.post('/chat', async (req, res) => {
  try {
    const { question, schemeId, language = 'en' } = req.body;

    // 1. Validate question input
    if (question === undefined || question === null) {
      return res.status(400).json({
        success: false,
        message: 'Question parameter is required.'
      });
    }

    if (typeof question !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Question must be a valid text string.'
      });
    }

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question cannot be empty. Please enter your inquiry.'
      });
    }

    if (trimmedQuestion.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Question exceeds maximum allowed length of 1000 characters. Please provide a more concise inquiry.'
      });
    }

    // 2. Validate optional schemeId
    let validatedSchemeId = null;
    if (schemeId !== undefined && schemeId !== null && schemeId !== '') {
      const numId = Number(schemeId);
      if (isNaN(numId) || numId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid scheme identifier. Must be a valid positive number.'
        });
      }
      const existingScheme = db.findById('schemes', numId);
      if (!existingScheme) {
        return res.status(404).json({
          success: false,
          message: `Scheme with ID ${schemeId} was not found in the verified directory.`
        });
      }
      validatedSchemeId = numId;
    }

    // 3. Validate supported language values
    let validatedLanguage = 'en';
    if (language) {
      const lowerLang = String(language).toLowerCase().trim();
      if (SUPPORTED_LANGUAGES.includes(lowerLang)) {
        validatedLanguage = lowerLang;
      } else {
        // Fallback gracefully to English if unrecognized language code sent
        validatedLanguage = 'en';
      }
    }

    // 4. Authenticated citizen profile resolution (or guest)
    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = (await import('jsonwebtoken')).default;
        const { config } = await import('../config.js');
        const decoded = jwt.verify(token, config.jwtSecret);
        userId = decoded.id;
      } catch (e) {
        // Guest mode continues gracefully without throwing
      }
    }

    // 5. Invoke answer engine
    const result = await AIService.answerQuestion(
      trimmedQuestion,
      validatedSchemeId,
      userId,
      validatedLanguage
    );

    // 6. Ensure predictable, complete response envelope
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
      message: 'An error occurred while generating your answer. Please try again or consult the official scheme portal.'
    });
  }
});

// POST /api/ai/explain/:id (Explain specific scheme in simple language)
router.post('/explain/:id', async (req, res) => {
  try {
    const schemeId = req.params.id;
    const numId = Number(schemeId);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid scheme ID parameter' });
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
    return res.status(500).json({ success: false, message: 'Error generating scheme explanation' });
  }
});

export default router;
