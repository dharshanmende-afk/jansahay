/**
 * tools.js — Step 5a: Zod-Validated AI Agent Tool Registry
 *
 * Implements the "LLM Explains, Engine Decides" architecture.
 * All factual scheme lookup, deterministic eligibility matching, missing document
 * calculations, RTS document guides, live policy updates, and profile updates
 * execute strictly via verified deterministic tools and DB collections.
 */

import { z } from 'zod';
import { db } from '../../db/database.js';
import { EligibilityEngine } from '../eligibilityEngine.js';
import { DocumentAnalysisService } from '../documentAnalysisService.js';
import { RAGService } from '../ragService.js';
import { RealtimeService } from '../realtimeService.js';
import { logger } from '../../utils/logger.js';

// Allowed safe profile fields (never Aadhaar, bank account, IFSC, or passwords)
export const SAFE_PROFILE_FIELDS = [
  'category',
  'state',
  'district',
  'occupation',
  'incomeRange',
  'annualIncome',
  'educationLevel',
  'course',
  'currentYear',
  'farmingType',
  'cropActivity',
  'landArea',
  'landOwnership',
  'businessType',
  'businessStage',
  'msmeStatus',
  'disabilityStatus'
];

const profileFieldsSchema = z.object({
  category: z.string().trim().optional(),
  state: z.string().trim().optional(),
  district: z.string().trim().optional(),
  occupation: z.string().trim().optional(),
  incomeRange: z.string().trim().optional(),
  annualIncome: z.number().nonnegative().optional(),
  educationLevel: z.string().trim().optional(),
  course: z.string().trim().optional(),
  currentYear: z.number().int().positive().optional(),
  farmingType: z.string().trim().optional(),
  cropActivity: z.string().trim().optional(),
  landArea: z.number().nonnegative().optional(),
  landOwnership: z.string().trim().optional(),
  businessType: z.string().trim().optional(),
  businessStage: z.string().trim().optional(),
  msmeStatus: z.string().trim().optional(),
  disabilityStatus: z.string().trim().optional()
}).strict();

export const toolSchemas = {
  search_schemes: z.object({
    query: z.string().trim().min(1, 'Search query is required').max(300),
    category: z.string().trim().optional(),
    state: z.string().trim().optional(),
    limit: z.number().int().min(1).max(15).optional().default(5)
  }),
  get_scheme_details: z.object({
    schemeId: z.union([z.number().int().positive(), z.string().trim().min(1)])
  }),
  check_eligibility: z.object({
    profile: z.record(z.string(), z.any()).optional().default({}),
    schemeId: z.union([z.number().int().positive(), z.string().trim().min(1)]).optional()
  }),
  get_missing_documents: z.object({
    schemeId: z.union([z.number().int().positive(), z.string().trim().min(1)])
  }),
  get_document_guide: z.object({
    documentType: z.string().trim().min(1, 'Document type or title keyword is required').max(200),
    state: z.string().trim().optional()
  }),
  get_latest_updates: z.object({
    category: z.string().trim().optional(),
    limit: z.number().int().min(1).max(15).optional().default(5)
  }),
  update_profile: z.object({
    fields: profileFieldsSchema,
    userConfirmed: z.boolean().default(false)
  })
};

/**
 * Gemini Function Calling Declarations (OpenAPI subset supported by Gemini API)
 */
