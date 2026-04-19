import { Routes, Route } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import CookieBanner from './components/CookieBanner';
// Eager imports for critical pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EmergencyAccess from './pages/EmergencyAccess';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy imports for heavy pages
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
const Trust = lazy(() => import('./pages/Trust'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function App() {
  return (
    <div className="App">
      <ScrollToTop />
      <Navbar />
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div className="spinner" />
        </div>
      }>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/trust" element={<Trust />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/emergency" element={<EmergencyAccess />} />
          <Route path="/voice-messages" element={<ProtectedRoute><VoiceMessages /></ProtectedRoute>} />
          <Route path="/life-timeline" element={<ProtectedRoute><LifeTimeline /></ProtectedRoute>} />
          <Route path="/memoir-ai" element={<ProtectedRoute><MemoirAI /></ProtectedRoute>} />
          <Route path="/gamification" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/activity-logs" element={<ProtectedRoute><ActivityLogs /></ProtectedRoute>} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vault" 
            element={
              <ProtectedRoute>
                <Vault />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/beneficiaries" 
            element={
              <ProtectedRoute>
                <Beneficiaries />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/capsules" 
            element={
              <ProtectedRoute>
                <Capsules />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ai" 
            element={
              <ProtectedRoute>
                <AI />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/final-message" 
            element={
              <ProtectedRoute>
                <FinalMessage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Suspense>
      <CookieBanner />
    </div>
  );
}

export default App;
