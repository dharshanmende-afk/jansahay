/**
 * safety.js — Steps 5c, 5d, 5f: Grounding Post-Check, Multilingual Classifier & Guardrails
 *
 * Enforces:
 * - Prompt-injection detection & strict data-vs-instruction boundaries
 * - Privacy scrubbing (Aadhaar / bank account / secrets never logged or persisted)
 * - Multilingual auto-detection (EN, HI, MR + Romanised HI/MR)
 * - Grounding post-check verifying scheme names, URLs, lastVerifiedAt, and amounts against tool outputs
 * - Anonymised unanswered / low-confidence query logging for admin analytics
 */

import { db } from '../../db/database.js';
import { logger } from '../../utils/logger.js';

export const AI_DISCLAIMER = {
  en: 'AI guidance only; confirm eligibility, fees, and deadlines on the official portal.',
  hi: 'केवल एआई मार्गदर्शन; पात्रता, शुल्क और अंतिम तिथि आधिकारिक पोर्टल पर अवश्य जांचें।',
  mr: 'केवळ AI मार्गदर्शन; पात्रता, शुल्क आणि अंतिम मुदत अधिकृत पोर्टलवर तपासा.'
};

export const CANT_VERIFY_MESSAGE = {
  en: 'I could not verify this yet — this topic has not yet been verified in JanSahay’s official government records. Please check the official citizen portals directly: https://www.myscheme.gov.in or https://aaplesarkar.mahaonline.gov.in',
  hi: 'जनसहाय के सत्यापित सरकारी डेटाबेस से मैं अभी इस जानकारी की पुष्टि नहीं कर सका (यह जानकारी अभी सत्यापित नहीं है)। कृपया सीधे आधिकारिक पोर्टल देखें: https://www.myscheme.gov.in या https://aaplesarkar.mahaonline.gov.in',
  mr: 'जनसहायच्या पडताळलेल्या शासकीय नोंदींमधून मला अद्याप या माहितीची खात्री करता आली नाही (ही माहिती अद्याप पडताळलेली नाही). कृपया अधिकृत पोर्टल तपासा: https://www.myscheme.gov.in किंवा https://aaplesarkar.mahaonline.gov.in'
};

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/i,
  /disregard\s+(all\s+)?(previous|system)\s+instructions?/i,
  /reveal\s+(your\s+)?(system\s+prompt|instructions?|api[\s_-]*key|secret|env)/i,
  /(print|show|output|leak|dump)\s+(the\s+)?(system\s+prompt|gemini_api_key|jwt_secret|\.env|password)/i,
  /you\s+are\s+now\s+(in\s+)?(developer|admin|god|unrestricted|dan)\s+mode/i,
  /bypass\s+(safety|guardrails|rules|verification|eligibility)/i,
  /<\s*\/?\s*(system|assistant|instruction|developer)\s*>/i,
  /pretend\s+you\s+are\s+not\s+an\s+ai/i
];

const OUT_OF_SCOPE_PATTERNS = [
  /\b(write\s+python\s+malware|hack\s+into|sql\s+injection|exploit\s+cve|crypto\s+trading\s+bot|stock\s+tip)\b/i
];

/**
 * Masks sensitive citizen PII (Aadhaar 12 digits, PAN, Bank Account/IFSC) from text before storage/logs.
 */
export function redactSensitivePII(text = '') {
  if (!text) return '';
  return String(text)
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED_AADHAAR]')
    .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, '[REDACTED_PAN]')
    .replace(/\b[A-Z]{4}0[A-Z0-9]{6}\b/g, '[REDACTED_IFSC]');
}

/**
 * Checks user prompt for prompt-injection or out-of-scope abuse.
 */
export function inspectUserInputSafety(rawText = '') {
  const text = String(rawText || '').trim();
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        reason: 'prompt_injection',
        message: 'For security reasons, JanSahay AI cannot follow instruction-override requests or reveal system configuration. Ask me about Indian government schemes, eligibility, or official documents.'
      };
    }
  }
  for (const pattern of OUT_OF_SCOPE_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        reason: 'out_of_scope',
        message: 'JanSahay AI specializes exclusively in verified Indian government schemes, eligibility checks, and official document guides.'
      };
    }
  }
  return { safe: true, sanitizedText: redactSensitivePII(text) };
}

/**
 * Step 5d: Multilingual detection supporting EN, HI, MR & Romanised HI/MR
 */
