import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Shield, Sparkles, BookOpen, CheckCircle, FileText,
  Bell, User, LogOut, Globe, Menu, X
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout, quickLogin } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleDemoClick = async (role) => {
    try {
      await quickLogin(role);
      setMobileMenuOpen(false);
      navigate(role === 'admin' ? '/admin' : '/recommendations');
    } catch {
      alert('Quick login failed');
    }
  };

  return (
    <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Top Gov Banner */}
      <div style={{ backgroundColor: '#0f172a', color: '#e2e8f0', fontSize: '0.75rem', padding: '0.3rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🇮🇳 Government Citizen Assistance Platform • Digital India</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Language Switcher */}
            <div role="group" aria-label="Language selection" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Globe size={13} aria-hidden="true" />
              {[
                { code: 'en', label: 'English' },
                { code: 'mr', label: 'मराठी' },
                { code: 'hi', label: 'हिन्दी' }
              ].map((langOpt, idx) => (
                <React.Fragment key={langOpt.code}>
                  {idx > 0 && <span aria-hidden="true">|</span>}
                  <button
                    type="button"
                    onClick={() => setLanguage(langOpt.code)}
                    aria-pressed={language === langOpt.code}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: language === langOpt.code ? '#fb923c' : '#e2e8f0',
                      cursor: 'pointer',
                      fontWeight: language === langOpt.code ? 700 : 500,
                      fontSize: '0.75rem',
                      padding: '2px 4px'
                    }}>
                    {langOpt.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 1.25rem', gap: '0.75rem' }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', minWidth: 0 }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'linear-gradient(135deg, #1e3a8a 0%, #0f2459 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.15rem', border: '2px solid #f97316', flexShrink: 0 }}>
            ज
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.02em' }}>
                {t('appTitle')}
              </span>
              <span style={{ background: '#c2410c', color: 'white', fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>
                2.0
              </span>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 500, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t('tagline')}
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav aria-label="Main navigation" className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
          <Link to="/" style={{ color: '#1e293b', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
            {t('home')}
          </Link>
          <Link to="/schemes" style={{ color: '#1e293b', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <BookOpen size={15} color="#1d4ed8" aria-hidden="true" /> {t('schemes')}
          </Link>
          <Link to="/recommendations" style={{ color: '#1e293b', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Sparkles size={15} color="#c2410c" aria-hidden="true" /> {t('recommendations')}
          </Link>
          <Link to="/document-preparation" style={{ color: '#1e293b', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle size={15} color="#15803d" aria-hidden="true" /> {t('preparation')}
          </Link>
          <Link to="/document-guides" style={{ color: '#1e293b', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <FileText size={15} color="#4338ca" aria-hidden="true" /> {t('documentGuides')}
          </Link>
          <Link to="/updates" style={{ color: '#1e293b', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Bell size={15} color="#be123c" aria-hidden="true" /> {t('updates')}
          </Link>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('jansahay-open-ai'))}
            style={{
              background: '#fff7ed',
              border: '1px solid #fdba74',
              color: '#9a3412',
              fontSize: '0.82rem',
              fontWeight: 700,
              padding: '0.32rem 0.65rem',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer'
            }}>
            <Sparkles size={14} color="#c2410c" aria-hidden="true" /> AI Assistant
          </button>
          {isAdmin && (
            <Link to="/admin" style={{ color: '#5b21b6', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#f5f3ff', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
              <Shield size={15} aria-hidden="true" /> {t('admin')}
            </Link>
          )}
        </nav>

        {/* Desktop User Actions + Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isAuthenticated ? (
              <>
                <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', textDecoration: 'none', color: '#0f172a', background: '#f1f5f9', padding: '0.35rem 0.7rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600 }}>
                  <User size={14} color="#1e3a8a" aria-hidden="true" />
                  <span>{user?.name?.split(' ')[0]}</span>
                  <span style={{ fontSize: '0.7rem', color: '#475569' }}>({user?.role})</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="btn btn-outline btn-sm"
                  aria-label="Log out"
                  style={{ padding: '0.4rem' }}>
                  <LogOut size={16} aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <Link to="/profile" className="btn btn-outline btn-sm" style={{ borderColor: '#cbd5e1', color: '#1e3a8a' }}>
                  Check Free
                </Link>
                <Link to="/login" className="btn btn-primary btn-sm">
                  {t('login')}
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm mobile-menu-toggle"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-panel"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            style={{ padding: '0.45rem', minWidth: '40px', minHeight: '40px' }}>
            {mobileMenuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer (360px friendly) */}
      {mobileMenuOpen && (
        <nav
          id="mobile-nav-panel"
          aria-label="Mobile navigation"
          style={{
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            padding: '0.85rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 600, padding: '0.35rem 0' }}>{t('home')}</Link>
          <Link to="/schemes" onClick={() => setMobileMenuOpen(false)} style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 600, padding: '0.35rem 0' }}>{t('schemes')}</Link>
          <Link to="/recommendations" onClick={() => setMobileMenuOpen(false)} style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 600, padding: '0.35rem 0' }}>{t('recommendations')} (Free/Guest)</Link>
          <Link to="/document-preparation" onClick={() => setMobileMenuOpen(false)} style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 600, padding: '0.35rem 0' }}>{t('preparation')}</Link>
          <Link to="/document-guides" onClick={() => setMobileMenuOpen(false)} style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 600, padding: '0.35rem 0' }}>{t('documentGuides')}</Link>
          <Link to="/updates" onClick={() => setMobileMenuOpen(false)} style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 600, padding: '0.35rem 0' }}>{t('updates')}</Link>
          {isAdmin && (
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)} style={{ color: '#5b21b6', textDecoration: 'none', fontWeight: 700, padding: '0.35rem 0' }}>{t('admin')}</Link>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
            {isAuthenticated ? (
              <>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="btn btn-outline btn-sm">Profile ({user?.name?.split(' ')[0]})</Link>
                <button type="button" onClick={() => { logout(); setMobileMenuOpen(false); }} className="btn btn-outline btn-sm">Logout</button>
              </>
            ) : (
              <>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary btn-sm">Check Eligibility (No Login)</Link>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-outline btn-sm">{t('login')}</Link>
                <button type="button" onClick={() => handleDemoClick('student')} className="btn btn-outline btn-sm">Student Demo</button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};
