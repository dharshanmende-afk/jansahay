/**
 * pdfExport.js — JanSahay AI Client-Side PDF Generation Utility
 *
 * Generates official, beautifully styled, multi-page vector PDFs using jsPDF:
 * 1. Citizen Scheme Eligibility & Recommendation Dossier
 * 2. Consolidated Cross-Scheme Document Preparation Checklist
 */

import { jsPDF } from 'jspdf';

/**
 * Exports Citizen Scheme Recommendations Dossier as PDF
 */
export const exportRecommendationsPdf = (citizenName = 'Citizen', recommendations = []) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 15;

  // Primary Colors
  const navy = [30, 58, 138]; // #1e3a8a
  const saffron = [249, 115, 22]; // #f97316
  const darkGray = [51, 65, 85]; // #334155
  const lightGray = [241, 245, 249]; // #f1f5f9
  const green = [21, 128, 61]; // #15803d

  // Helper: Draw Header on page
  const drawHeader = () => {
    // Top banner
    doc.setFillColor(...navy);
    doc.rect(0, 0, pageWidth, 22, 'F');

    // Saffron accent stripe
    doc.setFillColor(...saffron);
    doc.rect(0, 22, pageWidth, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('🇮🇳 JanSahay AI — Official Scheme Eligibility Dossier', 14, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Government Scheme Discovery & Statutory Guidance Platform', 14, 18);

    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - 14, 13, { align: 'right' });
    doc.text('https://creative-mochi-5f7e5c.netlify.app', pageWidth - 14, 18, { align: 'right' });
  };

  // Helper: Draw Footer on page
  const drawFooter = (pageNumber, totalPages) => {
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');

    doc.setDrawColor(226, 232, 240);
    doc.line(0, pageHeight - 12, pageWidth, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('JanSahay AI • Verified Government Welfare Scheme Catalog • Not an official Govt ID', 14, pageHeight - 5);
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 14, pageHeight - 5, { align: 'right' });
  };

  drawHeader();
  y = 32;

  // Citizen Meta Card
  doc.setFillColor(...lightGray);
  doc.roundedRect(14, y, pageWidth - 28, 20, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 20, 2, 2, 'D');

  doc.setTextColor(...navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Beneficiary: ${citizenName || 'Registered Citizen'}`, 20, y + 8);

  doc.setTextColor(...darkGray);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Total Recommended Schemes: ${recommendations.length}`, 20, y + 14);

  const strongMatches = recommendations.filter(r => r.matchType === 'STRONG_MATCH').length;
  doc.text(`Strong Matches: ${strongMatches}  |  Potential / Pending Info: ${recommendations.length - strongMatches}`, pageWidth - 20, y + 14, { align: 'right' });

  y += 28;

  // Section Heading
  doc.setTextColor(...navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Matched Welfare Schemes & Benefit Summary', 14, y);
  y += 6;

  // Render Schemes
  recommendations.forEach((rec, idx) => {
    const scheme = rec.scheme || {};
    const cardHeight = 36;

    // Check if new page needed
    if (y + cardHeight > pageHeight - 20) {
      doc.addPage();
      drawHeader();
      y = 32;
    }

    // Scheme Card background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageWidth - 28, cardHeight, 2, 2, 'FD');

    // Left accent bar
    const isStrong = rec.matchType === 'STRONG_MATCH';
    doc.setFillColor(...(isStrong ? green : saffron));
    doc.rect(14, y, 3, cardHeight, 'F');

    // Title & Category
    doc.setTextColor(...navy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const title = `${idx + 1}. ${scheme.name || 'Government Welfare Scheme'}`;
    doc.text(doc.splitTextToSize(title, pageWidth - 70), 20, y + 7);

    // Score badge
    doc.setFillColor(...(isStrong ? [220, 252, 231] : [254, 243, 199]));
    doc.roundedRect(pageWidth - 45, y + 4, 28, 6, 1, 1, 'F');
    doc.setTextColor(...(isStrong ? green : [180, 83, 9]));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`${rec.matchScore || 100}% ${isStrong ? 'MATCH' : 'POTENTIAL'}`, pageWidth - 31, y + 8, { align: 'center' });

    // Benefits
    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Benefit:', 20, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(scheme.benefit || 'Direct government assistance and subsidies', pageWidth - 45), 34, y + 15);

    // Jurisdiction & Level
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Jurisdiction: ${scheme.state || 'All India'} (${scheme.governmentLevel || 'Central'} Govt)  |  Category: ${scheme.category || 'General'}`, 20, y + 23);

    // Official Portal Link
    if (scheme.sourceUrl) {
      doc.setTextColor(...navy);
      doc.setFont('helvetica', 'bold');
      doc.text(`Official Application Portal: ${scheme.sourceUrl}`, 20, y + 30);
    }

    y += cardHeight + 4;
  });

  // Apply page numbers to all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  // Save PDF
  const filename = `JanSahay_Recommendations_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};

/**
 * Exports Consolidated Cross-Scheme Document Checklist as PDF
 */
export const exportDocumentChecklistPdf = (citizenName = 'Citizen', dashboard = {}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 15;

  const navy = [30, 58, 138];
  const saffron = [249, 115, 22];
  const darkGray = [51, 65, 85];
  const lightGray = [241, 245, 249];
  const green = [21, 128, 61];
  const red = [220, 38, 38];

  const drawHeader = () => {
    doc.setFillColor(...navy);
    doc.rect(0, 0, pageWidth, 22, 'F');

    doc.setFillColor(...saffron);
    doc.rect(0, 22, pageWidth, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('🇮🇳 JanSahay AI — Smart Document Checklist', 14, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Consolidated Cross-Scheme Deduplication & Statutory RTS Guide', 14, 18);

    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - 14, 13, { align: 'right' });
    doc.text('https://creative-mochi-5f7e5c.netlify.app', pageWidth - 14, 18, { align: 'right' });
  };

  const drawFooter = (pageNumber, totalPages) => {
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');

    doc.setDrawColor(226, 232, 240);
    doc.line(0, pageHeight - 12, pageWidth, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('JanSahay AI • Deduplicated under Maharashtra Right to Public Services Act 2015', 14, pageHeight - 5);
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 14, pageHeight - 5, { align: 'right' });
  };

  drawHeader();
  y = 32;

  // Summary Metrics Banner
  const total = dashboard.totalDistinctDocuments || 0;
  const inHand = dashboard.availableCount || 0;
  const missing = dashboard.missingCount || 0;
  const progress = dashboard.overallProgress || 0;

  doc.setFillColor(...lightGray);
  doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, 'D');

  doc.setTextColor(...navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Citizen Document Readiness: ${progress}% Complete`, 20, y + 8);

  doc.setTextColor(...darkGray);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Total Distinct Certificates Needed: ${total}   |   In-Hand Available: ${inHand}   |   Missing to Acquire: ${missing}`, 20, y + 15);

  y += 30;

  // Table Headers
  doc.setTextColor(...navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Required Certificates & Dependent Schemes', 14, y);
  y += 5;

  // Table Column Headers
  doc.setFillColor(...navy);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Status', 18, y + 5);
  doc.text('Document Name & Issuing Authority', 42, y + 5);
  doc.text('Dependent Schemes (Deduplicated)', 125, y + 5);

  y += 8;

  const docs = dashboard.allDocuments || [];

  docs.forEach((item, idx) => {
    const isAvailable = item.status === 'AVAILABLE';
    const rowHeight = 14;

    if (y + rowHeight > pageHeight - 20) {
      doc.addPage();
      drawHeader();
      y = 32;
    }

    doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
    doc.rect(14, y, pageWidth - 28, rowHeight, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + rowHeight, pageWidth - 14, y + rowHeight);

    // Status Pill
    doc.setFillColor(...(isAvailable ? [220, 252, 231] : [254, 226, 226]));
    doc.roundedRect(16, y + 3, 22, 6, 1, 1, 'F');
    doc.setTextColor(...(isAvailable ? green : red));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(isAvailable ? 'IN-HAND' : 'MISSING', 27, y + 7, { align: 'center' });

    // Document Name & Authority
    doc.setTextColor(...navy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const docName = item.documentName || item.documentType;
    doc.text(doc.splitTextToSize(docName, 78), 42, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(doc.splitTextToSize(item.issuingAuthority || 'Tehsildar / SDO / Competent Govt Authority', 78), 42, y + 10);

    // Dependent Schemes
    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const depList = item.dependentSchemes && item.dependentSchemes.length > 0
      ? item.dependentSchemes.map(s => s.schemeName).join(', ')
      : 'General Statutory Record';
    doc.text(doc.splitTextToSize(depList, 65), 125, y + 6);

    y += rowHeight;
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  const filename = `JanSahay_Document_Checklist_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};
