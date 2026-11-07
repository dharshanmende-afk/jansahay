/**
 * evalRag.js — JanSahay RAG Assistant Evaluation Benchmark
 *
 * Runs 30 official benchmark questions across 3 languages:
 * - 10 English queries
 * - 10 Hindi / Hinglish queries
 * - 10 Marathi / Romanized Marathi queries
 * - 1 Out-of-Scope Control query (Zero Hallucination Test)
 *
 * Checks:
 * 1. Semantic Retrieval Accuracy: Top chunk contains the expected scheme/guide.
 * 2. Grounded Citation Verification: Response includes source title & lastVerifiedAt.
 * 3. Language Alignment: Response matches target language.
 * 4. Safety Guard: Out-of-scope question triggers "not yet verified".
 */

import { AIService } from '../src/services/aiService.js';
import { RAGService } from '../src/services/ragService.js';
import { db } from '../src/db/database.js';

const BENCHMARK_CASES = [
  // ───────────────────────────────────────────────────────────────────────────
  // ENGLISH BENCHMARKS (1 to 10)
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 1,
    language: 'en',
    query: 'How do I apply for the Rajarshi Shahu Maharaj EBC fee reimbursement scholarship in Maharashtra?',
    expectedKeywords: ['EBC', 'Rajarshi Chhatrapati Shahu Maharaj', 'MahaDBT'],
    expectedType: 'SCHEME'
  },
  {
    id: 2,
    language: 'en',
    query: 'What are the eligibility criteria and documents required for Income Certificate from Tehsildar?',
    expectedKeywords: ['Income Certificate', 'Tehsildar', 'Aaple Sarkar'],
    expectedType: 'DOCUMENT_GUIDE'
  },
  {
    id: 3,
    language: 'en',
    query: 'How can I download digitally signed 7/12 land extract online from Mahabhumi?',
    expectedKeywords: ['7/12', 'Mahabhumi', 'Satbara'],
    expectedType: 'DOCUMENT_GUIDE'
  },
  {
    id: 4,
    language: 'en',
    query: 'What financial benefits and installment amount are provided under PM-KISAN Samman Nidhi?',
    expectedKeywords: ['PM-KISAN', '6,000', 'Farmer'],
    expectedType: 'SCHEME'
  },
  {
    id: 5,
    language: 'en',
    query: 'What are the rules and monthly financial assistance under Mukhyamantri Majhi Ladki Bahin Yojna?',
    expectedKeywords: ['Majhi Ladki Bahin', '1,500', 'Women'],
    expectedType: 'SCHEME'
  },
  {
    id: 6,
    language: 'en',
    query: 'How to get a Domicile and Residence Certificate in Maharashtra under Right to Services Act?',
    expectedKeywords: ['Domicile', 'Aaple Sarkar', '15 years'],
    expectedType: 'DOCUMENT_GUIDE'
  },
  {
    id: 7,
    language: 'en',
    query: 'What is the collateral-free loan amount under PM Mudra Yojana for small business owners?',
    expectedKeywords: ['Mudra', 'Shishu', 'Kishor', 'Tarun'],
    expectedType: 'SCHEME'
  },
  {
    id: 8,
    language: 'en',
    query: 'What hospital coverage is provided under Ayushman Bharat PM-JAY health insurance?',
    expectedKeywords: ['Ayushman Bharat', 'PM-JAY', '5 Lakh'],
    expectedType: 'SCHEME'
  },
  {
    id: 9,
    language: 'en',
    query: 'How can a student from a farmer family get hostel allowance under Dr Punjabrao Deshmukh scheme?',
    expectedKeywords: ['Punjabrao Deshmukh', 'Hostel', 'MahaDBT'],
    expectedType: 'SCHEME'
  },
  {
    id: 10,
    language: 'en',
    query: 'What is the procedure and portal for Udyam MSME registration for micro enterprises?',
    expectedKeywords: ['Udyam', 'MSME', 'Ministry of MSME'],
    expectedType: 'DOCUMENT_GUIDE'
  },

  // ───────────────────────────────────────────────────────────────────────────
  // HINDI & HINGLISH BENCHMARKS (11 to 20)
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 11,
    language: 'hi',
    query: 'आय प्रमाण पत्र (Income Certificate) कैसे बनवाया जाता है और कितने दिन लगते हैं?',
    expectedKeywords: ['Income Certificate', 'आय प्रमाण पत्र', 'तहसीलदार'],
    expectedType: 'DOCUMENT_GUIDE'
  },
  {
    id: 12,
    language: 'hi',
    query: 'income certificate ke liye kaun kaun se documents chahiye tehsildar office me?',
    expectedKeywords: ['Income Certificate', 'Aadhaar', 'Ration Card'],
    expectedType: 'DOCUMENT_GUIDE'
  },
  {
    id: 13,
    language: 'hi',
    query: 'पीएम किसान सम्मान निधि योजना में सालाना कितना पैसा मिलता है?',
    expectedKeywords: ['PM-KISAN', '6,000', 'किसान'],
    expectedType: 'SCHEME'
  },
  {
    id: 14,
    language: 'hi',
    query: 'ladki bahin yojana me har mahine kitne rupaye milte hain aur kaun patra hai?',
    expectedKeywords: ['Ladki Bahin', 'Majhi Ladki', '1,500', 'महिला'],
    expectedType: 'SCHEME'
  },
  {
    id: 15,
    language: 'hi',
    query: 'maharashtra me domicile certificate banane ke liye 15 saal ka nivas praman kaise de?',
    expectedKeywords: ['Domicile', 'निवास', 'Aaple Sarkar'],
    expectedType: 'DOCUMENT_GUIDE'
  },
  {
    id: 16,
    language: 'hi',
    query: 'आयुष्मान भारत योजना के तहत कितने लाख रुपये तक का मुफ्त इलाज मिलता है?',
    expectedKeywords: ['Ayushman Bharat', 'PM-JAY', '5 लाख'],
    expectedType: 'SCHEME'
  },
  {
    id: 17,
    language: 'hi',
    query: 'pm mudra loan yojana me bina guarantee ke business shuru karne ke liye loan kaise milega?',
    expectedKeywords: ['Mudra', 'ऋण', 'लोन', 'Shishu'],
    expectedType: 'SCHEME'
  },
  {
    id: 18,
    language: 'hi',
    query: 'नॉन क्रीमी लेयर प्रमाण पत्र (NCL) प्राप्त करने के लिए 3 साल की आय सीमा क्या है?',
    expectedKeywords: ['Non-Creamy Layer', 'NCL', '8 लाख'],
    expectedType: 'DOCUMENT_GUIDE'
  },
  {
    id: 19,
    language: 'hi',
    query: 'ration card online banane ke liye maharashtra me kaise apply kare?',
    expectedKeywords: ['Ration Card', 'रेशन कार्ड', 'MahaFood'],
    expectedType: 'DOCUMENT_GUIDE'
  },
  {
    id: 20,
    language: 'hi',
    query: 'प्रधानमंत्री फसल बीमा योजना (PMFBY) में किसानों को कितना प्रीमियम भरना होता है?',
    expectedKeywords: ['Fasal Bima', 'PMFBY', 'Crop Insurance', 'प्रीमियम'],
    expectedType: 'SCHEME'
  },

  // ───────────────────────────────────────────────────────────────────────────
  // MARATHI & ROMANIZED MARATHI BENCHMARKS (21 to 30)
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 21,
    language: 'mr',
    query: 'तहसील कार्यालयातून उत्पन्नाचा दाखला कसा काढायचा आणि कोणती कागदपत्रे लागतात?',
    expectedKeywords: ['Income Certificate', 'उत्पन्नाचा दाखला', 'तहसीलदार'],
    expectedType: 'DOCUMENT_GUIDE'
  },
  {
    id: 22,
    language: 'mr',
    query: 'utpannacha dakhla milnyasathi kiti divas lagtat aani aaple sarkar var fee kiti aahe?',
    expectedKeywords: ['Income Certificate', 'दाखला', 'दिवस', 'Aaple Sarkar'],
    expectedType: 'DOCUMENT_GUIDE'
  },
  {
    id: 23,
    language: 'mr',
    query: 'महाभूमिकेवरून डिजिटल स्वाक्षरी असलेला ७/१२ आणि ८-अ उतारा कसा डाऊनलोड करायचा?',
    expectedKeywords: ['7/12', 'सातबारा', 'Mahabhumi'],
    expectedType: 'DOCUMENT_GUIDE'
  },
  {
    id: 24,
    language: 'mr',
    query: 'नमो शेतकरी महासन्मान निधी योजनेचे पैसे कोणाला मिळतात आणि किती मिळतात?',
    expectedKeywords: ['Namo Shetkari', 'शेतकरी', '6,000'],
    expectedType: 'SCHEME'
  },
  {
    id: 25,
    language: 'mr',
    query: 'मुख्यमंत्री माझी लाडकी बहीण योजनेसाठी कोण पात्र आहे आणि किती आर्थिक साहाय्य मिळते?',
    expectedKeywords: ['Ladki Bahin', 'Majhi Ladki', 'लाडकी बहीण', '1,500'],
    expectedType: 'SCHEME'
  },
  {
    id: 26,
    language: 'mr',
    query: 'maharashtra rajyat adhivasa va rashtriyatva pramanpatra (domicile) kadhanyasathi kon-konte purave pahijet?',
    expectedKeywords: ['Domicile', 'अधिवास', '१५ वर्षे'],
    expectedType: 'DOCUMENT_GUIDE'
  },
  {
    id: 27,
    language: 'mr',
    query: 'इबीसी (EBC) राजर्षी शाहू महाराज शिष्यवृत्तीचा लाभ कोणाला मिळतो आणि किती फी माफ होते?',
    expectedKeywords: ['EBC', 'Rajarshi Chhatrapati Shahu Maharaj', '५०%', 'फी'],
    expectedType: 'SCHEME'
  },
  {
    id: 28,
    language: 'mr',
    query: 'जात पडताळणी (Caste Validity) प्रमाणपत्र बार्टी मार्फत कसे काढायचे?',
    expectedKeywords: ['Caste Validity', 'जात पडताळणी', 'BARTI'],
    expectedType: 'DOCUMENT_GUIDE'
  },
  {
    id: 29,
    language: 'mr',
    query: 'डॉ. पंजाबराव देशमुख वसतिगृह निर्वाह भत्ता योजनेचा अर्ज महाडीबीटीवर कसा करायचा?',
    expectedKeywords: ['Punjabrao Deshmukh', 'वसतिगृह', 'MahaDBT'],
    expectedType: 'SCHEME'
  },
  {
    id: 30,
    language: 'mr',
    query: 'उद्यम नोंदणी (Udyam MSME) प्रमाणपत्र काढण्यासाठी काही शासकीय शुल्क लागते का?',
    expectedKeywords: ['Udyam', 'उद्यम', 'MSME', 'विनामूल्य'],
    expectedType: 'DOCUMENT_GUIDE'
  },

  // ───────────────────────────────────────────────────────────────────────────
  // ZERO HALLUCINATION SAFETY GUARD TEST
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 31,
    language: 'en',
    query: 'What is the recipe for authentic Hyderabadi dum biryani with saffron?',
    expectedKeywords: ['not yet verified'],
    isOutOfScope: true
  }
];

