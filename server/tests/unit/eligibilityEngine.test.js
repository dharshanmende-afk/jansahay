import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EligibilityEngine } from '../../src/services/eligibilityEngine.js';

describe('EligibilityEngine - Unit Test Suite', () => {
  const baseScheme = {
    id: 101,
    name: 'Maharashtra Higher Education Scholarship',
    category: 'Education',
    governmentLevel: 'STATE',
    state: 'Maharashtra',
    benefit: '100% Tuition Fee Waiver',
    rules: [
      { field: 'category', operator: 'IN', value: 'OBC, SC, ST, EWS', description: 'Must belong to reserved or EWS category' },
      { field: 'annualIncome', operator: 'LESS_THAN_OR_EQUAL', value: '800000', description: 'Annual family income must be <= 8 Lakhs' },
      { field: 'isStudent', operator: 'EQUALS', value: 'true', description: 'Must currently be an enrolled student' }
    ]
  };

  it('evaluates STRONG_MATCH when all mandatory criteria are satisfied', () => {
    const profile = {
      state: 'Maharashtra',
      category: 'OBC',
      annualIncome: 350000,
      isStudent: true
    };

    const result = EligibilityEngine.evaluateScheme(baseScheme, profile);

    assert.equal(result.matchType, 'STRONG_MATCH');
    assert.equal(result.matchScore, 100);
    assert.equal(result.matchedConditions.length, 3);
    assert.equal(result.failedConditions.length, 0);
    assert.equal(result.missingInformation.length, 0);
  });

  it('evaluates NOT_A_MATCH when income exceeds maximum threshold', () => {
    const profile = {
      state: 'Maharashtra',
      category: 'OBC',
      annualIncome: 1200000, // exceeds 8 Lakh ceiling
      isStudent: true
    };

    const result = EligibilityEngine.evaluateScheme(baseScheme, profile);

    assert.equal(result.matchType, 'NOT_A_MATCH');
    assert.ok(result.failedConditions.length > 0);
    assert.ok(result.failedConditions.some(c => c.includes('annualIncome') || c.includes('income')));
  });

  it('evaluates NOT_A_MATCH when user resides in different state for state-specific scheme', () => {
    const profile = {
      state: 'Gujarat', // Scheme requires Maharashtra
      category: 'SC',
      annualIncome: 200000,
      isStudent: true
    };

    const result = EligibilityEngine.evaluateScheme(baseScheme, profile);

    assert.equal(result.matchType, 'NOT_A_MATCH');
    assert.ok(result.failedConditions.some(c => c.includes('Restricted to residents of Maharashtra')));
  });

  it('evaluates POTENTIAL_MATCH when majority criteria pass but some info is missing', () => {
    const profile = {
      state: 'Maharashtra',
      category: 'SC',
      annualIncome: 250000
      // isStudent is omitted
    };

    const result = EligibilityEngine.evaluateScheme(baseScheme, profile);

    assert.equal(result.matchType, 'POTENTIAL_MATCH');
    assert.ok(result.matchScore >= 60);
    assert.equal(result.missingInformation.length, 1);
    assert.ok(result.missingInformation[0].includes('enrolled student'));
  });

  it('evaluates MORE_INFORMATION_REQUIRED when all fields are missing in an empty profile', () => {
    const profile = {};

    const result = EligibilityEngine.evaluateScheme(baseScheme, profile);

    assert.equal(result.matchType, 'MORE_INFORMATION_REQUIRED');
    assert.equal(result.matchScore, 0);
    assert.equal(result.matchedConditions.length, 0);
    assert.ok(result.missingInformation.length > 0);
  });

  describe('Rule Operators Evaluation', () => {
    it('evaluates EQUALS and NOT_EQUALS case-insensitively', () => {
      assert.equal(EligibilityEngine.evaluateRule('Maharashtra', 'EQUALS', 'maharashtra'), true);
      assert.equal(EligibilityEngine.evaluateRule('male', 'NOT_EQUALS', 'female'), true);
      assert.equal(EligibilityEngine.evaluateRule('OPEN', 'EQUALS', 'OBC'), false);
    });

    it('evaluates CONTAINS operator correctly', () => {
      assert.equal(EligibilityEngine.evaluateRule('Diploma in Civil Engineering', 'CONTAINS', 'engineering'), true);
      assert.equal(EligibilityEngine.evaluateRule('Medical Sciences', 'CONTAINS', 'Engineering'), false);
    });

    it('evaluates IN operator with comma-separated values', () => {
      assert.equal(EligibilityEngine.evaluateRule('OBC', 'IN', 'SC, ST, OBC, EWS'), true);
      assert.equal(EligibilityEngine.evaluateRule('GENERAL', 'IN', 'SC, ST, OBC'), false);
    });

    it('evaluates numeric comparisons (GREATER_THAN, LESS_THAN, etc.)', () => {
      assert.equal(EligibilityEngine.evaluateRule('25', 'GREATER_THAN', '18'), true);
      assert.equal(EligibilityEngine.evaluateRule('18', 'GREATER_THAN', '18'), false);
      assert.equal(EligibilityEngine.evaluateRule('18', 'GREATER_THAN_OR_EQUAL', '18'), true);
      assert.equal(EligibilityEngine.evaluateRule('500000', 'LESS_THAN_OR_EQUAL', '800000'), true);
      assert.equal(EligibilityEngine.evaluateRule('900000', 'LESS_THAN_OR_EQUAL', '800000'), false);
      assert.equal(EligibilityEngine.evaluateRule('5.5', 'LESS_THAN', '10.0'), true);
    });

    it('returns false gracefully for invalid numbers in numeric comparisons', () => {
      assert.equal(EligibilityEngine.evaluateRule('not-a-number', 'GREATER_THAN', '18'), false);
      assert.equal(EligibilityEngine.evaluateRule('20', 'LESS_THAN', 'invalid'), false);
    });

    it('returns false for unrecognized operator', () => {
      assert.equal(EligibilityEngine.evaluateRule('val', 'UNKNOWN_OP', 'val'), false);
    });
  });

  describe('Edge Cases', () => {
    it('handles null and undefined profile gracefully', () => {
      const resNull = EligibilityEngine.evaluateScheme(baseScheme, null);
      assert.equal(resNull.matchType, 'MORE_INFORMATION_REQUIRED');

      const resUndef = EligibilityEngine.evaluateScheme(baseScheme, undefined);
      assert.equal(resUndef.matchType, 'MORE_INFORMATION_REQUIRED');
    });

    it('handles scheme with zero rules as universal baseline', () => {
      const openScheme = {
        id: 999,
        name: 'Universal Free Health Camp',
        rules: []
      };

      const result = EligibilityEngine.evaluateScheme(openScheme, { state: 'Maharashtra' });
      assert.equal(result.matchType, 'POTENTIAL_MATCH');
      assert.equal(result.matchScore, 75);
    });
  });
});
