import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import CookieBanner from './components/CookieBanner';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Beneficiaries from './pages/Beneficiaries';
import Capsules from './pages/Capsules';
import Vault from './pages/Vault';
import AI from './pages/AI';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Pricing from './pages/Pricing';
import EmergencyAccess from './pages/EmergencyAccess';
import VoiceMessages from './pages/VoiceMessages';
import LifeTimeline from './pages/LifeTimeline';
import MemoirAI from './pages/MemoirAI';
import GamificationPanel from './components/GamificationPanel';
import Onboarding from './pages/Onboarding';
import ProtectedRoute from './components/ProtectedRoute';
import Settings from './pages/Settings';

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
      <Routes>
<Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/emergency" element={<EmergencyAccess />} />
        <Route path="/voice-messages" element={<ProtectedRoute><VoiceMessages /></ProtectedRoute>} />
        <Route path="/life-timeline" element={<ProtectedRoute><LifeTimeline /></ProtectedRoute>} />
        <Route path="/memoir-ai" element={<ProtectedRoute><MemoirAI /></ProtectedRoute>} />
        <Route path="/gamification" element={<ProtectedRoute><GamificationPanel /></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
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
      </Routes>
      <CookieBanner />
    </div>
  );
}

export default App;
