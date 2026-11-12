import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { schemeService, updateService } from '../services/api';
import { Search, Filter, BookOpen, ArrowRight, ExternalLink, RefreshCw, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { ReportWrongInfoButton } from '../components/ReportWrongInfoButton';

export const SchemesCatalogPage = () => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [availableStates, setAvailableStates] = useState(['Maharashtra', 'All India']);

  useEffect(() => {
    schemeService.getStates()
      .then(res => {
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          setAvailableStates(res.data.map(s => s.name));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadSchemes();
  }, [keyword, selectedCategory, selectedLevel, selectedState]);

  const loadSchemes = async () => {
    setLoading(true);
    try {
      const res = await schemeService.getSchemes({
        keyword: keyword || undefined,
        category: selectedCategory || undefined,
        governmentLevel: selectedLevel || undefined,
        state: selectedState || undefined,
        size: 50
      });
      if (res.success && res.data) {
        const raw = res.data.content || [];
        // Deduplicate schemes so only unique schemes & policies are shown
        const seen = new Set();
        const uniqueSchemes = [];
        for (const s of raw) {
          if (!s || !s.name) continue;
          const key = s.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!seen.has(key)) {
            seen.add(key);
            uniqueSchemes.push(s);
          }
        }
        setSchemes(uniqueSchemes);
      }
    } catch (err) {
      console.error('Error loading schemes catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncGovSchemes = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await updateService.fetchGovSchemes();
      if (res.success) {
        setSyncMessage(`✓ Live Government Sync Complete! ${res.data?.totalInserted || 0} new schemes added, ${res.data?.totalUpdated || 0} updated.`);
        await loadSchemes();
      }
    } catch (err) {
      console.error('Error syncing schemes:', err);
      setSyncMessage('⚠️ Could not connect to external portals. Stored official scheme data is active.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 6000);
    }
  };

  return (
    <div style={{ padding: '3rem 0', minHeight: '85vh', backgroundColor: '#f8fafc' }}>
      <div className="container">
        {/* Header & Live Dynamic Sync Action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#dbeafe', color: '#1e40af', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <ShieldCheck size={13} /> Official Central & State Government Portals
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
              Government Schemes Catalog
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Discover dynamic government welfare schemes with verified eligibility rules and document checklists.
            </p>
          </div>

          <button
            onClick={handleSyncGovSchemes}
            disabled={syncing}
            className="btn btn-primary"
            style={{
              background: '#15803d',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              padding: '0.65rem 1.15rem',
              boxShadow: '0 2px 4px rgba(21, 128, 61, 0.2)'
            }}>
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Fetching Live Govt Schemes...' : 'Fetch Live Govt Schemes (Dynamic Sync)'}
          </button>
        </div>

        {/* Sync Notification Banner */}
        {syncMessage && (
          <div style={{
            background: syncMessage.startsWith('✓') ? '#f0fdf4' : '#fffbeb',
            border: `1px solid ${syncMessage.startsWith('✓') ? '#bbf7d0' : '#fef3c7'}`,
            color: syncMessage.startsWith('✓') ? '#166534' : '#92400e',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={16} /> {syncMessage}
          </div>
        )}

        {/* Search & Filters */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* Keyword Search */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>SEARCH BY NAME OR BENEFIT</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="e.g. Scholarship, PM-Kisan, Mudra..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>CATEGORY</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}>
                <option value="">All Categories</option>
                <option value="EDUCATION">Education & Scholarships</option>
                <option value="AGRICULTURE">Agriculture & Farmers</option>
                <option value="BUSINESS">Business & MSME</option>
                <option value="EMPLOYMENT">Employment & Skills</option>
                <option value="SOCIAL_SUPPORT">Social Support & Housing</option>
                <option value="HEALTHCARE">Healthcare Assurance</option>
              </select>
            </div>

            {/* Government Level */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>GOVERNMENT LEVEL</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}>
                <option value="">Central & State (All)</option>
                <option value="CENTRAL">Central Government</option>
                <option value="STATE">State Government</option>
              </select>
            </div>

            {/* State Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>STATE / REGION</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}>
                <option value="">All India & States</option>
                {availableStates.filter(st => st !== 'All India').map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Schemes Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: '#64748b' }}>
            <p>Loading scheme directory...</p>
          </div>
        ) : schemes.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <p>No schemes matched your search criteria. Try clearing filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
            {schemes.map(s => (
              <div key={s.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span className="badge" style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', fontSize: '0.7rem' }}>
                      {s.governmentLevel} • {s.state || 'All India'}
                    </span>
                    <span 
                      className={`badge ${s.verificationStatus === 'VERIFIED' ? 'badge-verified' : ''}`}
                      style={{ 
                        fontSize: '0.7rem',
                        background: s.verificationStatus === 'VERIFIED' ? '#f0fdf4' : '#f8fafc',
                        color: s.verificationStatus === 'VERIFIED' ? '#166534' : '#475569',
                        border: `1px solid ${s.verificationStatus === 'VERIFIED' ? '#bbf7d0' : '#e2e8f0'}`
                      }}
                    >
                      {s.verificationStatus === 'VERIFIED' 
                        ? '✓ Verified Source' 
                        : (s.dataStatus === 'LIVE' ? '● Live Official Data' : 'Official Record')}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                    {s.name}
                  </h3>

                  <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {s.description}
                  </p>
                </div>

                <div>
                  <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '1rem', fontSize: '0.825rem' }}>
                    <strong style={{ color: '#0f172a' }}>Benefit:</strong>{' '}
                    <span style={{ color: '#15803d', fontWeight: 600 }}>{s.benefit}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <Link to={`/schemes/${s.id}`} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      Check Eligibility & Documents <ArrowRight size={13} />
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ReportWrongInfoButton schemeId={s.id} entityTitle={s.name} compact />
                      {s.sourceUrl && (
                        <a
                          href={s.sourceUrl.startsWith('http://') || s.sourceUrl.startsWith('https://') ? s.sourceUrl : `https://${s.sourceUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', cursor: 'pointer' }}>
                          Official Portal <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
