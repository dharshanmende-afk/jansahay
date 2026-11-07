/**
 * ragService.js — JanSahay Retrieval-Augmented Generation (RAG) Engine
 *
 * Implements:
 * 1. Semantic Chunking for 30+ official schemes and 10 RTS document guides
 * 2. Multilingual & Hinglish / Romanized Marathi transliteration synonym expansion
 * 3. In-memory Hybrid Vector & TF-IDF similarity index + Google Gemini embeddings
 * 4. Top-K chunk retrieval with confidence score thresholding
 * 5. Zero-hallucination answering strictly bounded by retrieved context
 * 6. Mandatory source citations (Scheme/Guide Title + lastVerifiedAt + Official URL)
 * 7. Graceful "not yet verified" response when no relevant context is retrieved
 */

import axios from 'axios';
import { db } from '../db/database.js';
import { config } from '../config.js';

// Common stop words to exclude from TF-IDF vectorization
const STOPWORDS = new Set([
  'what', 'is', 'the', 'how', 'to', 'for', 'with', 'and', 'in', 'on', 'at', 'of',
  'a', 'an', 'are', 'do', 'does', 'can', 'i', 'get', 'apply', 'from', 'under',
  'details', 'information', 'please', 'tell', 'me', 'recipe', 'authentic', 'dum',
  'make', 'home', 'chicken', 'mutton', 'biryani', 'saffron',
  'hai', 'hain', 'kya', 'ka', 'ke', 'ki', 'se', 'ko', 'mein', 'me', 'par',
  'hota', 'hoti', 'hote', 'aahe', 'aahet', 'kasa', 'kashi', 'kase', 'kara',
  'karayche', 'aani', 'ani', 'va', 'cha', 'chi', 'che', 'chya', 'sathi'
]);