export const GEMINI_FUNCTION_DECLARATIONS = [
  {
    name: 'search_schemes',
    description: 'Search verified government schemes using semantic and keyword matching. Always verify scheme names, benefits, official URLs, and lastVerified dates from this tool.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Citizen question or search keywords (e.g., "farmer subsidy Maharashtra", "engineering scholarship", "MSME loan")' },
        category: { type: 'STRING', description: 'Optional category filter: EDUCATION, AGRICULTURE, BUSINESS, HOUSING, HEALTHCARE, WOMEN_CHILD, SOCIAL_WELFARE' },
        state: { type: 'STRING', description: 'Optional state filter, e.g., "Maharashtra" or "All India"' },
        limit: { type: 'INTEGER', description: 'Max number of schemes to return (default 5)' }
      },
      required: ['query']
    }
  },
  {
    name: 'get_scheme_details',
    description: 'Get complete official details, rules, required documents, application steps, sourceUrl, and lastVerified date for a specific scheme by ID or name.',
    parameters: {
      type: 'OBJECT',
      properties: {
        schemeId: { type: 'STRING', description: 'Numeric scheme ID or exact scheme name' }
      },
      required: ['schemeId']
    }
  },
  {
    name: 'check_eligibility',
    description: 'Run the deterministic EligibilityEngine to evaluate a citizen profile against verified schemes (or one specific scheme). Never determine eligibility manually—always call this tool.',
    parameters: {
      type: 'OBJECT',
      properties: {
        profile: {
          type: 'OBJECT',
          description: 'Citizen attributes such as category (STUDENT/FARMER/BUSINESS_OWNER/GENERAL_CITIZEN), state, incomeRange (BELOW_1_LAKH/BELOW_2_LAKH/BELOW_3_LAKH/BELOW_5_LAKH/BELOW_8_LAKH), educationLevel, landArea, businessStage.'
        },
        schemeId: { type: 'STRING', description: 'Optional numeric scheme ID to check a single scheme' }
      }
    }
  },
  {
    name: 'get_missing_documents',
    description: 'Check which required documents the citizen already has in-hand and which documents are still missing for a given schemeId.',
    parameters: {
      type: 'OBJECT',
      properties: {
        schemeId: { type: 'STRING', description: 'Numeric scheme ID' }
      },
      required: ['schemeId']
    }
  },
  {
    name: 'get_document_guide',
    description: 'Get step-by-step official instructions, issuing authority, official portal URL, processing time, fees, and lastVerifiedAt for obtaining an Indian government document (e.g., Income Certificate, Domicile, Caste Validity, Non-Creamy Layer, 7/12 Extract, Udyam).',
    parameters: {
      type: 'OBJECT',
      properties: {
        documentType: { type: 'STRING', description: 'Document type code or name (e.g., INCOME_CERTIFICATE, DOMICILE_CERTIFICATE, 7/12, Caste Certificate)' },
        state: { type: 'STRING', description: 'Optional state name (e.g., Maharashtra)' }
      },
      required: ['documentType']
    }
  },
  {
    name: 'get_latest_updates',
    description: 'Retrieve latest verified policy announcements, scholarship deadline updates, and circulars.',
    parameters: {
      type: 'OBJECT',
      properties: {
        category: { type: 'STRING', description: 'Optional category filter (EDUCATION, AGRICULTURE, BUSINESS, GENERAL)' },
        limit: { type: 'INTEGER', description: 'Number of updates to return (default 5)' }
      }
    }
  },
  {
    name: 'update_profile',
    description: 'Save citizen profile fields ONLY after the citizen explicitly states those fields and confirms updating their profile.',
    parameters: {
      type: 'OBJECT',
      properties: {
        fields: {
          type: 'OBJECT',
          description: 'Safe profile fields stated by the citizen (category, state, district, occupation, incomeRange, annualIncome, educationLevel, farmingType, landArea, businessType, businessStage)'
        },
        userConfirmed: {
          type: 'BOOLEAN',
          description: 'Must be true only if the user explicitly asked or confirmed saving/updating their profile'
        }
      },
      required: ['fields', 'userConfirmed']
    }
  }
];

function isSchemeVerified(scheme) {
  return (
    scheme &&
    scheme.active !== false &&
    scheme.verificationStatus !== 'UNVERIFIED' &&
    Boolean(scheme.sourceUrl || scheme.officialPortalUrl)
  );
}

function resolveScheme(schemeIdOrName) {
  const schemes = (db.getCollection('schemes') || []).filter(isSchemeVerified);
  const numId = Number(schemeIdOrName);
  if (!Number.isNaN(numId) && Number.isInteger(numId)) {
    const byId = schemes.find(s => s.id === numId);
    if (byId) return byId;
  }
  const q = String(schemeIdOrName).toLowerCase().trim();
  return schemes.find(s => s.name.toLowerCase() === q)
    || schemes.find(s => s.name.toLowerCase().includes(q));
}

function sanitizeProfileFields(raw = {}) {
  const cleaned = {};
  for (const key of SAFE_PROFILE_FIELDS) {
    if (raw[key] !== undefined && raw[key] !== null && raw[key] !== '') {
      cleaned[key] = raw[key];
    }
  }
  return cleaned;
}

