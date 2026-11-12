import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ExternalLink, AlertTriangle } from 'lucide-react';

export const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#0f172a', color: '#94a3b8', borderTop: '1px solid #1e293b', marginTop: '4rem', paddingTop: '3rem', paddingBottom: '2rem' }}>
      <div className="container">
        {/* Important Disclaimer Alert Box */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '2.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ backgroundColor: '#f59e0b', padding: '0.5rem', borderRadius: '0.5rem', color: '#0f172a' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h4 style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Official Citizen Notice & Legal Disclaimer
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
              <strong>JanSahay AI</strong> is an informational assistance system designed to help citizens discover potentially relevant government schemes and understand document preparation steps. <strong>It is NOT an official government portal or legal eligibility authority.</strong> Government rules, quotas, fees, deadlines, and required documentation are subject to gazette amendments. Final eligibility and document issuance can only be confirmed and granted by the respective government department or issuing authority.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
          {/* Col 1 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.75rem' }}>
              <span>🇮🇳 JanSahay AI</span>
            </div>
            <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1rem' }}>
              Empowering Indian citizens through rule-based scheme discovery, transparent document preparation checklists, and grounded multilingual assistance.
            </p>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
              Open-Source Civic Platform 2026<br />
              Government Welfare & Document Readiness
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h5 style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>Core Modules</h5>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.825rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><Link to="/schemes" style={{ color: '#cbd5e1', textDecoration: 'none' }}>50+ Verified Schemes</Link></li>
              <li><Link to="/recommendations" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Explainable Eligibility Engine</Link></li>
              <li><Link to="/document-preparation" style={{ color: '#cbd5e1', textDecoration: 'none' }}>My Document Preparation</Link></li>
              <li><Link to="/document-guides" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Smart Document Acquisition Guides</Link></li>
              <li><Link to="/updates" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Real-time Government Updates</Link></li>
              <li><Link to="/privacy" style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy & Citizen Data Rights</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h5 style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>Official Portals</h5>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.825rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><a href="https://www.myscheme.gov.in" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>myScheme Portal <ExternalLink size={12} /></a></li>
              <li><a href="https://aaplesarkar.mahaonline.gov.in" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Aaple Sarkar Maharashtra <ExternalLink size={12} /></a></li>
              <li><a href="https://mahadbt.maharashtra.gov.in" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>MahaDBT Scholarship <ExternalLink size={12} /></a></li>
              <li><a href="https://pmkisan.gov.in" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>PM-KISAN Portal <ExternalLink size={12} /></a></li>
              <li><a href="https://udyamregistration.gov.in" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Udyam MSME Portal <ExternalLink size={12} /></a></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h5 style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>Data & Trust Principles</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#10b981" />
                <span>Zero Aadhaar / Bank details stored</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#10b981" />
                <span>Deterministic rules (No hallucination)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#10b981" />
                <span>Verified state & central sources</span>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <Link to="/privacy" style={{ color: '#10b981', fontSize: '0.78rem', textDecoration: 'underline' }}>
                  Manage Data & Account Deletion →
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#cbd5e1', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            © 2026 JanSahay AI • Built for Indian Citizens • DPDP Act 2023 Aligned
          </div>
          <div>
            React 18, Node.js, Express, PostgreSQL & Prisma ORM
          </div>
        </div>
      </div>
    </footer>
  );
};