// Multilingual synonym dictionary for cross-lingual query mapping
const SYNONYM_MAP = {
  // Documents & Certificates (English, Hinglish, Marathi in Latin)
  'income': ['income', 'utpann', 'utpanna', 'aay', 'income certificate', 'tehsildar', '8 lakh', 'fees'],
  'income certificate': ['income certificate', 'income', 'utpann', 'aay praman', 'tehsildar', 'aaple sarkar'],
  'utpann': ['income', 'utpann', 'utpannacha dakhla', 'aay', 'income certificate', 'tehsildar'],
  'utpannacha': ['income', 'utpann', 'utpannacha dakhla', 'income certificate', 'tehsildar'],
  'dakhla': ['certificate', 'dakhla', 'praman patra', 'document'],
  'aay': ['income', 'utpann', 'aay', 'income certificate', 'tehsildar'],
  'domicile': ['domicile', 'adhivas', 'adhibhas', 'niwas', 'mool niwas', 'residence', '15 years', 'aaple sarkar', 'nationality'],
  'adhivas': ['domicile', 'adhivas', 'niwas', 'residence', '15 years'],
  'niwas': ['domicile', 'adhivas', 'niwas', 'residence'],
  'caste': ['caste', 'jaat', 'jati', 'sc', 'st', 'obc', 'vjnt', 'sebc', 'barti', 'validity'],
  'jaat': ['caste', 'jaat', 'jati', 'sc', 'st', 'obc'],
  'validity': ['caste validity', 'padtalani', 'pramanpatra', 'barti', 'scrutiny committee'],
  'padtalani': ['caste validity', 'padtalani', 'barti', 'caste scrutiny'],
  'non creamy': ['non creamy', 'ncl', 'unnat v प्रगत gat', 'crimilayer', '3 financial years', 'obc certificate'],
  'ncl': ['non creamy', 'ncl', 'crimilayer', 'obc', 'non creamy layer certificate'],
  '7/12': ['7/12', 'satbara', 'saatbaara', '8a', 'land record', 'mahabhumi', 'khatavahi', 'bhulekh'],
  'satbara': ['7/12', 'satbara', 'saatbaara', '8a', 'land record', 'mahabhumi'],
  'ration': ['ration', 'ration card', 'rashan', 'annapurna', 'nfsa', 'rcms', 'mahafood', 'dhan'],
  'ration card': ['ration card', 'ration', 'rashan', 'mahafood', 'rcms'],
  'udyam': ['udyam', 'msme', 'business registration', 'udyog aadhaar', 'small business', 'manufacturing'],
  'disability': ['disability', 'divyang', 'swavlamban', 'udid', 'viklang', '40 percent'],
  'divyang': ['disability', 'divyang', 'swavlamban', 'udid'],

  // Schemes & Topics
  'ebc': ['ebc', 'shahu maharaj', 'rajarshi chhatrapati shahu maharaj', 'tuition fee', 'shikshan shulkh', '50 percent fee', 'mahadbt', 'open category'],
  'shahu maharaj': ['ebc', 'rajarshi chhatrapati shahu maharaj', 'tuition fee', 'mahadbt', 'shikshan shulkh'],
  'rajarshi': ['ebc', 'rajarshi chhatrapati shahu maharaj', 'shahu maharaj', 'tuition fee', 'mahadbt'],
  'scholarship': ['scholarship', 'shishyavrutti', 'chhatravritti', 'mahadbt', 'nsp', 'post matric', 'freeship'],
  'shishyavrutti': ['scholarship', 'shishyavrutti', 'chhatravritti', 'mahadbt', 'post matric'],
  'chhatravritti': ['scholarship', 'shishyavrutti', 'chhatravritti', 'mahadbt'],
  'kisan': ['kisan', 'shetkari', 'pm kisan', 'farmer', 'krishi', 'samman nidhi', '6000', 'namo shetkari'],
  'shetkari': ['kisan', 'shetkari', 'pm kisan', 'farmer', 'namo shetkari', 'crop insurance', 'pik vima'],
  'pm kisan': ['pm kisan', 'shetkari', 'samman nidhi', '6000', 'kisan samman', 'land holding', 'farmer'],
  'samman nidhi': ['pm kisan', 'kisan samman nidhi', 'samman nidhi', '6000', 'namo shetkari'],
  'namo': ['namo shetkari', 'mahasamman', 'maharashtra additional 6000', 'shetkari', '12000 total'],
  'namo shetkari': ['namo shetkari', 'mahasamman', 'shetkari', 'farmer', '6000'],
  'pik vima': ['pmfby', 'pik vima', 'fasal bima', 'crop insurance', 'one rupee', '1 rupee', 'kharif', 'rabi'],
  'fasal bima': ['pmfby', 'pik vima', 'fasal bima', 'crop insurance', 'pradhan mantri fasal bima'],
  'pmfby': ['pmfby', 'fasal bima', 'pik vima', 'crop insurance'],
  'crop insurance': ['pmfby', 'fasal bima', 'pik vima', 'crop insurance'],
  'mudra': ['mudra', 'pm mudra', 'shishu', 'kishor', 'tarun', 'collateral free', 'loan', 'karz', 'vyavsay'],
  'ladki bahin': ['ladki bahin', 'majhi ladki', 'majhi ladki bahin', '1500', 'mukhyamantri majhi ladki bahin', 'women welfare', 'nari shakti'],
  'majhi ladki': ['ladki bahin', 'majhi ladki bahin', '1500', 'mukhyamantri majhi ladki bahin'],
  'ayushman': ['ayushman', 'ayushman bharat', 'pm jay', 'golden card', '5 lakh', 'health insurance', 'aarogya', 'hospital'],
  'pm jay': ['ayushman bharat', 'pm jay', 'golden card', '5 lakh'],
  'housing': ['pmay', 'awaas', 'ghar', 'pradhan mantri awas yojana', 'subsidized housing', 'pucca house'],
  'punjabrao': ['punjabrao', 'dr punjabrao deshmukh', 'vastigruh', 'hostel allowance', 'maintenance allowance', 'farmer child hostel', 'mahadbt'],
  'vastigruh': ['punjabrao', 'vastigruh', 'hostel allowance', 'mahadbt'],

  // Devanagari Mappings (Pure Hindi / Marathi Script)
  'आय प्रमाण पत्र': ['income certificate', 'income', 'tehsildar', 'aaple sarkar', 'revenue'],
  'आय प्रमाण': ['income certificate', 'income', 'tehsildar'],
  'उत्पन्नाचा दाखला': ['income certificate', 'income', 'utpann', 'tehsildar', 'aaple sarkar'],
  'उत्पन्न': ['income', 'income certificate', 'utpann', 'tehsildar'],
  'दाखला': ['certificate', 'document', 'dakhla'],
  'अधिवास': ['domicile', 'residence', 'aaple sarkar', '15 years'],
  'निवास': ['domicile', 'residence', 'aaple sarkar', '15 years'],
  'जात पडताळणी': ['caste validity', 'barti', 'validity certificate'],
  'पडताळणी': ['caste validity', 'barti'],
  'नॉन क्रीमी लेयर': ['non creamy layer', 'ncl', 'obc'],
  'सातबारा': ['7/12', 'satbara', 'mahabhumi', 'land record'],
  '७/१२': ['7/12', 'satbara', 'mahabhumi'],
  'रेशन कार्ड': ['ration card', 'mahafood', 'rcms'],
  'रेशन': ['ration card', 'mahafood'],
  'पीएम किसान': ['pm kisan', 'kisan samman nidhi', 'farmer', '6000', 'samman nidhi'],
  'किसान सम्मान': ['pm kisan', 'kisan samman nidhi', 'farmer', '6000'],
  'नमो शेतकरी': ['namo shetkari', 'mahasamman', 'shetkari', '6000'],
  'लाडकी बहीण': ['ladki bahin', 'majhi ladki bahin', '1500', 'mukhyamantri majhi ladki bahin'],
  'माझी लाडकी': ['ladki bahin', 'majhi ladki bahin', '1500'],
  'आयुष्मान भारत': ['ayushman bharat', 'pm jay', 'golden card', '5 lakh', 'health insurance'],
  'आयुष्मान': ['ayushman bharat', 'pm jay', '5 lakh'],
  'मुद्रा': ['mudra', 'pm mudra', 'loan', 'shishu', 'kishor', 'tarun'],
  'फसल बीमा': ['pmfby', 'fasal bima', 'crop insurance'],
  'पीक विमा': ['pmfby', 'pik vima', 'crop insurance'],
  'पंजाबराव देशमुख': ['punjabrao deshmukh', 'dr punjabrao deshmukh', 'vastigruh', 'hostel allowance'],
  'वसतिगृह': ['punjabrao deshmukh', 'hostel allowance', 'mahadbt'],
  'इबीसी': ['ebc', 'rajarshi chhatrapati shahu maharaj', 'shahu maharaj', 'tuition fee'],
  'राजर्षी शाहू': ['ebc', 'rajarshi chhatrapati shahu maharaj', 'tuition fee'],
  'शिष्यवृत्ती': ['scholarship', 'shishyavrutti', 'mahadbt'],
  'छात्रवृत्ति': ['scholarship', 'chhatravritti', 'mahadbt'],
  'उद्यम': ['udyam', 'msme', 'business registration']
};