const DEVANAGARI_TERM_MAP = [
  [/नमो\s*शेतकरी|महासन्मान/g, 'namo shetkari mahasanman'],
  [/पीएम\s*किसान|किसान|शेतकऱ्|शेतकरी/g, 'pm kisan farmer'],
  [/महाडीबीटी|महाडिबिटी/g, 'mahadbt'],
  [/लाडकी\s*बहीण|लाडली\s*बहना/g, 'ladki bahin'],
  [/मुद्रा/g, 'mudra'],
  [/फसल\s*बीमा|पीक\s*विमा/g, 'fasal bima pmfby'],
  [/आयुष्मान/g, 'ayushman'],
  [/शिष्यवृत्ती|छात्रवृत्ति/g, 'scholarship'],
  [/उत्पन्न|आय/g, 'income'],
  [/अधिवास|निवास/g, 'domicile'],
  [/जातीचा|जाति/g, 'caste'],
  [/नॉन[\s-]?(?:क्रिमी|क्रीमी)/g, 'non creamy layer'],
  [/सातबारा|७\/१२/g, '7/12 land extract'],
  [/पंजाबराव\s*देशमुख|वसतिगृह/g, 'punjabrao deshmukh hostel'],
  [/उद्यम/g, 'udyam'],
  [/दाखला|प्रमाण\s*पत्र|प्रमाणपत्र/g, 'certificate']
];

const GENERIC_QUERY_WORDS = new Set([
  'what', 'which', 'how', 'does', 'are', 'the', 'for', 'and', 'with', 'about', 'tell', 'exact',
  'benefit', 'benefits', 'fee', 'fees', 'cost', 'apply', 'check', 'confirm', 'next', 'year',
  'provide', 'needed', 'yojana', 'scheme', 'schemes', 'pradhan', 'mantri', 'mukhyamantri',
  'government', 'india', 'maharashtra', 'certificate', 'card', 'portal', 'give', 'explain',
  'simple', 'words', 'checklist', 'kaise', 'kasa', 'milega', 'milel', 'dastavez', 'mahiti', 'mala',
  'free', 'subsidy', 'monthly', 'payout', 'issuance', 'aaple', 'sarkar', 'jansahay', 'mumbai'
]);

const CAPITALIZED_STOP = new Set([
  'What', 'Which', 'How', 'Tell', 'Give', 'Show', 'Explain', 'Check', 'Confirm', 'Documents',
  'India', 'Maharashtra', 'Pune', 'Mumbai', 'Satara', 'Nashik', 'Nagpur', 'Pradhan', 'Mantri',
  'Mukhyamantri', 'Yojana', 'Scheme', 'Certificate', 'Aaple', 'Sarkar', 'JanSahay', 'Free',
  'Subsidy', 'Portal', 'MahaDBT', 'PM-KISAN', 'PM-JAY', 'PMFBY', 'Mudra', 'Ayushman', 'Bharat'
]);

function extractRareCapitalizedTerms(rawQuery) {
  const matches = String(rawQuery || '').match(/\b[A-Z][a-z]{3,}\b/g) || [];
  return [...new Set(matches.filter(w => !CAPITALIZED_STOP.has(w)))].map(w => w.toLowerCase());
}

function expandMultilingualTerms(rawQuery) {
  let enriched = String(rawQuery || '').toLowerCase();
  for (const [pattern, replacement] of DEVANAGARI_TERM_MAP) {
    if (pattern.test(enriched)) {
      enriched += ` ${replacement}`;
    }
  }
  return enriched;
}

