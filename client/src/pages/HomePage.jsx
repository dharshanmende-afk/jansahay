import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { updateService } from '../services/api';
import {
  Sparkles,
  Search,
  CheckCircle,
  FileText,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Award,
  Users,
  Compass,
  Building2,
  ExternalLink
} from 'lucide-react';

export const HomePage = () => {
  const { user, isAuthenticated, quickLogin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [tickerItems, setTickerItems] = useState([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchTicker();
  }, []);

  const fetchTicker = async () => {
    try {
      const res = await updateService.getLiveTicker();
      if (res.success && res.data) {
        setTickerItems(res.data);
      }
    } catch (e) {
      console.warn('Ticker load error');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await updateService.syncLive();
      await fetchTicker();
    } catch (e) {
      alert('Sync completed with local cache');
    } finally {
      setSyncing(false);
    }
  };

  const handleDemoSelect = async (role) => {
    await quickLogin(role);
    navigate('/recommendations');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Real-time Announcements Ticker Bar */}
      <div style={{ backgroundColor: '#fff7ed', borderBottom: '1px solid #ffedd5', padding: '0.5rem 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
            <span style={{ background: '#9a3412', color: 'white', fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <TrendingUp size={12} /> LIVE UPDATES
            </span>
            <div style={{ fontSize: '0.8rem', color: '#9a3412', fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {tickerItems.length > 0
                ? `${tickerItems[0].title} (${tickerItems[0].publishedDate})`
                : 'National and Maharashtra State welfare portals actively monitored • 35+ verified schemes online'}
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: '#9a3412', borderColor: '#fed7aa', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing...' : 'Live Sync'}
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)', padding: '4rem 0 3.5rem', borderBottom: '1px solid #e2e8f0' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '880px' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700, color: '#1e40af', marginBottom: '1.5rem' }}>
            <ShieldCheck size={16} color="#2563eb" />
            <span>Deterministic Rule Engine • Zero Aadhaar/Bank Storage • 100% Verified Sources</span>
          </div>

          <h1 style={{ fontSize: '2.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
            Personalized Government Schemes & <span style={{ color: '#1e3a8a', textDecoration: 'underline decoration-orange-500 decoration-4' }}>Smart Document Guidance</span>
          </h1>

          <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: 1.6, marginBottom: '2.25rem' }}>
            Tell JanSahay AI your location and background. We match you with verified central and state schemes, explain <strong>why you qualify</strong>, detect missing documents, and provide step-by-step state acquisition guides.
          </p>

          {/* Primary Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
            <Link to={isAuthenticated ? "/recommendations" : "/profile"} className="btn btn-primary" style={{ padding: '0.875rem 1.75rem', fontSize: '1rem' }}>
              <Sparkles size={18} color="#f97316" /> Check My Eligibility Now <ArrowRight size={18} />
            </Link>
            <Link to="/schemes" className="btn btn-outline" style={{ padding: '0.875rem 1.75rem', fontSize: '1rem' }}>
              <Search size={18} /> Browse 35+ Schemes
            </Link>
          </div>

          {/* 1-Click Presentation Demo Profiles Box */}
          <div style={{ background: '#ffffff', border: '2px dashed #cbd5e1', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Award size={18} color="#ea580c" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                College Viva Demo — 1-Click Evaluation Profiles:
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleDemoSelect('student')}
                className="btn btn-outline btn-sm"
                style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af', padding: '0.5rem 1rem' }}>
                👨‍🎓 <strong>Student Demo:</strong> Rahul (Pune, B.Tech, Income &lt; ₹2L)
              </button>
              <button
                onClick={() => handleDemoSelect('farmer')}
                className="btn btn-outline btn-sm"
                style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534', padding: '0.5rem 1rem' }}>
                🌾 <strong>Farmer Demo:</strong> Ramesh (Satara, 3.5 Acres, Sugarcane)
              </button>
              <button
                onClick={() => handleDemoSelect('business')}
                className="btn btn-outline btn-sm"
                style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e', padding: '0.5rem 1rem' }}>
                💼 <strong>Business Demo:</strong> Priya (Mumbai, MSME Startup)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Pillar Citizen Journey */}
      <section style={{ padding: '4rem 0', backgroundColor: '#ffffff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem' }}>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
              The 4-Step Citizen Journey
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Converting complex government gazettes and eligibility clauses into a simple, personalized roadmap.
            </p>
          </div>

          <div className="grid grid-cols-4">
            {/* Step 1 */}
            <div className="card" style={{ padding: '1.5rem', borderTop: '4px solid #3b82f6' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: 800, marginBottom: '1rem' }}>
                1
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                Discover Schemes
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>
                Answer progressive questions tailored to whether you are a Student, Farmer, Business Owner, or Job Seeker.
              </p>
            </div>

            {/* Step 2 */}
            <div className="card" style={{ padding: '1.5rem', borderTop: '4px solid #10b981' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', fontWeight: 800, marginBottom: '1rem' }}>
                2
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                Understand Rules
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>
                Deterministic engine transparently displays which rules passed, which failed, and which need confirmation.
              </p>
            </div>

            {/* Step 3 */}
            <div className="card" style={{ padding: '1.5rem', borderTop: '4px solid #f97316' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontWeight: 800, marginBottom: '1rem' }}>
                3
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                Prepare Documents
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>
                Automated missing-document detection with step-by-step state acquisition guides for Tehsildar & MSME certificates.
              </p>
            </div>

            {/* Step 4 */}
            <div className="card" style={{ padding: '1.5rem', borderTop: '4px solid #8b5cf6' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', fontWeight: 800, marginBottom: '1rem' }}>
                4
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                Apply with Clarity
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>
                Access verified official application portals (MahaDBT, Aaple Sarkar, PM-KISAN, Udyam) with zero confusion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ padding: '4rem 0', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '2rem' }}>
            {/* Box 1: Smart Document Guidance */}
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.5rem', borderRadius: '8px' }}>
                  <FileText size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Smart Document Guidance</h3>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Need an Income Certificate, Domicile, Non-Creamy Layer, or Udyam MSME registration? Follow state-specific instructions detailing issuing authorities, supporting checklists, online steps, and official fees.
              </p>
              <Link to="/document-guides" style={{ color: '#1e3a8a', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                Explore Document Acquisition Guides <ArrowRight size={14} />
              </Link>
            </div>

            {/* Box 2: Multilingual Grounded AI Assistant */}
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: '#fef3c7', color: '#b45309', padding: '0.5rem', borderRadius: '8px' }}>
                  <Sparkles size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Grounded AI Assistant</h3>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Have questions in Marathi, Hindi, or English? The JanSahay AI Assistant explains complex conditions in simple everyday language using only verified database records — no hallucinations or fake criteria.
              </p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('jansahay-open-ai', { detail: { initialQuestion: 'What government schemes are available for students, farmers, and citizens?' } }))}
                style={{ background: 'none', border: 'none', padding: 0, color: '#1e3a8a', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                Open AI Assistant in Action <ArrowRight size={14} />
              </button>
            </div>

            {/* Box 3: Cross-Scheme Preparation Dashboard */}
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.5rem', borderRadius: '8px' }}>
                  <CheckCircle size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Document Prep Dashboard</h3>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Track your document readiness across all recommended schemes. If 3 schemes require an Income Certificate, it is deduplicated into one single action item with progress tracking.
              </p>
              <Link to="/document-preparation" style={{ color: '#1e3a8a', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                View Preparation Dashboard <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
