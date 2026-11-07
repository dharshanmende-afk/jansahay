import test from 'node:test';
import assert from 'node:assert/strict';
import { AIService } from '../src/services/aiService.js';

test('AI Service - Language Detection', () => {
  // Marathi Devanagari
  assert.equal(AIService.detectLanguage('मला स्कॉलरशिप कशी मिळेल आणि कागदपत्रे कोणती लागतात?'), 'mr');
  assert.equal(AIService.detectLanguage('माहिती सांगा'), 'mr');
  
  // Hindi Devanagari
  assert.equal(AIService.detectLanguage('मुझे स्कॉलरशिप कैसे मिलेगी?'), 'hi');
  assert.equal(AIService.detectLanguage('पीएम किसान का पैसा कब आएगा?'), 'hi');
  
  // Romanized Marathi
  assert.equal(AIService.detectLanguage('mala scholarship pahije kasa apply karaycha'), 'mr');
  assert.equal(AIService.detectLanguage('income certificate kashi milnar'), 'mr');
  
  // Romanized Hindi / Hinglish
  assert.equal(AIService.detectLanguage('mujhe scholarship chahiye kaise apply kare'), 'hi');
  assert.equal(AIService.detectLanguage('pm kisan ka paisa kab aayega'), 'hi');
  
  // English
  assert.equal(AIService.detectLanguage('How to apply for post matric scholarship?'), 'en');
  assert.equal(AIService.detectLanguage('Can I get any scholarship as a B.Tech student?'), 'en');
});

test('AI Service - Guest query returns structured response envelope without crashing', async () => {
  const result = await AIService.answerQuestion('How do I apply for scholarship?', null, null, 'en');

  assert.ok(result.answer, 'Expected non-empty answer');
  assert.ok(typeof result.answer === 'string');
  assert.ok(result.provider, 'Expected truthful provider');
  assert.ok(Array.isArray(result.sources), 'Expected sources array');
  assert.ok(result.dataStatus, 'Expected dataStatus');
  assert.ok(result.generatedAt, 'Expected generatedAt ISO timestamp');
});

test('AI Service - Marathi query produces Marathi answer', async () => {
  const result = await AIService.answerQuestion('Mala income certificate pahije', null, null, 'mr');

  assert.ok(result.answer);
  assert.ok(result.sources.length > 0);
  assert.match(result.answer, /उत्पन्न|प्रमाणपत्र|MahaDBT|तहसीलदार/i);
});

test('AI Service - Hindi query produces Hindi answer', async () => {
  const result = await AIService.answerQuestion('PM kisan ka paisa kab aayega?', null, null, 'hi');

  assert.ok(result.answer);
  assert.match(result.answer, /किसान|किस्त|pmkisan\.gov\.in/i);
});

test('AI Service - Authenticated citizen profile checks eligibility correctly', async () => {
  const profile = {
    category: 'OPEN',
    annualIncome: 150000,
    occupation: 'Student',
    educationLevel: 'UNDERGRADUATE',
    course: 'B.Tech Computer Engineering',
    state: 'Maharashtra'
  };

  const result = AIService.generateDeterministicAnswer(
    'Am I eligible for EBC scholarship?',
    1,
    'en',
    profile
  );

  assert.ok(result.answer);
  assert.ok(result.answer.toLowerCase().includes('eligib') || result.answer.toLowerCase().includes('ebc'));
});
