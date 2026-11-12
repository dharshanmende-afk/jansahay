import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { schemeService, documentService, documentGuideService } from '../services/api';
import { DocumentGuideModal } from '../components/DocumentGuideModal';
import { ReportWrongInfoButton } from '../components/ReportWrongInfoButton';
import { SpeakButton } from '../components/VoiceControls';
import {
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  FileText,
  Building,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Sparkles,
  Printer,
  ChevronDown,
  ChevronUp,
  Globe,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Bot
} from 'lucide-react';

const getHostname = (urlStr) => {
  try {
    if (!urlStr) return 'Official Government Portal';
    const clean = urlStr.trim();
    const parsed = new URL(clean.startsWith('http://') || clean.startsWith('https://') ? clean : `https://${clean}`);
    return parsed.hostname;
  } catch (e) {
    return 'Official Government Portal';
  }
};

const ensureAbsoluteUrl = (urlStr) => {
  if (!urlStr) return '#';
  const clean = urlStr.trim();
  return clean.startsWith('http://') || clean.startsWith('https://') ? clean : `https://${clean}`;
};

const handleOpenOfficial = (e, urlStr) => {
  if (e && e.preventDefault) e.preventDefault();
  const targetUrl = ensureAbsoluteUrl(urlStr);
  if (targetUrl && targetUrl !== '#') {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }
};

