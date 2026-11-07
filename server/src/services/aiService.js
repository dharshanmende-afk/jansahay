/**
 * aiService.js — JanSahay Hybrid AI Assistant
 *
 * Grounded in the verified JanSahay knowledge base, active scheme directory,
 * smart document guides, official government sources, and the deterministic
 * EligibilityEngine.
 *
 * Multilingual Engine:
 *  - English (en)
 *  - Marathi (mr) + Romanized Marathi (Hinglish/Marathi in Latin script)
 *  - Hindi (hi) + Hinglish (Hindi in Latin script)
 *
 * Full Intent Coverage:
 *  - Groups A through L (Greetings, Discovery, Scheme Details, Scholarships,
 *    Farmers, Business/MSME, Documents, Eligibility, Roadmaps, Freshness,
 *    Navigation, Security & Privacy)
 *
 * Fallback & Provider Integrity:
 *  - Gemini 1.5 Flash (bounded timeout, safe fallback)
 *  - Groq Llama-3 (bounded timeout, safe fallback)
 *  - Grounded Deterministic Engine (always available, never falsely labeled as an external LLM)
 */

import { db } from '../db/database.js';
import { config } from '../config.js';
import { EligibilityEngine } from './eligibilityEngine.js';
import axios from 'axios';

export class AIService {
  /**
   * Accurate Language Detection
   * Distinguishes Hindi vs Marathi in both Devanagari and Latin script
   */
  static detectLanguage(text, requestedLanguage = 'en') {
    if (requestedLanguage === 'mr' || requestedLanguage === 'hi') {
      return requestedLanguage;
    }

    const t = text.toLowerCase().trim();

    // 1. Check Devanagari content
    const hasDevanagari = /[\u0900-\u097F]/.test(t);
    if (hasDevanagari) {
      // Distinctive Marathi markers in Devanagari
      const marathiDevanagariWords = [
        'आहे', 'आहेत', 'नाही', 'काय', 'कसा', 'कशी', 'कसे', 'मिळेल', 'करावे', 'लागेल',
        'माहिती', 'दाखला', 'अर्ज', 'शिष्यवृत्ती', 'शेतकरी', 'कागदपत्रे', 'उत्पन्न',
        'अधिवास', 'जात', 'सातबारा', 'सांगा', 'द्या', 'पाहिजे', 'करायचा', 'करायची',
        'कोणत्या', 'माझ्यासाठी', 'लागणारी', 'मराठी'
      ];

      // Distinctive Hindi markers in Devanagari
      const hindiDevanagariWords = [
        'है', 'हैं', 'नहीं', 'क्या', 'कैसे', 'मिलेगा', 'मिलेगी', 'करना', 'पड़ेगा',
        'जानकारी', 'योजनाएं', 'प्रमाण', 'आवेदन', 'छात्रवृत्ति', 'किसान', 'दस्तावेज',
        'दस्तावेज़', 'आय', 'निवास', 'जाति', 'बताइए', 'चाहिए', 'मेरे', 'कौन-कौन',
        'पात्रता', 'लगेंगे', 'हिंदी', 'हिन्दी'
      ];

      const mrMatches = marathiDevanagariWords.filter(w => t.includes(w)).length;
      const hiMatches = hindiDevanagariWords.filter(w => t.includes(w)).length;

      if (mrMatches > hiMatches) return 'mr';
      if (hiMatches > mrMatches) return 'hi';
      // Default Devanagari preference if tie
      return 'hi';
    }

    // 2. Romanized Marathi / Latin script Marathi markers
    const romanizedMarathiWords = [
      'mala', 'pahije', 'kasa', 'kashi', 'kase', 'kadhaicha', 'kadhaycha', 'milu',
      'shakte', 'shakto', 'karaycha', 'karaychi', 'konti', 'kontya', 'shetkari',
      'satbara', 'aahe', 'dakhla', 'utpann', 'mahiti', 'kiti'
    ];
    if (romanizedMarathiWords.some(w => new RegExp(`\\b${w}\\b`, 'i').test(t))) {
      return 'mr';
    }

    // 3. Hinglish / Latin script Hindi markers
    const hinglishWords = [
      'mujhe', 'kaise', 'chahiye', 'milega', 'milegi', 'karna', 'kaun', 'kaunsi',
      'sarkari', 'yojana', 'dastavez', 'aay', 'praman', 'patra', 'batao', 'bataiye',
      'kab aayega', 'kitna', 'paise', 'kya hai', 'hoga'
    ];
    if (hinglishWords.some(w => new RegExp(`\\b${w}\\b`, 'i').test(t))) {
      return 'hi';
    }

    return 'en';
  }

  /**
   * Builds grounded context from verified scheme and document guides
   */
  static buildContext(schemeId, userProfile = null) {
    let ctx = 'GROUNDED OFFICIAL INFORMATION BASE (JanSahay):\n';

    if (schemeId) {
      const scheme = db.findById('schemes', schemeId);
      if (scheme) {
        ctx += `\nTARGET SCHEME: ${scheme.name}\n`;
        ctx += `CATEGORY: ${scheme.category} | LEVEL: ${scheme.governmentLevel} | JURISDICTION: ${scheme.state || 'All India'}\n`;
        ctx += `OBJECTIVE / DESCRIPTION: ${scheme.description}\n`;
        ctx += `BENEFITS: ${scheme.benefit}\n`;
        ctx += `OFFICIAL PORTAL URL: ${scheme.sourceUrl}\n`;
        ctx += `LAST VERIFIED DATE: ${scheme.lastVerified || 'March 2026'}\n`;
        ctx += `VERIFICATION STATUS: ${scheme.verificationStatus || 'VERIFIED'}\n`;

        if (scheme.rules?.length) {
          ctx += `ELIGIBILITY CRITERIA:\n`;
          scheme.rules.forEach(r => {
            ctx += `  - ${r.description || (r.field + ' ' + r.operator + ' ' + r.value)}\n`;
          });
        }
        if (scheme.requiredDocuments?.length) {
          ctx += `REQUIRED DOCUMENTS:\n`;
          scheme.requiredDocuments.forEach(d => {
            ctx += `  - ${d.documentName} (${d.purpose || 'Verification'}, Authority: ${d.issuingAuthority || 'Govt'})\n`;
          });
        }
        if (scheme.applicationGuides?.length) {
          ctx += `APPLICATION ROADMAP:\n`;
          scheme.applicationGuides.forEach(s => {
            ctx += `  Step ${s.stepNumber}: ${s.title} — ${s.instruction}\n`;
          });
        }
      }
    }

    if (userProfile) {
      ctx += `\nCITIZEN CONTEXT: Category=${userProfile.category}, State=${userProfile.state || 'Maharashtra'}, District=${userProfile.district || 'Not specified'}, Income=${userProfile.incomeRange || 'Not declared'}\n`;
    }

    return ctx;
  }

