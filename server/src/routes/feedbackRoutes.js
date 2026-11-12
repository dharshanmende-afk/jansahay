// ==============================================================================
// JanSahay AI — Feedback & Error Reporting Routes
// Allows citizens to submit feedback or report inaccurate scheme/guide data
// ==============================================================================

import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { config } from '../config.js';
import { validate } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import { feedbackSchema } from '../schemas/validationSchemas.js';

const router = express.Router();

// Helper to extract optional citizen user without rejecting guests
const optionalUser = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    return decoded.id || decoded.userId || null;
  } catch {
    return null;
  }
};

// POST /api/feedback (Public / Citizen Report)
router.post('/', validate(feedbackSchema), async (req, res) => {
  try {
    const userId = optionalUser(req);
    const { schemeId, guideId, feedbackType = 'CORRECTION', comment, rating } = req.body;

    const feedbackDoc = {
      userId: userId ? Number(userId) : null,
      schemeId: schemeId ? Number(schemeId) : null,
      guideId: guideId ? Number(guideId) : null,
      feedbackType,
      comment: comment.trim(),
      rating: rating ? Number(rating) : null,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    const inserted = db.insert('feedback', feedbackDoc);

    // Save to Prisma if active
    if (db.prisma && await db.isPrismaConnected()) {
      await db.prisma.feedback.create({
        data: {
          userId: feedbackDoc.userId,
          schemeId: feedbackDoc.schemeId,
          guideId: feedbackDoc.guideId,
          feedbackType: feedbackDoc.feedbackType,
          comment: feedbackDoc.comment,
          rating: feedbackDoc.rating,
          status: 'PENDING'
        }
      }).catch(err => console.warn('[Feedback] Prisma write note:', err.message));
    }

    return res.status(201).json({
      success: true,
      message: 'Feedback and correction report received. Thank you for helping keep government information accurate.',
      data: inserted
    });
  } catch (err) {
    console.error('[Feedback] Submission error:', err);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: 'Failed to record feedback. Please try again later.'
    });
  }
});

// GET /api/feedback (Admin Only — View feedback & correction reports)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const reports = db.find('feedback');
    return res.json({
      success: true,
      data: reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  } catch (err) {
    console.error('[Feedback] Admin query error:', err);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: 'Failed to retrieve feedback reports.'
    });
  }
});

export default router;
