import { describe, it, expect } from 'vitest';
import { validateSchemesDataset } from '../../scripts/validate-schemes.js';
import { parseRobotsTxt } from '../../src/services/govDataService.js';
import { normalizeSchemeRecord, getSupportedStates } from '../../src/data/stateExpansionLoader.js';

describe('Phase 7: Data Governance, Freshness Validator & robots.txt Compliance', () => {
  it('normalizeSchemeRecord populates canonical fields while preserving legacy fields', () => {
    const normalized = normalizeSchemeRecord({
      id: 99,
      name: 'Sample Scheme',
      governmentLevel: 'STATE',
      state: 'Maharashtra',
      category: 'EDUCATION',
      rules: [],
      requiredDocuments: [{ documentName: 'Income Certificate', documentType: 'INCOME_CERTIFICATE', mandatory: true }],
      benefit: 'Rs 10,000',
      sourceUrl: 'https://mahadbt.maharashtra.gov.in',
      lastVerified: '2026-10-01',
      verificationStatus: 'VERIFIED'
    });

    expect(normalized.level).toBe('STATE');
    expect(normalized.officialUrl).toBe('https://mahadbt.maharashtra.gov.in');
    expect(normalized.sourceUrl).toBe('https://mahadbt.maharashtra.gov.in');
    expect(normalized.lastVerifiedAt).toBe('2026-10-01');
    expect(normalized.documents).toHaveLength(1);
    expect(normalized.verifiedBy).toBeTruthy();
  });

  it('validateSchemesDataset fails when sourceUrl or lastVerifiedAt is missing', () => {
    const badSchemes = [
      {
        id: 1,
        name: 'Missing Source Scheme',
        level: 'CENTRAL',
        state: 'All India',
        category: 'WELFARE',
        rules: [],
        documents: [],
        benefit: 'Test',
        sourceUrl: '',
        officialUrl: '',
        lastVerifiedAt: '2026-10-15',
        verifiedBy: 'Tester',
        active: true,
        verificationStatus: 'VERIFIED'
      },
      {
        id: 2,
        name: 'Missing Date Scheme',
        level: 'CENTRAL',
        state: 'All India',
        category: 'WELFARE',
        rules: [],
        documents: [],
        benefit: 'Test',
        sourceUrl: 'https://pmkisan.gov.in',
        officialUrl: 'https://pmkisan.gov.in',
        lastVerifiedAt: '',
        verifiedBy: 'Tester',
        active: true,
        verificationStatus: 'VERIFIED'
      }
    ];

    const report = validateSchemesDataset({ schemes: badSchemes, now: new Date('2026-11-12') });
    expect(report.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('validateSchemesDataset warns when lastVerifiedAt is older than 180 days', () => {
    const staleScheme = {
      id: 3,
      name: 'Old Verified Scheme',
      level: 'CENTRAL',
      state: 'All India',
      category: 'AGRICULTURE',
      rules: [],
      documents: [],
      benefit: 'Rs 6000/yr',
      sourceUrl: 'https://pmkisan.gov.in',
      officialUrl: 'https://pmkisan.gov.in',
      lastVerifiedAt: '2026-01-01',
      verifiedBy: 'Audit Team',
      active: true,
      verificationStatus: 'VERIFIED'
    };

    const report = validateSchemesDataset({ schemes: [staleScheme], now: new Date('2026-11-12') });
    expect(report.errors).toHaveLength(0);
    expect(report.staleWarnings).toHaveLength(1);
    expect(report.staleWarnings[0].ageDays).toBeGreaterThan(180);
  });

  it('validateSchemesDataset rejects active templates in expansion templates list', () => {
    const report = validateSchemesDataset({
      schemes: [],
      templates: [{ templateId: 'BAD-TPL', name: 'Bad', active: true, verificationStatus: 'VERIFIED' }]
    });
    expect(report.errors.length).toBeGreaterThan(0);
  });

  it('parseRobotsTxt respects Disallow and Allow directives for User-agent * and JanSahay', () => {
    const robots = [
      'User-agent: *',
      'Disallow: /admin/',
      'Disallow: /api/private',
      'Allow: /api/private/public-feed',
      '',
      'User-agent: JanSahay',
      'Disallow: /blocked-bot'
    ].join('\n');

    expect(parseRobotsTxt(robots, '/allRel.aspx', 'JanSahay').allowed).toBe(true);
    expect(parseRobotsTxt(robots, '/blocked-bot/page', 'JanSahay').allowed).toBe(false);
    expect(parseRobotsTxt(robots, '/admin/dashboard', 'OtherBot').allowed).toBe(false);
    expect(parseRobotsTxt(robots, '/api/private/secret', 'OtherBot').allowed).toBe(false);
    expect(parseRobotsTxt(robots, '/api/private/public-feed', 'OtherBot').allowed).toBe(true);
  });

  it('getSupportedStates reflects new states dynamically as a data-only change', () => {
    const states = getSupportedStates([
      { active: true, verificationStatus: 'VERIFIED', state: 'Karnataka', sourceUrl: 'https://sevasindhugs.karnataka.gov.in' }
    ], []);
    const names = states.map(s => s.name);
    expect(names).toContain('Maharashtra');
    expect(names).toContain('All India');
    expect(names).toContain('Karnataka');
  });
});
