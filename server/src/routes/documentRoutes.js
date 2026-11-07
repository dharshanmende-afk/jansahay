import express from 'express';
import { db } from '../db/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { DocumentAnalysisService } from '../services/documentAnalysisService.js';
import { EligibilityEngine } from '../services/eligibilityEngine.js';

const router = express.Router();

// GET /api/documents (Get user's personal document checklist)
router.get('/', authMiddleware, (req, res) => {
  const userDocs = db.find('userDocuments', doc => String(doc.userId) === String(req.user.id));
  return res.json({
    success: true,
    data: userDocs
  });
});

// PUT /api/documents/status (Update document status: AVAILABLE, MISSING, NEEDS_VERIFICATION)
router.put('/status', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const { documentName, documentType, status, notes } = req.body;

    if (!documentName || !status) {
      return res.status(400).json({ success: false, message: 'Document name and status are required' });
    }

    const validStatuses = ['AVAILABLE', 'MISSING', 'NEEDS_VERIFICATION', 'NOT_YET_CHECKED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    // Check if user already has an entry for this document
    const existing = db.findOne('userDocuments', doc =>
      String(doc.userId) === String(userId) &&
      (
        (doc.documentType && documentType && doc.documentType.toUpperCase() === documentType.toUpperCase()) ||
        doc.documentName.toLowerCase() === documentName.toLowerCase()
      )
    );

    let updated;
    if (existing) {
      updated = db.update('userDocuments', existing.id, {
        status,
        notes: notes !== undefined ? notes : existing.notes,
        documentType: documentType || existing.documentType
      });
    } else {
      updated = db.insert('userDocuments', {
        userId,
        documentType: documentType || null,
        documentName: documentName.trim(),
        status,
        notes: notes || null
      });
    }

    return res.json({
      success: true,
      message: `Document status marked as ${status}`,
      data: updated
    });
  } catch (err) {
    console.error('[Documents] Update status error:', err);
    return res.status(500).json({ success: false, message: 'Server error updating document status' });
  }
});

// PUT /api/checklists/:schemeId (Update checklist items for a specific scheme)
router.put('/checklists/:schemeId', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const { documentName, documentType, status } = req.body;

    if (!documentName || !status) {
      return res.status(400).json({ success: false, message: 'Document name and status required' });
    }

    const existing = db.findOne('userDocuments', doc =>
      String(doc.userId) === String(userId) &&
      (
        (doc.documentType && documentType && doc.documentType.toUpperCase() === documentType.toUpperCase()) ||
        doc.documentName.toLowerCase() === documentName.toLowerCase()
      )
    );

    let result;
    if (existing) {
      result = db.update('userDocuments', existing.id, { status, documentType: documentType || existing.documentType });
    } else {
      result = db.insert('userDocuments', {
        userId,
        documentName: documentName.trim(),
        documentType: documentType || null,
        status
      });
    }

    return res.json({
      success: true,
      message: `Checklist updated for scheme`,
      data: result
    });
  } catch (err) {
    console.error('[Checklist] Error:', err);
    return res.status(500).json({ success: false, message: 'Server error updating checklist' });
  }
});

// GET /api/documents/preparation-dashboard ("My Document Preparation" Dashboard)
router.get('/preparation-dashboard', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const profile = db.findOne('profiles', p => String(p.userId) === String(userId));
    const userState = profile?.state || 'Maharashtra';

    // Find recommended schemes for user
    const schemes = db.find('schemes', s => s.active !== false);
    const recommendedSchemes = [];

    if (profile) {
      for (const scheme of schemes) {
        const evalRes = EligibilityEngine.evaluateScheme(scheme, profile);
        if (evalRes.matchType !== 'NOT_A_MATCH') {
          recommendedSchemes.push({
            ...scheme,
            matchType: evalRes.matchType,
            matchScore: evalRes.matchScore
          });
        }
      }
    }

    const dashboard = DocumentAnalysisService.getConsolidatedPreparationDashboard(
      userId,
      recommendedSchemes,
      userState
    );

    return res.json({
      success: true,
      data: dashboard
    });
  } catch (err) {
    console.error('[Preparation Dashboard] Error:', err);
    return res.status(500).json({ success: false, message: 'Server error calculating document preparation dashboard' });
  }
});

export default router;