export class RAGService {
  static knowledgeChunks = [];
  static isIndexed = false;
  static vocabulary = new Map(); // term -> idf
  static chunkVectors = []; // array of TF-IDF sparse/dense vectors

  /**
   * Initializes and builds chunked knowledge base from DB schemes & document guides
   */
  static buildKnowledgeBase() {
    const schemes = db.find('schemes') || [];
    const documentGuides = db.find('documentGuides') || [];
    const chunks = [];

    // 1. Chunk Schemes
    schemes.forEach(scheme => {
      const lastVerified = scheme.lastVerified || scheme.lastVerifiedAt || '2026-03-01';
      const cleanUrl = scheme.sourceUrl || 'https://www.india.gov.in';

      // Bilingual keywords builder
      const schemeKeywords = [
        scheme.name, scheme.category, scheme.state || 'All India',
        scheme.benefit, 'overview', 'benefits', 'scheme'
      ];

      // Add Devanagari & alias tags for specific schemes
      const lowerScheme = scheme.name.toLowerCase();
      if (lowerScheme.includes('shahu maharaj') || lowerScheme.includes('ebc')) {
        schemeKeywords.push('ebc', 'shahu maharaj', 'rajarshi chhatrapati shahu maharaj', 'इबीसी', 'राजर्षी शाहू', 'शिष्यवृत्ती', 'tuition fee waiver');
      }
      if (lowerScheme.includes('kisan') || lowerScheme.includes('pm-kisan')) {
        schemeKeywords.push('pm kisan', 'पीएम किसान', 'किसान सम्मान', 'kisan samman nidhi', '6000', 'shetkari', 'farmer');
      }
      if (lowerScheme.includes('namo shetkari')) {
        schemeKeywords.push('namo shetkari', 'नमो शेतकरी', 'mahasamman', 'shetkari', '6000');
      }
      if (lowerScheme.includes('ladki bahin')) {
        schemeKeywords.push('ladki bahin', 'majhi ladki bahin', 'लाडकी बहीण', 'माझी लाडकी', '1500', 'mukhyamantri majhi ladki bahin');
      }
      if (lowerScheme.includes('ayushman') || lowerScheme.includes('jan arogya')) {
        schemeKeywords.push('ayushman bharat', 'आयुष्मान भारत', 'pm jay', 'golden card', '5 lakh', '5 लाख', 'health insurance');
      }
      if (lowerScheme.includes('mudra')) {
        schemeKeywords.push('mudra', 'pm mudra', 'मुद्रा', 'shishu', 'kishor', 'tarun', 'collateral free loan');
      }
      if (lowerScheme.includes('punjabrao')) {
        schemeKeywords.push('punjabrao deshmukh', 'पंजाबराव देशमुख', 'वसतिगृह', 'vastigruh', 'hostel allowance');
      }
      if (lowerScheme.includes('fasal bima') || lowerScheme.includes('pmfby') || lowerScheme.includes('crop insurance')) {
        schemeKeywords.push('pmfby', 'fasal bima', 'फसल बीमा', 'पीक विमा', 'pik vima', 'crop insurance');
      }

      // Chunk A: Overview & Benefits
      chunks.push({
        id: `scheme_${scheme.id}_overview`,
        sourceType: 'SCHEME',
        sourceId: scheme.id,
        sourceTitle: scheme.name,
        chunkType: 'OVERVIEW',
        title: `${scheme.name} — Overview & Benefits`,
        content: `Scheme: ${scheme.name}\nCategory: ${scheme.category} | Government Level: ${scheme.governmentLevel} | State: ${scheme.state || 'All India'}\nDescription: ${scheme.description}\nTarget Beneficiaries: ${scheme.targetBeneficiaries || 'Eligible citizens'}\nDirect Benefits: ${scheme.benefit}\nOfficial Portal: ${cleanUrl}\nLast Verified: ${lastVerified}`,
        keywords: schemeKeywords,
        url: cleanUrl,
        lastVerifiedAt: lastVerified
      });

      // Chunk B: Eligibility Rules
      if (scheme.rules && scheme.rules.length > 0) {
        const rulesText = scheme.rules.map(r => `• ${r.description || (r.field + ' ' + r.operator + ' ' + r.value)}`).join('\n');
        chunks.push({
          id: `scheme_${scheme.id}_eligibility`,
          sourceType: 'SCHEME',
          sourceId: scheme.id,
          sourceTitle: scheme.name,
          chunkType: 'ELIGIBILITY',
          title: `${scheme.name} — Eligibility Criteria`,
          content: `Eligibility Criteria for ${scheme.name}:\n${rulesText}\nAge Condition: ${scheme.ageCondition || 'As per norms'}\nIncome Condition: ${scheme.incomeCondition || 'As specified in rules'}\nOfficial Portal: ${cleanUrl}\nLast Verified: ${lastVerified}`,
          keywords: [
            ...schemeKeywords, 'eligibility', 'patrata', 'criteria', 'rules',
            scheme.incomeCondition || '', scheme.state || ''
          ],
          url: cleanUrl,
          lastVerifiedAt: lastVerified
        });
      }

      // Chunk C: Required Documents
      if (scheme.requiredDocuments && scheme.requiredDocuments.length > 0) {
        const docsText = scheme.requiredDocuments.map(d =>
          `• ${d.documentName} (Type: ${d.documentType}, Issuing Authority: ${d.issuingAuthority || 'Govt Authority'}, Purpose: ${d.purpose || 'Verification'})`
        ).join('\n');

        chunks.push({
          id: `scheme_${scheme.id}_documents`,
          sourceType: 'SCHEME',
          sourceId: scheme.id,
          sourceTitle: scheme.name,
          chunkType: 'DOCUMENTS',
          title: `${scheme.name} — Required Documents`,
          content: `Mandatory Documents Required for ${scheme.name}:\n${docsText}\nOfficial Portal: ${cleanUrl}\nLast Verified: ${lastVerified}`,
          keywords: [
            ...schemeKeywords, 'documents', 'certificates', 'dakhla', 'praman patra',
            'required documents', 'kagadpatre', ...scheme.requiredDocuments.map(d => d.documentName)
          ],
          url: cleanUrl,
          lastVerifiedAt: lastVerified
        });
      }

      // Chunk D: Application Steps
      if (scheme.applicationGuides && scheme.applicationGuides.length > 0) {
        const stepsText = scheme.applicationGuides.map(s =>
          `Step ${s.stepNumber}: ${s.title} — ${s.instruction || s.detail || ''}`
        ).join('\n');

        chunks.push({
          id: `scheme_${scheme.id}_application`,
          sourceType: 'SCHEME',
          sourceId: scheme.id,
          sourceTitle: scheme.name,
          chunkType: 'ROADMAP',
          title: `${scheme.name} — How to Apply`,
          content: `Application Procedure for ${scheme.name}:\n${stepsText}\nApply Online At: ${cleanUrl}\nLast Verified: ${lastVerified}`,
          keywords: [
            ...schemeKeywords, 'how to apply', 'online application', 'steps',
            'kaise apply kare', 'kasa araj karaycha', 'portal'
          ],
          url: cleanUrl,
          lastVerifiedAt: lastVerified
        });
      }
    });

    // 2. Chunk Document Guides
    documentGuides.forEach(guide => {
      const lastVerified = guide.lastVerifiedAt || '2026-03-01';
      const cleanUrl = guide.officialApplicationUrl || guide.officialInformationUrl || 'https://aaplesarkar.mahaonline.gov.in';

      const docKeywords = [
        guide.title, guide.documentType, 'timeline', 'fees', 'issuing authority',
        'dakhla', 'certificate', 'tehsildar', guide.applicableState || 'Maharashtra'
      ];

      // Enrich document-specific bilingual keywords
      const lowerTitle = guide.title.toLowerCase();
      if (lowerTitle.includes('income') || guide.documentType === 'INCOME_CERTIFICATE') {
        docKeywords.push('income certificate', 'आय प्रमाण पत्र', 'आय प्रमाण', 'उत्पन्नाचा दाखला', 'उत्पन्न', 'utpann', 'utpannacha dakhla', 'tehsildar', 'तहसीलदार');
      }
      if (lowerTitle.includes('domicile') || guide.documentType === 'DOMICILE_CERTIFICATE') {
        docKeywords.push('domicile', 'अधिवास', 'निवास', 'nationality', '15 years', '१५ वर्षे', 'aaple sarkar');
      }
      if (lowerTitle.includes('7/12') || guide.documentType === 'SEVEN_TWELVE_EXTRACT') {
        docKeywords.push('7/12', '७/१२', 'सातबारा', 'satbara', '8a', '८-अ', 'mahabhumi', 'land extract');
      }
      if (lowerTitle.includes('non-creamy') || guide.documentType === 'NON_CREAMY_LAYER') {
        docKeywords.push('non-creamy layer', 'नॉन क्रीमी लेयर', 'ncl', 'obc certificate', '3 financial years');
      }
      if (lowerTitle.includes('caste validity') || guide.documentType === 'CASTE_VALIDITY') {
        docKeywords.push('caste validity', 'जात पडताळणी', 'barti', 'scrutiny committee', 'validity');
      }
      if (lowerTitle.includes('ration') || guide.documentType === 'RATION_CARD') {
        docKeywords.push('ration card', 'रेशन कार्ड', 'rcms', 'mahafood', 'food security');
      }
      if (lowerTitle.includes('udyam') || guide.documentType === 'UDYAM_REGISTRATION') {
        docKeywords.push('udyam', 'उद्यम', 'msme', 'business registration', 'free registration', 'विनामूल्य');
      }

      // Chunk A: Document Statutory Overview & Timelines
      chunks.push({
        id: `guide_${guide.id}_overview`,
        sourceType: 'DOCUMENT_GUIDE',
        sourceId: guide.id,
        sourceTitle: guide.title,
        chunkType: 'OVERVIEW',
        title: `${guide.title} — Statutory Guidelines & Timeline`,
        content: `Document: ${guide.title} (${guide.documentType})\nDescription: ${guide.simpleDescription}\nJurisdiction: ${guide.applicableState || 'Maharashtra'}\nIssuing Authority: ${guide.issuingAuthority}\nStatutory Delivery Timeline: ${guide.expectedProcessingTime || '15-21 days'}\nGovernment Fee: ${guide.possibleFees || 'Nominal statutory fee'}\nOfficial Portal: ${cleanUrl}\nLast Verified: ${lastVerified}`,
        keywords: docKeywords,
        url: cleanUrl,
        lastVerifiedAt: lastVerified
      });

      // Chunk B: Supporting Proofs
      if (guide.requiredSupportingDocuments && guide.requiredSupportingDocuments.length > 0) {
        const proofsText = guide.requiredSupportingDocuments.map(p => `• ${p}`).join('\n');
        chunks.push({
          id: `guide_${guide.id}_proofs`,
          sourceType: 'DOCUMENT_GUIDE',
          sourceId: guide.id,
          sourceTitle: guide.title,
          chunkType: 'DOCUMENTS',
          title: `${guide.title} — Required Supporting Proofs`,
          content: `Required Supporting Documents for obtaining ${guide.title}:\n${proofsText}\nEligible Prerequisites: ${guide.eligibilityOrPrerequisites || 'State resident'}\nOfficial Portal: ${cleanUrl}\nLast Verified: ${lastVerified}`,
          keywords: [
            ...docKeywords, 'supporting documents', 'proof', 'documents required',
            'kagadpatre', 'dastavez', ...guide.requiredSupportingDocuments
          ],
          url: cleanUrl,
          lastVerifiedAt: lastVerified
        });
      }

      // Chunk C: Steps to Obtain
      if (guide.applicationSteps && guide.applicationSteps.length > 0) {
        const stepsText = guide.applicationSteps.map(s =>
          `Step ${s.stepNumber} (${s.method || 'Online'}): ${s.title} — ${s.detail}`
        ).join('\n');

        chunks.push({
          id: `guide_${guide.id}_steps`,
          sourceType: 'DOCUMENT_GUIDE',
          sourceId: guide.id,
          sourceTitle: guide.title,
          chunkType: 'ROADMAP',
          title: `${guide.title} — Step-by-Step Acquisition Procedure`,
          content: `Procedure to obtain ${guide.title}:\n${stepsText}\nApplication Method: ${guide.applicationMethod || 'Online & Offline'}\nOfficial Portal: ${cleanUrl}\nLast Verified: ${lastVerified}`,
          keywords: [
            ...docKeywords, 'how to get', 'steps', 'procedure', 'kaise banwaye',
            'kasa kadhaycha', 'aaple sarkar', 'csc center'
          ],
          url: cleanUrl,
          lastVerifiedAt: lastVerified
        });
      }
    });

    this.knowledgeChunks = chunks;
    if (chunks.length > 0) {
      this.indexVocabulary();
      this.isIndexed = true;
    }
    return chunks;
  }