const handlers = {
  async search_schemes({ query, category, state, limit }) {
    const allSchemes = (db.getCollection('schemes') || []).filter(isSchemeVerified);

    let candidates = allSchemes;
    if (category) {
      const catUpper = category.toUpperCase();
      const filtered = candidates.filter(s => (s.category || '').toUpperCase().includes(catUpper));
      if (filtered.length > 0) candidates = filtered;
    }
    if (state && state.toLowerCase() !== 'all india') {
      const stLower = state.toLowerCase();
      candidates = candidates.filter(
        s => !s.state || s.state.toLowerCase() === 'all india' || s.state.toLowerCase().includes(stLower)
      );
    }

    // Reject hallucination traps naming a specific proper noun absent from our verified schemes/guides
    const namedEntityQuery = /\b(yojana|scheme|certificate|passport|subsidy|pension|mission)\b/i.test(query);
    if (namedEntityQuery) {
      const unknownNamedModifiers = extractRareCapitalizedTerms(query).filter(
        rc => !allSchemes.some(s => `${s.name} ${s.description || ''}`.toLowerCase().includes(rc))
      );
      if (unknownNamedModifiers.length >= 1) {
        return { totalMatches: 0, schemes: [] };
      }
    }

    const enrichedQuery = expandMultilingualTerms(query);

    // 1. Semantic TF-IDF scores from RAGService
    const ragHits = RAGService.retrieveTopK(enrichedQuery, 10, 0.08) || [];
    const ragScoreBySchemeId = new Map();
    for (const hit of ragHits) {
      if (hit.type === 'SCHEME' && hit.entityId) {
        const prev = ragScoreBySchemeId.get(hit.entityId) || 0;
        ragScoreBySchemeId.set(hit.entityId, Math.max(prev, hit.score));
      }
    }

    // 2. Distinctive keyword overlap scoring (filter out generic words like "pradhan", "mantri", "yojana")
    const norm = (str) => String(str || '').toLowerCase().replace(/[-_/.,()]+/g, ' ');
    const normQuery = norm(enrichedQuery);
    const allTerms = normQuery.split(/\s+/).filter(w => w.length > 2 && !/[\u0900-\u097F]/.test(w));
    const distinctiveTerms = allTerms.filter(w => !GENERIC_QUERY_WORDS.has(w) && !/^\d{4}$/.test(w));

    const scored = candidates.map(s => {
      const normName = norm(s.name);
      const blob = `${normName} ${norm(s.description)} ${norm(s.category)} ${norm(s.benefit)} ${norm(s.targetBeneficiaries)}`;
      let nameHits = 0;
      let distinctiveHits = 0;

      for (const term of distinctiveTerms) {
        if (normName.includes(term)) nameHits += 1;
        if (blob.includes(term)) distinctiveHits += 1;
      }

      const ragScore = ragScoreBySchemeId.get(s.id) || 0;
      const distRatio = distinctiveTerms.length > 0 ? distinctiveHits / distinctiveTerms.length : 0;
      const nameRatio = distinctiveTerms.length > 0 ? nameHits / distinctiveTerms.length : 0;

      // Reject hallucinated/unverified entities: require either strong distinctive coverage (>= 0.45) or >=2 matched distinctive hits
      const passesPrecision = distinctiveTerms.length === 0
        ? ragScore >= 0.25
        : (distinctiveHits >= 1 && (distRatio >= 0.34 || nameHits >= 1));

      const combinedScore = passesPrecision ? (nameRatio * 2.5 + ragScore * 1.5 + distRatio) : 0;
      return { scheme: s, combinedScore, ragScore, distinctiveHits, distRatio };
    });

    scored.sort((a, b) => b.combinedScore - a.combinedScore);
    const matched = scored
      .filter(x => x.combinedScore >= 0.28)
      .slice(0, limit);

    return {
      totalMatches: matched.length,
      schemes: matched.map(({ scheme: s, combinedScore }) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        governmentLevel: s.governmentLevel,
        state: s.state || 'All India',
        benefit: s.benefit,
        incomeCondition: s.incomeCondition,
        sourceUrl: s.sourceUrl || s.officialPortalUrl,
        lastVerifiedAt: s.lastVerified || s.lastVerifiedAt || null,
        verificationStatus: s.verificationStatus || 'VERIFIED',
        relevanceScore: Number(combinedScore.toFixed(3))
      }))
    };
  },

  async get_scheme_details({ schemeId }) {
    const scheme = resolveScheme(schemeId);
    if (!scheme) {
      return { found: false, message: `No verified scheme found matching "${schemeId}".` };
    }
    return {
      found: true,
      scheme: {
        id: scheme.id,
        name: scheme.name,
        description: scheme.description,
        category: scheme.category,
        governmentLevel: scheme.governmentLevel,
        state: scheme.state || 'All India',
        targetBeneficiaries: scheme.targetBeneficiaries,
        ageCondition: scheme.ageCondition,
        educationCondition: scheme.educationCondition,
        incomeCondition: scheme.incomeCondition,
        benefit: scheme.benefit,
        sourceUrl: scheme.sourceUrl || scheme.officialPortalUrl,
        lastVerifiedAt: scheme.lastVerified || scheme.lastVerifiedAt || null,
        verificationStatus: scheme.verificationStatus || 'VERIFIED',
        rules: scheme.rules || [],
        requiredDocuments: scheme.requiredDocuments || [],
        applicationGuides: scheme.applicationGuides || []
      }
    };
  },

  async check_eligibility({ profile = {}, schemeId }, context = {}) {
    const baseProfile = context.profile || {};
    const mergedProfile = { ...baseProfile, ...sanitizeProfileFields(profile) };

    if (schemeId !== undefined) {
      const scheme = resolveScheme(schemeId);
      if (!scheme) {
        return { found: false, error: `Verified scheme "${schemeId}" not found.` };
      }
      const evaluation = EligibilityEngine.evaluateScheme(scheme, mergedProfile);
      return {
        evaluatedCount: 1,
        profileUsed: sanitizeProfileFields(mergedProfile),
        results: [evaluation]
      };
    }

    const verifiedSchemes = (db.getCollection('schemes') || []).filter(isSchemeVerified);
    const evaluated = verifiedSchemes
      .map(s => EligibilityEngine.evaluateScheme(s, mergedProfile))
      .sort((a, b) => b.matchScore - a.matchScore);

    const eligibleOrPartial = evaluated.filter(e => e.matchType !== 'NOT_A_MATCH');
    const notMatched = evaluated.filter(e => e.matchType === 'NOT_A_MATCH').slice(0, 3);

    return {
      evaluatedCount: verifiedSchemes.length,
      profileUsed: sanitizeProfileFields(mergedProfile),
      matchedCount: eligibleOrPartial.length,
      results: eligibleOrPartial.slice(0, 8),
      topIneligibleSample: notMatched.map(n => ({
        schemeId: n.schemeId,
        schemeName: n.schemeName,
        matchType: n.matchType,
        failedConditions: n.failedConditions,
        sourceUrl: n.sourceUrl
      }))
    };
  },

  async get_missing_documents({ schemeId }, context = {}) {
    const scheme = resolveScheme(schemeId);
    if (!scheme) {
      return { found: false, error: `Verified scheme "${schemeId}" not found.` };
    }

    const userState = context.profile?.state || 'Maharashtra';
    if (context.userId) {
      const evalResult = DocumentAnalysisService.evaluateSchemeDocuments(scheme, context.userId, userState);
      return { found: true, ...evalResult };
    }

    // Anonymous citizen fallback using session in-hand document list if provided
    const inHandSet = new Set(
      (context.sessionInHandDocuments || context.profile?.inHandDocuments || []).map(d => String(d).toUpperCase())
    );
    const docs = (scheme.requiredDocuments || []).map(reqDoc => {
      const docType = (reqDoc.documentType || '').toUpperCase();
      const available = inHandSet.has(docType);
      return {
        documentType: reqDoc.documentType,
        documentName: reqDoc.documentName,
        purpose: reqDoc.purpose,
        issuingAuthority: reqDoc.issuingAuthority,
        requiredFlag: reqDoc.requiredFlag !== false,
        status: available ? 'AVAILABLE' : 'MISSING',
        isAvailable: available,
        hasSmartGuide: true
      };
    });

    const availableDocuments = docs.filter(d => d.isAvailable).length;
    const totalDocuments = docs.length;
    return {
      found: true,
      schemeId: scheme.id,
      schemeName: scheme.name,
      sourceUrl: scheme.sourceUrl,
      lastVerifiedAt: scheme.lastVerified || scheme.lastVerifiedAt || null,
      totalDocuments,
      availableDocuments,
      missingDocuments: totalDocuments - availableDocuments,
      readinessPercentage: totalDocuments > 0 ? Math.round((availableDocuments / totalDocuments) * 100) : 100,
      documents: docs
    };
  },

  async get_document_guide({ documentType, state }) {
    const guides = (db.getCollection('documentGuides') || []).filter(
      g => g.verificationStatus !== 'UNVERIFIED' && g.publicationStatus !== 'ARCHIVED'
    );
    const q = documentType.toLowerCase().trim();
    const normQ = q.replace(/[\s\-/]+/g, '_');

    let candidates = guides;
    if (state) {
      const stateMatches = guides.filter(
        g => !g.applicableState || g.applicableState.toLowerCase().includes(state.toLowerCase()) || g.applicableState.toLowerCase() === 'all india'
      );
      if (stateMatches.length > 0) candidates = stateMatches;
    }

    const match = candidates.find(g => (g.documentType || '').toLowerCase() === normQ)
      || candidates.find(g => (g.documentType || '').toLowerCase().includes(normQ))
      || candidates.find(g => (g.title || '').toLowerCase().includes(q))
      || candidates.find(g => `${g.title} ${g.simpleDescription || ''}`.toLowerCase().includes(q));

    if (!match) {
      return { found: false, message: `No verified document guide found for "${documentType}".` };
    }

    return {
      found: true,
      guide: {
        id: match.id,
        documentType: match.documentType,
        title: match.title,
        simpleDescription: match.simpleDescription,
        applicableState: match.applicableState,
        issuingAuthority: match.issuingAuthority,
        requiredSupportingDocuments: match.requiredSupportingDocuments || [],
        applicationSteps: match.applicationSteps || [],
        applicationMethod: match.applicationMethod,
        officialApplicationUrl: match.officialApplicationUrl,
        officialInformationUrl: match.officialInformationUrl,
        possibleFees: match.possibleFees,
        expectedProcessingTime: match.expectedProcessingTime,
        lastVerifiedAt: match.lastVerifiedAt || match.lastVerified || null,
        verificationStatus: match.verificationStatus || 'VERIFIED'
      }
    };
  },

  async get_latest_updates({ category, limit }) {
    const updates = RealtimeService.getLiveUpdates() || [];
    let filtered = updates;
    if (category) {
      const catUpper = category.toUpperCase();
      const catMatched = updates.filter(u => (u.category || '').toUpperCase().includes(catUpper));
      if (catMatched.length > 0) filtered = catMatched;
    }

    return {
      totalUpdates: filtered.length,
      updates: filtered.slice(0, limit).map(u => ({
        id: u.id,
        title: u.title,
        summary: u.summary,
        category: u.category || 'GENERAL',
        sourceUrl: u.sourceUrl,
        publishedAt: u.publishedAt,
        lastVerifiedAt: u.lastVerified || u.lastVerifiedAt || u.publishedAt
      }))
    };
  },

  async update_profile({ fields, userConfirmed }, context = {}) {
    const safeFields = sanitizeProfileFields(fields);
    if (Object.keys(safeFields).length === 0) {
      return { updated: false, message: 'No valid profile fields provided to update.' };
    }

    if (!userConfirmed) {
      return {
        updated: false,
        requiresConfirmation: true,
        proposedFields: safeFields,
        message: 'Ask the citizen to confirm before saving these fields to their profile.'
      };
    }

    if (context.userId) {
      const existing = db.findOne('profiles', p => p.userId === context.userId);
      if (existing) {
        const updated = db.update('profiles', existing.id, {
          ...safeFields,
          updatedAt: new Date().toISOString()
        });
        context.profile = { ...existing, ...updated };
        return { updated: true, scope: 'database', profile: sanitizeProfileFields(updated) };
      } else {
        const created = db.insert('profiles', {
          userId: context.userId,
          category: safeFields.category || 'GENERAL_CITIZEN',
          state: safeFields.state || 'Maharashtra',
          incomeRange: safeFields.incomeRange || 'BELOW_2_LAKH',
          ...safeFields,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        context.profile = created;
        return { updated: true, scope: 'database', profile: sanitizeProfileFields(created) };
      }
    }

    // Anonymous session update
    context.profile = { ...(context.profile || {}), ...safeFields };
    return {
      updated: true,
      scope: 'session',
      profile: sanitizeProfileFields(context.profile)
    };
  }
};

/**
 * Validates arguments via Zod, executes tool handler, measures latency,
 * and emits structured Pino observability logs.
 */
export async function executeTool(toolName, rawArgs = {}, context = {}) {
  const start = Date.now();
  const schema = toolSchemas[toolName];
  const handler = handlers[toolName];

  if (!schema || !handler) {
    const durationMs = Date.now() - start;
    logger.warn({ toolName, durationMs, success: false, reason: 'unknown_tool' }, 'AI tool call rejected');
    return { ok: false, toolName, durationMs, error: `Unknown tool: ${toolName}` };
  }

  const parsed = schema.safeParse(rawArgs);
  if (!parsed.success) {
    const durationMs = Date.now() - start;
    const errorMsg = parsed.error.issues.map(i => `${i.path.join('.') || 'arg'}: ${i.message}`).join('; ');
    logger.warn({ toolName, durationMs, success: false, error: errorMsg }, 'AI tool validation failed');
    return { ok: false, toolName, durationMs, error: `Invalid arguments: ${errorMsg}` };
  }

  try {
    const data = await handler(parsed.data, context);
    const durationMs = Date.now() - start;
    logger.info(
      { toolName, durationMs, success: true, userId: context.userId || 'anonymous' },
      'AI tool executed'
    );
    return { ok: true, toolName, durationMs, data };
  } catch (err) {
    const durationMs = Date.now() - start;
    logger.error(
      { toolName, durationMs, success: false, err: err.message, userId: context.userId || 'anonymous' },
      'AI tool execution failed'
    );
    return { ok: false, toolName, durationMs, error: err.message || 'Tool execution error' };
  }
}