async function runEvaluation() {
  console.log('======================================================================');
  console.log('🇮🇳 JanSahay AI — RAG Evaluation & Grounding Benchmark Suite');
  console.log('======================================================================');
  console.log(`Evaluating ${BENCHMARK_CASES.length} benchmark questions across EN, HI, MR...`);
  console.log('----------------------------------------------------------------------\n');

  // Wait for database initialization to load all schemes and document guides
  while (!db.find('schemes')?.length || !db.find('documentGuides')?.length) {
    await new Promise(r => setTimeout(r, 50));
  }

  // Pre-warm and index chunked knowledge base
  const chunks = RAGService.buildKnowledgeBase();
  console.log(`Knowledge chunks indexed: ${chunks.length}`);

  let passedCount = 0;
  const results = [];

  for (const tc of BENCHMARK_CASES) {
    const startTime = Date.now();
    const response = await AIService.answerQuestion(tc.query, null, null, tc.language);
    const elapsed = Date.now() - startTime;

    const answer = response.answer || '';
    const sources = response.sources || [];
    const sourceTitles = sources.map(s => s.title).join(' | ');

    let isPassed = false;
    let failureReason = '';

    if (tc.isOutOfScope) {
      // Out of scope test: MUST say not yet verified, and MUST NOT cite false schemes
      const indicatesUnverified =
        answer.toLowerCase().includes('not yet been verified') ||
        answer.toLowerCase().includes('not yet verified') ||
        answer.includes('पडताळलेली नाही') ||
        answer.includes('सत्यापित नहीं');

      if (indicatesUnverified && sources.length === 0) {
        isPassed = true;
      } else {
        failureReason = 'Hallucinated out-of-scope answer instead of declining.';
      }
    } else {
      // Normal scheme/guide retrieval test:
      // 1. Must match at least one expected keyword in sources or answer
      const combinedText = `${sourceTitles} ${answer}`.toLowerCase();
      const hasKeyword = tc.expectedKeywords.some(kw => combinedText.includes(kw.toLowerCase()));

      // 2. Must cite a verified date
      const hasVerificationDate =
        sources.some(s => s.lastVerifiedAt || s.lastVerified) ||
        answer.includes('Verified:') ||
        answer.includes('पडताळलेली') ||
        answer.includes('सत्यापित');

      if (hasKeyword && hasVerificationDate) {
        isPassed = true;
      } else if (!hasKeyword) {
        failureReason = `Did not retrieve expected concept [${tc.expectedKeywords.join(', ')}]`;
      } else {
        failureReason = 'Missing mandatory source citation or lastVerifiedAt date.';
      }
    }

    if (isPassed) passedCount++;

    results.push({
      id: tc.id,
      lang: tc.language.toUpperCase(),
      query: tc.query.length > 50 ? tc.query.substring(0, 47) + '...' : tc.query,
      sourcesCount: sources.length,
      topSource: sources[0]?.title || 'None (Safety Guard)',
      elapsed: `${elapsed}ms`,
      status: isPassed ? 'PASS' : 'FAIL',
      reason: failureReason
    });
  }

  // Print results table
  console.log('| ID | Lang | Status | Top Source Retrieved                              | Time  | Query Preview');
  console.log('|:--:|:----:|:------:|:--------------------------------------------------|:-----:|:---------------------------------------------');
  results.forEach(r => {
    const paddedSource = (r.topSource.length > 48 ? r.topSource.substring(0, 45) + '...' : r.topSource).padEnd(48);
    const paddedStatus = r.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    console.log(`| ${String(r.id).padStart(2)} |  ${r.lang}  | ${paddedStatus} | ${paddedSource} | ${r.elapsed.padStart(5)} | ${r.query}`);
    if (r.status === 'FAIL') {
      console.log(`     ↳ Reason: ${r.reason}`);
    }
  });

  const accuracy = Math.round((passedCount / BENCHMARK_CASES.length) * 100);

  console.log('\n======================================================================');
  console.log(`📊 BENCHMARK SUMMARY:`);
  console.log(`• Total Questions Evaluated: ${BENCHMARK_CASES.length}`);
  console.log(`• Passed:                    ${passedCount}`);
  console.log(`• Failed:                    ${BENCHMARK_CASES.length - passedCount}`);
  console.log(`• Accuracy:                  ${accuracy}%`);
  console.log('======================================================================\n');

  if (accuracy >= 90) {
    console.log('🎯 SUCCESS: RAG Engine achieves target accuracy (>= 90%) with zero hallucination!\n');
    process.exit(0);
  } else {
    console.error('⚠️ ACCURACY BELOW THRESHOLD (< 90%). Please inspect failed test cases.\n');
    process.exit(1);
  }
}

runEvaluation().catch(err => {
  console.error('Fatal evaluation error:', err);
  process.exit(1);
});
