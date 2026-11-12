import express from 'express';
import { db } from '../db/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { anonymousProfileSchema } from '../schemas/validationSchemas.js';
import { EligibilityEngine } from '../services/eligibilityEngine.js';

const router = express.Router();

const evaluateProfileAgainstVerifiedSchemes = (profile) => {
  if (!profile) return [];

  const schemes = db.find(
    'schemes',
    s => s.active !== false && s.verificationStatus !== 'UNVERIFIED' && Boolean(s.sourceUrl)
  );

  const results = schemes.map(scheme => EligibilityEngine.evaluateScheme(scheme, profile));

  const order = { STRONG_MATCH: 1, POTENTIAL_MATCH: 2, MORE_INFORMATION_REQUIRED: 3, NOT_A_MATCH: 4 };
  const filtered = results.filter(r => r.matchType !== 'NOT_A_MATCH');

  return filtered.sort((a, b) => {
    const rankDiff = (order[a.matchType] || 5) - (order[b.matchType] || 5);
    if (rankDiff !== 0) return rankDiff;
    return b.matchScore - a.matchScore;
  });
};

// Helper to compute recommendations for a registered user
const calculateUserRecommendations = (userId) => {
  const profile = db.findOne('profiles', p => String(p.userId) === String(userId));
  return evaluateProfileAgainstVerifiedSchemes(profile);
};

// POST /api/recommendations/anonymous-check (No registration required — instant eligibility check)
router.post('/anonymous-check', validate(anonymousProfileSchema), (req, res) => {
  try {
    const recommendations = evaluateProfileAgainstVerifiedSchemes(req.body);
    return res.json({
      success: true,
      anonymous: true,
      message: `Computed ${recommendations.length} scheme recommendations in anonymous mode`,
      data: recommendations
    });
  } catch (err) {
    console.error('[Recommendations] Anonymous check error:', err);
    return res.status(500).json({ success: false, message: 'Server error computing anonymous recommendations' });
  }
});

// GET /api/recommendations
router.get('/', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const recommendations = calculateUserRecommendations(userId);

    return res.json({
      success: true,
      message: `Computed ${recommendations.length} scheme recommendations`,
      data: recommendations
    });
  } catch (err) {
    console.error('[Recommendations] Error:', err);
    return res.status(500).json({ success: false, message: 'Server error computing recommendations' });
  }
});

// POST /api/recommendations/generate (Force re-compute)
router.post('/generate', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const recommendations = calculateUserRecommendations(userId);

    return res.json({
      success: true,
      message: 'Recommendations freshly computed and synchronized with verified scheme database',
      data: recommendations
    });
  } catch (err) {
    console.error('[Recommendations] Generate error:', err);
    return res.status(500).json({ success: false, message: 'Server error generating recommendations' });
  }
});

export default router;
