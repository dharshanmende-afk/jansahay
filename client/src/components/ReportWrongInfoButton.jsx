import React, { useState } from 'react';
import { Flag, X, CheckCircle, AlertCircle } from 'lucide-react';
import { aiService } from '../services/api';

/**
 * ReportWrongInfoButton — Allows citizens to flag inaccurate fees, deadlines,
 * rules, or official links on any Scheme or Document Guide.
 * Persists directly to backend `feedback` table via POST /api/feedback.
 */
export const ReportWrongInfoButton = ({ schemeId = null, guideId = null, entityTitle = '', compact = false }) => {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', text: string }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanComment = comment.trim();
    if (cleanComment.length < 3) {
      setStatus({ type: 'error', text: 'Please enter at least 3 characters describing the correction.' });
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      await aiService.submitCorrection({
        schemeId: schemeId ? Number(schemeId) : null,
        guideId: guideId ? Number(guideId) : null,
        feedbackType: 'ERROR_REPORT',
        comment: entityTitle ? `[${entityTitle}] ${cleanComment}` : cleanComment
      });
      setStatus({ type: 'success', text: 'Thank you! Correction logged for verification.' });
      setComment('');
      setTimeout(() => {
        setOpen(false);
        setStatus(null);
      }, 1800);
    } catch (err) {
      setStatus({ type: 'error', text: err?.message || 'Could not submit report. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="btn btn-outline btn-sm"
        aria-label={`Report wrong information for ${entityTitle || 'this item'}`}
        style={{
          color: '#b91c1c',
          borderColor: '#fecaca',
          backgroundColor: '#fef2f2',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: compact ? '0.72rem' : '0.78rem',
          minHeight: '36px'
        }}>
        <Flag size={13} aria-hidden="true" />
        <span>Report wrong information</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-wrong-info-title"
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
            padding: '1rem'
          }}>
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '460px', padding: '1.25rem', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 id="report-wrong-info-title" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Report Wrong or Outdated Information
              </h3>
              <button
                type="button"
                aria-label="Close report dialog"
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            {entityTitle && (
              <p style={{ fontSize: '0.8rem', color: '#334155', marginBottom: '0.75rem' }}>
                Regarding: <strong>{entityTitle}</strong>
              </p>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label htmlFor="wrong-info-textarea" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                What detail needs correction? (fee, deadline, broken link, rule)
              </label>
              <textarea
                id="wrong-info-textarea"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Example: Portal fee is now ₹40, or official URL changed..."
                required
                maxLength={2000}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit'
                }}
              />

              {status && (
                <div
                  role="status"
                  aria-live="polite"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    padding: '0.5rem',
                    borderRadius: '0.4rem',
                    backgroundColor: status.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: status.type === 'success' ? '#166534' : '#991b1b'
                  }}>
                  {status.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                  <span>{status.text}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setOpen(false)} className="btn btn-outline btn-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary btn-sm"
                  style={{ backgroundColor: '#b91c1c', borderColor: '#b91c1c' }}>
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
