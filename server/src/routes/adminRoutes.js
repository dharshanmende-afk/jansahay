import express from 'express';
import { db } from '../db/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Apply auth and admin middleware to all admin endpoints
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/dashboard (System Statistics)
router.get('/dashboard', (req, res) => {
  const users = db.getCollection('users');
  const schemes = db.getCollection('schemes');
  const documentGuides = db.getCollection('documentGuides');
  const updates = db.getCollection('updates');

  const verifiedGuides = documentGuides.filter(g => g.verificationStatus === 'VERIFIED');
  const outdatedGuides = documentGuides.filter(g => g.verificationStatus === 'OUTDATED');
  const activeSchemes = schemes.filter(s => s.active !== false);

  return res.json({
    success: true,
    data: {
      totalUsers: users.length,
      totalSchemes: schemes.length,
      activeSchemesCount: activeSchemes.length,
      totalDocumentGuides: documentGuides.length,
      verifiedGuidesCount: verifiedGuides.length,
      outdatedGuidesCount: outdatedGuides.length,
      totalUpdates: updates.length
    }
  });
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  const users = db.getCollection('users').map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt
  }));
  return res.json({ success: true, data: users });
});

// --- Scheme Management Endpoints ---

// GET /api/admin/schemes
router.get('/schemes', (req, res) => {
  const schemes = db.getCollection('schemes');
  return res.json({ success: true, data: schemes });
});

// POST /api/admin/schemes
router.post('/schemes', (req, res) => {
  const { name, description, category, governmentLevel, state, benefit, sourceUrl, rules, requiredDocuments, applicationGuides } = req.body;
  if (!name || !description || !category || !governmentLevel) {
    return res.status(400).json({ success: false, message: 'Name, description, category, and governmentLevel are required' });
  }

  const newScheme = db.insert('schemes', {
    name: name.trim(),
    description: description.trim(),
    category,
    governmentLevel,
    state: state || 'All India',
    benefit: benefit || '',
    sourceUrl: sourceUrl || '',
    lastVerified: new Date().toISOString().split('T')[0],
    active: true,
    isDemoData: false,
    verificationStatus: 'VERIFIED',
    rules: rules || [],
    requiredDocuments: requiredDocuments || [],
    applicationGuides: applicationGuides || []
  });

  return res.status(201).json({ success: true, message: 'Scheme created successfully', data: newScheme });
});

// PUT /api/admin/schemes/:id
router.put('/schemes/:id', (req, res) => {
  const scheme = db.findById('schemes', req.params.id);
  if (!scheme) {
    return res.status(404).json({ success: false, message: 'Scheme not found' });
  }

  const updated = db.update('schemes', req.params.id, {
    ...req.body,
    lastVerified: req.body.lastVerified || new Date().toISOString().split('T')[0]
  });

  return res.json({ success: true, message: 'Scheme updated successfully', data: updated });
});

// DELETE /api/admin/schemes/:id
router.delete('/schemes/:id', (req, res) => {
  const success = db.delete('schemes', req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Scheme not found' });
  }
  return res.json({ success: true, message: 'Scheme deleted' });
});

// --- Document Guide Knowledge Base Endpoints ---

// GET /api/admin/document-guides (Includes drafts and archived)
router.get('/document-guides', (req, res) => {
  const guides = db.getCollection('documentGuides');
  // Enrich each guide with count of schemes that reference this documentType
  const schemes = db.getCollection('schemes');

  const enriched = guides.map(guide => {
    const referencingSchemes = schemes.filter(s =>
      s.requiredDocuments && s.requiredDocuments.some(d => d.documentType === guide.documentType)
    ).map(s => ({ id: s.id, name: s.name }));

    return {
      ...guide,
      referencingSchemesCount: referencingSchemes.length,
      referencingSchemes
    };
  });

  return res.json({ success: true, data: enriched });
});

// POST /api/admin/document-guides
router.post('/document-guides', (req, res) => {
  const {
    documentType,
    title,
    simpleDescription,
    applicableState = 'All India',
    issuingAuthority,
    eligibilityOrPrerequisites,
    requiredSupportingDocuments = [],
    applicationSteps = [],
    applicationMethod = 'BOTH',
    officialApplicationUrl,
    officialInformationUrl,
    possibleFees,
    expectedProcessingTime,
    additionalNotes
  } = req.body;

  if (!documentType || !title || !simpleDescription) {
    return res.status(400).json({ success: false, message: 'documentType, title, and simpleDescription are required' });
  }

  const newGuide = db.insert('documentGuides', {
    documentType: documentType.trim().toUpperCase(),
    title: title.trim(),
    simpleDescription: simpleDescription.trim(),
    applicableState: applicableState.trim(),
    issuingAuthority: issuingAuthority || '',
    eligibilityOrPrerequisites: eligibilityOrPrerequisites || '',
    requiredSupportingDocuments: Array.isArray(requiredSupportingDocuments) ? requiredSupportingDocuments : [],
    applicationSteps: Array.isArray(applicationSteps) ? applicationSteps : [],
    applicationMethod,
    officialApplicationUrl: officialApplicationUrl || '',
    officialInformationUrl: officialInformationUrl || '',
    possibleFees: possibleFees || '',
    expectedProcessingTime: expectedProcessingTime || '',
    lastVerifiedAt: new Date().toISOString().split('T')[0],
    verificationStatus: 'UNVERIFIED', // New guides start as unverified until checked
    publicationStatus: 'PUBLISHED',
    additionalNotes: additionalNotes || ''
  });

  return res.status(201).json({ success: true, message: 'Document Guide added to knowledge base', data: newGuide });
});

// PUT /api/admin/document-guides/:id
router.put('/document-guides/:id', (req, res) => {
  const guide = db.findById('documentGuides', req.params.id);
  if (!guide) {
    return res.status(404).json({ success: false, message: 'Document guide not found' });
  }

  const updated = db.update('documentGuides', req.params.id, {
    ...req.body,
    // When editing content, require re-verification unless explicitly set
    verificationStatus: req.body.verificationStatus || guide.verificationStatus
  });

  return res.json({ success: true, message: 'Document guide updated', data: updated });
});

// PUT /api/admin/document-guides/:id/verify (Mark as Verified, Unverified, or Outdated)
router.put('/document-guides/:id/verify', (req, res) => {
  const { status = 'VERIFIED' } = req.body;
  const guide = db.findById('documentGuides', req.params.id);
  if (!guide) {
    return res.status(404).json({ success: false, message: 'Document guide not found' });
  }

  const updated = db.update('documentGuides', req.params.id, {
    verificationStatus: status,
    lastVerifiedAt: new Date().toISOString().split('T')[0]
  });

  return res.json({ success: true, message: `Guide marked as ${status}`, data: updated });
});

// PUT /api/admin/document-guides/:id/publish (Publish or Archive)
router.put('/document-guides/:id/publish', (req, res) => {
  const { status = 'PUBLISHED' } = req.body;
  const guide = db.findById('documentGuides', req.params.id);
  if (!guide) {
    return res.status(404).json({ success: false, message: 'Document guide not found' });
  }

  const updated = db.update('documentGuides', req.params.id, {
    publicationStatus: status
  });

  return res.json({ success: true, message: `Publication status set to ${status}`, data: updated });
});

// DELETE /api/admin/document-guides/:id
router.delete('/document-guides/:id', (req, res) => {
  const success = db.delete('documentGuides', req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Document guide not found' });
  }
  return res.json({ success: true, message: 'Document guide deleted' });
});

export default router;