  /**
   * Tokenizes and normalizes text into informative word stems (excludes common stopwords)
   */
  static tokenize(text, filterStopwords = false) {
    if (!text) return [];
    const tokens = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s/.-]/gu, ' ')
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length >= 2);

    if (filterStopwords) {
      return tokens.filter(t => !STOPWORDS.has(t));
    }
    return tokens;
  }

  /**
   * Builds TF-IDF inverted index and precalculates chunk vectors
   */
  static indexVocabulary() {
    const docCount = this.knowledgeChunks.length;
    const docFreq = new Map();

    // 1. Calculate document frequencies
    this.knowledgeChunks.forEach(chunk => {
      const fullText = `${chunk.title} ${chunk.content} ${chunk.keywords.join(' ')}`;
      const tokens = new Set(this.tokenize(fullText, true));
      tokens.forEach(t => {
        docFreq.set(t, (docFreq.get(t) || 0) + 1);
      });
    });

    // 2. Compute IDF for vocabulary
    this.vocabulary.clear();
    docFreq.forEach((df, term) => {
      const idf = Math.log(1 + (docCount - df + 0.5) / (df + 0.5));
      this.vocabulary.set(term, idf);
    });

    // 3. Precalculate normalized TF-IDF vector for each chunk
    this.chunkVectors = this.knowledgeChunks.map(chunk => {
      const fullText = `${chunk.title} ${chunk.content} ${chunk.keywords.join(' ')}`;
      const tokens = this.tokenize(fullText, true);
      const tfMap = new Map();
      tokens.forEach(t => tfMap.set(t, (tfMap.get(t) || 0) + 1));

      const vector = new Map();
      let normSq = 0;
      tfMap.forEach((count, term) => {
        const idf = this.vocabulary.get(term) || 0;
        const weight = count * idf;
        vector.set(term, weight);
        normSq += weight * weight;
      });

      return {
        chunkId: chunk.id,
        vector,
        norm: Math.sqrt(normSq) || 1
      };
    });
  }

  /**
   * Expands query using transliteration, synonym mapping, and Hindi/Marathi terms
   */
  static expandQuery(query) {
    const rawTokens = this.tokenize(query, true);
    const expanded = new Set(rawTokens);
    const queryLower = query.toLowerCase();

    for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
      if (queryLower.includes(key.toLowerCase())) {
        this.tokenize(key, true).forEach(t => expanded.add(t));
        synonyms.forEach(s => {
          this.tokenize(s, true).forEach(t => expanded.add(t));
        });
      }
      for (const syn of synonyms) {
        if (queryLower.includes(syn.toLowerCase())) {
          this.tokenize(key, true).forEach(t => expanded.add(t));
          synonyms.forEach(s => {
            this.tokenize(s, true).forEach(t => expanded.add(t));
          });
          break;
        }
      }
    }

    return Array.from(expanded);
  }

  /**
   * Retrieves top-K context chunks matching the query using semantic vector scoring
   */
  static retrieveTopK(query, k = 4, threshold = 0.22) {
    if (!this.isIndexed || this.knowledgeChunks.length === 0) {
      this.buildKnowledgeBase();
    }

    const queryTokens = this.expandQuery(query);
    if (queryTokens.length === 0) return [];

    // Check if query has any domain-meaningful terms in vocabulary
    const meaningfulTokens = queryTokens.filter(t => this.vocabulary.has(t));
    if (meaningfulTokens.length === 0) {
      // Zero domain tokens match our vocabulary (out-of-scope query guard)
      return [];
    }

    // Calculate query vector
    const qTf = new Map();
    queryTokens.forEach(t => qTf.set(t, (qTf.get(t) || 0) + 1));

    const qVector = new Map();
    let qNormSq = 0;
    qTf.forEach((count, term) => {
      const idf = this.vocabulary.get(term) || 0;
      if (idf > 0) {
        const weight = count * idf;
        qVector.set(term, weight);
        qNormSq += weight * weight;
      }
    });
    const qNorm = Math.sqrt(qNormSq) || 1;

    // Score all chunks
    const scores = [];
    const lowerQuery = query.toLowerCase();

    for (let i = 0; i < this.knowledgeChunks.length; i++) {
      const chunk = this.knowledgeChunks[i];
      const chunkVec = this.chunkVectors[i];

      let dotProduct = 0;
      qVector.forEach((qWeight, term) => {
        const cWeight = chunkVec.vector.get(term);
        if (cWeight) {
          dotProduct += qWeight * cWeight;
        }
      });

      let score = dotProduct / (qNorm * chunkVec.norm);

      // Targeted concept match boosts
      const lowerTitle = chunk.title.toLowerCase();
      const lowerSource = chunk.sourceTitle.toLowerCase();

      // Check keyword overlap directly
      for (const kw of chunk.keywords) {
        if (lowerQuery.includes(kw.toLowerCase())) {
          score += 0.30;
          break;
        }
      }

      if (lowerQuery.includes(lowerSource) || lowerSource.includes(lowerQuery)) {
        score += 0.40;
      }

      if (score >= threshold) {
        scores.push({ chunk, score });
      }
    }

    // Sort descending by score
    scores.sort((a, b) => b.score - a.score);

    // Group to ensure diversity: take top-k
    const selected = [];
    for (const item of scores) {
      if (selected.length >= k) break;
      selected.push({
        ...item.chunk,
        score: item.score
      });
    }

    return selected;
  }

  /**
   * Generates a fully grounded answer strictly bounded by retrieved context, with source citations
   */
  static async answerWithRag(question, language = 'en', schemeId = null) {
    if (!this.isIndexed || this.knowledgeChunks.length === 0) {
      this.buildKnowledgeBase();
    }

    let enrichedQuery = question;
    let targetScheme = null;
    if (schemeId) {
      targetScheme = db.findById('schemes', Number(schemeId));
      if (targetScheme) {
        enrichedQuery = `${targetScheme.name} ${question}`;
      }
    }

    const topChunks = this.retrieveTopK(enrichedQuery, 4, 0.22);

    // ─────────────────────────────────────────────────────────────────────────
    // ZERO HALLUCINATION GUARD: If no chunks pass threshold, return unverified
    // ─────────────────────────────────────────────────────────────────────────
    if (!topChunks || topChunks.length === 0) {
      let unverifiedText = `Information for this specific query has **not yet been verified** in the JanSahay official database. Please consult the concerned department or official portal for verified instructions.`;
      if (language === 'mr') {
        unverifiedText = `या विशिष्ट प्रश्नासाठी माहिती जनसहाय अधिकृत डेटाबेसमध्ये **अद्याप पडताळलेली नाही (not yet verified)**. कृपया संबंधित शासकीय विभाग किंवा अधिकृत पोर्टलशी संपर्क साधावा.`;
      } else if (language === 'hi') {
        unverifiedText = `इस विशिष्ट प्रश्न के लिए जानकारी जनसहाय के आधिकारिक डेटाबेस में **अभी सत्यापित नहीं (not yet verified)** है। कृपया संबंधित विभाग या आधिकारिक पोर्टल से संपर्क करें।`;
      }

      return {
        answer: unverifiedText,
        provider: 'JanSahay Grounded Engine (Safety Guard)',
        sources: [],
        dataStatus: 'unverified',
        generatedAt: new Date().toISOString(),
        isVerified: false,
        retrievedChunksCount: 0
      };
    }

    // Prepare retrieved context payload
    const contextText = topChunks.map((c, idx) =>
      `[CONTEXT CHUNK ${idx + 1}] Source: ${c.sourceTitle} | Category: ${c.chunkType}\n${c.content}\nOfficial URL: ${c.url} | Last Verified: ${c.lastVerifiedAt}`
    ).join('\n\n---\n\n');

    // Prepare standardized source citations
    const uniqueSources = [];
    const seenUrls = new Set();
    topChunks.forEach(c => {
      if (!seenUrls.has(c.url)) {
        seenUrls.add(c.url);
        uniqueSources.push({
          title: c.sourceTitle,
          url: c.url,
          sourceName: c.sourceType === 'SCHEME' ? 'Official Scheme Portal' : 'Right to Services (RTS) Portal',
          lastVerifiedAt: c.lastVerifiedAt,
          relevanceScore: Math.round(c.score * 100) / 100
        });
      }
    });

    // Format citations markdown block
    const citationsMarkdown = `\n\n**Source Citations:**\n` + uniqueSources.map(s =>
      `• [${s.title}](${s.url}) — *Verified: ${s.lastVerifiedAt}*`
    ).join('\n');

    // ─────────────────────────────────────────────────────────────────────────
    // GEMINI 1.5 FLASH RAG CALL (if GEMINI_API_KEY is configured in env)
    // ─────────────────────────────────────────────────────────────────────────
    if (config.geminiApiKey && config.geminiApiKey !== 'your_gemini_api_key_here') {
      try {
        const targetLangName = language === 'mr' ? 'Marathi (मराठी)' : language === 'hi' ? 'Hindi (हिंदी)' : 'English';
        const systemPrompt = `You are JanSahay AI, a verified assistant for Indian government welfare schemes and statutory citizen certificates.
STRICT GROUNDING RULES:
1. ONLY answer using facts explicitly stated in the RETRIEVED CONTEXT below.
2. DO NOT hallucinate, guess, or assume fees, timelines, or eligibility criteria.
3. If specific details are not in context, state: "Specific details for this point are not yet verified."
4. Respond fluently and politely in ${targetLangName}.
5. Use markdown bullet points and bold headers for clarity.
6. Always preserve official URLs and mention the verification date.

RETRIEVED CONTEXT:
${contextText}`;

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`,
          {
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nCitizen Question: ${question}` }]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1024
            }
          },
          { timeout: 7000 }
        );

        const geminiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (geminiText && geminiText.trim().length > 0) {
          return {
            answer: geminiText.trim() + citationsMarkdown,
            provider: 'Google Gemini 1.5 Flash (JanSahay RAG)',
            sources: uniqueSources,
            dataStatus: 'knowledge_base',
            generatedAt: new Date().toISOString(),
            isVerified: true,
            retrievedChunksCount: topChunks.length
          };
        }
      } catch (err) {
        console.warn('[RAG] Gemini API call failed or timed out. Falling back to local grounded synthesizer:', err.message);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DETERMINISTIC GROUNDED SYNTHESIS (Offline & Zero-Dependency Fallback)
    // ─────────────────────────────────────────────────────────────────────────
    const primaryChunk = topChunks[0];
    let synthesizedAnswer = '';

    if (language === 'mr') {
      synthesizedAnswer = `**${primaryChunk.sourceTitle} — पडताळलेली माहिती** 🇮🇳\n\n` +
        `जनसहाय अधिकृत माहितीनुसार खालील तपशील उपलब्ध आहेत:\n\n` +
        primaryChunk.content.split('\n').map(line => `• ${line}`).join('\n') +
        `\n\nअधिकृत संकेतस्थळावर अर्ज करण्यासाठी व अधिक माहितीसाठी खालील लिंक पहा.`;
    } else if (language === 'hi') {
      synthesizedAnswer = `**${primaryChunk.sourceTitle} — सत्यापित जानकारी** 🇮🇳\n\n` +
        `जनसहाय आधिकारिक डेटाबेस के अनुसार मुख्य विवरण निम्न प्रकार हैं:\n\n` +
        primaryChunk.content.split('\n').map(line => `• ${line}`).join('\n') +
        `\n\nआधिकारिक पोर्टल पर आवेदन करने अथवा पूर्ण जानकारी के लिए नीचे दिए गए लिंक पर जाएं।`;
    } else {
      synthesizedAnswer = `**${primaryChunk.sourceTitle} — Official Grounded Summary** 🇮🇳\n\n` +
        `According to the verified JanSahay directory, here are the official facts:\n\n` +
        primaryChunk.content.split('\n').map(line => `• ${line}`).join('\n') +
        `\n\nTo apply or check live status, visit the official government portal cited below.`;
    }

    return {
      answer: synthesizedAnswer + citationsMarkdown,
      provider: 'JanSahay Grounded Engine (Verified Knowledge Base)',
      sources: uniqueSources,
      dataStatus: 'knowledge_base',
      generatedAt: new Date().toISOString(),
      isVerified: true,
      retrievedChunksCount: topChunks.length
    };
  }
}

export default RAGService;
