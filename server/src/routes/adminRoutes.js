import express from 'express';
import { db } from '../db/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import { GovDataService } from '../services/govDataService.js';
import { RAGService } from '../services/ragService.js';
import { normalizeSchemeRecord } from '../data/stateExpansionLoader.js';
import { validateSchemesDataset } from '../../scripts/validate-schemes.js';

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


// GET /api/admin/analytics (Phase 7 - Genuine, Privacy-Safe Aggregate Policy Metrics)
router.get('/analytics', (req, res) => {
  const users = db.getCollection('users') || [];
  const profiles = db.getCollection('profiles') || [];
  const schemes = (db.getCollection('schemes') || []).map(normalizeSchemeRecord);
  const documentGuides = db.getCollection('documentGuides') || [];
  const userDocuments = db.getCollection('userDocuments') || [];

  // 1. Top Schemes Viewed (real aggregate counter from GET /api/schemes/:id)
  const mostViewedSchemes = schemes
    .map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      governmentLevel: s.governmentLevel,
      viewCount: Number(s.viewCount) || 0,
      lastVerified: s.lastVerifiedAt || s.lastVerified || ''
    }))
    .sort((a, b) => (b.viewCount - a.viewCount) || (Number(a.id) - Number(b.id)))
    .slice(0, 8);

  // 2. Most Common Missing Documents (real aggregate across userDocuments + active profiles)
  const missingCounter = new Map();
  const guideByType = new Map();
  for (const g of documentGuides) {
    if (g.documentType) guideByType.set(g.documentType.toUpperCase(), g);
  }

  for (const ud of userDocuments) {
    if (ud.status && ud.status !== 'AVAILABLE') {
      const key = String(ud.documentType || ud.documentName || 'UNKNOWN').toUpperCase();
      const guide = guideByType.get(key);
      const entry = missingCounter.get(key) || {
        documentType: key,
        documentName: guide?.title || ud.documentName || key,
        missingCount: 0,
        issuingAuthority: guide?.issuingAuthority || 'Notified Issuing Authority',
        rtsTimeline: guide?.expectedProcessingTime || 'Per State RTS SLA'
      };
      entry.missingCount += 1;
      missingCounter.set(key, entry);
    }
  }

  // Also aggregate in-hand gaps inferred from saved profile inHandDocuments vs active verified schemes
  for (const p of profiles) {
    const owned = new Set((p.inHandDocuments || []).map(d => String(d).toLowerCase()));
    const seenForProfile = new Set();
    for (const s of schemes) {
      if (s.active === false) continue;
      for (const reqDoc of (s.requiredDocuments || [])) {
        const docName = typeof reqDoc === 'string' ? reqDoc : reqDoc.documentName;
        const docType = String((typeof reqDoc === 'object' ? reqDoc.documentType : docName) || docName).toUpperCase();
        if (!docName || seenForProfile.has(docType)) continue;
        if (!owned.has(docName.toLowerCase()) && !owned.has(docType.toLowerCase())) {
          seenForProfile.add(docType);
          const guide = guideByType.get(docType);
          const entry = missingCounter.get(docType) || {
            documentType: docType,
            documentName: guide?.title || docName,
            missingCount: 0,
            issuingAuthority: guide?.issuingAuthority || 'Notified Issuing Authority',
            rtsTimeline: guide?.expectedProcessingTime || 'Per State RTS SLA'
          };
          entry.missingCount += 1;
          missingCounter.set(docType, entry);
        }
      }
    }
  }

  const mostCommonMissingDocuments = Array.from(missingCounter.values())
    .sort((a, b) => b.missingCount - a.missingCount)
    .slice(0, 8);

  // 3. Language Usage Distribution (real recorded events in db.data.languageMetrics)
  const rawLang = db.data?.languageMetrics || { en: 0, hi: 0, mr: 0 };
  const enCount = Number(rawLang.en) || 0;
  const hiCount = Number(rawLang.hi) || 0;
  const mrCount = Number(rawLang.mr) || 0;
  const totalLangEvents = enCount + hiCount + mrCount;
  const languageUsage = {
    english: totalLangEvents > 0 ? Math.round((enCount / totalLangEvents) * 100) : 0,
    marathi: totalLangEvents > 0 ? Math.round((mrCount / totalLangEvents) * 100) : 0,
    hindi: totalLangEvents > 0 ? Math.round((hiCount / totalLangEvents) * 100) : 0,
    counts: { en: enCount, mr: mrCount, hi: hiCount },
    totalEvents: totalLangEvents
  };

  // 4. Scheme Category Breakdown
  const categoryCounts = {};
  schemes.forEach(s => {
    const cat = s.category || 'GENERAL';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  // 5. Real Citizen Distribution by Category (no synthetic padding)
  const citizenCategoryDistribution = {
    STUDENT: profiles.filter(p => p.category === 'STUDENT').length,
    FARMER: profiles.filter(p => p.category === 'FARMER').length,
    BUSINESS_OWNER: profiles.filter(p => p.category === 'BUSINESS_OWNER').length,
    GENERAL_CITIZEN: profiles.filter(p => p.category === 'GENERAL_CITIZEN').length
  };

  // 6. Unanswered / Low-Confidence AI Queries & Feedback Reports (privacy-safe)
  const unansweredQueries = (db.getCollection('unansweredAiQueries') || []).slice(-15).reverse();
  const feedbackItems = db.getCollection('feedback') || [];
  const aiThumbsUp = feedbackItems.filter(f => f.aiVote === 'up').length;
  const aiThumbsDown = feedbackItems.filter(f => f.aiVote === 'down').length;
  const citizenErrorReports = feedbackItems
    .filter(f => f.feedbackType === 'ERROR_REPORT' || f.feedbackType === 'CORRECTION' || f.feedbackType === 'SUGGESTION')
    .slice(-20)
    .reverse()
    .map(f => ({
      id: f.id,
      schemeId: f.schemeId || null,
      guideId: f.guideId || null,
      feedbackType: f.feedbackType,
      comment: f.comment,
      status: f.status || 'PENDING',
      createdAt: f.createdAt
    }));

  // 7. Data Freshness & Verification Hygiene Report
  const freshnessReport = validateSchemesDataset({ schemes });

  return res.json({
    success: true,
    data: {
      totalSchemes: schemes.length,
      totalGuides: documentGuides.length,
      totalRegisteredCitizens: users.length,
      totalProfiles: profiles.length,
      mostViewedSchemes,
      mostCommonMissingDocuments,
      languageUsage,
      categoryCounts,
      citizenCategoryDistribution,
      unansweredAiQueries: unansweredQueries,
      aiEvaluationSignals: { thumbsUp: aiThumbsUp, thumbsDown: aiThumbsDown },
      feedbackReports: {
        totalReports: citizenErrorReports.length,
        pendingReports: citizenErrorReports.filter(r => r.status === 'PENDING').length,
        items: citizenErrorReports
      },
      freshnessSummary: {
        activeVerifiedCount: freshnessReport.activeCount,
        missingMetadataErrors: freshnessReport.errors.length,
        staleOver180DaysCount: freshnessReport.staleWarnings.length
      },
      lastAnalyzedAt: new Date().toISOString()
    }
  });
});

