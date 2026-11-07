import express from 'express';
import { db } from '../db/database.js';

const router = express.Router();

// GET /api/documents/guides (List with filters)
router.get('/', (req, res) => {
  try {
    const { documentType, state, verificationStatus } = req.query;

    let guides = db.find('documentGuides', g => g.publicationStatus === 'PUBLISHED');

    if (documentType) {
      guides = guides.filter(g => g.documentType.toUpperCase() === documentType.toUpperCase());
    }

    if (state && state !== 'All') {
      guides = guides.filter(g => g.applicableState === 'All India' || g.applicableState.toLowerCase() === state.toLowerCase());
    }

    if (verificationStatus) {
      guides = guides.filter(g => g.verificationStatus.toUpperCase() === verificationStatus.toUpperCase());
    }

    return res.json({
      success: true,
      data: guides
    });
  } catch (err) {
    console.error('[Guides] Error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving document guides' });
  }
});

// GET /api/documents/guides/:id
router.get('/:id', (req, res) => {
  const guide = db.findById('documentGuides', req.params.id);
  if (!guide) {
    return res.status(404).json({ success: false, message: 'Document acquisition guide not found' });
  }
  return res.json({
    success: true,
    data: guide
  });
});

// GET /api/documents/guides/by-type/:documentType
router.get('/by-type/:documentType', (req, res) => {
  const { documentType } = req.params;
  const { state = 'Maharashtra' } = req.query;

  // Prefer state-specific guide, fallback to national guide
  let guide = db.findOne('documentGuides', g =>
    g.documentType.toUpperCase() === documentType.toUpperCase() &&
    g.applicableState.toLowerCase() === state.toLowerCase() &&
    g.publicationStatus === 'PUBLISHED'
  );

  if (!guide) {
    guide = db.findOne('documentGuides', g =>
      g.documentType.toUpperCase() === documentType.toUpperCase() &&
      g.applicableState === 'All India' &&
      g.publicationStatus === 'PUBLISHED'
    );
  }

  if (!guide) {
    guide = db.findOne('documentGuides', g =>
      g.documentType.toUpperCase() === documentType.toUpperCase() &&
      g.publicationStatus === 'PUBLISHED'
    );
  }

  if (!guide) {
    return res.status(404).json({
      success: false,
      message: 'Detailed instructions have not yet been verified. Please consult the issuing authority through the official information link.'
    });
  }

  return res.json({
    success: true,
    data: guide
  });
});

export default router;
