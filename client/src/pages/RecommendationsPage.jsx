import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { recommendationService } from '../services/api';
import { exportRecommendationsPdf } from '../utils/pdfExport';
import {
  Sparkles,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  FileText,
  Building,
  ExternalLink,
  Bot,
  Download
} from 'lucide-react';

export const RecommendationsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSchemeForAI, setSelectedSchemeForAI] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadRecommendations();
  }, [isAuthenticated]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const res = await recommendationService.getRecommendations();
      if (res.success && res.data) {
        setRecommendations(res.data);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForceRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await recommendationService.generateRecommendations();
      if (res.success && res.data) {
        setRecommendations(res.data);
      }
    } catch (err) {
      alert('Error updating matches');
    } finally {
      setRefreshing(false);
    }
  };

  const strongMatches = recommendations.filter(r => r.matchType === 'STRONG_MATCH');
  const potentialMatches = recommendations.filter(r => r.matchType === 'POTENTIAL_MATCH');
  const moreInfoMatches = recommendations.filter(r => r.matchType === 'MORE_INFORMATION_REQUIRED');

  const handleAskAIAboutScheme = (scheme) => {
    setSelectedSchemeForAI(scheme);
    window.dispatchEvent(new CustomEvent('jansahay-open-ai', {
      detail: {
        scheme: scheme,
        initialQuestion: `Please explain ${scheme.schemeName || scheme.name} in simple language and tell me what documents are required.`
      }
    }));
  };

  return (
    <div style={{ padding: '3rem 0', minHeight: '85vh', backgroundColor: '#f8fafc' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#dcfce7', color: '#15803d', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              ✓ Deterministic Eligibility Engine (Auditable Matching)
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
              Personalized Scheme Recommendations
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Evaluated against your profile. Every recommendation explains which conditions matched and what documents are required.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {recommendations.length > 0 && (
              <button
                onClick={() => exportRecommendationsPdf(user?.name, recommendations)}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#1e3a8a' }}>
                <Download size={16} /> Export PDF Dossier
              </button>
            )}
            <button
              onClick={handleForceRefresh}
              disabled={refreshing}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Re-evaluating...' : 'Re-run Eligibility Engine'}
            </button>
            <Link to="/profile" className="btn btn-outline">
              Edit Profile
            </Link>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: '#64748b' }}>
            <Sparkles size={32} color="#1e3a8a" className="animate-spin" style={{ margin: '0 auto 1rem' }} />
            <p>Evaluating your profile conditions against 35+ verified schemes...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <AlertCircle size={40} color="#f97316" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              No Direct Matches Found
            </h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
              We could not find an exact match for your current profile. Try editing your profile details or explore our open scheme directory.
            </p>
            <Link to="/profile" className="btn btn-primary">
              Update Profile Details
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {/* Section 1: Strong Matches */}
            {strongMatches.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <span className="badge badge-strong" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                    <CheckCircle size={14} /> Strong Match ({strongMatches.length})
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    You satisfy 80%+ of published eligibility conditions
                  </span>
                </div>

                <div className="grid grid-cols-1" style={{ gap: '1.25rem' }}>
                  {strongMatches.map(scheme => (
                    <RecommendationCard
                      key={scheme.schemeId}
                      scheme={scheme}
                      onAskAI={() => handleAskAIAboutScheme(scheme)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Section 2: Potential Matches */}
            {potentialMatches.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <span className="badge badge-potential" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                    <HelpCircle size={14} /> Potential Match ({potentialMatches.length})
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Satisfies core criteria; additional conditions may apply
                  </span>
                </div>

                <div className="grid grid-cols-1" style={{ gap: '1.25rem' }}>
                  {potentialMatches.map(scheme => (
                    <RecommendationCard
                      key={scheme.schemeId}
                      scheme={scheme}
                      onAskAI={() => handleAskAIAboutScheme(scheme)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: More Info Required */}
            {moreInfoMatches.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <span className="badge badge-more-info" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                    <AlertCircle size={14} /> More Information Required ({moreInfoMatches.length})
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    You may be eligible once unrecorded details are confirmed
                  </span>
                </div>

                <div className="grid grid-cols-1" style={{ gap: '1.25rem' }}>
                  {moreInfoMatches.map(scheme => (
                    <RecommendationCard
                      key={scheme.schemeId}
                      scheme={scheme}
                      onAskAI={() => handleAskAIAboutScheme(scheme)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-component: RecommendationCard
const RecommendationCard = ({ scheme, onAskAI }) => {
  return (
    <div className="card" style={{ padding: '1.5rem', borderLeft: `6px solid ${
      scheme.matchType === 'STRONG_MATCH' ? '#15803d' :
      scheme.matchType === 'POTENTIAL_MATCH' ? '#b45309' : '#0284c7'
    }` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e3a8a', background: '#eff6ff', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
              {scheme.governmentLevel} • {scheme.state || 'All India'}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
              Category: {scheme.schemeCategory}
            </span>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            {scheme.schemeName}
          </h3>
        </div>

        {/* Match Percentage Badge */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: scheme.matchScore >= 80 ? '#15803d' : '#b45309' }}>
            {scheme.matchScore}%
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
            RULE MATCH SCORE
          </span>
        </div>
      </div>

      {/* Benefit Highlight Box */}
      <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
        <strong style={{ color: '#0f172a' }}>Direct Benefit:</strong>{' '}
        <span style={{ color: '#166534', fontWeight: 600 }}>{scheme.benefit}</span>
      </div>

      {/* Transparent Match Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {/* Conditions Matched */}
        {scheme.matchedConditions && scheme.matchedConditions.length > 0 && (
          <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle size={13} /> SATISFIED CONDITIONS:
            </div>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.8rem', color: '#15803d', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {scheme.matchedConditions.map((cond, idx) => (
                <li key={idx}>{cond}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing or Unconfirmed Information */}
        {scheme.missingInformation && scheme.missingInformation.length > 0 && (
          <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <HelpCircle size={13} /> NEEDS CONFIRMATION:
            </div>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.8rem', color: '#1e3a8a', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {scheme.missingInformation.map((info, idx) => (
                <li key={idx}>{info}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          onClick={onAskAI}
          className="btn btn-outline btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#1e3a8a', borderColor: '#bfdbfe', background: '#eff6ff' }}>
          <Bot size={15} /> Ask JanSahay AI About This Scheme
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            to={`/schemes/${scheme.schemeId}`}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            Check Required Documents & Guidance <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};
