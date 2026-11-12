import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ProfileWizardPage } from './pages/ProfileWizardPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { SchemesCatalogPage } from './pages/SchemesCatalogPage';
import { SchemeDetailPage } from './pages/SchemeDetailPage';
import { DocumentPreparationPage } from './pages/DocumentPreparationPage';
import { DocumentGuidesCatalogPage } from './pages/DocumentGuidesCatalogPage';
import { LiveUpdatesPage } from './pages/LiveUpdatesPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { AIChatDrawer } from './components/AIChatDrawer';

export const App = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
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
      </main>
      <Footer />
      {/* Global JanSahay AI Chatbot Drawer persistent across all pages */}
      <AIChatDrawer />
    </div>
  );
};