export const SchemeDetailPage = () => {
  const { id } = useParams();

  const [scheme, setScheme] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeGuide, setActiveGuide] = useState(null);
  const [docFilterTab, setDocFilterTab] = useState('ALL'); // ALL | IN_HAND | MISSING
  const [expandedDocGuidance, setExpandedDocGuidance] = useState({});

  useEffect(() => {
    loadSchemeDetails();
  }, [id]);

  const loadSchemeDetails = async () => {
    setLoading(true);
    try {
      const schemeRes = await schemeService.getSchemeById(id);
      if (schemeRes.success) {
        setScheme(schemeRes.data);
      }

      // Load readiness from backend
      try {
        const readRes = await schemeService.getSchemeDocumentReadiness(id);
        if (readRes.success && readRes.data) {
          setReadiness(readRes.data);
        }
      } catch (e) {
        console.warn('Document readiness endpoint notice:', e);
      }
    } catch (err) {
      console.error('Error loading scheme:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (docName, docType, newStatus) => {
    try {
      await documentService.updateStatus({
        documentName: docName,
        documentType: docType || docName.toUpperCase().replace(/\s+/g, '_'),
        status: newStatus
      });
      // Refresh readiness
      const readRes = await schemeService.getSchemeDocumentReadiness(id);
      if (readRes.success) {
        setReadiness(readRes.data);
      }
    } catch (err) {
      alert('Could not update status. Please make sure you are logged in.');
    }
  };

  const toggleDocGuidance = (docName) => {
    setExpandedDocGuidance(prev => ({
      ...prev,
      [docName]: !prev[docName]
    }));
  };

  const openGuideForDocument = async (docType, docName) => {
    const item = (allDocs || []).find(d => d.documentName === docName) ||
                 (readiness?.documents || []).find(d => d.documentName === docName);
    try {
      const cleanType = docType || docName.toUpperCase().replace(/\s+/g, '_');
      const res = await documentGuideService.getGuideByType(cleanType, scheme?.state || 'Maharashtra');
      if (res.success && res.data) {
        const g = res.data;
        if ((!g.prerequisites || g.prerequisites.length === 0) && item?.prerequisites) {
          g.prerequisites = item.prerequisites;
        }
        if ((!g.steps || g.steps.length === 0) && item?.stepByStepProcess) {
          g.steps = item.stepByStepProcess.map((s, idx) => ({
            stepNumber: idx + 1,
            title: `Step ${idx + 1}`,
            description: s,
            isOnline: true
          }));
        }
        setActiveGuide(g);
      } else {
        openFallbackGuide(docName);
      }
    } catch (e) {
      openFallbackGuide(docName);
    }
  };

  const openFallbackGuide = (docName) => {
    const item = (allDocs || []).find(d => d.documentName === docName) ||
                 (readiness?.documents || []).find(d => d.documentName === docName);
    setActiveGuide({
      id: 999,
      documentType: docName.toUpperCase().replace(/\s+/g, '_'),
      title: docName,
      simpleDescription: item?.purpose || `Official government certificate required for ${scheme?.name}.`,
      issuingAuthority: item?.issuingAuthority || 'Competent State Authority / Setu Suvidha Kendra',
      applicableState: scheme?.state || 'Maharashtra',
      possibleFees: item?.feeAndTimeline?.split('•')[0] || '₹33 to ₹50 statutory RTS fee',
      estimatedTime: item?.feeAndTimeline?.split('•')[1] || '15 to 21 working days',
      officialUrl: item?.officialPortalUrl || 'https://aaplesarkar.mahaonline.gov.in',
      verificationStatus: 'VERIFIED',
      prerequisites: item?.prerequisites && (Array.isArray(item.prerequisites) ? item.prerequisites.length > 0 : String(item.prerequisites).trim().length > 0)
        ? (Array.isArray(item.prerequisites) ? item.prerequisites : [String(item.prerequisites)])
        : ['Aadhaar Card copy', 'Identity Proof', 'Address / Domicile Proof', 'Self-declaration affidavit'],
      steps: item?.stepByStepProcess && (Array.isArray(item.stepByStepProcess) ? item.stepByStepProcess.length > 0 : String(item.stepByStepProcess).trim().length > 0)
        ? (Array.isArray(item.stepByStepProcess) ? item.stepByStepProcess : [String(item.stepByStepProcess)]).map((step, idx) => ({
            stepNumber: idx + 1,
            title: `Step ${idx + 1}`,
            description: step,
            isOnline: true,
            portalName: 'Official State Portal'
          }))
        : [
            { stepNumber: 1, title: 'Step 1: Gather Required Proofs', description: 'Collect your Aadhaar card and supporting residence/income documents.', isOnline: false },
            { stepNumber: 2, title: 'Step 2: Visit the Official Portal', description: 'Open the verified issuing portal or visit your nearest CSC / Setu Kendra.', isOnline: true },
            { stepNumber: 3, title: 'Step 3: Fill Application & Submit', description: 'Fill the official form, upload certified scans, and pay the nominal statutory RTS fee.', isOnline: true }
          ]
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0', color: '#64748b' }}>
        <p>Loading verified scheme requirements and document readiness...</p>
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h2>Scheme record not found</h2>
        <Link to="/schemes" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Catalog
        </Link>
      </div>
    );
  }

  const rawDocs = readiness?.documents || (scheme.requiredDocuments || []).map(rd => ({
    documentName: rd.documentName,
    purpose: rd.purpose,
    requiredFlag: rd.requiredFlag,
    status: 'NOT_YET_CHECKED',
    issuingAuthority: 'Competent Authority',
    feeAndTimeline: '₹33 statutory fee • 15 days',
    officialPortalUrl: 'https://aaplesarkar.mahaonline.gov.in',
    hasGuide: true
  }));

  // Ensure each document is strictly unique by normalized document name
  const seenDocKeys = new Set();
  const allDocs = [];
  for (const doc of rawDocs) {
    if (!doc || !doc.documentName) continue;
    const key = doc.documentName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!seenDocKeys.has(key)) {
      seenDocKeys.add(key);
      allDocs.push(doc);
    }
  }

  const inHandDocs = allDocs.filter(d => d.status === 'AVAILABLE');
  const missingDocs = allDocs.filter(d => d.status !== 'AVAILABLE');
  const computedReadinessPercent = allDocs.length > 0 ? Math.round((inHandDocs.length / allDocs.length) * 100) : 0;

  const displayedDocs = docFilterTab === 'IN_HAND' ? inHandDocs : docFilterTab === 'MISSING' ? missingDocs : allDocs;

  return (
    <div style={{ padding: '3rem 0', backgroundColor: '#f8fafc', minHeight: '90vh' }}>
      <div className="container">
        {/* Navigation Breadcrumb */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link to="/schemes" style={{ color: '#1e3a8a', textDecoration: 'none', fontWeight: 600 }}>Schemes</Link>
            <span>/</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>{scheme.name}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <SpeakButton text={`${scheme.name}. ${scheme.description || ''} Benefit: ${scheme.benefit || ''}`} label="Listen" />
            <ReportWrongInfoButton schemeId={scheme.id} entityTitle={scheme.name} />
            <button
              onClick={() => window.print()}
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
              <Printer size={14} /> Print / Save PDF Roadmap
            </button>
          </div>
        </div>

        {/* Scheme Header Card with DIRECT OFFICIAL PORTAL APPLY BUTTON */}
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem', borderTop: '4px solid #1e3a8a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ flex: 1, minWidth: 'min(100%, 300px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge" style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', fontWeight: 700 }}>
                  {scheme.governmentLevel} GOVERNMENT
                </span>
                <span className="badge" style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                  State: {scheme.state || 'All India'}
                </span>
                <span className="badge" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontWeight: 700 }}>
                  Category: {scheme.category}
                </span>
                <span className="badge" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', fontWeight: 700 }}>
                  {scheme.verificationStatus === 'VERIFIED' ? '✓ Verified Source' : '● Live Official Feed'}
                </span>
              </div>

              <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', lineHeight: 1.25 }}>
                {scheme.name}
              </h1>

              <p style={{ color: '#475569', fontSize: '0.975rem', lineHeight: 1.6, maxWidth: '850px', marginBottom: '1rem' }}>
                {scheme.description}
              </p>
            </div>

            {/* DIRECT ACTION COLUMN: Apply Officially on Government Portal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end', minWidth: '260px' }}>
              {scheme.sourceUrl && (
                <a
                  href={ensureAbsoluteUrl(scheme.sourceUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => handleOpenOfficial(e, scheme.sourceUrl)}
                  className="btn btn-primary"
                  style={{
                    background: '#15803d',
                    borderColor: '#166534',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    padding: '0.75rem 1.35rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 10px rgba(21, 128, 61, 0.35)',
                    textDecoration: 'none'
                  }}>
                  <Globe size={18} /> Apply Officially on Govt Portal <ExternalLink size={15} />
                </a>
              )}

              <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'right' }}>
                <div>Verified Portal: <strong>{getHostname(scheme.sourceUrl)}</strong></div>
                <div>{scheme.lastVerified ? `Verified Date: ${scheme.lastVerified}` : 'Live Synchronized Feed'}</div>
              </div>
            </div>
          </div>

          {/* Direct Benefit Banner */}
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '0.5rem', padding: '1rem', marginTop: '1.25rem' }}>
            <strong style={{ color: '#065f46', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              DIRECT BENEFIT DELIVERED:
            </strong>
            <p style={{ color: '#047857', fontWeight: 700, fontSize: '1.1rem', margin: '0.25rem 0 0 0' }}>
              {scheme.benefit}
            </p>
          </div>
        </div>

        {/* 3-SECTION INTEGRATED ROADMAP */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

          {/* SECTION A: SCHEME ELIGIBILITY */}
          <section className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ background: '#1e3a8a', color: 'white', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                A
              </div>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Section A: Scheme Eligibility Criteria
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                  Statutory rules and parameters verified by our deterministic matching engine.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(scheme.eligibilityRules || scheme.rules || []).map((rule, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={16} color="#15803d" />
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{rule.description || `${rule.field} ${rule.operator} ${rule.value}`}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#1e40af', background: '#dbeafe', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    Mandatory Rule
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION B: SEGREGATED DOCUMENT READINESS (IN-HAND VS TO-BE-GENERATED) */}
          <section className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ background: '#f97316', color: 'white', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                  B
                </div>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Section B: Your Document Readiness & In-Hand Status
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                    See which documents are already in your hand, and get step-by-step guidance to generate missing paperwork.
                  </p>
                </div>
              </div>

              {/* Readiness Progress Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: computedReadinessPercent === 100 ? '#15803d' : '#ea580c' }}>
                    {computedReadinessPercent}% Ready
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {inHandDocs.length} of {allDocs.length} Documents in Hand
                  </div>
                </div>
                <div style={{ width: '100px' }}>
                  <div className="progress-bar-bg" style={{ height: '10px' }}>
                    <div className="progress-bar-fill" style={{ width: `${computedReadinessPercent}%`, background: computedReadinessPercent === 100 ? '#16a34a' : '#ea580c' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Tabs for Segregated View */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setDocFilterTab('ALL')}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  background: docFilterTab === 'ALL' ? '#1e3a8a' : '#ffffff',
                  color: docFilterTab === 'ALL' ? '#ffffff' : '#475569',
                  borderColor: docFilterTab === 'ALL' ? '#1e3a8a' : '#cbd5e1'
                }}>
                All Required Documents ({allDocs.length})
              </button>

              <button
                onClick={() => setDocFilterTab('IN_HAND')}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  background: docFilterTab === 'IN_HAND' ? '#15803d' : '#ffffff',
                  color: docFilterTab === 'IN_HAND' ? '#ffffff' : '#166534',
                  borderColor: docFilterTab === 'IN_HAND' ? '#15803d' : '#86efac',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                <CheckCircle2 size={15} /> Already In Hand ({inHandDocs.length})
              </button>

              <button
                onClick={() => setDocFilterTab('MISSING')}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  background: docFilterTab === 'MISSING' ? '#ea580c' : '#ffffff',
                  color: docFilterTab === 'MISSING' ? '#ffffff' : '#c2410c',
                  borderColor: docFilterTab === 'MISSING' ? '#ea580c' : '#fdba74',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                <AlertCircle size={15} /> Action Needed / Missing ({missingDocs.length})
              </button>
            </div>

            {/* SEGREGATED SUB-SECTION 1: DOCUMENTS ALREADY COMPLETED & IN HAND */}
            {(docFilterTab === 'ALL' || docFilterTab === 'IN_HAND') && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#166534', margin: 0 }}>
                    Documents Already Completed & Present in Your Hands ({inHandDocs.length})
                  </h3>
                </div>

                {inHandDocs.length === 0 ? (
                  <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '1rem', borderRadius: '0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
                    You have not declared any documents in hand yet. Mark documents as available below or visit your profile wizard.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {inHandDocs.map((doc, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '0.5rem',
                          padding: '1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '1rem'
                        }}>
                        <div style={{ flex: 1, minWidth: '240px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 800, color: '#14532d', fontSize: '1rem' }}>
                              {doc.documentName}
                            </span>
                            <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#166534', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid #86efac' }}>
                              ✓ Present in Your Hands
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#166534', marginTop: '0.25rem' }}>
                            <strong>Issuing Authority:</strong> {doc.issuingAuthority || 'Competent Authority'} • <strong>Purpose:</strong> {doc.purpose}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            onClick={() => handleStatusChange(doc.documentName, doc.documentType, 'MISSING')}
                            className="btn btn-outline btn-sm"
                            style={{ borderColor: '#cbd5e1', color: '#64748b', fontSize: '0.75rem', background: '#ffffff' }}>
                            Change to Missing
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SEGREGATED SUB-SECTION 2: DOCUMENTS STILL REQUIRED / MISSING (WITH STEP-BY-STEP GENERATION GUIDANCE) */}
            {(docFilterTab === 'ALL' || docFilterTab === 'MISSING') && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <AlertCircle size={18} color="#ea580c" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#9a3412', margin: 0 }}>
                    Documents Still Needed / Must Be Generated by You ({missingDocs.length})
                  </h3>
                </div>

                {missingDocs.length === 0 ? (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '0.5rem', color: '#166534', fontWeight: 700, fontSize: '0.9rem' }}>
                    🎉 Outstanding! All required documents for this scheme are already present in your hands! You can apply directly on the official portal below.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {missingDocs.map((doc, idx) => {
                      const isExpanded = !!expandedDocGuidance[doc.documentName];
                      return (
                        <div
                          key={idx}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #fed7aa',
                            borderRadius: '0.5rem',
                            padding: '1.25rem',
                            boxShadow: '0 2px 4px rgba(234, 88, 12, 0.05)'
                          }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ flex: 1, minWidth: '240px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                <span style={{ fontWeight: 800, color: '#9a3412', fontSize: '1.05rem' }}>
                                  {doc.documentName}
                                </span>
                                <span style={{ fontSize: '0.7rem', background: '#ffedd5', color: '#c2410c', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid #fdba74' }}>
                                  ⏳ Action Required - Not in Hand
                                </span>
                              </div>

                              <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                                <strong>Purpose:</strong> {doc.purpose}
                              </div>

                              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>
                                <strong>Issuing Office:</strong> {doc.issuingAuthority || 'Competent Authority'} • <strong>Fees & Timeline:</strong> {doc.feeAndTimeline || '₹33 statutory RTS fee • 15 days'}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              <button
                                onClick={() => toggleDocGuidance(doc.documentName)}
                                className="btn btn-outline btn-sm"
                                style={{
                                  borderColor: '#ea580c',
                                  color: '#ea580c',
                                  background: isExpanded ? '#fff7ed' : '#ffffff',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem'
                                }}>
                                <BookOpen size={14} />
                                {isExpanded ? 'Hide Steps' : 'How to Generate Officially (Step-by-Step)'}
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>

                              <button
                                onClick={() => handleStatusChange(doc.documentName, doc.documentType, 'AVAILABLE')}
                                className="btn btn-primary btn-sm"
                                style={{
                                  background: '#15803d',
                                  borderColor: '#166534',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem'
                                }}>
                                <Check size={14} /> Mark as Now in Hand
                              </button>
                            </div>
                          </div>

                          {/* EXPANDABLE POINT-WISE OFFICIAL GENERATION GUIDANCE */}
                          {isExpanded && (
                            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px dashed #fed7aa', background: '#fffaf5', padding: '1rem', borderRadius: '0.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#9a3412', margin: 0 }}>
                                  Point-Wise Procedure to Generate {doc.documentName} Officially:
                                </h4>
                                {doc.officialPortalUrl && (
                                  <a
                                    href={ensureAbsoluteUrl(doc.officialPortalUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => handleOpenOfficial(e, doc.officialPortalUrl)}
                                    style={{
                                      fontSize: '0.8rem',
                                      color: '#1e40af',
                                      fontWeight: 700,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      textDecoration: 'underline'
                                    }}>
                                    Open Official Issuing Portal ({getHostname(doc.officialPortalUrl)}) <ExternalLink size={12} />
                                  </a>
                                )}
                              </div>

                              {/* Prerequisites */}
                              {((Array.isArray(doc.prerequisites) && doc.prerequisites.length > 0) || (typeof doc.prerequisites === 'string' && doc.prerequisites.trim().length > 0)) && (
                                <div style={{ marginBottom: '1rem', background: '#ffffff', border: '1px solid #fed7aa', padding: '0.75rem', borderRadius: '0.375rem' }}>
                                  <strong style={{ fontSize: '0.75rem', color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Required Proofs / Prerequisites Needed:
                                  </strong>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                                    {(Array.isArray(doc.prerequisites) ? doc.prerequisites : doc.prerequisites.split(/(?=[A-Z][a-z]+)/).filter(Boolean)).map((p, pIdx) => (
                                      <span key={pIdx} style={{ background: '#ffedd5', color: '#9a3412', fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                                        • {p}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Step-by-Step Point-Wise Instructions */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                {(Array.isArray(doc.stepByStepProcess) ? doc.stepByStepProcess : [
                                  `Step 1: Visit the designated issuing authority portal or nearest Citizen Service Center (CSC / Setu).`,
                                  `Step 2: Fill out the application form with accurate identity details.`,
                                  `Step 3: Attach self-attested copies of Aadhaar card and required supporting proofs.`,
                                  `Step 4: Submit application, pay statutory RTS fee (${doc.feeAndTimeline?.split('•')[0] || '₹33'}), and collect acknowledgment receipt.`,
                                  `Step 5: Download verified digital certificate upon administrative sanction.`
                                ]).map((stepText, sIdx) => (
                                  <div key={sIdx} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
                                    <span style={{ background: '#ea580c', color: 'white', width: '20px', height: '20px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, flexShrink: 0 }}>
                                      {sIdx + 1}
                                    </span>
                                    <span>{stepText.replace(/^Step \d+:\s*/i, '')}</span>
                                  </div>
                                ))}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <button
                                  onClick={() => openGuideForDocument(doc.documentType, doc.documentName)}
                                  className="btn btn-outline btn-sm"
                                  style={{ background: '#ffffff', borderColor: '#ea580c', color: '#ea580c', fontWeight: 700 }}>
                                  View Full Detailed Guide Modal <ArrowRight size={13} />
                                </button>
                                <span style={{ fontSize: '0.75rem', color: '#78350f' }}>
                                  Expected Processing: <strong>{doc.feeAndTimeline?.split('•')[1] || '15 to 21 working days'}</strong>
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* APPLICATION TIMELINE & OFFICIAL APPLICATION GATEWAY */}
          <section className="card" style={{ padding: '2rem', borderTop: '4px solid #15803d' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Official Application Roadmap & Gateway
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                  Step-by-step roadmap to officially apply on the government department portal.
                </p>
              </div>

              {scheme.sourceUrl && (
                <a
                  href={ensureAbsoluteUrl(scheme.sourceUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => handleOpenOfficial(e, scheme.sourceUrl)}
                  className="btn btn-primary"
                  style={{
                    background: '#15803d',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 800,
                    padding: '0.65rem 1.25rem'
                  }}>
                  <Globe size={16} /> Open Official Portal to Apply <ExternalLink size={14} />
                </a>
              )}
            </div>

            {/* Step-by-Step Guidance */}
            {scheme.applicationGuides && scheme.applicationGuides.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {scheme.applicationGuides.map((guide, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '9999px', background: '#1e3a8a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                      {guide.stepNumber}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                        {guide.title}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                        {guide.instruction}
                      </p>
                      {guide.sourceUrl && (
                        <a href={guide.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#1e3a8a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.35rem' }}>
                          Official Link <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', color: '#475569', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Gather your in-hand documents, open the official portal link, register with your mobile OTP/Aadhaar, and complete the direct application.
              </div>
            )}

            {/* Direct Government Application Callout Banner */}
            <div style={{
              background: '#f0fdf4',
              border: '2px solid #86efac',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#15803d', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <ShieldCheck size={16} /> Official Government Application Portal
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
                  Ready to Submit Your Application?
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                  JanSahay does not charge any application fee. Render directly on the official portal: <strong>{scheme.sourceUrl}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('jansahay-open-ai', {
                      detail: {
                        scheme: scheme,
                        initialQuestion: `Please explain ${scheme.name} in simple words and tell me what documents are still needed.`
                      }
                    }));
                  }}
                  className="btn btn-outline"
                  style={{
                    borderColor: '#1e3a8a',
                    color: '#1e3a8a',
                    background: '#eff6ff',
                    padding: '0.75rem 1.25rem',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                  <Bot size={18} color="#1e3a8a" /> Ask AI About This Scheme
                </button>

                {scheme.sourceUrl && (
                  <a
                    href={ensureAbsoluteUrl(scheme.sourceUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => handleOpenOfficial(e, scheme.sourceUrl)}
                    className="btn btn-primary"
                    style={{
                      background: '#15803d',
                      borderColor: '#166534',
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(21, 128, 61, 0.3)'
                    }}>
                    <Globe size={18} /> Apply Directly on Govt Portal <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Document Acquisition Guide Modal */}
      {activeGuide && (
        <DocumentGuideModal
          guide={activeGuide}
          onClose={() => setActiveGuide(null)}
          onStatusUpdated={() => loadSchemeDetails()}
        />
      )}
    </div>
  );
};