// PUT /api/admin/feedback/:id/resolve (Mark citizen error report reviewed/resolved)
router.put('/feedback/:id/resolve', (req, res) => {
  const report = db.findById('feedback', req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, message: 'Feedback report not found' });
  }
  const nextStatus = req.body?.status === 'PENDING' ? 'PENDING' : 'RESOLVED';
  const updated = db.update('feedback', report.id, {
    status: nextStatus,
    resolvedAt: nextStatus === 'RESOLVED' ? new Date().toISOString() : null
  });
  return res.json({ success: true, message: `Report marked as ${nextStatus}`, data: updated });
});

// POST /api/admin/sync-and-analyze (Live Scheme Pipeline & RAG Knowledge Sync)
router.post('/sync-and-analyze', async (req, res) => {
  try {
    console.log(`[Admin] Initiating live synchronization & analyzation by ${req.user.email}...`);
    const govReport = await GovDataService.fetchAndSync();
    const ragIndex = await RAGService.buildKnowledgeBase();

    const schemes = db.getCollection('schemes');
    const documentGuides = db.getCollection('documentGuides');
    const verifiedSchemes = schemes.filter(s => s.verificationStatus === 'VERIFIED').length;

    return res.json({
      success: true,
      message: `Live synchronization & AI analyzation completed: ${schemes.length} schemes indexed with ${ragIndex.totalChunks} knowledge chunks.`,
      data: {
        totalSchemes: schemes.length,
        verifiedSchemes,
        totalGuides: documentGuides.length,
        totalChunksIndexed: ragIndex.totalChunks,
        syncReport: govReport,
        analyzedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[Admin] Sync & Analyzation failed:', err);
    return res.status(500).json({
      success: false,
      error: 'SyncAnalyzationError',
      message: 'Failed to complete live synchronization & analyzation: ' + err.message
    });
  }
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
  const {
    name,
    description,
    category,
    governmentLevel,
    level,
    state,
    benefit,
    sourceUrl,
    officialUrl,
    lastVerifiedAt,
    verifiedBy,
    rules,
    requiredDocuments,
    documents,
    applicationGuides
  } = req.body;
  const effectiveLevel = level || governmentLevel;
  if (!name || !description || !category || !effectiveLevel) {
    return res.status(400).json({ success: false, message: 'Name, description, category, and level/governmentLevel are required' });
  }

  const effectiveSourceUrl = (sourceUrl || officialUrl || '').trim();
  const hasOfficialSource = Boolean(effectiveSourceUrl);
  const verifiedDate = hasOfficialSource ? (lastVerifiedAt || new Date().toISOString().split('T')[0]) : '';

  const newScheme = db.insert('schemes', normalizeSchemeRecord({
    name: name.trim(),
    description: description.trim(),
    category,
    level: effectiveLevel,
    governmentLevel: effectiveLevel,
    state: state || 'All India',
    benefit: benefit || '',
    officialUrl: effectiveSourceUrl,
    sourceUrl: effectiveSourceUrl,
    lastVerified: verifiedDate,
    lastVerifiedAt: verifiedDate,
    verifiedBy: verifiedBy || (hasOfficialSource ? (req.user?.email || 'JanSahay Admin') : ''),
    active: hasOfficialSource,
    isDemoData: false,
    verificationStatus: hasOfficialSource ? 'VERIFIED' : 'UNVERIFIED',
    rules: rules || [],
    documents: documents || requiredDocuments || [],
    requiredDocuments: requiredDocuments || documents || [],
    applicationGuides: applicationGuides || [],
    viewCount: 0
  }));

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