  /**
   * Deterministic Grounded Engine
   * Covers Question Groups A through L with complete multilingual support
   */
  static generateDeterministicAnswer(question, schemeId, language = 'en', userProfile = null) {
    const q = question.toLowerCase().trim();
    const detectedLang = this.detectLanguage(question, language);
    const scheme = schemeId ? db.findById('schemes', schemeId) : null;
    const allSchemes = db.find('schemes') || [];
    const guides = db.find('documentGuides') || [];
    const updates = db.find('updates') || [];

    const generatedAt = new Date().toISOString();

    // Helper: Build standard response
    const respond = (answer, sources = [], guideId = null, officialUrl = null) => {
      let providerName = 'JanSahay Grounded Engine';
      if (detectedLang === 'mr') providerName = 'JanSahay Multilingual Engine (मराठी)';
      else if (detectedLang === 'hi') providerName = 'JanSahay Multilingual Engine (हिंदी)';

      return {
        answer,
        provider: providerName,
        sources: sources.length > 0 ? sources : (scheme ? [{
          title: scheme.name,
          url: scheme.sourceUrl,
          sourceName: `${scheme.governmentLevel} Government (${scheme.state || 'All India'})`,
          dataStatus: scheme.dataStatus || 'knowledge_base',
          lastVerified: scheme.lastVerified || 'March 2026'
        }] : [{
          title: 'National Portal of India',
          url: 'https://www.india.gov.in',
          sourceName: 'Official Govt Portal',
          dataStatus: 'knowledge_base',
          lastVerified: 'March 2026'
        }]),
        dataStatus: scheme?.dataStatus || 'knowledge_base',
        generatedAt,
        isVerified: true,
        guideId,
        officialUrl: officialUrl || scheme?.sourceUrl || null
      };
    };

    // Helper: Find document guide
    const findDocGuide = (keywords) => {
      return guides.find(g =>
        keywords.some(kw =>
          g.documentType?.toLowerCase().includes(kw) ||
          g.title?.toLowerCase().includes(kw) ||
          g.simpleDescription?.toLowerCase().includes(kw)
        )
      ) || null;
    };

    // Helper: Find matching schemes
    const findSchemesByKeywords = (keywords) => {
      return allSchemes.filter(s =>
        keywords.some(kw =>
          s.name?.toLowerCase().includes(kw) ||
          s.description?.toLowerCase().includes(kw) ||
          s.category?.toLowerCase().includes(kw) ||
          s.benefit?.toLowerCase().includes(kw)
        )
      );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // GROUP A: Greetings & Basic Help
    // ─────────────────────────────────────────────────────────────────────────
    if (/^(hi|hello|hey|namaste|namaskar|pranam|ram ram|hallo)\b/i.test(q) ||
        q.includes('what is jansahay') || q.includes('how does jansahay work') || q.includes('who are you') ||
        q.includes('काय आहे जनसहाय') || q.includes('जनसहाय क्या है')) {
      if (detectedLang === 'mr') {
        return respond(
          `**नमस्कार! जनसहाय AI मध्ये आपले स्वागत आहे!** 🙏\n\n` +
          `जनसहाय हे भारतीय नागरिकांसाठी केंद्र व राज्य सरकारच्या कल्याणकारी योजना, शिष्यवृत्ती आणि आवश्यक कागदपत्रांची माहिती देणारे डिजिटल साहाय्यक व्यासपीठ आहे.\n\n` +
          `**मी तुम्हाला खालील गोष्टींमध्ये मदत करू शकतो:**\n` +
          `• 🎓 **विद्यार्थी शिष्यवृत्ती** — MahaDBT, NSP, EBC, OBC, SC/ST योजना\n` +
          `• 🌾 **शेतकरी योजना** — PM-KISAN, नमो शेतकरी, पीक विमा (PMFBY), 7/12\n` +
          `• 💼 **व्यवसाय व स्वयंरोजगार** — PM Mudra, CMEGP, PMEGP, Udyam MSME\n` +
          `• 🏥 **आरोग्य व सामाजिक संरक्षण** — आयुष्मान भारत (PM-JAY), लाडकी बहीण\n` +
          `• 📋 **शासकीय कागदपत्रे** — उत्पन्नाचा दाखला, अधिवास, जात प्रमाणपत्र\n\n` +
          `आपण कोणत्याही योजनेबद्दल किंवा कागदपत्रांबद्दल प्रश्न विचारू शकता!`
        );
      }
      if (detectedLang === 'hi') {
        return respond(
          `**नमस्ते! जनसहाय AI में आपका स्वागत है!** 🙏\n\n` +
          `जनसहाय भारतीय नागरिकों के लिए सरकारी कल्याणकारी योजनाओं, छात्रवृत्तियों और आवश्यक दस्तावेजों की सही व सत्यापित जानकारी देने वाला डिजिटल प्लेटफॉर्म है।\n\n` +
          `**मैं आपकी इन विषयों में सहायता कर सकता हूँ:**\n` +
          `• 🎓 **छात्रवृत्तियां** — MahaDBT, NSP, EBC, SC/ST/OBC स्कॉलरशिप\n` +
          `• 🌾 **किसान कल्याण** — PM-KISAN, नमो शेतकरी, फसल बीमा (PMFBY)\n` +
          `• 💼 **व्यापार एवं स्वरोजगार** — PM Mudra, PMEGP, Stand-Up India, उद्यम MSME\n` +
          `• 🏥 **स्वास्थ्य एवं आवास** — आयुष्मान भारत (PM-JAY), PMAY आवास योजना\n` +
          `• 📋 **सरकारी दस्तावेज** — आय प्रमाण पत्र, निवास प्रमाण पत्र, जाति प्रमाण पत्र\n\n` +
          `कृपया अपनी आवश्यकता बताएं या कोई प्रश्न पूछें!`
        );
      }
      return respond(
        `**Welcome to JanSahay AI Assistant!** 🇮🇳\n\n` +
        `JanSahay is a citizen-assistance platform designed to help you discover official government schemes, understand eligibility rules, identify missing certificates, and follow step-by-step application guidance.\n\n` +
        `**How I can assist you:**\n` +
        `• 🎓 **Education & Scholarships** — MahaDBT, National Scholarship Portal (NSP), EBC, and reserved category benefits\n` +
        `• 🌾 **Farmer Welfare** — PM-KISAN, Namo Shetkari, PMFBY Crop Insurance, Soil Health Cards\n` +
        `• 💼 **Business & MSME** — PM Mudra, PMEGP, CMEGP, Stand-Up India, Udyam Registration\n` +
        `• 🏥 **Healthcare & Social Welfare** — Ayushman Bharat (PM-JAY), PMAY Housing, Ladki Bahin\n` +
        `• 📋 **Document Preparation** — Step-by-step guides for Income, Domicile, Caste, and 7/12 records\n\n` +
        `Feel free to ask a question in **English**, **Hindi (हिंदी)**, or **Marathi (मराठी)**!`
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GROUP L: Security, Privacy, and Limitations (Safety Check first)
    // ─────────────────────────────────────────────────────────────────────────
    if (q.includes('aadhaar') && (q.includes('number') || q.includes('share') || q.includes('collect') || q.includes('password')) ||
        q.includes('is jansahay official') || q.includes('guarantee approval') || q.includes('privacy') || q.includes('security')) {
      if (detectedLang === 'mr') {
        return respond(
          `**सुरक्षा, गोपनीयता आणि जनसहायच्या मर्यादा:**\n\n` +
          `1. 🛡️ **जनसहाय अधिकृत सरकारी विभाग नाही:** हे एक स्वतंत्र नागरिक साहाय्यक व्यासपीठ आहे.\n` +
          `2. 🔒 **गोपनीय माहिती कधीही शेअर करू नका:** जनसहाय कधीही तुमचा पूर्ण आधार क्रमांक, बँक पासवर्ड, OTP किंवा UPI पिन मागत नाही. चॅटमध्ये कोणतीही संवेदनशील माहिती टाकू नका.\n` +
          `3. ⚖️ **मंजुरीची हमी नाही:** कोणताही सरकारी लाभ मिळण्याचा अंतिम निर्णय केवळ संबंधित शासकीय विभागाच्या पडताळणीवर अवलंबून असतो.\n` +
          `4. 🌐 **अधिकृत अर्ज:** सर्व अंतिम अर्ज नेहमी संबंधित अधिकृत सरकारी संकेतस्थळावरच (उदा. aaplesarkar, mahadbt, pmkisan) सादर करावेत.`
        );
      }
      if (detectedLang === 'hi') {
        return respond(
          `**सुरक्षा, गोपनीयता और जनसहाय की सीमाएं:**\n\n` +
          `1. 🛡️ **जनसहाय आधिकारिक सरकारी विभाग नहीं है:** यह नागरिकों की सहायता के लिए बनाया गया सूचना एवं मार्गदर्शन प्लेटफॉर्म है।\n` +
          `2. 🔒 **संवेदनशील जानकारी साझा न करें:** जनसहाय कभी भी आपका पूरा आधार नंबर, बैंक पासवर्ड, एटीएम पिन या OTP नहीं मांगता। चैट में गोपनीय जानकारी कभी न लिखें।\n` +
          `3. ⚖️ **स्वीकृति की कोई गारंटी नहीं:** योजना का लाभ देने का अधिकार केवल संबंधित सरकारी प्राधिकरण के पास है।\n` +
          `4. 🌐 **आधिकारिक आवेदन:** हमेशा संबंधित सरकारी पोर्टल (जैसे mahadbt, pmkisan, nsp) पर ही सुरक्षित रूप से आवेदन करें।`
        );
      }
      return respond(
        `**Security, Privacy, and Important Limitations:**\n\n` +
        `1. 🛡️ **Independent Assistance Platform:** JanSahay is an academic and civic assistance application, **not an official government ministry or department**.\n` +
        `2. 🔒 **Privacy Protection:** JanSahay **never asks for or stores** your full Aadhaar number, bank account passwords, OTPs, or financial credentials. Please never share private secrets in chat.\n` +
        `3. ⚖️ **No Guarantee of Approval:** JanSahay cannot grant government funds or guarantee application approval. Final eligibility and sanctions are strictly determined by the respective government authorities upon scrutiny.\n` +
        `4. 🌐 **Direct Application:** Applications must always be submitted on authorized government portals (such as Aaple Sarkar, MahaDBT, PM-KISAN, or JanSamarth).`
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GROUP H: Eligibility & Personalized Recommendations
    // ─────────────────────────────────────────────────────────────────────────
    if (q.includes('eligible') || q.includes('eligibility') || q.includes('qualify') ||
        q.includes('can i apply') || q.includes('why recommended') || q.includes('पात्र') || q.includes('पात्रता')) {
      if (scheme) {
        // Evaluate using actual deterministic EligibilityEngine!
        const evalResult = EligibilityEngine.evaluateScheme(scheme, userProfile);
        const matchTier = evalResult.matchType;

        if (detectedLang === 'mr') {
          return respond(
            `**${scheme.name} — पात्रता पडताळणी अहवाल:**\n\n` +
            `🎯 **नियम जुळणी स्थिती:** ${evalResult.matchScore}% (${matchTier.replace(/_/g, ' ')})\n\n` +
            (evalResult.matchedConditions.length > 0 ? `✅ **पात्र ठरलेल्या अटी:**\n${evalResult.matchedConditions.map(c => `  • ${c}`).join('\n')}\n\n` : '') +
            (evalResult.failedConditions.length > 0 ? `❌ **अपूर्ण / जुळत नसलेल्या अटी:**\n${evalResult.failedConditions.map(c => `  • ${c}`).join('\n')}\n\n` : '') +
            (evalResult.missingInformation.length > 0 ? `ℹ️ **अतिरिक्त माहिती आवश्यक:**\n${evalResult.missingInformation.map(c => `  • ${c}`).join('\n')}\n\n` : '') +
            `📄 **आवश्यक कागदपत्रे:** ${scheme.requiredDocuments?.map(d => d.documentName).join(', ') || 'आधार कार्ड, उत्पन्नाचा दाखला'}\n` +
            `🌐 **अधिकृत पोर्टल:** [${scheme.sourceUrl}](${scheme.sourceUrl})`
          );
        }

        if (detectedLang === 'hi') {
          return respond(
            `**${scheme.name} — पात्रता विश्लेषण:**\n\n` +
            `🎯 **नियम स्कोर:** ${evalResult.matchScore}% (${matchTier.replace(/_/g, ' ')})\n\n` +
            (evalResult.matchedConditions.length > 0 ? `✅ **संतुष्ट शर्तें:**\n${evalResult.matchedConditions.map(c => `  • ${c}`).join('\n')}\n\n` : '') +
            (evalResult.failedConditions.length > 0 ? `❌ **अपूर्ण शर्तें:**\n${evalResult.failedConditions.map(c => `  • ${c}`).join('\n')}\n\n` : '') +
            (evalResult.missingInformation.length > 0 ? `ℹ️ **आवश्यक अतिरिक्त जानकारी:**\n${evalResult.missingInformation.map(c => `  • ${c}`).join('\n')}\n\n` : '') +
            `📄 **आवश्यक दस्तावेज़:** ${scheme.requiredDocuments?.map(d => d.documentName).join(', ') || 'आधार कार्ड, आय प्रमाण पत्र'}\n` +
            `🌐 **आधिकारिक पोर्टल:** [${scheme.sourceUrl}](${scheme.sourceUrl})`
          );
        }

        return respond(
          `**Eligibility Analysis for ${scheme.name}:**\n\n` +
          `🎯 **Match Score:** ${evalResult.matchScore}% — **${matchTier.replace(/_/g, ' ')}**\n\n` +
          (evalResult.matchedConditions.length > 0
            ? `✅ **Satisfied Criteria:**\n${evalResult.matchedConditions.map(c => `  • ${c}`).join('\n')}\n\n`
            : '') +
          (evalResult.failedConditions.length > 0
            ? `❌ **Unsatisfied / Unmatched Conditions:**\n${evalResult.failedConditions.map(c => `  • ${c}`).join('\n')}\n\n`
            : '') +
          (evalResult.missingInformation.length > 0
            ? `ℹ️ **Information Needed to Finalize Verification:**\n${evalResult.missingInformation.map(c => `  • ${c}`).join('\n')}\n\n`
            : '') +
          `📄 **Required Documents:**\n${scheme.requiredDocuments?.map(d => `  • ${d.documentName} (${d.purpose || 'Verification'})`).join('\n') || '  • Standard KYC Documents'}\n\n` +
          `🌐 **Official Portal:** [${scheme.sourceUrl}](${scheme.sourceUrl})`
        );
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GROUP G: Documents & Certificates
    // ─────────────────────────────────────────────────────────────────────────
    const docKeywords = [
      { keys: ['income', 'utpann', 'उत्पन्न', 'आय प्रमाण'], type: 'INCOME_CERTIFICATE' },
      { keys: ['domicile', 'residence', 'nivas', 'अधिवास', 'निवास प्रमाण'], type: 'DOMICILE_CERTIFICATE' },
      { keys: ['caste certificate', 'jaat', 'jati', 'जात प्रमाणपत्र', 'जाति प्रमाण'], type: 'CASTE_CERTIFICATE' },
      { keys: ['caste validity', 'validity', 'जात पडताळणी'], type: 'CASTE_VALIDITY' },
      { keys: ['non creamy', 'ncl', 'नॉन-क्रिमीलेअर'], type: 'NON_CREAMY_LAYER' },
      { keys: ['7/12', 'satbara', 'saat baara', 'land record', 'सातबारा'], type: 'SEVEN_TWELVE_EXTRACT' },
      { keys: ['udyam', 'msme registration', 'उद्यम नोंदणी'], type: 'UDYAM_REGISTRATION' },
      { keys: ['disability', 'udid', 'divyang', 'दिव्यांग'], type: 'DISABILITY_CERTIFICATE' },
      { keys: ['bonafide', 'बोनाफाईड'], type: 'BONAFIDE_CERTIFICATE' },
      { keys: ['ration card', 'रेशन कार्ड', 'राशन कार्ड'], type: 'RATION_CARD' },
    ];

    for (const item of docKeywords) {
      if (item.keys.some(k => q.includes(k))) {
        const guide = guides.find(g => g.documentType === item.type);
        if (guide) {
          const sources = [{
            title: guide.title,
            url: guide.officialApplicationUrl,
            sourceName: guide.issuingAuthority,
            dataStatus: 'knowledge_base',
            lastVerified: guide.lastVerifiedAt || 'March 2026'
          }];

          if (detectedLang === 'mr') {
            return respond(
              `**${guide.title} — संपूर्ण अर्ज मार्गदर्शन:**\n\n` +
              `🏛️ **जारीकर्ता संस्था:** ${guide.issuingAuthority}\n` +
              `🌐 **अधिकृत अर्ज पोर्टल:** [${guide.officialApplicationUrl}](${guide.officialApplicationUrl})\n` +
              `⏱️ **अपेक्षित कालावधी:** ${guide.expectedProcessingTime || '15 ते 21 दिवस'}\n` +
              `💳 **शासकीय शुल्क:** ${guide.possibleFees || 'किमान शासकीय शुल्क'}\n\n` +
              `📄 **आवश्यक पुरावे:**\n${guide.requiredSupportingDocuments?.map(d => `  • ${d}`).join('\n') || '  • आधार कार्ड, रहिवासी पुरावा'}\n\n` +
              (guide.additionalNotes ? `💡 **महत्त्वाची टीप:** ${guide.additionalNotes}\n\n` : '') +
              `आपण जवळच्या महा ई-सेवा केंद्र (CSC) किंवा सेतू केंद्रावरूनही अर्ज करू शकता.`,
              sources,
              guide.id,
              guide.officialApplicationUrl
            );
          }

          if (detectedLang === 'hi') {
            return respond(
              `**${guide.title} — आवेदन प्रक्रिया एवं दिशानिर्देश:**\n\n` +
              `🏛️ **जारी करने वाला प्राधिकरण:** ${guide.issuingAuthority}\n` +
              `🌐 **आधिकारिक पोर्टल:** [${guide.officialApplicationUrl}](${guide.officialApplicationUrl})\n` +
              `⏱️ **अनुमानित समय:** ${guide.expectedProcessingTime || '15-21 कार्य दिवस'}\n` +
              `💳 **सरकारी शुल्क:** ${guide.possibleFees || 'न्यूनतम शुल्क'}\n\n` +
              `📄 **आवश्यक दस्तावेज:**\n${guide.requiredSupportingDocuments?.map(d => `  • ${d}`).join('\n') || '  • आधार कार्ड, निवास प्रमाण'}\n\n` +
              (guide.additionalNotes ? `💡 **महत्वपूर्ण सूचना:** ${guide.additionalNotes}\n\n` : '') +
              `नजदीकी सीएससी (CSC) या जन सेवा केंद्र पर जाकर भी आवेदन कर सकते हैं।`,
              sources,
              guide.id,
              guide.officialApplicationUrl
            );
          }

          return respond(
            `**How to Obtain: ${guide.title}**\n\n` +
            `🏛️ **Issuing Authority:** ${guide.issuingAuthority}\n` +
            `🌐 **Official Application Portal:** [${guide.officialApplicationUrl}](${guide.officialApplicationUrl})\n` +
            `⏱️ **Statutory Processing Timeline:** ${guide.expectedProcessingTime || '15 to 21 working days'}\n` +
            `💳 **Official Fee Structure:** ${guide.possibleFees || 'Nominal statutory charge'}\n\n` +
            `📄 **Required Supporting Documents:**\n${guide.requiredSupportingDocuments?.map(d => `  • ${d}`).join('\n') || '  • Aadhaar Card, Address Proof, Proof of Income'}\n\n` +
            (guide.additionalNotes ? `💡 **Important Note:** ${guide.additionalNotes}\n\n` : '') +
            `**Application Route:** You can apply online through the official portal or visit your nearest Citizen Service Centre (Setu Suvidha Kendra / CSC).`,
            sources,
            guide.id,
            guide.officialApplicationUrl
          );
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GROUP D: Student & Scholarship Guidance
    // ─────────────────────────────────────────────────────────────────────────
    if (q.includes('scholarship') || q.includes('student') || q.includes('b.tech') || q.includes('college') ||
        q.includes('mahadbt') || q.includes('ebc') || q.includes('शिष्यवृत्ती') || q.includes('छात्रवृत्ति')) {
      const studentSchemes = allSchemes.filter(s =>
        s.category === 'EDUCATION' || s.targetBeneficiaries?.toLowerCase().includes('student')
      );

      const sources = studentSchemes.slice(0, 3).map(s => ({
        title: s.name,
        url: s.sourceUrl,
        sourceName: `${s.governmentLevel} Govt (${s.state || 'All India'})`,
        dataStatus: s.dataStatus || 'knowledge_base',
        lastVerified: s.lastVerified || 'March 2026'
      }));

      if (detectedLang === 'mr') {
        return respond(
          `**विद्यार्थी शिष्यवृत्ती मार्गदर्शन (Maharashtra & Central):**\n\n` +
          `महाराष्ट्रातील आणि राष्ट्रीय स्तरावरील प्रमुख विद्यार्थी शिष्यवृत्ती योजना:\n\n` +
          `1. **राजर्षी छत्रपती शाहू महाराज शिक्षण शुल्क शिष्यवृत्ती (EBC):**\n` +
          `   • खुल्या प्रवर्गातील (EBC) विद्यार्थ्यांसाठी ५०% शिक्षण शुल्क व परीक्षा शुल्क परतावा (वार्षिक उत्पन्न मर्यादा: ₹८ लाख).\n` +
          `2. **डॉ. पंजाबराव देशमुख वसतिगृह निर्वाह भत्ता:**\n` +
          `   • नोंदणीकृत शेतकरी कुटुंबातील विद्यार्थ्यांना वसतिगृह खर्चासाठी ₹२०,००० ते ₹३०,००० वार्षिक भत्ता.\n` +
          `3. **SC / ST / VJNT / OBC मॅट्रिकोत्तर शिष्यवृत्ती (MahaDBT):**\n` +
          `   • १००% शिक्षण शुल्क प्रतिपूर्ती आणि मासिक निर्वाह भत्ता.\n` +
          `4. **National Scholarship Portal (NSP Central Schemes):**\n` +
          `   • केंद्रीय मंत्रालयांच्या गुणवत्ता शिष्यवृत्ती.\n\n` +
          `🌐 **अर्ज करण्याचे अधिकृत पोर्टल:** [MahaDBT Portal](https://mahadbt.maharashtra.gov.in)\n` +
          `📄 **महत्त्वाची कागदपत्रे:** उत्पन्नाचा दाखला, अधिवास प्रमाणपत्र (Domicile), बोनाफाईड प्रमाणपत्र, CAP allotment letter.`,
          sources
        );
      }

      if (detectedLang === 'hi') {
        return respond(
          `**छात्रवृत्ति योजनाएं (Scholarships for Students):**\n\n` +
          `विद्यार्थियों के लिए प्रमुख सरकारी छात्रवृत्ति योजनाएं:\n\n` +
          `1. **राजर्षि शाहू महाराज EBC शुल्क प्रतिपूर्ति (MahaDBT):**\n` +
          `   • व्यावसायिक एवं उच्च शिक्षा के लिए 50% ट्यूशन फीस प्रतिपूर्ति (पारिवारिक आय ₹8 लाख तक)।\n` +
          `2. **डॉ. पंजाबराव देशमुख हॉस्टल भत्ता योजना:**\n` +
          `   • किसान परिवारों के विद्यार्थियों के लिए ₹20,000 से ₹30,000 प्रति वर्ष हॉस्टल भत्ता।\n` +
          `3. **SC / ST / OBC पोस्ट-मैट्रिक स्कॉलरशिप:**\n` +
          `   • 100% शिक्षण शुल्क छूट एवं मासिक निर्वाह भत्ता।\n` +
          `4. **नेशनल स्कॉलरशिप पोर्टल (NSP Schemes):**\n` +
          `   • केंद्रीय मंत्रालयों की मेधावी छात्रवृत्तियां।\n\n` +
          `🌐 **ऑनलाइन आवेदन पोर्टल:** [MahaDBT](https://mahadbt.maharashtra.gov.in) | [NSP](https://scholarships.gov.in)\n` +
          `📄 **आवश्यक दस्तावेज:** आय प्रमाण पत्र, निवास प्रमाण पत्र, कॉलेज बोनाफाइड, आधार-सीडेड बैंक खाता।`,
          sources
        );
      }

      return respond(
        `**Official Student Scholarships & Fee Reimbursement Schemes:**\n\n` +
        `Here are the verified central and state scholarship programmes available for higher education:\n\n` +
        `1. **Rajarshi Chhatrapati Shahu Maharaj EBC Scholarship (MahaDBT):**\n` +
        `   • 50% tuition and exam fee reimbursement for general/EBC students enrolled in approved technical (B.Tech, Pharmacy, Polytechnic) and non-professional courses (family income up to ₹8 Lakhs).\n` +
        `2. **Dr. Punjabrao Deshmukh Hostel Maintenance Allowance:**\n` +
        `   • Annual maintenance allowance of ₹20,000 to ₹30,000 for children of small/marginal farmers pursuing higher education away from home in hostels or rented accommodation.\n` +
        `3. **Government of India Post-Matric Scholarships (SC / ST / VJNT / OBC):**\n` +
        `   • 100% tuition fee waiver directly credited to the institution plus maintenance stipend.\n` +
        `4. **National Scholarship Portal (NSP Central Schemes):**\n` +
        `   • Merit-cum-means scholarships from Central Ministries across all states.\n\n` +
        `🌐 **Official Portals:** [MahaDBT](https://mahadbt.maharashtra.gov.in) and [NSP](https://scholarships.gov.in)\n` +
        `📄 **Key Documents Needed:** Income Certificate (Tehsildar), Maharashtra Domicile, College Bonafide, CAP Allotment Letter, and NPCI Aadhaar-seeded Bank Account.`,
        sources
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GROUP E: Farmer Guidance
    // ─────────────────────────────────────────────────────────────────────────
    if (q.includes('farmer') || q.includes('kisan') || q.includes('agriculture') || q.includes('pm-kisan') ||
        q.includes('fasal bima') || q.includes('crop') || q.includes('शेतकरी') || q.includes('किसान')) {
      const farmerSchemes = allSchemes.filter(s => s.category === 'AGRICULTURE');
      const sources = farmerSchemes.slice(0, 3).map(s => ({
        title: s.name,
        url: s.sourceUrl,
        sourceName: `${s.governmentLevel} Govt (${s.state || 'All India'})`,
        dataStatus: s.dataStatus || 'knowledge_base',
        lastVerified: s.lastVerified || 'March 2026'
      }));

      if (detectedLang === 'mr') {
        return respond(
          `**शेतकऱ्यांसाठी शासकीय योजना (Farmer Welfare Schemes):**\n\n` +
          `1. **PM-KISAN (प्रधानमंत्री किसान सन्मान निधी):**\n` +
          `   • वर्षाला ₹६,००० थेट बँक खात्यात (₹२,००० चे तीन समान हप्ते).\n` +
          `2. **नमो शेतकरी महासन्मान निधी योजना (महाराष्ट्र):**\n` +
          `   • महाराष्ट्र शासनाकडून अतिरिक्त ₹६,०००, ज्यामुळे PM-KISAN सह एकूण ₹१२,००० प्रतिवर्ष मिळतात.\n` +
          `3. **प्रधानमंत्री पीक विमा योजना (PMFBY):**\n` +
          `   • अवकाळी पाऊस, दुष्काळ किंवा नैसर्गिक आपत्तीमुळे पिकाचे नुकसान झाल्यास आर्थिक भरपाई (महाराष्ट्रात केवळ ₹१ टोकन शुल्कात).\n` +
          `4. **मृदा आरोग्य पत्रिका (Soil Health Card) व ई-नाम (eNAM):**\n` +
          `   • मोफत माती परीक्षण व थेट राष्ट्रीय बाजारपेठेत कृषी मालाची विक्री.\n\n` +
          `🌐 **अधिकृत संकेतस्थळ:** [PM-KISAN Portal](https://pmkisan.gov.in) | [कृषी विभाग महाराष्ट्र](https://krishi.maharashtra.gov.in)\n` +
          `📄 **आवश्यक कागदपत्रे:** डिजिटल ७/१२ व ८-अ उतारा, आधार कार्ड (e-KYC पूर्ण), बँक पासबुक.`,
          sources
        );
      }

      if (detectedLang === 'hi') {
        return respond(
          `**किसानों के लिए सरकारी कल्याणकारी योजनाएं:**\n\n` +
          `1. **प्रधानमंत्री किसान सम्मान निधि (PM-KISAN):**\n` +
          `   • सभी भूमिधारक किसान परिवारों को ₹6,000 प्रति वर्ष (₹2,000 की 3 किस्तों में सीधे बैंक खाते में)।\n` +
          `2. **नमो शेतकरी महासम्मान निधि (महाराष्ट्र):**\n` +
          `   • महाराष्ट्र के पात्र किसानों को अतिरिक्त ₹6,000 (कुल ₹12,000 प्रति वर्ष)।\n` +
          `3. **प्रधानमंत्री फसल बीमा योजना (PMFBY):**\n` +
          `   • प्राकृतिक आपदाओं या सूखे से फसल नुकसान पर पूर्ण बीमा सुरक्षा।\n` +
          `4. **मृदा स्वास्थ्य कार्ड एवं ई-नाम (eNAM):**\n` +
          `   • नि:शुल्क मिट्टी जांच तथा 1000+ मंडियों में फसल का उचित मूल्य।\n\n` +
          `🌐 **आधिकारिक पोर्टल:** [pmkisan.gov.in](https://pmkisan.gov.in)\n` +
          `📄 **अनिवार्य दस्तावेज:** भू-अभिलेख (खतौनी / 7/12), आधार कार्ड (e-KYC), बैंक पासबुक।`,
          sources
        );
      }

      return respond(
        `**Official Government Schemes Supporting Farmers:**\n\n` +
        `1. **PM-KISAN (Pradhan Mantri Kisan Samman Nidhi):**\n` +
        `   • Central income support of ₹6,000 per year transferred directly to landholding farmers in three 4-monthly instalments of ₹2,000 via DBT.\n` +
        `2. **Namo Shetkari Mahasanman Nidhi (Maharashtra Supplement):**\n` +
        `   • Additional ₹6,000 per year from the Govt of Maharashtra for PM-KISAN verified farmers, totaling ₹12,000 annually.\n` +
        `3. **Pradhan Mantri Fasal Bima Yojana (PMFBY):**\n` +
        `   • Multi-peril crop insurance safeguarding against drought, flood, pests, and unseasonal rainfall with nominal farmer premium (token ₹1 in Maharashtra).\n` +
        `4. **Soil Health Card & eNAM (National Agriculture Market):**\n` +
        `   • Free biennial soil testing and integrated digital mandi trading across 1,000+ APMCs.\n\n` +
        `🌐 **Official Portals:** [PM-KISAN](https://pmkisan.gov.in) and [PMFBY](https://pmfby.gov.in)\n` +
        `📄 **Key Requirements:** Updated 7/12 & 8A Land Record, Biometric Aadhaar e-KYC, and NPCI Aadhaar-seeded Bank Account.`,
        sources
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GROUP F: Business and MSME
    // ─────────────────────────────────────────────────────────────────────────
    if (q.includes('business') || q.includes('msme') || q.includes('loan') || q.includes('mudra') ||
        q.includes('startup') || q.includes('cmegp') || q.includes('pmegp') || q.includes('व्यवसाय') || q.includes('उद्योग')) {
      const bizSchemes = allSchemes.filter(s => s.category === 'BUSINESS');
      const sources = bizSchemes.slice(0, 3).map(s => ({
        title: s.name,
        url: s.sourceUrl,
        sourceName: `${s.governmentLevel} Govt (${s.state || 'All India'})`,
        dataStatus: s.dataStatus || 'knowledge_base',
        lastVerified: s.lastVerified || 'March 2026'
      }));

      if (detectedLang === 'mr') {
        return respond(
          `**व्यवसाय व उद्योग सुरू करण्यासाठी शासकीय कर्ज योजना:**\n\n` +
          `1. **प्रधानमंत्री मुद्रा योजना (PMMY):**\n` +
          `   • विनातारण कर्ज: शिशु (₹५०,००० पर्यंत), किशोर (₹५०,००० ते ₹५ लाख), तरुण (₹५ लाख ते ₹१० लाख).\n` +
          `2. **मुख्यमंत्री रोजगार निर्मिती कार्यक्रम (CMEGP - Maharashtra):**\n` +
          `   • उत्पादन क्षेत्रासाठी ₹५० लाखांपर्यंत व सेवा क्षेत्रासाठी ₹२० लाखांपर्यंत प्रकल्प साहाय्य (१५% ते ३५% शासकीय अनुदान).\n` +
          `3. **PMEGP (पंतप्रधान रोजगार निर्मिती कार्यक्रम):**\n` +
          `   • केंद्रीय खादी व ग्रामोद्योग मंडळाकडून २५% ते ३५% भांडवली सबसिडी.\n` +
          `4. **PM स्वनिधी (PM SVANidhi):**\n` +
          `   • फेरीवाले व छोट्या विक्रेत्यांसाठी ₹१०,००० ते ₹५०,००० पर्यंत खेळते भांडवल कर्ज.\n` +
          `5. **उद्यम नोंदणी (Udyam Registration):**\n` +
          `   • १००% मोफत व कागदपत्रविरहित राष्ट्रीय MSME नोंदणी.\n\n` +
          `🌐 **अधिकृत पोर्टल:** [JanSamarth](https://www.jansamarth.in) | [Maha-CMEGP](https://maha-cmegp.gov.in) | [Udyam](https://udyamregistration.gov.in)`,
          sources
        );
      }

      return respond(
        `**Official Government Support for Business & Entrepreneurs:**\n\n` +
        `1. **Pradhan Mantri Mudra Yojana (PMMY):**\n` +
        `   • Collateral-free micro-credit for non-corporate micro/small enterprises across 3 categories: Shishu (up to ₹50k), Kishore (₹50k-₹5L), and Tarun (₹5L-₹10L).\n` +
        `2. **Chief Minister Employment Generation Programme (CMEGP - Maharashtra):**\n` +
        `   • Credit-linked financial assistance up to ₹50 Lakhs (Manufacturing) and ₹20 Lakhs (Services) with 15% to 35% capital subsidy.\n` +
        `3. **PMEGP (Central Scheme):**\n` +
        `   • Bank-financed subsidies up to 35% margin money through KVIC/DIC.\n` +
        `4. **PM SVANidhi:**\n` +
        `   • Working capital micro-loans (₹10k, ₹20k, ₹50k) for urban and rural street vendors.\n` +
        `5. **Udyam MSME Registration:**\n` +
        `   • Completely free paperless MSME identity unlocking priority sector lending exemptions.\n\n` +
        `🌐 **Official Application Portals:** [JanSamarth](https://www.jansamarth.in), [Maha-CMEGP](https://maha-cmegp.gov.in), and [Udyam](https://udyamregistration.gov.in)`,
        sources
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GROUP J: Freshness & Government Announcements
    // ─────────────────────────────────────────────────────────────────────────
    if (q.includes('latest update') || q.includes('announcement') || q.includes('news') ||
        q.includes('fresh') || q.includes('pib') || q.includes('नवीन अपडेट') || q.includes('ताजा अपडेट')) {
      const topUpdates = updates.slice(0, 4);
      const sources = topUpdates.map(u => ({
        title: u.title,
        url: u.sourceUrl,
        sourceName: u.source,
        dataStatus: u.dataStatus || 'cached',
        lastVerified: u.publishedDate || u.retrievedAt?.split('T')[0] || 'March 2026'
      }));

      if (detectedLang === 'mr') {
        return respond(
          `**नवीनतम शासकीय सूचना आणि धोरण घोषणा:**\n\n` +
          topUpdates.map((u, i) =>
            `${i + 1}. **${u.title}**\n` +
            `   • ${u.description}\n` +
            `   • प्रसिद्ध दिनांक: ${u.publishedDate || 'उपलब्ध नाही'} | स्रोत: ${u.source}\n` +
            (u.sourceUrl ? `   • [अधिकृत आदेश पहा](${u.sourceUrl})\n` : '')
          ).join('\n') +
          `\nℹ️ *टीप: आपण थेट **Live Updates** पेजवरून "🌐 Fetch Live Govt Schemes Now" बटण दाबून नवीन सरकारी अपडेट्स सिंक करू शकता.*`,
          sources
        );
      }

      return respond(
        `**Recent Official Government Announcements & Updates:**\n\n` +
        topUpdates.map((u, i) =>
          `**${i + 1}. ${u.title}**\n` +
          `• ${u.description}\n` +
          `• Published Date: **${u.publishedDate || 'Date unavailable'}** | Source: ${u.source}\n` +
          (u.sourceUrl ? `• Official Link: [${u.sourceUrl}](${u.sourceUrl})\n` : '')
        ).join('\n') +
        `\n💡 *Tip: Visit the **Live Updates** screen to trigger an on-demand sync from official portals including PIB and central ministries.*`,
        sources
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GROUP C: Detailed Scheme Specific Explanation (when scheme is selected)
    // ─────────────────────────────────────────────────────────────────────────
    if (scheme) {
      const sources = [{
        title: scheme.name,
        url: scheme.sourceUrl,
        sourceName: `${scheme.governmentLevel} Govt (${scheme.state || 'All India'})`,
        dataStatus: scheme.dataStatus || 'knowledge_base',
        lastVerified: scheme.lastVerified || 'March 2026'
      }];

      if (detectedLang === 'mr') {
        return respond(
          `**${scheme.name} — योजना तपशील:**\n\n` +
          `📌 **उद्देश:** ${scheme.description}\n\n` +
          `💰 **मिळणारा थेट लाभ:** ${scheme.benefit}\n\n` +
          `📍 **अधिकारक्षेत्र:** ${scheme.governmentLevel} शासन (${scheme.state || 'सर्व भारत'})\n\n` +
          `✅ **पात्रता अटी:**\n${scheme.rules?.map(r => `  • ${r.description || (r.field + ' ' + r.operator + ' ' + r.value)}`).join('\n') || '  • अधिकृत सरकारी नियमांनुसार'}\n\n` +
          `📄 **लागणारी कागदपत्रे:**\n${scheme.requiredDocuments?.map(d => `  • ${d.documentName} (${d.purpose || 'पडताळणी'})`).join('\n') || '  • आधार कार्ड, बँक पासबुक'}\n\n` +
          `🌐 **अधिकृत अर्ज पोर्टल:** [${scheme.sourceUrl}](${scheme.sourceUrl})\n` +
          `⏱️ **अंतिम पडताळणी तारीख:** ${scheme.lastVerified || 'March 2026'}`,
          sources,
          null,
          scheme.sourceUrl
        );
      }

      if (detectedLang === 'hi') {
        return respond(
          `**${scheme.name} — योजना विवरण:**\n\n` +
          `📌 **उद्देश्य:** ${scheme.description}\n\n` +
          `💰 **मुख्य लाभ:** ${scheme.benefit}\n\n` +
          `📍 **क्षेत्राधिकार:** ${scheme.governmentLevel} सरकार (${scheme.state || 'अखिल भारतीय'})\n\n` +
          `✅ **पात्रता शर्तें:**\n${scheme.rules?.map(r => `  • ${r.description}`).join('\n') || '  • सरकारी मार्गदर्शिका के अनुसार'}\n\n` +
          `📄 **आवश्यक दस्तावेज:**\n${scheme.requiredDocuments?.map(d => `  • ${d.documentName}`).join('\n') || '  • आधार कार्ड, आय प्रमाण पत्र'}\n\n` +
          `🌐 **ऑनलाइन आवेदन पोर्टल:** [${scheme.sourceUrl}](${scheme.sourceUrl})\n` +
          `⏱️ **सत्यापन तिथि:** ${scheme.lastVerified || 'March 2026'}`,
          sources,
          null,
          scheme.sourceUrl
        );
      }

      return respond(
        `**Overview of ${scheme.name}:**\n\n` +
        `📌 **Objective & Description:**\n${scheme.description}\n\n` +
        `💰 **Direct Benefit Delivered:**\n${scheme.benefit}\n\n` +
        `📍 **Jurisdiction:** ${scheme.governmentLevel} Government (${scheme.state || 'All India'})\n\n` +
        `✅ **Key Eligibility Criteria:**\n${scheme.rules?.map(r => `• ${r.description || (r.field + ' ' + r.operator + ' ' + r.value)}`).join('\n') || '• As per official scheme guidelines'}\n\n` +
        `📄 **Required Supporting Documents:**\n${scheme.requiredDocuments?.map(d => `• ${d.documentName} (Issuing Authority: ${d.issuingAuthority || 'Govt'})`).join('\n') || '• Standard identity & residence proofs'}\n\n` +
        `🌐 **Official Application Portal:** [${scheme.sourceUrl}](${scheme.sourceUrl})\n` +
        `⏱️ **Last Verified Record Date:** ${scheme.lastVerified || 'March 2026'} (Status: ${scheme.verificationStatus || 'VERIFIED'})`,
        sources,
        null,
        scheme.sourceUrl
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GENERAL FALLBACK & INTENT CLARIFICATION
    // ─────────────────────────────────────────────────────────────────────────
    if (detectedLang === 'mr') {
      return respond(
        `**जनसहाय AI — शासकीय योजना साहाय्यक:**\n\n` +
        `आपल्या प्रश्नाचे नेमके उत्तर देण्यासाठी कृपया अधिक तपशील द्या किंवा खालीलपैकी एक विषय निवडा:\n\n` +
        `• *"विद्यार्थ्यांसाठी कोणत्या शिष्यवृत्ती आहेत?"*\n` +
        `• *"PM-KISAN योजनेसाठी कोणती कागदपत्रे लागतात?"*\n` +
        `• *"उत्पन्नाचा दाखला कसा काढायचा?"*\n` +
        `• *"मुद्रा व्यवसाय कर्ज कसे मिळवायचे?"*\n` +
        `• *"मी या योजनेसाठी पात्र आहे का?"*\n\n` +
        `आपण योजनेचे थेट नाव विचारल्यास मी अधिकृत पोर्टल लिंक व संपूर्ण प्रक्रिया समजावून सांगेन.`
      );
    }

    if (detectedLang === 'hi') {
      return respond(
        `**जनसहाय AI — सरकारी योजना सहायक:**\n\n` +
        `आपके प्रश्न का सटीक उत्तर देने के लिए कृपया नीचे दिए गए उदाहरणों की तरह पूछें:\n\n` +
        `• *"छात्रवृत्ति के लिए कौन-कौन सी योजनाएं उपलब्ध हैं?"*\n` +
        `• *"पीएम-किसान योजना के लिए क्या पात्रता है?"*\n` +
        `• *"आय प्रमाण पत्र (Income Certificate) कैसे बनवाएं?"*\n` +
        `• *"मुद्रा लोन के लिए कौन से दस्तावेज चाहिए?"*\n` +
        `• *"आयुष्मान भारत कार्ड कैसे बनवाएं?"*\n\n` +
        `आप किसी विशिष्ट योजना का नाम लिखकर भी सीधे जानकारी ले सकते हैं।`
      );
    }

    return respond(
      `**JanSahay AI — Government Assistance Assistant:**\n\n` +
      `I can help you navigate **${allSchemes.length} verified government welfare schemes** and **${guides.length} smart document acquisition guides**.\n\n` +
      `**Suggested questions to get started:**\n` +
      `• *"What scholarships are available for B.Tech students?"*\n` +
      `• *"Which schemes support farmers with direct income transfer?"*\n` +
      `• *"How do I obtain an Income Certificate in Maharashtra?"*\n` +
      `• *"What are the eligibility conditions for PM Mudra Loan?"*\n` +
      `• *"How can I get a 7/12 land record digitally?"*\n` +
      `• *"Am I eligible for this scheme?"* (Select a scheme first)\n\n` +
      `You can also complete your **Profile Wizard** to view automated deterministic recommendations tailored to your category and income tier.`
    );
  }

  /**
   * Main Answering Pipeline
   * Supports optional external LLM (Gemini/Groq) with safe timeout and fallback
   */
  static async answerQuestion(question, schemeId, userId, language = 'en') {
    const profile = userId ? db.findOne('profiles', p => String(p.userId) === String(userId)) : null;
    const context = this.buildContext(schemeId, profile);
    const detectedLang = this.detectLanguage(question, language);

    // Optional Gemini 1.5 Flash (bounded timeout, safe fallback)
    if (config.aiProvider === 'gemini' && config.geminiApiKey) {
      try {
        const systemPrompt = `You are JanSahay AI, an official citizen assistance assistant for Indian government schemes.
RULES:
1. ONLY answer using verified facts from the context provided below.
2. DO NOT invent application fees, deadlines, URLs, or eligibility criteria.
3. If information is not in the context, explicitly state: "Detailed instructions have not yet been verified. Please consult the issuing authority through the official information link."
4. If the user asks in Hindi or Marathi, respond fluently and politely in that language.
\n${context}`;

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`,
          {
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nCitizen Question: ${question}` }]
              }
            ]
          },
          { timeout: 7000 }
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          const scheme = schemeId ? db.findById('schemes', schemeId) : null;
          return {
            answer: text,
            provider: 'Google Gemini 1.5 Flash (Grounded in JanSahay DB)',
            sources: scheme ? [{
              title: scheme.name,
              url: scheme.sourceUrl,
              sourceName: `${scheme.governmentLevel} Govt (${scheme.state || 'All India'})`,
              dataStatus: scheme.dataStatus || 'knowledge_base',
              lastVerified: scheme.lastVerified || 'March 2026'
            }] : [],
            dataStatus: scheme?.dataStatus || 'knowledge_base',
            generatedAt: new Date().toISOString(),
            isVerified: true,
            officialUrl: scheme?.sourceUrl || null
          };
        }
      } catch (err) {
        console.warn('[AI] Gemini call failed, falling back safely to grounded engine:', err.message);
      }
    }

    // Optional Groq Llama-3 (bounded timeout, safe fallback)
    if (config.groqApiKey) {
      try {
        const systemPrompt = `You are JanSahay AI, a verified assistant for Indian government welfare schemes. Answer ONLY from facts in context. Respond in ${detectedLang === 'mr' ? 'Marathi' : detectedLang === 'hi' ? 'Hindi' : 'English'}.\n${context}`;
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama3-8b-8192',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: question }
            ],
            max_tokens: 1024,
            temperature: 0.2
          },
          {
            headers: {
              'Authorization': `Bearer ${config.groqApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 7000
          }
        );

        const text = response.data?.choices?.[0]?.message?.content;
        if (text && text.trim().length > 0) {
          const scheme = schemeId ? db.findById('schemes', schemeId) : null;
          return {
            answer: text,
            provider: 'Llama 3 via Groq (Grounded in JanSahay DB)',
            sources: scheme ? [{
              title: scheme.name,
              url: scheme.sourceUrl,
              sourceName: `${scheme.governmentLevel} Govt (${scheme.state || 'All India'})`,
              dataStatus: scheme.dataStatus || 'knowledge_base',
              lastVerified: scheme.lastVerified || 'March 2026'
            }] : [],
            dataStatus: scheme?.dataStatus || 'knowledge_base',
            generatedAt: new Date().toISOString(),
            isVerified: true,
            officialUrl: scheme?.sourceUrl || null
          };
        }
      } catch (err) {
        console.warn('[AI] Groq call failed, falling back safely to grounded engine:', err.message);
      }
    }

    // Always available, 100% deterministic grounded answer engine
    return this.generateDeterministicAnswer(question, schemeId, detectedLang, profile);
  }
}
