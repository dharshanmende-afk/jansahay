import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DocumentAnalysisService } from '../../src/services/documentAnalysisService.js';
import db from '../../src/db/database.js';

describe('DocumentAnalysisService - Cross-Scheme Deduplication Suite', () => {
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
    const recommendedSchemes = [schemeA, schemeB, schemeC];
    const testUserId = 99999;

    const dashboard = DocumentAnalysisService.getConsolidatedPreparationDashboard(
      testUserId,
      recommendedSchemes,
      'Maharashtra'
    );

    assert.ok(dashboard);

    // Total raw requirements: 3 + 3 + 2 = 8.
    // Unique types: INCOME_CERTIFICATE, DOMICILE_CERTIFICATE, AADHAAR_CARD, CASTE_CERTIFICATE, COLLEGE_BONAFIDE = 5 unique documents.
    assert.equal(dashboard.totalDistinctDocuments, 5);
    assert.equal(dashboard.allDocuments.length, 5);

    // Verify Income Certificate deduplication
    const incomeDoc = dashboard.allDocuments.find(d => d.documentType === 'INCOME_CERTIFICATE');
    assert.ok(incomeDoc, 'Income Certificate must be present in consolidated plan');
    assert.equal(incomeDoc.dependentSchemes.length, 3, 'Income Certificate must be required by all 3 schemes');

    // Verify Domicile Certificate deduplication
    const domicileDoc = dashboard.allDocuments.find(d => d.documentType === 'DOMICILE_CERTIFICATE');
    assert.ok(domicileDoc, 'Domicile Certificate must be present');
    assert.equal(domicileDoc.dependentSchemes.length, 2, 'Domicile Certificate required by 2 schemes');
  });

  it('correctly calculates document readiness percentage for in-hand certificates', () => {
    const testUserId = 88888;
    
    // Provision 1 in-hand document
    db.insert('userDocuments', {
      userId: testUserId,
      documentType: 'AADHAAR_CARD',
      documentName: 'Aadhaar Card',
      status: 'AVAILABLE'
    });

    const readiness = DocumentAnalysisService.evaluateSchemeDocuments(schemeA, testUserId, 'Maharashtra');

    assert.equal(readiness.totalDocuments, 3);
    assert.equal(readiness.availableDocuments, 1);
    assert.equal(readiness.missingDocuments, 0);
    assert.equal(readiness.unknownDocuments, 2);
    assert.equal(readiness.readinessPercentage, 33); // 1 out of 3 = 33%

    // Cleanup
    const userDocs = db.find('userDocuments', d => d.userId === testUserId);
    userDocs.forEach(d => db.delete('userDocuments', d.id));
  });

  it('handles empty recommended schemes list gracefully', () => {
    const dashboard = DocumentAnalysisService.getConsolidatedPreparationDashboard(77777, []);
    assert.equal(dashboard.totalDistinctDocuments, 0);
    assert.equal(dashboard.allDocuments.length, 0);
    assert.equal(dashboard.overallProgress, 100);
  });
});