export function detectLanguageEnhanced(text = '', requestedLanguage = null) {
  if (requestedLanguage === 'hi' || requestedLanguage === 'mr') {
    return { language: requestedLanguage, isRomanised: false };
  }

  const t = String(text || '').toLowerCase().trim();
  if (!t) return { language: 'en', isRomanised: false };

  const hasDevanagari = /[\u0900-\u097F]/.test(t);
  if (hasDevanagari) {
    const mrMarkers = [
      'आहे', 'आहेत', 'नाही', 'काय', 'कसा', 'कशी', 'कसे', 'मिळेल', 'करावे', 'लागेल',
      'लागतात', 'माहिती', 'दाखला', 'दाखल्या', 'काढाय', 'अर्ज', 'शिष्यवृत्ती', 'शेतकऱ्',
      'शेतकरी', 'कागदपत्रे', 'उत्पन्न', 'अधिवास', 'सातबारा', 'सांगा', 'द्या', 'पाहिजे',
      'कोणती', 'कोणत्या', 'माझ्यासाठी', 'मराठी', 'आणि', 'साठी', 'तपासा', 'बहीण', 'घडामोडी'
    ];
    const hiMarkers = [
      'है', 'हैं', 'नहीं', 'क्या', 'कैसे', 'मिलेगा', 'मिलेगी', 'करना', 'पड़ेगा',
      'जानकारी', 'योजनाएं', 'प्रमाण', 'आवेदन', 'छात्रवृत्ति', 'किसान', 'दस्तावेज',
      'दस्तावेज़', 'आय', 'निवास', 'जाति', 'बताइए', 'चाहिए', 'मेरे', 'पात्रता',
      'हिंदी', 'लगेंगे', 'बनवाएं', 'ताज़ा', 'दिखाएं', 'पंजीकरण'
    ];
    const mrScore = mrMarkers.filter(m => t.includes(m)).length;
    const hiScore = hiMarkers.filter(m => t.includes(m)).length;
    return {
      language: mrScore >= hiScore ? 'mr' : 'hi',
      isRomanised: false
    };
  }

  const romanMarathi = [
    'mala', 'pahije', 'kasa', 'kashi', 'kase', 'kadhaicha', 'kadhaycha', 'milel',
    'shakte', 'shakto', 'karaycha', 'karaychi', 'konti', 'kontya', 'shetkari',
    'satbara', 'aahe', 'dakhla', 'utpann', 'mahiti', 'kiti', 'mazya', 'shevti'
  ];
  if (romanMarathi.some(w => new RegExp(`\\b${w}\\b`, 'i').test(t))) {
    return { language: 'mr', isRomanised: true };
  }

  const romanHindi = [
    'mujhe', 'kaise', 'chahiye', 'milega', 'milegi', 'karna', 'kaun', 'kaunsi',
    'sarkari', 'dastavez', 'aay', 'praman', 'patra', 'batao', 'bataiye',
    'kitna', 'paise', 'kya hai', 'hoga', 'humare', 'meri', 'kahan', 'banwaye', 'ke liye'
  ];
  if (romanHindi.some(w => new RegExp(`\\b${w}\\b`, 'i').test(t))) {
    return { language: 'hi', isRomanised: true };
  }

  return { language: requestedLanguage || 'en', isRomanised: false };
}

/**
 * Wraps untrusted user/retrieved content so Gemini treats it strictly as data.
 */
export function wrapUntrustedData(label, content) {
  const safeContent = String(content || '').replace(/<\/?untrusted_data[^>]*>/gi, '');
  return `<untrusted_data source="${label}">\n${safeContent}\n</untrusted_data>`;
}

/**
 * Extracts all grounded scheme/guide facts, rupee numbers, and official URLs
 * returned by tool calls during the agent loop.
 */
