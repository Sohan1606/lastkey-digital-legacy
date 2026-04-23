import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import CookieBanner from './components/CookieBanner';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

// Eager imports for critical pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Trust from './pages/Trust';

// Lazy imports
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Beneficiaries = lazy(() => import('./pages/Beneficiaries'));
const Capsules = lazy(() => import('./pages/Capsules'));
const Vault = lazy(() => import('./pages/Vault'));
const AI = lazy(() => import('./pages/AI'));
const Pricing = lazy(() => import('./pages/Pricing'));
const VoiceMessages = lazy(() => import('./pages/VoiceMessages'));
const LifeTimeline = lazy(() => import('./pages/LifeTimeline'));
const MemoirAI = lazy(() => import('./pages/MemoirAI'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Settings = lazy(() => import('./pages/Settings'));
const FinalMessage = lazy(() => import('./pages/FinalMessage'));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs'));
const LegalDocuments = lazy(() => import('./pages/LegalDocuments'));
const BeneficiaryPortal = lazy(() => import('./pages/BeneficiaryPortal'));
const NotFound = lazy(() => import('./pages/NotFound'));

function AppContent() {
  const location = useLocation();
  const { user } = useAuth();

  // Only show navbar on public pages (NOT on dashboard pages)
  const PUBLIC_ROUTES = [
    '/', '/login', '/signin', '/register', '/signup',
    '/verify-email', '/forgot-password', '/reset-password',
    '/privacy', '/terms', '/trust', '/pricing',
    '/beneficiary-portal'
  ];
  const isPublicPage = PUBLIC_ROUTES.includes(location.pathname) ||
    location.pathname.startsWith('/portal/') ||
    location.pathname.startsWith('/reset-password');

  return (
    <>
      {/* Only show navbar on public pages */}
      {isPublicPage && <Navbar />}
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }} />
        </div>
      }>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signin" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/trust" element={<Trust />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/beneficiary-portal" element={<BeneficiaryPortal />} />
          <Route path="/portal/:token" element={<BeneficiaryPortal />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/vault" element={<ProtectedRoute><Vault /></ProtectedRoute>} />
          <Route path="/beneficiaries" element={<ProtectedRoute><Beneficiaries /></ProtectedRoute>} />
          <Route path="/capsules" element={<ProtectedRoute><Capsules /></ProtectedRoute>} />
          <Route path="/ai" element={<ProtectedRoute><AI /></ProtectedRoute>} />
          <Route path="/final-message" element={<ProtectedRoute><FinalMessage /></ProtectedRoute>} />
          <Route path="/legal-documents" element={<ProtectedRoute><LegalDocuments /></ProtectedRoute>} />
          <Route path="/voice-messages" element={<ProtectedRoute><VoiceMessages /></ProtectedRoute>} />
          <Route path="/life-timeline" element={<ProtectedRoute><LifeTimeline /></ProtectedRoute>} />
          <Route path="/memoir-ai" element={<ProtectedRoute><MemoirAI /></ProtectedRoute>} />
          <Route path="/gamification" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/activity-logs" element={<ProtectedRoute><ActivityLogs /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <CookieBanner />
    </>
  );
}

function App() {
  return (
    <div className="App">
      <ScrollToTop />
      <AppContent />
    </div>
  );
}

export default App;

