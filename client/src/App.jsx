import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AIChatDrawer } from './components/AIChatDrawer';
import { HomePage } from './pages/HomePage';

// Route-level code splitting for secondary routes while keeping `/` CLS-free
const ProfileWizardPage = lazy(() => import('./pages/ProfileWizardPage').then(m => ({ default: m.ProfileWizardPage })));
const RecommendationsPage = lazy(() => import('./pages/RecommendationsPage').then(m => ({ default: m.RecommendationsPage })));
const SchemesCatalogPage = lazy(() => import('./pages/SchemesCatalogPage').then(m => ({ default: m.SchemesCatalogPage })));
const SchemeDetailPage = lazy(() => import('./pages/SchemeDetailPage').then(m => ({ default: m.SchemeDetailPage })));
const DocumentPreparationPage = lazy(() => import('./pages/DocumentPreparationPage').then(m => ({ default: m.DocumentPreparationPage })));
const DocumentGuidesCatalogPage = lazy(() => import('./pages/DocumentGuidesCatalogPage').then(m => ({ default: m.DocumentGuidesCatalogPage })));
const LiveUpdatesPage = lazy(() => import('./pages/LiveUpdatesPage').then(m => ({ default: m.LiveUpdatesPage })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));

const PageLoader = () => (
  <div role="status" aria-live="polite" style={{ minHeight: '75vh', padding: '4rem 1rem', textAlign: 'center', color: '#334155' }}>
    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Loading JanSahay AI...</div>
  </div>
);

export const App = () => {
  const [serverWaking, setServerWaking] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const onWaking = (e) => setServerWaking(Boolean(e.detail?.waking));
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);

    window.addEventListener('jansahay-server-waking', onWaking);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('jansahay-server-waking', onWaking);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar />

      {serverWaking && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: '#fef3c7',
            color: '#92400e',
            borderBottom: '1px solid #fde68a',
            padding: '0.45rem 1rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            textAlign: 'center'
          }}>
          Server is waking up... Free-tier cold starts can take a few seconds. Thank you for waiting.
        </div>
      )}

      {isOffline && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: '#e0f2fe',
            color: '#075985',
            borderBottom: '1px solid #bae6fd',
            padding: '0.45rem 1rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            textAlign: 'center'
          }}>
          Offline mode active: cached schemes catalog and your saved checklist remain available.
        </div>
      )}

      <main id="main-content" tabIndex={-1} style={{ flex: 1 }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={<ProfileWizardPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/schemes" element={<SchemesCatalogPage />} />
            <Route path="/schemes/:id" element={<SchemeDetailPage />} />
            <Route path="/document-preparation" element={<DocumentPreparationPage />} />
            <Route path="/document-guides" element={<DocumentGuidesCatalogPage />} />
            <Route path="/updates" element={<LiveUpdatesPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <AIChatDrawer />
    </div>
  );
};