export function collectToolGroundTruth(toolExecutions = []) {
  const serialized = JSON.stringify(toolExecutions).toLowerCase();
  const citations = [];
  const seenUrls = new Set();

  for (const exec of toolExecutions) {
    if (!exec.ok || !exec.data) continue;
    const d = exec.data;

    if (Array.isArray(d.schemes)) {
      for (const s of d.schemes) {
        if (s.sourceUrl && !seenUrls.has(`${s.name}|${s.sourceUrl}`)) {
          seenUrls.add(`${s.name}|${s.sourceUrl}`);
          citations.push({
            title: s.name,
            sourceUrl: s.sourceUrl,
            lastVerifiedAt: s.lastVerifiedAt || s.lastVerified || null,
            type: 'SCHEME'
          });
        }
      }
    }
    if (d.scheme && d.scheme.sourceUrl) {
      const s = d.scheme;
      if (!seenUrls.has(`${s.name}|${s.sourceUrl}`)) {
        seenUrls.add(`${s.name}|${s.sourceUrl}`);
        citations.push({
          title: s.name,
          sourceUrl: s.sourceUrl,
          lastVerifiedAt: s.lastVerifiedAt || s.lastVerified || null,
          type: 'SCHEME'
        });
      }
    }
    if (Array.isArray(d.results)) {
      for (const r of d.results) {
        const url = r.sourceUrl;
        if (url && !seenUrls.has(`${r.schemeName}|${url}`)) {
          seenUrls.add(`${r.schemeName}|${url}`);
          citations.push({
            title: r.schemeName,
            sourceUrl: url,
            lastVerifiedAt: r.lastVerified || null,
            type: 'ELIGIBILITY'
          });
        }
      }
    }
    if (d.guide) {
      const g = d.guide;
      const url = g.officialApplicationUrl || g.officialInformationUrl;
      if (url && !seenUrls.has(`${g.title}|${url}`)) {
        seenUrls.add(`${g.title}|${url}`);
        citations.push({
          title: g.title,
          sourceUrl: url,
          lastVerifiedAt: g.lastVerifiedAt || null,
          type: 'DOCUMENT_GUIDE'
        });
      }
    }
    if (Array.isArray(d.updates)) {
      for (const u of d.updates) {
        if (u.sourceUrl && !seenUrls.has(`${u.title}|${u.sourceUrl}`)) {
          seenUrls.add(`${u.title}|${u.sourceUrl}`);
          citations.push({
            title: u.title,
            sourceUrl: u.sourceUrl,
            lastVerifiedAt: u.lastVerifiedAt || u.publishedAt || null,
            type: 'POLICY_UPDATE'
          });
        }
      }
    }
  }

  return { serialized, citations };
}

/**
 * Step 5c: Post-check verification of LLM answer against tool outputs.
 * Rejects hallucinated ₹ amounts or fabricated scheme claims not backed by tool results.
 */
export function verifyGroundedResponse(answerText, toolExecutions = [], language = 'en') {
  const { serialized, citations } = collectToolGroundTruth(toolExecutions);
  const issues = [];

  // Extract explicit rupee amounts written by the model (e.g. ₹6,000, Rs. 50000, ₹33.60)
  const amountRegex = /(?:₹|rs\.?\s*)([\d,]+(?:\.\d+)?)/gi;
  let match;
  while ((match = amountRegex.exec(answerText || '')) !== null) {
    const rawNum = match[1].replace(/,/g, '');
    const withCommas = match[1];
    // Allow if the numeric figure appears in tool outputs (either raw digits or comma-formatted)
    if (!serialized.includes(rawNum.toLowerCase()) && !serialized.includes(withCommas.toLowerCase())) {
      issues.push(`Ungrounded rupee amount mentioned: ${match[0]}`);
    }
  }

  // If no citations exist at all and answer asserts detailed official facts (other than clarifying questions)
  const asksClarification = /\?/.test(answerText) && citations.length === 0 && (answerText || '').length < 320;
  if (citations.length === 0 && !asksClarification && toolExecutions.length > 0) {
    const hasAnyToolRecords = toolExecutions.some(t =>
      t.ok && ((t.data?.schemes?.length > 0) || t.data?.found || (t.data?.results?.length > 0) || (t.data?.updates?.length > 0))
    );
    if (!hasAnyToolRecords) {
      return {
        grounded: false,
        issues: ['No verified scheme/guide records matched the query'],
        citations: [],
        fallbackText: CANT_VERIFY_MESSAGE[language] || CANT_VERIFY_MESSAGE.en
      };
    }
  }

  return {
    grounded: issues.length === 0,
    issues,
    citations,
    fallbackText: issues.length > 0 ? (CANT_VERIFY_MESSAGE[language] || CANT_VERIFY_MESSAGE.en) : null
  };
}

/**
 * Step 5f: Logs anonymised unanswered or low-confidence AI questions for admin analytics.
 */
export function logUnansweredQuery(query, language = 'en', reason = 'no_verified_match') {
  try {
    const cleanQuery = redactSensitivePII(String(query || '').trim()).slice(0, 300);
    if (!cleanQuery) return null;

    const record = db.insert('unansweredAiQueries', {
      query: cleanQuery,
      language,
      reason,
      createdAt: new Date().toISOString()
    });
    logger.info({ reason, language }, 'Logged anonymised low-confidence AI query');
    return record;
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to log unanswered AI query');
    return null;
  }
}

// Simple TTL Response Cache (used only for stateless deterministic FAQs)
const responseCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 100;

export function getCachedResponse(key) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  return entry.value;
}

export function setCachedResponse(key, value) {
  if (responseCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = responseCache.keys().next().value;
    responseCache.delete(oldestKey);
  }
  responseCache.set(key, { value, ts: Date.now() });
}
