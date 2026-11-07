import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { documentService, documentGuideService } from '../services/api';
import { DocumentGuideModal } from '../components/DocumentGuideModal';
import { exportDocumentChecklistPdf } from '../utils/pdfExport';
import {
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  BookOpen,
  Filter,
  Printer,
  Download,
  MapPin
} from 'lucide-react';

export const DocumentPreparationPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('ALL'); // ALL, MISSING, AVAILABLE, NEEDS_VERIFICATION
  const [activeGuide, setActiveGuide] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadDashboard();
  }, [isAuthenticated]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await documentService.getPreparationDashboard();
      if (res.success && res.data) {
        setDashboard(res.data);
      }
    } catch (err) {
      console.error('Error loading document preparation dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (docName, docType, newStatus) => {
    try {
      await documentService.updateStatus({
        documentName: docName,
        documentType: docType,
        status: newStatus
      });
      loadDashboard();
    } catch (e) {
      alert('Error updating document status');
    }
  };

  const openGuideForDocument = async (docType) => {
    try {
      const res = await documentGuideService.getGuideByType(docType, 'Maharashtra');
      if (res.success && res.data) {
        setActiveGuide(res.data);
      } else {
        alert('Detailed instructions have not yet been verified. Please consult the issuing authority through the official information link.');
      }
    } catch (e) {
      alert('Detailed instructions have not yet been verified for this document.');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0', color: '#64748b' }}>
        <p>Analyzing document requirements across all your recommended schemes...</p>
      </div>
    );
  }

  const allDocs = dashboard?.allDocuments || [];
  const filteredDocs = filterTab === 'ALL'
    ? allDocs
    : allDocs.filter(d => d.status === filterTab);

  return (
    <div style={{ padding: '3rem 0', minHeight: '85vh', backgroundColor: '#f8fafc' }}>
      <div className="container">
        {/* Printable Official Header (Visible ONLY when printing) */}
        <div className="print-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', color: '#1e3a8a', margin: 0, fontWeight: 800 }}>
                🇮🇳 JanSahay AI — Citizen Document Checklist & Preparation Report
              </h1>
              <p style={{ margin: '0.25rem 0 0', color: '#475569', fontSize: '0.9rem' }}>
                Citizen Name: <strong>{user?.name || 'Rahul Sharma'}</strong> • Category: <strong>{user?.profile?.category || 'Student'}</strong> • State: <strong>{user?.profile?.state || 'Maharashtra'}</strong>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Generated On: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#15803d' }}>{dashboard?.overallProgress}% Prepared</div>
            </div>
          </div>
        </div>

        {/* Web Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#eff6ff', color: '#1e40af', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <ShieldCheck size={14} /> Cross-Scheme Document Deduplication Engine
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
              My Document Preparation Dashboard
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Consolidated preparation status across all schemes. One certificate often fulfills requirements for multiple schemes.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => exportDocumentChecklistPdf(user?.name, dashboard)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
              title="Download structured official PDF checklist with RTS timelines and deduplicated documents">
              <Download size={16} /> Export PDF Checklist
            </button>
            <button
              onClick={() => window.print()}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
              <Printer size={16} /> Print / Save PDF
            </button>
            <Link to="/recommendations" className="btn btn-primary">
              View Matched Schemes
            </Link>
          </div>
        </div>

        {/* Readiness Metric Banner */}
        <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem', background: 'linear-gradient(135deg, #1e3a8a 0%, #0f2459 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <div style={{ fontSize: '0.85rem', color: '#93c5fd', fontWeight: 600, marginBottom: '0.35rem' }}>
                OVERALL DOCUMENT READINESS
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800 }}>
                {dashboard?.overallProgress}% Prepared
              </div>
              <p style={{ fontSize: '0.85rem', color: '#bfdbfe', margin: '0.5rem 0 1rem 0' }}>
                {dashboard?.availableCount} of {dashboard?.totalDistinctDocuments} required certificates marked ready in your checklist.
              </p>
              <div className="progress-bar-bg" style={{ height: '8px', maxWidth: '400px' }}>
                <div className="progress-bar-fill" style={{ width: `${dashboard?.overallProgress}%` }}></div>
              </div>
            </div>

            {/* Quick Stat Counter Cards */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.85rem 1.25rem', borderRadius: '0.5rem', textAlign: 'center', minWidth: '95px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ade80' }}>{dashboard?.availableCount}</div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Available</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.85rem 1.25rem', borderRadius: '0.5rem', textAlign: 'center', minWidth: '95px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f87171' }}>{dashboard?.missingCount}</div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Missing</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.85rem 1.25rem', borderRadius: '0.5rem', textAlign: 'center', minWidth: '95px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24' }}>{dashboard?.needsVerificationCount}</div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Verify</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.85rem 1.25rem', borderRadius: '0.5rem', textAlign: 'center', minWidth: '95px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#93c5fd' }}>{dashboard?.unknownCount}</div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Unchecked</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {[
            { id: 'ALL', label: `All Documents (${allDocs.length})` },
            { id: 'MISSING', label: `Missing / Needs Acquisition (${dashboard?.missingCount})` },
            { id: 'AVAILABLE', label: `Already Available (${dashboard?.availableCount})` },
            { id: 'NEEDS_VERIFICATION', label: `Needs Verification (${dashboard?.needsVerificationCount})` },
            { id: 'NOT_YET_CHECKED', label: `Not Yet Checked (${dashboard?.unknownCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`btn btn-sm ${filterTab === tab.id ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontWeight: 700, borderRadius: '9999px' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Consolidated Documents List */}
        {filteredDocs.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <FileText size={36} style={{ margin: '0 auto 1rem', color: '#94a3b8' }} />
            <p>No documents found in this filter category.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredDocs.map((item, idx) => (
              <div key={idx} className="card" style={{ padding: '1.5rem', borderLeft: `6px solid ${
                item.status === 'AVAILABLE' ? '#15803d' :
                item.status === 'MISSING' ? '#dc2626' :
                item.status === 'NEEDS_VERIFICATION' ? '#d97706' : '#94a3b8'
              }` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span className={`badge ${
                        item.status === 'AVAILABLE' ? 'badge-strong' :
                        item.status === 'MISSING' ? 'badge-outdated' :
                        item.status === 'NEEDS_VERIFICATION' ? 'badge-potential' : 'badge-more-info'
                      }`}>
                        {item.status === 'AVAILABLE' ? '✓ Available' :
                         item.status === 'MISSING' ? '✗ Missing' :
                         item.status === 'NEEDS_VERIFICATION' ? '⚠ Needs Renewal' : '❓ Not Yet Checked'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                        Issuing Authority: {item.issuingAuthority}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                      {item.documentName}
                    </h3>
                  </div>

                  {/* Status Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.documentName, item.documentType, e.target.value)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.825rem',
                        fontWeight: 700,
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff'
                      }}>
                      <option value="NOT_YET_CHECKED">❓ Not Yet Checked</option>
                      <option value="AVAILABLE">✓ Already Available</option>
                      <option value="MISSING">✗ Missing / Needs Acquisition</option>
                      <option value="NEEDS_VERIFICATION">⚠ Needs Verification / Renewal</option>
                    </select>

                    {item.hasGuide && (
                      <button
                        onClick={() => openGuideForDocument(item.documentType)}
                        className="btn btn-outline btn-sm"
                        style={{ color: '#ea580c', borderColor: '#fed7aa', background: '#fff7ed', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <BookOpen size={14} /> How to Get This Document
                      </button>
                    )}
                  </div>
                </div>

                {/* Dependent Schemes Badges */}
                <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    RELEVANT SCHEMES THAT DEPEND ON THIS CERTIFICATE ({item.dependentSchemes?.length || 0}):
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {item.dependentSchemes && item.dependentSchemes.map((s, sIdx) => (
                      <Link
                        key={sIdx}
                        to={`/schemes/${s.id}`}
                        style={{
                          textDecoration: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#1e3a8a',
                          background: '#eff6ff',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                          border: '1px solid #bfdbfe',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                        {s.name} <ArrowRight size={10} />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Offline / Common Service Centre (CSC) Guidance Banner */}
        <div className="card" style={{ padding: '1.75rem', marginTop: '2.5rem', background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '4px solid #f97316' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', flexShrink: 0 }}>
              <MapPin size={24} />
            </div>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                Offline & CSC Kiosk Application Assistance
              </h3>
              <p style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                Citizens without online access or digital signature can print this checklist and visit their nearest <strong>Aaple Sarkar Seva Kendra / CSC Digital Seva / Maha e-Seva Kendra / e-Mitra</strong>. 
                Operators are authorized under the Right to Public Services Act (RTS) to scan, verify, and submit applications on your behalf for a statutory government facilitation fee of ₹20 to ₹50 per service.
              </p>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#1e3a8a', fontWeight: 600, flexWrap: 'wrap' }}>
                <span>• Step 1: Print this Checklist</span>
                <span>• Step 2: Carry Original Aadhaar & Photos</span>
                <span>• Step 3: Receive Official Acknowledgment Slip (Receipt)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Modal */}
      {activeGuide && (
        <DocumentGuideModal
          guide={activeGuide}
          onClose={() => setActiveGuide(null)}
          onStatusUpdated={() => loadDashboard()}
        />
      )}
    </div>
  );
};
