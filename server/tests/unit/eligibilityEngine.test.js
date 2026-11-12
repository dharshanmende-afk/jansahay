import { describe, it, expect } from 'vitest';
import { EligibilityEngine } from '../../src/services/eligibilityEngine.js';

describe('EligibilityEngine - Unit Test Suite (Vitest)', () => {
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

  describe('Match Tiers', () => {
    it('evaluates STRONG_MATCH when all mandatory criteria are satisfied', () => {
      const profile = {
        state: 'Maharashtra',
        category: 'OBC',
        annualIncome: 350000,
        isStudent: true
      };

      const result = EligibilityEngine.evaluateScheme(baseScheme, profile);

      expect(result.matchType).toBe('STRONG_MATCH');
      expect(result.matchScore).toBe(100);
      expect(result.matchedConditions).toHaveLength(3);
      expect(result.failedConditions).toHaveLength(0);
      expect(result.missingInformation).toHaveLength(0);
    });

    it('evaluates NOT_A_MATCH when income exceeds maximum threshold', () => {
      const profile = {
        state: 'Maharashtra',
        category: 'OBC',
        annualIncome: 1200000,
        isStudent: true
      };

      const result = EligibilityEngine.evaluateScheme(baseScheme, profile);

      expect(result.matchType).toBe('NOT_A_MATCH');
      expect(result.failedConditions.length).toBeGreaterThan(0);
      expect(result.failedConditions.some(c => c.includes('annualIncome') || c.includes('income'))).toBe(true);
    });

    it('evaluates NOT_A_MATCH when user resides in different state for state-specific scheme', () => {
      const profile = {
        state: 'Gujarat',
        category: 'SC',
        annualIncome: 200000,
        isStudent: true
      };

      const result = EligibilityEngine.evaluateScheme(baseScheme, profile);

      expect(result.matchType).toBe('NOT_A_MATCH');
      expect(result.failedConditions.some(c => c.includes('Restricted to residents of Maharashtra'))).toBe(true);
    });

    it('evaluates POTENTIAL_MATCH when majority criteria pass (>= 60%) but some info is missing', () => {
      const profile = {
        state: 'Maharashtra',
        category: 'SC',
        annualIncome: 250000
        // isStudent omitted -> 2/3 = 67% -> POTENTIAL_MATCH
      };

      const result = EligibilityEngine.evaluateScheme(baseScheme, profile);

      expect(result.matchType).toBe('POTENTIAL_MATCH');
      expect(result.matchScore).toBeGreaterThanOrEqual(60);
      expect(result.missingInformation).toHaveLength(1);
      expect(result.missingInformation[0]).toContain('enrolled student');
    });

    it('evaluates MORE_INFORMATION_REQUIRED when all fields are missing in an empty profile', () => {
      const result = EligibilityEngine.evaluateScheme(baseScheme, {});

      expect(result.matchType).toBe('MORE_INFORMATION_REQUIRED');
      expect(result.matchScore).toBe(0);
      expect(result.matchedConditions).toHaveLength(0);
      expect(result.missingInformation.length).toBeGreaterThan(0);
    });

    it('evaluates MORE_INFORMATION_REQUIRED when fewer than 60% rules matched and others are missing', () => {
      const profile = {
        state: 'Maharashtra',
        category: 'SC'
        // 1/3 = 33% matched, 2 missing -> MORE_INFORMATION_REQUIRED
      };

      const result = EligibilityEngine.evaluateScheme(baseScheme, profile);

      expect(result.matchType).toBe('MORE_INFORMATION_REQUIRED');
      expect(result.matchScore).toBeLessThan(60);
      expect(result.missingInformation).toHaveLength(2);
    });
  });

  describe('Boundary Values Evaluation', () => {
    it('evaluates exact income ceiling boundary for LESS_THAN_OR_EQUAL (800000 vs 800001)', () => {
      const exactMatch = EligibilityEngine.evaluateScheme(baseScheme, {
        state: 'Maharashtra',
        category: 'EWS',
        annualIncome: 800000,
        isStudent: true
      });
      expect(exactMatch.matchType).toBe('STRONG_MATCH');

      const overLimit = EligibilityEngine.evaluateScheme(baseScheme, {
        state: 'Maharashtra',
        category: 'EWS',
        annualIncome: 800001,
        isStudent: true
      });
      expect(overLimit.matchType).toBe('NOT_A_MATCH');
    });

    it('evaluates strict LESS_THAN income boundary (799999 passes, 800000 fails)', () => {
      expect(EligibilityEngine.evaluateRule('799999', 'LESS_THAN', '800000')).toBe(true);
      expect(EligibilityEngine.evaluateRule('800000', 'LESS_THAN', '800000')).toBe(false);
    });

    it('evaluates farmer land area decimal boundaries (2.0 hectares ceiling)', () => {
      const farmerScheme = {
        id: 202,
        name: 'Small & Marginal Farmer Aid',
        category: 'Agriculture',
        governmentLevel: 'CENTRAL',
        state: 'All India',
        rules: [
          { field: 'landArea', operator: 'LESS_THAN_OR_EQUAL', value: '2.0' }
        ]
      };

      expect(EligibilityEngine.evaluateScheme(farmerScheme, { landArea: 2.0 }).matchType).toBe('STRONG_MATCH');
      expect(EligibilityEngine.evaluateScheme(farmerScheme, { landArea: 2.01 }).matchType).toBe('NOT_A_MATCH');
    });
  });

  describe('Rule Operators Evaluation', () => {
    it('evaluates EQUALS and NOT_EQUALS case-insensitively', () => {
      expect(EligibilityEngine.evaluateRule('Maharashtra', 'EQUALS', 'maharashtra')).toBe(true);
      expect(EligibilityEngine.evaluateRule('male', 'NOT_EQUALS', 'female')).toBe(true);
      expect(EligibilityEngine.evaluateRule('OPEN', 'EQUALS', 'OBC')).toBe(false);
      expect(EligibilityEngine.evaluateRule('OBC', 'NOT_EQUALS', 'obc')).toBe(false);
    });

    it('evaluates CONTAINS operator correctly', () => {
      expect(EligibilityEngine.evaluateRule('B.Tech Computer Engineering', 'CONTAINS', 'engineering')).toBe(true);
      expect(EligibilityEngine.evaluateRule('Arts', 'CONTAINS', 'engineering')).toBe(false);
    });

    it('evaluates IN operator with comma-separated values', () => {
      expect(EligibilityEngine.evaluateRule('OBC', 'IN', 'SC, ST, OBC, VJNT')).toBe(true);
      expect(EligibilityEngine.evaluateRule('OPEN', 'IN', 'SC, ST, OBC')).toBe(false);
    });

    it('evaluates numeric comparisons (GREATER_THAN, LESS_THAN, GTE, LTE)', () => {
      expect(EligibilityEngine.evaluateRule('25', 'GREATER_THAN', '18')).toBe(true);
      expect(EligibilityEngine.evaluateRule('18', 'GREATER_THAN', '18')).toBe(false);
      expect(EligibilityEngine.evaluateRule('18', 'GREATER_THAN_OR_EQUAL', '18')).toBe(true);
      expect(EligibilityEngine.evaluateRule('150000', 'LESS_THAN', '200000')).toBe(true);
      expect(EligibilityEngine.evaluateRule('2.5', 'LESS_THAN_OR_EQUAL', '2.5')).toBe(true);
    });

    it('returns false gracefully for missing values or invalid numbers', () => {
      expect(EligibilityEngine.evaluateRule(null, 'EQUALS', 'OBC')).toBe(false);
      expect(EligibilityEngine.evaluateRule('', 'EQUALS', 'OBC')).toBe(false);
      expect(EligibilityEngine.evaluateRule('invalid_num', 'LESS_THAN', '100')).toBe(false);
      expect(EligibilityEngine.evaluateRule('100', 'GREATER_THAN', 'nan')).toBe(false);
    });

    it('returns false for unrecognized operator', () => {
      expect(EligibilityEngine.evaluateRule('OBC', 'UNKNOWN_OP', 'OBC')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('handles null and undefined profile gracefully', () => {
      const resNull = EligibilityEngine.evaluateScheme(baseScheme, null);
      const resUndef = EligibilityEngine.evaluateScheme(baseScheme, undefined);

      expect(resNull.matchType).toBe('MORE_INFORMATION_REQUIRED');
      expect(resUndef.matchType).toBe('MORE_INFORMATION_REQUIRED');
    });

    it('handles scheme with zero rules as universal baseline', () => {
      const universalScheme = {
        id: 303,
        name: 'Universal Citizen Welfare',
        category: 'General',
        governmentLevel: 'CENTRAL',
        state: 'All India',
        rules: []
      };

      const result = EligibilityEngine.evaluateScheme(universalScheme, { state: 'Maharashtra' });
      expect(result.matchScore).toBe(75);
      expect(result.matchType).toBe('POTENTIAL_MATCH');
    });

    it('flags missing state for state-level scheme when state is omitted', () => {
      const result = EligibilityEngine.evaluateScheme(baseScheme, {
        category: 'SC',
        annualIncome: 100000,
        isStudent: true
      });
      expect(result.missingInformation.some(m => m.includes('State of residence required'))).toBe(true);
    });
  });
});
