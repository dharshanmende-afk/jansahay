import { describe, it, expect, afterEach } from 'vitest';
import { DocumentAnalysisService } from '../../src/services/documentAnalysisService.js';
import db from '../../src/db/database.js';

describe('DocumentAnalysisService - Cross-Scheme Deduplication Suite (Vitest)', () => {
  const testUserIds = [99999, 88888, 77777, 66666];

  afterEach(() => {
    for (const uid of testUserIds) {
      const userDocs = db.find('userDocuments', d => d.userId === uid);
      userDocs.forEach(d => db.delete('userDocuments', d.id));
    }
  });

  const schemeA = {
    id: 1,
    name: 'EBC Higher Education Scholarship',
    requiredDocuments: [
      { id: 101, documentType: 'INCOME_CERTIFICATE', documentName: 'Tahsildar Income Certificate', requiredFlag: true },
      { id: 102, documentType: 'DOMICILE_CERTIFICATE', documentName: 'Maharashtra Domicile Certificate', requiredFlag: true },
      { id: 103, documentType: 'AADHAAR_CARD', documentName: 'Aadhaar Card', requiredFlag: true }
    ]
  };

  const schemeB = {
    id: 2,
    name: 'Post-Matric OBC Freeship Scheme',
    requiredDocuments: [
      { id: 201, documentType: 'INCOME_CERTIFICATE', documentName: 'Current Financial Year Income Certificate', requiredFlag: true },
      { id: 202, documentType: 'CASTE_CERTIFICATE', documentName: 'Caste Certificate', requiredFlag: true },
      { id: 203, documentType: 'DOMICILE_CERTIFICATE', documentName: 'Domicile Certificate', requiredFlag: true }
    ]
  };

  const schemeC = {
    id: 3,
    name: 'Dr. Punjabrao Deshmukh Hostel Subsidy',
    requiredDocuments: [
      { id: 301, documentType: 'INCOME_CERTIFICATE', documentName: 'Income Certificate', requiredFlag: true },
      { id: 302, documentType: 'COLLEGE_BONAFIDE', documentName: 'College Bonafide Certificate', requiredFlag: true }
    ]
  };

  it('deduplicates shared certificates across multiple eligible schemes', () => {
    const dashboard = DocumentAnalysisService.getConsolidatedPreparationDashboard(
      99999,
      [schemeA, schemeB, schemeC],
      'Maharashtra'
    );

    expect(dashboard).toBeTruthy();
    expect(dashboard.totalDistinctDocuments).toBe(5);
    expect(dashboard.allDocuments).toHaveLength(5);

    const incomeDoc = dashboard.allDocuments.find(d => d.documentType === 'INCOME_CERTIFICATE');
    expect(incomeDoc).toBeDefined();
    expect(incomeDoc.dependentSchemes).toHaveLength(3);

    const domicileDoc = dashboard.allDocuments.find(d => d.documentType === 'DOMICILE_CERTIFICATE');
    expect(domicileDoc).toBeDefined();
    expect(domicileDoc.dependentSchemes).toHaveLength(2);
  });

  it('correctly calculates document readiness percentage for AVAILABLE, MISSING, and NEEDS_VERIFICATION', () => {
    const testUserId = 88888;
    db.insert('userDocuments', {
      userId: testUserId,
      documentType: 'AADHAAR_CARD',
      documentName: 'Aadhaar Card',
      status: 'AVAILABLE'
    });

    const readiness1 = DocumentAnalysisService.evaluateSchemeDocuments(schemeA, testUserId, 'Maharashtra');
    expect(readiness1.totalDocuments).toBe(3);
    expect(readiness1.availableDocuments).toBe(1);
    expect(readiness1.unknownDocuments).toBe(2);
    expect(readiness1.readinessPercentage).toBe(33);
    expect(readiness1.readinessMessage).toContain('not yet been checked');

    // Add missing doc -> warning message shifts to missing
    db.insert('userDocuments', {
      userId: testUserId,
      documentType: 'INCOME_CERTIFICATE',
      documentName: 'Income Certificate',
      status: 'MISSING'
    });
    const readiness2 = DocumentAnalysisService.evaluateSchemeDocuments(schemeA, testUserId, 'Maharashtra');
    expect(readiness2.missingDocuments).toBe(1);
    expect(readiness2.readinessMessage).toContain('missing 1 required document');
  });

  it('reports NEEDS_VERIFICATION and 100% ready messages accurately', () => {
    const testUserId = 66666;
    db.insert('userDocuments', { userId: testUserId, documentType: 'INCOME_CERTIFICATE', documentName: 'Income Certificate', status: 'AVAILABLE' });
    db.insert('userDocuments', { userId: testUserId, documentType: 'DOMICILE_CERTIFICATE', documentName: 'Domicile Certificate', status: 'AVAILABLE' });
    db.insert('userDocuments', { userId: testUserId, documentType: 'AADHAAR_CARD', documentName: 'Aadhaar Card', status: 'NEEDS_VERIFICATION' });

    const rVerify = DocumentAnalysisService.evaluateSchemeDocuments(schemeA, testUserId, 'Maharashtra');
    expect(rVerify.needsVerificationDocuments).toBe(1);
    expect(rVerify.readinessMessage).toContain('require renewal or verification');

    // Update Aadhaar to AVAILABLE -> 100% ready
    const doc = db.findOne('userDocuments', d => d.userId === testUserId && d.documentType === 'AADHAAR_CARD');
    db.update('userDocuments', doc.id, { status: 'AVAILABLE' });
    const rReady = DocumentAnalysisService.evaluateSchemeDocuments(schemeA, testUserId, 'Maharashtra');
    expect(rReady.readinessPercentage).toBe(100);
    expect(rReady.readinessMessage).toContain('prepared and ready');
  });

  it('handles empty recommended schemes list gracefully', () => {
    const dashboard = DocumentAnalysisService.getConsolidatedPreparationDashboard(77777, []);
    expect(dashboard.totalDistinctDocuments).toBe(0);
    expect(dashboard.allDocuments).toHaveLength(0);
    expect(dashboard.overallProgress).toBe(100);
  });
});
