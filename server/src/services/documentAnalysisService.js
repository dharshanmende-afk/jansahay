import { db } from '../db/database.js';

export class DocumentAnalysisService {
  /**
   * Evaluates document readiness for a specific scheme against a citizen's document checklist
   */
  static evaluateSchemeDocuments(scheme, userId, userState = 'Maharashtra') {
    const requiredDocs = scheme.requiredDocuments || [];
    const userDocs = db.find('userDocuments', doc => String(doc.userId) === String(userId));

    let availableCount = 0;
    let missingCount = 0;
    let verificationCount = 0;
    let unknownCount = 0;

    const evaluatedDocs = requiredDocs.map(reqDoc => {
      // Find matching user document by normalized type or name
      const userDoc = userDocs.find(ud =>
        (ud.documentType && reqDoc.documentType && ud.documentType.toUpperCase() === reqDoc.documentType.toUpperCase()) ||
        ud.documentName.toLowerCase().includes(reqDoc.documentName.toLowerCase()) ||
        reqDoc.documentName.toLowerCase().includes(ud.documentName.toLowerCase())
      );

      let status = 'NOT_YET_CHECKED';
      let userDocId = null;

      if (userDoc) {
        status = userDoc.status;
        userDocId = userDoc.id;
      }

      if (status === 'AVAILABLE') {
        availableCount++;
      } else if (status === 'MISSING') {
        missingCount++;
      } else if (status === 'NEEDS_VERIFICATION') {
        verificationCount++;
      } else {
        unknownCount++;
      }

      // Find state-specific or national DocumentGuide
      let guide = null;
      if (reqDoc.documentType) {
        guide = db.findOne('documentGuides', g =>
          g.documentType === reqDoc.documentType &&
          (g.applicableState === userState || g.applicableState === 'All India') &&
          g.publicationStatus === 'PUBLISHED'
        );
        if (!guide) {
          // Fallback to any state guide for same document type
          guide = db.findOne('documentGuides', g =>
            g.documentType === reqDoc.documentType && g.publicationStatus === 'PUBLISHED'
          );
        }
      }

      return {
        requiredDocumentId: reqDoc.id,
        userDocumentId: userDocId,
        documentType: reqDoc.documentType,
        documentName: reqDoc.documentName,
        purpose: reqDoc.purpose,
        requiredFlag: reqDoc.requiredFlag !== false,
        issuingAuthority: reqDoc.issuingAuthority || guide?.issuingAuthority || 'Competent Government Authority',
        status, // 'AVAILABLE', 'MISSING', 'NEEDS_VERIFICATION', 'NOT_YET_CHECKED'
        hasGuide: !!guide,
        guideId: guide?.id || null,
        officialApplicationUrl: guide?.officialApplicationUrl || null,
        officialInformationUrl: guide?.officialInformationUrl || null,
        verificationStatus: guide?.verificationStatus || 'UNVERIFIED'
      };
    });

    const totalCount = requiredDocs.length;
    const readinessPercentage = totalCount > 0 ? Math.round((availableCount / totalCount) * 100) : 100;

    let readinessMessage = 'All required documents are prepared and ready.';
    if (missingCount > 0) {
      readinessMessage = `You are missing ${missingCount} required document(s). Obtain them before applying.`;
    } else if (unknownCount > 0) {
      readinessMessage = `${unknownCount} document(s) have not yet been checked. Please verify their status.`;
    } else if (verificationCount > 0) {
      readinessMessage = `${verificationCount} document(s) require renewal or verification.`;
    }

    return {
      schemeId: scheme.id,
      schemeName: scheme.name,
      totalDocuments: totalCount,
      availableDocuments: availableCount,
      missingDocuments: missingCount,
      needsVerificationDocuments: verificationCount,
      unknownDocuments: unknownCount,
      readinessPercentage,
      readinessMessage,
      documents: evaluatedDocs
    };
  }

  /**
   * Generates a consolidated "My Document Preparation" dashboard across all recommended schemes
   */
  static getConsolidatedPreparationDashboard(userId, recommendedSchemes, userState = 'Maharashtra') {
    const userDocs = db.find('userDocuments', doc => String(doc.userId) === String(userId));
    const documentMap = new Map();

    // Loop through each recommended scheme and index required documents
    for (const scheme of recommendedSchemes) {
      for (const reqDoc of scheme.requiredDocuments || []) {
        const key = reqDoc.documentType || reqDoc.documentName.toUpperCase().replace(/\s+/g, '_');

        if (!documentMap.has(key)) {
          const userDoc = userDocs.find(ud =>
            (ud.documentType && reqDoc.documentType && ud.documentType.toUpperCase() === reqDoc.documentType.toUpperCase()) ||
            ud.documentName.toLowerCase().includes(reqDoc.documentName.toLowerCase())
          );

          // Find acquisition guide
          const guide = db.findOne('documentGuides', g =>
            g.documentType === reqDoc.documentType &&
            (g.applicableState === userState || g.applicableState === 'All India') &&
            g.publicationStatus === 'PUBLISHED'
          ) || db.findOne('documentGuides', g =>
            g.documentType === reqDoc.documentType && g.publicationStatus === 'PUBLISHED'
          );

          documentMap.set(key, {
            documentType: reqDoc.documentType || key,
            documentName: reqDoc.documentName,
            status: userDoc ? userDoc.status : 'NOT_YET_CHECKED',
            userDocId: userDoc ? userDoc.id : null,
            notes: userDoc ? userDoc.notes : null,
            issuingAuthority: reqDoc.issuingAuthority || guide?.issuingAuthority || 'Competent Authority',
            hasGuide: !!guide,
            guideId: guide?.id || null,
            guideTitle: guide?.title || null,
            expectedProcessingTime: guide?.expectedProcessingTime || null,
            possibleFees: guide?.possibleFees || null,
            officialApplicationUrl: guide?.officialApplicationUrl || null,
            verificationStatus: guide?.verificationStatus || 'UNVERIFIED',
            dependentSchemes: []
          });
        }

        const entry = documentMap.get(key);
        if (!entry.dependentSchemes.some(s => s.id === scheme.id)) {
          entry.dependentSchemes.push({
            id: scheme.id,
            name: scheme.name,
            category: scheme.category,
            matchType: scheme.matchType || 'STRONG_MATCH'
          });
        }
      }
    }

    const consolidatedList = Array.from(documentMap.values());

    const available = consolidatedList.filter(d => d.status === 'AVAILABLE');
    const missing = consolidatedList.filter(d => d.status === 'MISSING');
    const needsVerification = consolidatedList.filter(d => d.status === 'NEEDS_VERIFICATION');
    const unknown = consolidatedList.filter(d => d.status === 'NOT_YET_CHECKED');

    const totalDistinct = consolidatedList.length;
    const overallProgress = totalDistinct > 0 ? Math.round((available.length / totalDistinct) * 100) : 100;

    return {
      totalDistinctDocuments: totalDistinct,
      availableCount: available.length,
      missingCount: missing.length,
      needsVerificationCount: needsVerification.length,
      unknownCount: unknown.length,
      overallProgress,
      missingDocuments: missing,
      needsVerificationDocuments: needsVerification,
      availableDocuments: available,
      unknownDocuments: unknown,
      allDocuments: consolidatedList
    };
  }
}
