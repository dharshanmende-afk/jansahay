import React, { useState } from 'react';
import { X, CheckCircle, ExternalLink, AlertTriangle, Clock, Building, FileText, DollarSign, Check, ShieldCheck, ListOrdered } from 'lucide-react';
import { documentService } from '../services/api';
import { ReportWrongInfoButton } from './ReportWrongInfoButton';
import { SpeakButton } from './VoiceControls';

export const DocumentGuideModal = ({ guide, onClose, onStatusUpdated }) => {
  const [markingAvailable, setMarkingAvailable] = useState(false);
  const [markedSuccess, setMarkedSuccess] = useState(false);

  if (!guide) return null;

  // 1. Normalize Prerequisites / Required Related Documents
  const supportingDocs = (guide.prerequisites && guide.prerequisites.length > 0)
    ? guide.prerequisites
    : (guide.requiredSupportingDocuments && guide.requiredSupportingDocuments.length > 0)
      ? guide.requiredSupportingDocuments
      : [
          'Aadhaar Card (Identity proof & mobile OTP linking)',
          'Proof of Residence / Address (Ration Card, Electricity Bill, or Domicile)',
          'Recent Passport-size Photographs',
          'Self-declaration Affidavit or Prescribed Application Form'
        ];

  // 2. Normalize Step-by-Step Process in point-wise format
  const rawSteps = guide.steps || guide.applicationSteps || guide.stepByStepProcess || [];
  const normalizedSteps = rawSteps.length > 0
    ? rawSteps.map((step, idx) => {
        if (typeof step === 'string') {
          return {
            stepNumber: idx + 1,
            title: `Step ${idx + 1}`,
            description: step,
            method: 'ONLINE'
          };
        }
        return {
          stepNumber: step.stepNumber || idx + 1,
          title: step.title || `Step ${idx + 1}`,
          description: step.description || step.detail || step.instruction || '',
          method: step.method || (step.isOnline ? 'ONLINE' : 'OFFLINE')
        };
      })
    : [
        {
          stepNumber: 1,
          title: 'Step 1: Check Prerequisites & Gather Proofs',
          description: 'Collect your Aadhaar card, residence proof, and applicable income or academic records listed in the prerequisites section.',
          method: 'OFFLINE'
        },
        {
          stepNumber: 2,
          title: 'Step 2: Access the Official Issuing Portal',
          description: 'Open the verified government portal link provided below or visit the nearest CSC Setu Suvidha Kendra.',
          method: 'ONLINE'
        },
        {
          stepNumber: 3,
          title: 'Step 3: Complete Citizen Registration & Upload Proofs',
          description: 'Login with Aadhaar OTP, select the specific certificate service, fill applicant particulars, and upload scanned documents (under 256KB).',
          method: 'ONLINE'
        },
        {
          stepNumber: 4,
          title: 'Step 4: Pay Statutory RTS Fee & Track Application',
          description: 'Pay the government statutory fee online via UPI/Netbanking, record your application tracking number, and download the digitally signed certificate upon approval.',
          method: 'ONLINE'
        }
      ];

  // 3. Normalize Metadata
  const issuingAuthority = guide.issuingAuthority || 'Competent Revenue Officer / Tahsildar';
  const statutoryFees = guide.possibleFees || guide.feeAndTimeline?.split('•')[0]?.trim() || '₹33 to ₹50 statutory RTS fee';
  const processingTime = guide.estimatedTime || guide.expectedProcessingTime || guide.feeAndTimeline?.split('•')[1]?.trim() || '15 to 21 working days';
  const officialPortalUrl = guide.officialUrl || guide.officialApplicationUrl || guide.officialPortalUrl || 'https://aaplesarkar.mahaonline.gov.in';
  const description = guide.simpleDescription || guide.howToGetGuide || `Official government certificate required for welfare schemes.`;

  const handleMarkAvailable = async () => {
    setMarkingAvailable(true);
    try {
      await documentService.updateStatus({
        documentName: guide.title,
        documentType: guide.documentType,
        status: 'AVAILABLE',
        notes: `Marked available from guidance modal on ${new Date().toLocaleDateString('en-IN')}`
      });
      setMarkedSuccess(true);
      if (onStatusUpdated) onStatusUpdated(guide.documentType, 'AVAILABLE');
    } catch (err) {
      alert('Could not update document status. Please make sure you are logged in.');
    } finally {
      setMarkingAvailable(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1100, padding: '1rem',
      backdropFilter: 'blur(3px)'
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        backgroundColor: '#ffffff',
        borderRadius: '1rem',
        maxWidth: '780px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #cbd5e1'
      }}>
        {/* Modal Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#f8fafc' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{
                background: '#dcfce7', color: '#15803d',
                padding: '0.2rem 0.6rem', borderRadius: '9999px',
                fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
              }}>
                <ShieldCheck size={13} /> Official Acquisition Guide
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Applicable: <strong>{guide.applicableState || 'Maharashtra & Central'}</strong>
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
              {guide.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            title="Close modal"
            style={{ background: '#e2e8f0', border: 'none', borderRadius: '9999px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* 1. What is this document & Purpose */}
          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={16} color="#2563eb" /> 1. Overview &amp; Official Purpose
            </h4>
            <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, background: '#f8fafc', padding: '0.9rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              {description}
            </div>
          </div>

          {/* 2. Key Metadata Cards: Issuing Authority, Fees, Timeline */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.85rem', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#15803d', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                <Building size={14} /> ISSUING AUTHORITY
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                {issuingAuthority}
              </div>
            </div>

            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '0.85rem', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#c2410c', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                <DollarSign size={14} /> STATUTORY GOVERNMENT FEES
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                {statutoryFees}
              </div>
            </div>

            <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', padding: '0.85rem', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#7e22ce', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                <Clock size={14} /> EXPECTED TIMELINE (RTS)
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                {processingTime}
              </div>
            </div>
          </div>

          {/* 3. Related Documents Needed to Create This Document (PREREQUISITES) */}
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.65rem', padding: '1.1rem' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#166534', margin: '0 0 0.65rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle size={18} color="#15803d" />
              <span>2. Related Documents Needed to Create This Document (Prerequisites Checklist)</span>
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#15803d', margin: '0 0 0.75rem 0' }}>
              You must have these supporting documents ready in your hand before applying to the issuing authority:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {supportingDocs.map((doc, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: '0.55rem',
                  background: '#ffffff', border: '1px solid #bbf7d0',
                  borderRadius: '0.4rem', padding: '0.55rem 0.75rem',
                  fontSize: '0.85rem', color: '#14532d', fontWeight: 600
                }}>
                  <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '0.9rem' }}>✓</span>
                  <span>{doc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Step-by-Step Process in Simple, Point-Wise Language */}
          <div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ListOrdered size={18} color="#1e3a8a" />
              <span>3. Step-by-Step Process to Officially Generate This Document:</span>
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 0.85rem 0' }}>
              Follow these simple, point-wise instructions to complete your application officially:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {normalizedSteps.map((step, idx) => (
                <div key={idx} style={{
                  display: 'flex', gap: '0.85rem',
                  background: '#ffffff', border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem', padding: '0.95rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '50%',
                    background: '#1e3a8a', color: '#ffffff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.85rem', flexShrink: 0
                  }}>
                    {step.stepNumber || idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                      <h5 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {step.title}
                      </h5>
                      <span style={{
                        fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: '4px',
                        background: step.method === 'ONLINE' ? '#dbeafe' : '#fef3c7',
                        color: step.method === 'ONLINE' ? '#1e40af' : '#92400e',
                        fontWeight: 700
                      }}>
                        {step.method || 'ONLINE'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Official Government Application Portal Link */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #0f2459 100%)',
            color: '#ffffff', padding: '1.15rem 1.25rem', borderRadius: '0.65rem',
            flexWrap: 'wrap', gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                DIRECT OFFICIAL ISSUING PORTAL
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginTop: '0.2rem' }}>
                Apply directly on the official government department website
              </div>
            </div>
            <a
              href={officialPortalUrl.startsWith('http://') || officialPortalUrl.startsWith('https://') ? officialPortalUrl : `https://${officialPortalUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                const target = officialPortalUrl.startsWith('http://') || officialPortalUrl.startsWith('https://') ? officialPortalUrl : `https://${officialPortalUrl}`;
                window.open(target, '_blank', 'noopener,noreferrer');
              }}
              className="btn"
              style={{
                background: '#f97316', color: '#ffffff', border: 'none',
                fontWeight: 800, fontSize: '0.85rem', padding: '0.6rem 1.25rem',
                borderRadius: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                textDecoration: 'none', cursor: 'pointer'
              }}>
              <span>Open Official Portal</span>
              <ExternalLink size={15} />
            </a>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div style={{
          padding: '1rem 1.5rem', backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={onClose} className="btn btn-outline" style={{ fontWeight: 600 }}>
              Close Guide
            </button>
            <SpeakButton text={`${guide.title}. Steps: ${normalizedSteps.map(s => s.title || s).join('. ')}`} label="Listen" />
            <ReportWrongInfoButton guideId={guide.id} entityTitle={guide.title} compact />
          </div>

          <button
            onClick={handleMarkAvailable}
            disabled={markingAvailable || markedSuccess}
            className="btn btn-primary"
            style={{
              backgroundColor: markedSuccess ? '#15803d' : '#1e3a8a',
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700
            }}>
            {markedSuccess ? (
              <>
                <Check size={16} /> Saved as In-Hand Document!
              </>
            ) : markingAvailable ? (
              'Saving...'
            ) : (
              <>
                <CheckCircle size={16} /> Mark as Now in My Hand
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
