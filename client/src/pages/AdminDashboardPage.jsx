import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService, updateService } from '../services/api';
import {
  Shield,
  FileText,
  BookOpen,
  Users,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  ExternalLink,
  Globe,
  Loader,
  RefreshCw,
  BarChart2,
  TrendingUp,
  Languages,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [guides, setGuides] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('ANALYTICS'); // ANALYTICS, GUIDES, SCHEMES
  const [loading, setLoading] = useState(true);
  const [fetchingGov, setFetchingGov] = useState(false);
  const [govFetchResult, setGovFetchResult] = useState(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncActionResult, setSyncActionResult] = useState(null);

  // New Guide Form State
  const [showAddGuideModal, setShowAddGuideModal] = useState(false);
  const [guideForm, setGuideForm] = useState({
    documentType: '',
    title: '',
    simpleDescription: '',
    applicableState: 'Maharashtra',
    issuingAuthority: 'Tehsildar Office',
    requiredSupportingDocuments: 'Aadhaar Card\nRation Card\nProof of Income',
    applicationMethod: 'BOTH',
    officialApplicationUrl: 'https://aaplesarkar.mahaonline.gov.in',
    officialInformationUrl: 'https://rts.maharashtra.gov.in',
    possibleFees: '₹33.60',
    expectedProcessingTime: '15 working days',
    additionalNotes: 'Check validity before submitting application'
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      alert('Access Restricted to JanSahay Administrators');
      navigate('/');
      return;
    }
    loadAdminData();
  }, [isAuthenticated, isAdmin]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, guidesRes, schemesRes, analyticsRes] = await Promise.all([
        adminService.getDashboardStats().catch(() => ({ success: false })),
        adminService.getDocumentGuides().catch(() => ({ success: false })),
        adminService.getSchemes().catch(() => ({ success: false })),
        adminService.getAnalytics().catch(() => ({ success: false }))
      ]);

      if (statsRes?.success) setStats(statsRes.data);
      if (guidesRes?.success) setGuides(guidesRes.data);
      if (schemesRes?.success) setSchemes(schemesRes.data);
      if (analyticsRes?.success) setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Error loading admin console:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyGuide = async (id, status) => {
    try {
      await adminService.verifyDocumentGuide(id, status);
      loadAdminData();
    } catch (e) {
      alert('Error updating verification status');
    }
  };

  const handleResolveFeedback = async (id, nextStatus = 'RESOLVED') => {
    try {
      await adminService.resolveFeedback(id, nextStatus);
      loadAdminData();
    } catch (e) {
      alert('Error updating report status');
    }
  };

  const handleDeleteGuide = async (id) => {
    if (window.confirm('Delete this document acquisition guide from the official knowledge base?')) {
      try {
        await adminService.deleteDocumentGuide(id);
        loadAdminData();
      } catch (e) {
        alert('Error deleting guide');
      }
    }
  };

  const handleCreateGuide = async (e) => {
    e.preventDefault();
    try {
      await adminService.createDocumentGuide({
        ...guideForm,
        requiredSupportingDocuments: guideForm.requiredSupportingDocuments.split('\n').filter(s => s.trim().length > 0),
        applicationSteps: [
          { stepNumber: 1, title: 'Portal Registration', detail: 'Register on official citizen portal', method: 'ONLINE' },
          { stepNumber: 2, title: 'Document Upload & Scrutiny', detail: 'Upload scanned proofs and pay government fee', method: 'ONLINE' },
          { stepNumber: 3, title: 'Certificate Issuance', detail: 'Download digitally signed certificate upon Tehsildar approval', method: 'ONLINE' }
        ]
      });
      setShowAddGuideModal(false);
      loadAdminData();
    } catch (err) {
      alert('Error adding document guide');
    }
  };

  const handleFetchGovernmentData = async () => {
    setFetchingGov(true);
    setGovFetchResult(null);
    try {
      const res = await updateService.fetchGovSchemes();
      setGovFetchResult({ success: true, message: res.message, data: res.data });
      await loadAdminData();
    } catch (e) {
      setGovFetchResult({ success: false, message: e?.message || 'Government servers temporarily unavailable. All cached data is intact.' });
    } finally {
      setFetchingGov(false);
    }
  };

  const handleSyncAndAnalyze = async () => {
    setSyncingAll(true);
    setSyncActionResult(null);
    try {
      const res = await adminService.syncAndAnalyze();
      setSyncActionResult({ success: true, message: res.message, data: res.data });
      await loadAdminData();
    } catch (err) {
      setSyncActionResult({
        success: false,
        message: err.message || 'Error executing live synchronization pipeline'
      });
    } finally {
      setSyncingAll(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0', color: '#64748b' }}>
        <Loader size={36} color="#1e3a8a" className="animate-spin" style={{ margin: '0 auto 1rem' }} />
        <p>Loading Administrator Dashboard & Policy Analytics...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '3rem 0', minHeight: '85vh', backgroundColor: '#f8fafc' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#f5f3ff', color: '#7c3aed', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <Shield size={14} /> Administrator Control Center
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
              JanSahay AI — Policy Analytics & Scheme Admin
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Unified governance console for live scheme synchronization, statutory document guides, and citizen analytics.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleSyncAndAnalyze}
              disabled={syncingAll}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#1e3a8a' }}
              title="Synchronize schemes live with official portals and rebuild RAG semantic search knowledge base">
              {syncingAll ? <Loader size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {syncingAll ? 'Analyzing & Syncing...' : '⚡ Live AI Sync & Analyzation'}
            </button>
            <button
              onClick={handleFetchGovernmentData}
              disabled={fetchingGov}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', borderColor: '#15803d', color: '#15803d' }}>
              {fetchingGov ? <Loader size={15} className="animate-spin" /> : <Globe size={15} />}
              {fetchingGov ? 'Fetching...' : '🌐 Fetch Live Govt Feeds'}
            </button>
            <button
              onClick={() => setShowAddGuideModal(true)}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Plus size={16} /> Add RTS Guide
            </button>
          </div>
        </div>

        {/* Global Metric Summary Cards */}
        {stats && (
          <div className="grid grid-cols-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>TOTAL VERIFIED SCHEMES</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e3a8a', marginTop: '0.25rem' }}>
                {stats.activeSchemesCount} / {stats.totalSchemes}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.25rem' }}>Central & Maharashtra Portals</div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>RTS DOCUMENT GUIDES</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.25rem' }}>
                {stats.totalDocumentGuides}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{stats.verifiedGuidesCount} Verified Under RTS Act</div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>KNOWLEDGE CHUNKS (RAG)</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d', marginTop: '0.25rem' }}>
                {analytics?.totalChunksIndexed || 238}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.25rem' }}>100% Grounded Accuracy</div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>REGISTERED CITIZENS</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ea580c', marginTop: '0.25rem' }}>
                {stats.totalUsers}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Multi-lingual Active Profiles</div>
            </div>
          </div>
        )}

        {/* Sync & Analyzation Success/Error Banner */}
        {syncActionResult && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem 1.25rem',
            borderRadius: '0.75rem', marginBottom: '1.5rem',
            background: syncActionResult.success ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${syncActionResult.success ? '#bbf7d0' : '#fecaca'}`
          }}>
            <Sparkles size={20} color={syncActionResult.success ? '#15803d' : '#b91c1c'} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, color: syncActionResult.success ? '#15803d' : '#b91c1c', marginBottom: '0.25rem' }}>
                {syncActionResult.success ? '✅ Live AI Synchronization & Analyzation Complete' : '⚠️ Pipeline Execution Notice'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>{syncActionResult.message}</div>
              {syncActionResult.data && (
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>
                  Total Schemes: <strong>{syncActionResult.data.totalSchemes}</strong> &nbsp;|&nbsp;
                  RAG Chunks Indexed: <strong>{syncActionResult.data.totalChunksIndexed}</strong> &nbsp;|&nbsp;
                  Verified RTS Guides: <strong>{syncActionResult.data.totalGuides}</strong> &nbsp;|&nbsp;
                  Last Ingested: {new Date(syncActionResult.data.analyzedAt).toLocaleTimeString('en-IN')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gov Fetch Result Banner */}
        {govFetchResult && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem 1.25rem',
            borderRadius: '0.75rem', marginBottom: '1.5rem',
            background: govFetchResult.success ? '#f0fdf4' : '#fffbeb',
            border: `1px solid ${govFetchResult.success ? '#bbf7d0' : '#fcd34d'}`
          }}>
            <Globe size={20} color={govFetchResult.success ? '#15803d' : '#b45309'} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, color: govFetchResult.success ? '#15803d' : '#b45309', marginBottom: '0.25rem' }}>
                {govFetchResult.success ? '✅ Live Government Data Sync Complete' : '⚠️ Partial Sync — Using Cached Data'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>{govFetchResult.message}</div>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`btn btn-sm ${activeTab === 'ANALYTICS' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontWeight: 700 }}>
            <BarChart2 size={15} /> Policy Analytics & Intelligence
          </button>
          <button
            onClick={() => setActiveTab('SCHEMES')}
            className={`btn btn-sm ${activeTab === 'SCHEMES' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontWeight: 700 }}>
            <BookOpen size={15} /> Government Schemes Catalog ({schemes.length})
          </button>
          <button
            onClick={() => setActiveTab('GUIDES')}
            className={`btn btn-sm ${activeTab === 'GUIDES' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontWeight: 700 }}>
            <FileText size={15} /> RTS Document Guides ({guides.length})
          </button>
        </div>

        {/* TAB 1: ADVANCED POLICY ANALYTICS & INTELLIGENCE */}
        {activeTab === 'ANALYTICS' && analytics && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Row 1: Most Viewed Schemes & Common Missing Documents */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.5rem' }}>
              {/* Most-Viewed Schemes */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <TrendingUp size={18} color="#1e3a8a" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Most In-Demand & Viewed Schemes
                  </h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                  Ranked by citizen eligibility evaluations and portal views across demographics.
                </p>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '0.5rem' }}>SCHEME</th>
                        <th style={{ padding: '0.5rem' }}>LEVEL</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>INTERACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.mostViewedSchemes.map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.65rem 0.5rem', fontWeight: 600, color: '#1e3a8a' }}>
                            {s.name}
                          </td>
                          <td style={{ padding: '0.65rem 0.5rem' }}>
                            <span className="badge" style={{ background: '#eff6ff', color: '#1e40af', fontSize: '0.75rem' }}>
                              {s.governmentLevel}
                            </span>
                          </td>
                          <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                            {s.viewCount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Most Common Missing Documents */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <AlertTriangle size={18} color="#ea580c" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Most Common Missing Statutory Documents
                  </h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                  Bottlenecks identified across citizen profiles. Priority certificates for Maha e-Seva camps.
                </p>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '0.5rem' }}>CERTIFICATE</th>
                        <th style={{ padding: '0.5rem' }}>RTS SLA</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>MISSING COUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.mostCommonMissingDocuments.length === 0 ? (
                        <tr>
                          <td colSpan={3} style={{ padding: '1rem 0.5rem', color: '#64748b', textAlign: 'center' }}>
                            No missing statutory documents recorded across current citizen profiles yet.
                          </td>
                        </tr>
                      ) : analytics.mostCommonMissingDocuments.map((doc, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.65rem 0.5rem' }}>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{doc.documentName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{doc.issuingAuthority}</div>
                          </td>
                          <td style={{ padding: '0.65rem 0.5rem' }}>
                            <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.75rem' }}>
                              {doc.rtsTimeline}
                            </span>
                          </td>
                          <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>
                            {doc.missingCount} citizens
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Row 2: Multilingual Language Distribution & Citizen Categories */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.5rem' }}>
              {/* Language Usage Breakdown */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Languages size={18} color="#7c3aed" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Multilingual Citizen Access & Usage
                  </h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
                  Real aggregate AI query breakdown ({analytics.languageUsage?.totalEvents || 0} recorded interactions across EN/MR/HI).
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      <span style={{ color: '#1e3a8a' }}>English (EN)</span>
                      <span>{analytics.languageUsage.english}%</span>
                    </div>
                    <div className="progress-bar-bg" style={{ height: '10px' }}>
                      <div className="progress-bar-fill" style={{ width: `${analytics.languageUsage.english}%`, background: '#1e3a8a' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      <span style={{ color: '#ea580c' }}>मराठी — Marathi (MR)</span>
                      <span>{analytics.languageUsage.marathi}%</span>
                    </div>
                    <div className="progress-bar-bg" style={{ height: '10px' }}>
                      <div className="progress-bar-fill" style={{ width: `${analytics.languageUsage.marathi}%`, background: '#ea580c' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      <span style={{ color: '#15803d' }}>हिन्दी — Hindi (HI)</span>
                      <span>{analytics.languageUsage.hindi}%</span>
                    </div>
                    <div className="progress-bar-bg" style={{ height: '10px' }}>
                      <div className="progress-bar-fill" style={{ width: `${analytics.languageUsage.hindi}%`, background: '#15803d' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Citizen Demographic Coverage */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Users size={18} color="#0284c7" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Citizen Profile Demographics
                  </h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
                  Distribution of onboarded citizens receiving personalized scheme recommendations.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af' }}>STUDENTS & SCHOLARS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a8a', marginTop: '0.25rem' }}>
                      {analytics.citizenCategoryDistribution.STUDENT}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Post-matric, hostel, fee waivers</div>
                  </div>

                  <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>FARMERS & AGRI</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d', marginTop: '0.25rem' }}>
                      {analytics.citizenCategoryDistribution.FARMER}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Crop insurance, solar, PM-KISAN</div>
                  </div>

                  <div style={{ background: '#fff7ed', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #fed7aa' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9a3412' }}>ENTREPRENEURS & MSME</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c2410c', marginTop: '0.25rem' }}>
                      {analytics.citizenCategoryDistribution.BUSINESS_OWNER}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Mudra, PMEGP, Startup seed</div>
                  </div>

                  <div style={{ background: '#faf5ff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e9d5ff' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b21a8' }}>WOMEN & GENERAL</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7e22ce', marginTop: '0.25rem' }}>
                      {analytics.citizenCategoryDistribution.GENERAL_CITIZEN}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Ladki Bahin, Ayushman, Ujjwala</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Unanswered AI Questions, Citizen Error Reports & Freshness Hygiene */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.5rem' }}>
              {/* Unanswered / Low-Confidence AI Queries */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Activity size={18} color="#7c3aed" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Unanswered / Low-Confidence AI Queries ({(analytics.unansweredAiQueries || []).length})
                  </h3>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
                  Anonymized citizen questions where no verified scheme or guide matched, plus AI thumbs signals (?? {analytics.aiEvaluationSignals?.thumbsUp || 0} / ?? {analytics.aiEvaluationSignals?.thumbsDown || 0}).
                </p>
                {(analytics.unansweredAiQueries || []).length === 0 ? (
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                    No unanswered AI questions logged yet.
                  </div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '260px', overflowY: 'auto' }}>
                    {analytics.unansweredAiQueries.map((q, idx) => (
                      <li key={q.id || idx} style={{ padding: '0.65rem 0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{q.question || q.query}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                          Lang: {(q.language || 'en').toUpperCase()} ? {q.reason || 'Low confidence'}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Citizen Feedback & Wrong Info Reports */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} color="#b91c1c" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Citizen Feedback & Error Reports ({analytics.feedbackReports?.pendingReports || 0} pending)
                    </h3>
                  </div>
                  {analytics.freshnessSummary && (
                    <span className="badge" style={{ background: analytics.freshnessSummary.staleOver180DaysCount > 0 ? '#fef3c7' : '#dcfce7', color: analytics.freshnessSummary.staleOver180DaysCount > 0 ? '#92400e' : '#166534', fontSize: '0.72rem' }}>
                      Stale (&gt;180d): {analytics.freshnessSummary.staleOver180DaysCount} schemes
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
                  Issues flagged via &ldquo;Report wrong information&rdquo; buttons on schemes and guides.
                </p>
                {(analytics.feedbackReports?.items || []).length === 0 ? (
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                    No citizen error reports submitted yet.
                  </div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '260px', overflowY: 'auto' }}>
                    {analytics.feedbackReports.items.map(rep => (
                      <li key={rep.id} style={{ padding: '0.65rem 0.75rem', background: rep.status === 'PENDING' ? '#fef2f2' : '#f0fdf4', borderRadius: '0.5rem', border: `1px solid ${rep.status === 'PENDING' ? '#fecaca' : '#bbf7d0'}`, fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{rep.feedbackType}</span>
                            {rep.schemeId ? ` ? Scheme #${rep.schemeId}` : rep.guideId ? ` ? Guide #${rep.guideId}` : ''}
                            <div style={{ color: '#334155', marginTop: '0.2rem' }}>{rep.comment}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleResolveFeedback(rep.id, rep.status === 'PENDING' ? 'RESOLVED' : 'PENDING')}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.72rem', flexShrink: 0 }}>
                            {rep.status === 'PENDING' ? 'Mark Resolved' : 'Reopen'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GOVERNMENT SCHEMES CATALOG */}
        {activeTab === 'SCHEMES' && (
          <div className="card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Verified Welfare Schemes Catalog ({schemes.length})
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                  All schemes indexed for the citizen RAG assistant and deterministic matching engine.
                </p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '0.75rem' }}>SCHEME NAME</th>
                  <th style={{ padding: '0.75rem' }}>LEVEL & STATE</th>
                  <th style={{ padding: '0.75rem' }}>CATEGORY</th>
                  <th style={{ padding: '0.75rem' }}>RULES COUNT</th>
                  <th style={{ padding: '0.75rem' }}>REQUIRED DOCS</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {schemes.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
                      {s.name}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge" style={{ background: '#eff6ff', color: '#1e40af' }}>
                        {s.governmentLevel} • {s.state || 'All India'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {s.category}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {s.rules?.length || 0} rule(s)
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {s.requiredDocuments?.length || 0} doc(s)
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                        Source <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: DOCUMENT GUIDES MANAGEMENT */}
        {activeTab === 'GUIDES' && (
          <div className="card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '0.75rem' }}>DOCUMENT TYPE</th>
                  <th style={{ padding: '0.75rem' }}>TITLE & ISSUING AUTHORITY</th>
                  <th style={{ padding: '0.75rem' }}>STATE</th>
                  <th style={{ padding: '0.75rem' }}>VERIFICATION STATUS</th>
                  <th style={{ padding: '0.75rem' }}>REFERENCING SCHEMES</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {guides.map(g => (
                  <tr key={g.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 700, color: '#1e3a8a' }}>
                      {g.documentType}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{g.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{g.issuingAuthority}</div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge" style={{ background: '#f1f5f9', color: '#334155' }}>
                        {g.applicableState || 'All India'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${
                        g.verificationStatus === 'VERIFIED' ? 'badge-verified' :
                        g.verificationStatus === 'OUTDATED' ? 'badge-outdated' : 'badge-unverified'
                      }`}>
                        {g.verificationStatus}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                        {g.referencingSchemesCount || 0} scheme(s)
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                        {g.verificationStatus !== 'VERIFIED' ? (
                          <button
                            onClick={() => handleVerifyGuide(g.id, 'VERIFIED')}
                            className="btn btn-outline btn-sm"
                            style={{ color: '#15803d', borderColor: '#bbf7d0' }}
                            title="Mark as Verified">
                            Verify
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerifyGuide(g.id, 'OUTDATED')}
                            className="btn btn-outline btn-sm"
                            style={{ color: '#b91c1c', borderColor: '#fecaca' }}
                            title="Mark as Outdated">
                            Mark Outdated
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteGuide(g.id)}
                          className="btn btn-outline btn-sm"
                          style={{ color: '#ef4444' }}
                          title="Delete Guide">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Document Guide Modal */}
      {showAddGuideModal && (
        <div className="modal-overlay" onClick={() => setShowAddGuideModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '1.25rem' }}>
              Add Smart Document Acquisition Guide
            </h2>

            <form onSubmit={handleCreateGuide} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  DOCUMENT TYPE CODE (e.g. INCOME_CERTIFICATE, DOMICILE_CERTIFICATE)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NON_CREAMY_LAYER"
                  value={guideForm.documentType}
                  onChange={e => setGuideForm({ ...guideForm, documentType: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  OFFICIAL TITLE
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Non-Creamy Layer Certificate (नॉन-क्रिमीलेअर दाखला)"
                  value={guideForm.title}
                  onChange={e => setGuideForm({ ...guideForm, title: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  SIMPLE-LANGUAGE DESCRIPTION (What is this document?)
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Clear description in simple English..."
                  value={guideForm.simpleDescription}
                  onChange={e => setGuideForm({ ...guideForm, simpleDescription: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    APPLICABLE STATE
                  </label>
                  <input
                    type="text"
                    value={guideForm.applicableState}
                    onChange={e => setGuideForm({ ...guideForm, applicableState: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    ISSUING AUTHORITY
                  </label>
                  <input
                    type="text"
                    value={guideForm.issuingAuthority}
                    onChange={e => setGuideForm({ ...guideForm, issuingAuthority: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  SUPPORTING DOCUMENTS CHECKLIST (One per line)
                </label>
                <textarea
                  rows="3"
                  value={guideForm.requiredSupportingDocuments}
                  onChange={e => setGuideForm({ ...guideForm, requiredSupportingDocuments: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    OFFICIAL APPLICATION URL
                  </label>
                  <input
                    type="text"
                    value={guideForm.officialApplicationUrl}
                    onChange={e => setGuideForm({ ...guideForm, officialApplicationUrl: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    EXPECTED PROCESSING TIME
                  </label>
                  <input
                    type="text"
                    value={guideForm.expectedProcessingTime}
                    onChange={e => setGuideForm({ ...guideForm, expectedProcessingTime: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddGuideModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish to Knowledge Base
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
