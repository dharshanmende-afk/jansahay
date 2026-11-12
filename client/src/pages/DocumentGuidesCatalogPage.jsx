import React, { useState, useEffect } from 'react';
import { documentGuideService, schemeService } from '../services/api';
import { DocumentGuideModal } from '../components/DocumentGuideModal';
import { FileText, Building, Clock, ArrowRight, ShieldCheck, Search } from 'lucide-react';
import { ReportWrongInfoButton } from '../components/ReportWrongInfoButton';

export const DocumentGuidesCatalogPage = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('');
  const [availableStates, setAvailableStates] = useState(['Maharashtra', 'All India']);
  const [activeGuide, setActiveGuide] = useState(null);

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
    loadGuides();
  }, [selectedState]);

  const loadGuides = async () => {
    setLoading(true);
    try {
      const res = await documentGuideService.getGuides({ state: selectedState || undefined });
      if (res.success && res.data) {
        setGuides(res.data);
      }
    } catch (err) {
      console.error('Error loading guides:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '3rem 0', minHeight: '85vh', backgroundColor: '#f8fafc' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#eff6ff', color: '#1e40af', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <ShieldCheck size={14} /> Official Citizen Service Manuals
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Smart Document Acquisition Guides
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Step-by-step instructions on how Indian citizens can obtain missing certificates from state revenue and central authorities without agent fees.
          </p>
        </div>

        {/* State Filter Buttons (Data-driven from states.json & verified guides) */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedState('')}
            className={`btn btn-sm ${selectedState === '' ? 'btn-primary' : 'btn-outline'}`}>
            All States & Central
          </button>
          {availableStates.map(st => (
            <button
              key={st}
              onClick={() => setSelectedState(st)}
              className={`btn btn-sm ${selectedState === st ? 'btn-primary' : 'btn-outline'}`}>
              {st === 'All India' ? 'Central / National Portals' : st}
            </button>
          ))}
        </div>

        {/* Guides Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: '#64748b' }}>
            <p>Loading document acquisition guides...</p>
          </div>
        ) : guides.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <p>No document guides found for this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
            {guides.map(guide => (
              <div key={guide.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span className={`badge ${
                      guide.verificationStatus === 'VERIFIED' ? 'badge-verified' :
                      guide.verificationStatus === 'OUTDATED' ? 'badge-outdated' : 'badge-unverified'
                    }`}>
                      {guide.verificationStatus === 'VERIFIED' ? '✓ Verified Official Guide' :
                       guide.verificationStatus === 'OUTDATED' ? '⚠ Outdated' : '⏳ Verification Pending'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                      Jurisdiction: {guide.applicableState || 'All India'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                    {guide.title}
                  </h3>

                  <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {guide.simpleDescription}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Issuing Authority:</strong> {guide.issuingAuthority}
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Application Mode:</strong> {guide.applicationMethod || 'Online & Setu Kendra'}
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Processing Time:</strong> {guide.expectedProcessingTime || '15-21 working days'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    onClick={() => setActiveGuide(guide)}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}>
                    <FileText size={16} /> Open Complete Step-by-Step Guide
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <ReportWrongInfoButton guideId={guide.id} entityTitle={guide.title} compact />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guide Modal */}
      {activeGuide && (
        <DocumentGuideModal
          guide={activeGuide}
          onClose={() => setActiveGuide(null)}
        />
      )}
    </div>
  );
};
