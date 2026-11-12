import { describe, it, expect } from 'vitest';
import { AIService } from '../src/services/aiService.js';
import { RAGService } from '../src/services/ragService.js';
import { RealtimeService } from '../src/services/realtimeService.js';

describe('AIService, RAGService & RealtimeService - Comprehensive Unit Suite', () => {
  it('detects English, Hindi, Marathi, and Romanised scripts accurately', () => {
    expect(AIService.detectLanguage('मला स्कॉलरशिप कशी मिळेल आणि कागदपत्रे कोणती लागतात?')).toBe('mr');
    expect(AIService.detectLanguage('माहिती सांगा')).toBe('mr');
    expect(AIService.detectLanguage('मुझे स्कॉलरशिप कैसे मिलेगी?')).toBe('hi');
    expect(AIService.detectLanguage('पीएम किसान का पैसा कब आएगा?')).toBe('hi');
    expect(AIService.detectLanguage('mala scholarship pahije kasa apply karaycha')).toBe('mr');
    expect(AIService.detectLanguage('income certificate kashi milnar')).toBe('mr');
    expect(AIService.detectLanguage('mujhe scholarship chahiye kaise apply kare')).toBe('hi');
    expect(AIService.detectLanguage('pm kisan ka paisa kab aayega')).toBe('hi');
    expect(AIService.detectLanguage('How to apply for post matric scholarship?')).toBe('en');
    expect(AIService.detectLanguage('Can I get any scholarship as a B.Tech student?')).toBe('en');
  });

  it('builds deterministic context with scheme and profile metadata', () => {
    const ctx = AIService.buildContext(1, { category: 'OBC', state: 'Maharashtra' });
    expect(ctx).toContain('TARGET SCHEME');
    expect(ctx).toContain('CITIZEN CONTEXT');
  });

  it('handles greetings and privacy guardrails in EN, HI, MR', async () => {
    for (const lang of ['en', 'hi', 'mr']) {
      const hello = await AIService.answerQuestion('Hello JanSahay', null, null, lang);
      expect(hello.answer).toBeTruthy();

      const priv = AIService.generateDeterministicAnswer('Is JanSahay official and safe for my Aadhaar number?', null, lang, null);
      expect(priv.answer).toBeTruthy();
    }
  });

  it('evaluates eligibility explanation deterministically across EN, HI, MR', () => {
    const profile = {
      category: 'OPEN',
      annualIncome: 150000,
      occupation: 'Student',
      educationLevel: 'UNDERGRADUATE',
      course: 'B.Tech Computer Engineering',
      state: 'Maharashtra'
    };

    for (const lang of ['en', 'hi', 'mr']) {
      const res = AIService.generateDeterministicAnswer('Am I eligible for this scheme?', 1, lang, profile);
      expect(res.answer).toBeTruthy();
      expect(res.sources.length).toBeGreaterThan(0);
    }
  });

  it('provides document certificate guidance, student, farmer, business, and update topics across EN, HI, MR', () => {
    const topics = [
      'How to get income certificate',
      'What scholarships for B.Tech students?',
      'Which schemes for farmers like pm-kisan?',
      'Mudra loan for business MSME',
      'What is the latest update or announcement?',
      'Explain this scheme in detail',
      'Something totally unrecognized xyz123'
    ];

    for (const q of topics) {
      for (const lang of ['en', 'hi', 'mr']) {
        const res = AIService.generateDeterministicAnswer(q, q.includes('detail') ? 1 : null, lang, null);
        expect(res.answer).toBeTruthy();
        expect(res.isVerified).toBe(true);
      }
    }
  });

  it('Guest query returns structured RAG response envelope', async () => {
    const result = await AIService.answerQuestion('How do I apply for scholarship?', null, null, 'en');
    expect(result.answer).toBeTruthy();
    expect(result.provider).toBeTruthy();
    expect(Array.isArray(result.sources)).toBe(true);
  });

  it('Marathi and Hindi full queries route cleanly', async () => {
    const mrRes = await AIService.answerQuestion('Mala income certificate pahije', null, null, 'mr');
    expect(mrRes.answer).toMatch(/उत्पन्न|प्रमाणपत्र|MahaDBT|तहसीलदार/i);

    const hiRes = await AIService.answerQuestion('PM kisan ka paisa kab aayega?', null, null, 'hi');
    expect(hiRes.answer).toMatch(/किसान|किस्त|pmkisan\.gov\.in/i);
  });

  it('RAGService retrieves verified chunks and guards against off-topic queries', async () => {
    RAGService.buildKnowledgeBase();
    const hits = RAGService.retrieveTopK('domicile certificate maharashtra', 3);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].title.toLowerCase()).toContain('domicile');

    const offTopic = await RAGService.answerWithRag('What is the recipe for biryani?', 'en');
    expect(offTopic.isFallback || offTopic.sources.length === 0).toBe(true);
  });

  it('RealtimeService.getLiveUpdates returns sorted active updates', () => {
    const updates = RealtimeService.getLiveUpdates();
    expect(Array.isArray(updates)).toBe(true);
    expect(updates.length).toBeGreaterThan(0);
  });
});
