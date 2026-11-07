import express from 'express';
import { db } from '../db/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { DocumentAnalysisService } from '../services/documentAnalysisService.js';
import { EligibilityEngine } from '../services/eligibilityEngine.js';

const router = express.Router();

// GET /api/schemes (Search & Filter)
router.get('/', (req, res) => {
  try {
    const { keyword, category, governmentLevel, state, page = 0, size = 50 } = req.query;

    let schemes = db.find('schemes', s => s.active !== false);

    if (category) {
      schemes = schemes.filter(s => s.category.toUpperCase() === category.toUpperCase());
    }

    if (governmentLevel) {
      schemes = schemes.filter(s => s.governmentLevel.toUpperCase() === governmentLevel.toUpperCase());
    }

    if (state && state !== 'All') {
      schemes = schemes.filter(s => s.state === 'All India' || s.state.toLowerCase() === state.toLowerCase());
    }

    if (keyword) {
      const q = keyword.toLowerCase();
      schemes = schemes.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.benefit.toLowerCase().includes(q) ||
        (s.targetBeneficiaries && s.targetBeneficiaries.toLowerCase().includes(q))
      );
    }

    const totalElements = schemes.length;
    const start = parseInt(page) * parseInt(size);
    const content = schemes.slice(start, start + parseInt(size));

    return res.json({
      success: true,
      data: {
        content,
        totalElements,
        totalPages: Math.ceil(totalElements / parseInt(size)),
        page: parseInt(page),
        size: parseInt(size)
      }
    });
  } catch (err) {
    console.error('[Schemes] Search error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving schemes' });
  }
});

// GET /api/schemes/:id
router.get('/:id', (req, res) => {
  const scheme = db.findById('schemes', req.params.id);
  if (!scheme) {
    return res.status(404).json({ success: false, message: 'Scheme record not found' });
  }
  return res.json({
    success: true,
    data: scheme
  });
});

// GET /api/schemes/:id/documents
router.get('/:id/documents', (req, res) => {
  const scheme = db.findById('schemes', req.params.id);
  if (!scheme) {
    return res.status(404).json({ success: false, message: 'Scheme record not found' });
  }
  return res.json({
    success: true,
    data: scheme.requiredDocuments || []
  });
});

// GET /api/schemes/:id/document-readiness (Authenticated)
router.get('/:id/document-readiness', authMiddleware, (req, res) => {
  const scheme = db.findById('schemes', req.params.id);
  if (!scheme) {
    return res.status(404).json({ success: false, message: 'Scheme record not found' });
  }

  const profile = db.findOne('profiles', p => String(p.userId) === String(req.user.id));
  const userState = profile?.state || 'Maharashtra';

  const readiness = DocumentAnalysisService.evaluateSchemeDocuments(scheme, req.user.id, userState);

  return res.json({
    success: true,
    data: readiness
  });
});

// GET /api/schemes/:id/application-guide
router.get('/:id/application-guide', (req, res) => {
  const scheme = db.findById('schemes', req.params.id);
  if (!scheme) {
    return res.status(404).json({ success: false, message: 'Scheme record not found' });
  }
  return res.json({
    success: true,
    data: (scheme.applicationGuides || []).sort((a, b) => a.stepNumber - b.stepNumber)
  });
});

export default router;
