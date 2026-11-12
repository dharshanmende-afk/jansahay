import React, { useState } from 'react';
import { ShieldCheck, Trash2, UserX, AlertTriangle, CheckCircle, Info, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const PrivacyPolicyPage = () => {
  const { user, token, logout } = useAuth();
  const [dataPurged, setDataPurged] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [confirmDataModal, setConfirmDataModal] = useState(false);

  const handleDeleteData = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      await axios.delete(`${API_BASE}/auth/delete-my-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDataPurged(true);
      setConfirmDataModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to erase data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      await axios.delete(`${API_BASE}/auth/delete-my-account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccountDeleted(true);
      setConfirmDeleteModal(false);
      setTimeout(() => {
        logout();
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '840px', margin: '2rem auto', padding: '0 1rem' }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#059669', marginBottom: '1rem' }}>
          <ShieldCheck size={32} />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
          Privacy Policy & Citizen Data Rights
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Governed under India's Digital Personal Data Protection (DPDP) Act, 2023 & Open Public Interest Standard
        </p>
      </div>

      {/* Critical Privacy Commitment Card */}
      <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <Lock size={24} style={{ color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#166534', margin: '0 0 0.25rem 0' }}>
            Zero Sensitive Identity Storage Guarantee
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#15803d', margin: 0, lineHeight: 1.5 }}>
            JanSahay AI <strong>never requests, accesses, or stores</strong> sensitive government identifiers including <strong>Aadhaar numbers, PAN cards, voter IDs, bank account numbers, or biometric credentials</strong>. All scheme matching is conducted using non-identifying socio-economic parameters.
          </p>
        </div>
      </div>

      {/* Structured Policy Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', color: '#334155', lineHeight: 1.7, fontSize: '0.925rem' }}>
        <section style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            1. Purpose of Data Collection
          </h2>
          <p style={{ margin: 0 }}>
            We collect only the minimum demographic attributes required to execute rule-based eligibility evaluation:
          </p>
          <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
            <li><strong>Socio-Economic Brackets:</strong> Annual income tier, social category (OPEN, OBC, SC, ST, EWS), and residential state/district.</li>
            <li><strong>Occupational Metrics:</strong> Occupation type (Student, Farmer, Business Owner, General Citizen), course of study, or land holding size.</li>
            <li><strong>Document Readiness Checklist:</strong> Flags indicating whether you hold statutory prerequisite certificates (e.g. Income Certificate, Domicile, Non-Creamy Layer).</li>
          </ul>
        </section>

        <section style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            2. Deterministic Matching & LLM Guardrails
          </h2>
          <p style={{ margin: 0 }}>
            JanSahay AI enforces a strict architectural boundary between rule computation and natural language explanation:
          </p>
          <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
            <li><strong>Rule Engine Independence:</strong> The Large Language Model (Gemini / RAG) does NOT calculate eligibility or determine benefit amounts. Eligibility is decided purely by the deterministic server engine.</li>
            <li><strong>No Prompt Training:</strong> User queries and chat interactions are grounded against official gazette rules and are never used to train third-party machine learning models.</li>
          </ul>
        </section>

        <section style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            3. Data Retention & Privacy Controls
          </h2>
          <p style={{ margin: 0 }}>
            You have full sovereignty over your information at all times. You can request temporary anonymization or immediate permanent erasure of your profile and documents.
          </p>
        </section>

        {/* Interactive Citizen Data Rights Control Box */}
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', marginTop: '0.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trash2 size={20} style={{ color: '#ef4444' }} /> Citizen Data Rights Dashboard
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
            In accordance with India's DPDP Act, exercise your statutory right to data erasure or account closure directly from here:
          </p>

          {error && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {dataPurged && (
            <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={16} /> All profile attributes, document statuses, and chat sessions have been permanently purged from the database.
            </div>
          )}

          {accountDeleted && (
            <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={16} /> Citizen account permanently deleted. Logging you out now...
            </div>
          )}

          {!user ? (
            <div style={{ fontSize: '0.875rem', color: '#64748b', fontStyle: 'italic' }}>
              You are currently browsing as a guest. No persistent profile records or user identifiers are linked to your session.
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setConfirmDataModal(true)}
                disabled={loading || dataPurged}
                style={{
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.5rem',
                  color: '#334155',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: loading || dataPurged ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Trash2 size={16} /> Delete My Data (Keep Login)
              </button>

              <button
                type="button"
                onClick={() => setConfirmDeleteModal(true)}
                disabled={loading || accountDeleted}
                style={{
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fca5a5',
                  borderRadius: '0.5rem',
                  color: '#991b1b',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: loading || accountDeleted ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <UserX size={16} /> Permanently Delete My Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Delete Data */}
      {confirmDataModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', maxWidth: '440px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Confirm Data Erasure?
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              This will permanently delete your demographic profile, document preparation records, and chat session transcripts. Your login account will remain active.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setConfirmDataModal(false)}
                style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', background: 'white', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteData}
                disabled={loading}
                style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', backgroundColor: '#e11d48', color: 'white', fontWeight: 600, cursor: 'pointer' }}
              >
                {loading ? 'Erasing...' : 'Yes, Erase My Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete Account */}
      {confirmDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', maxWidth: '440px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} /> Permanent Account Termination
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Are you sure you want to permanently delete your citizen account? All your saved profiles, matched schemes, in-hand document registries, and credentials will be irreversibly erased.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setConfirmDeleteModal(false)}
                style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', background: 'white', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', backgroundColor: '#991b1b', color: 'white', fontWeight: 600, cursor: 'pointer' }}
              >
                {loading ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacyPolicyPage;
