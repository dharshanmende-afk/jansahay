import express from 'express';
import jwt from 'jsonwebtoken';
import { AIService } from '../services/aiService.js';
import { AgentService } from '../services/ai/agentService.js';
import { db } from '../db/database.js';
import { config } from '../config.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { aiChatSchema, aiExplainSchema, aiFeedbackSchema } from '../schemas/validationSchemas.js';
import { redactSensitivePII } from '../services/ai/safety.js';

const router = express.Router();

const SUPPORTED_LANGUAGES = ['en', 'hi', 'mr'];

function resolveOptionalUserId(req) {
  if (req.user?.id) return req.user.id;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret);
      return decoded?.id || null;
    } catch {
      return null;
    }
  }
  return null;
}

// POST /api/ai/chat (Authenticated citizen or guest, rate-limited and Zod-validated)
router.post('/chat', aiLimiter, validate(aiChatSchema), async (req, res) => {
  try {
    const { question, message, schemeId, language, sessionId, mode, inHandDocuments } = req.body;
    const queryText = (question || message || '').trim();

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

    const validatedLanguage = language && SUPPORTED_LANGUAGES.includes(String(language).toLowerCase())
      ? String(language).toLowerCase()
      : null;

    const userId = resolveOptionalUserId(req);

    const result = await AgentService.runConversation({
      question: queryText,
      userId,
      sessionId: sessionId || null,
      language: validatedLanguage,
      schemeId: validatedSchemeId,
      mode: mode || 'default',
      inHandDocuments: inHandDocuments || []
    });

    db.recordLanguageUsage(result.language || validatedLanguage || 'en');

    return res.json({
      success: true,
      data: {
        answer: result.answer,
        provider: result.provider || 'JanSahay Grounded Engine',
        limitedMode: result.limitedMode ?? true,
        language: result.language || validatedLanguage || 'en',
        isRomanised: Boolean(result.isRomanised),
        sources: result.sources || [],
        matchedSchemes: result.matchedSchemes || [],
        nextSteps: result.nextSteps || [],
        suggestedActions: result.suggestedActions || [],
        extractedProfile: result.extractedProfile || {},
        toolCalls: result.toolCalls || [],
        sessionId: result.sessionId || null,
        messageId: result.messageId || null,
        disclaimer: result.disclaimer,
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

// POST /api/ai/chat/stream (Server-Sent Events streaming endpoint for status chips & progressive chunks)
router.post('/chat/stream', aiLimiter, validate(aiChatSchema), async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  const sendSse = (event, payload) => {
    if (res.writableEnded) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    const { question, message, schemeId, language, sessionId, mode, inHandDocuments } = req.body;
    const queryText = (question || message || '').trim();
    const validatedLanguage = language && SUPPORTED_LANGUAGES.includes(String(language).toLowerCase())
      ? String(language).toLowerCase()
      : null;
    const validatedSchemeId = schemeId && !isNaN(Number(schemeId)) && Number(schemeId) > 0 ? Number(schemeId) : null;
    const userId = resolveOptionalUserId(req);

    sendSse('status', { message: 'Understanding your request...' });

    const result = await AgentService.runConversation({
      question: queryText,
      userId,
      sessionId: sessionId || null,
      language: validatedLanguage,
      schemeId: validatedSchemeId,
      mode: mode || 'default',
      inHandDocuments: inHandDocuments || [],
      onEvent: (evt) => {
        if (evt.type === 'status') sendSse('status', { message: evt.message });
        else if (evt.type === 'tool') sendSse('tool', { toolName: evt.toolName, durationMs: evt.durationMs, ok: evt.ok });
      }
    });

    const tokens = (result.answer || '').split(/(\s+)/);
    const chunkSize = 14;
    for (let i = 0; i < tokens.length; i += chunkSize) {
      const piece = tokens.slice(i, i + chunkSize).join('');
      if (piece) sendSse('chunk', { text: piece });
    }

    db.recordLanguageUsage(result.language || validatedLanguage || 'en');

    sendSse('done', result);
    return res.end();
  } catch (err) {
    sendSse('error', { message: err.message || 'Streaming error' });
    return res.end();
  }
});

// POST /api/ai/feedback (Store thumbs up/down ratings for continuous evaluation)
router.post('/feedback', aiLimiter, validate(aiFeedbackSchema), (req, res) => {
  try {
    const { sessionId, messageId, rating, question, comment } = req.body;
    const userId = resolveOptionalUserId(req);
    const saved = db.insert('feedback', {
      userId: userId || null,
      sessionId: sessionId || null,
      messageId: messageId || null,
      feedbackType: 'AI_RATING',
      rating: rating === 'up' ? 5 : 1,
      aiVote: rating,
      question: question ? redactSensitivePII(question) : null,
      comment: comment ? redactSensitivePII(comment) : `AI response rated ${rating}`,
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: 'AI feedback recorded for evaluation',
      data: saved
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to store AI feedback'
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
