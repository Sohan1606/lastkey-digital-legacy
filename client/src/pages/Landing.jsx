import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, Users, Zap, Award, Lock, CheckCircle,
  ArrowRight, Eye, FileText, Brain, Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

const Landing = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const handleGetStarted = () => {
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="pt-16">
      {/* SECTION 1 - HERO (id="hero") */}
      <section id="hero" className="bg-[#030508] min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-600/8 rounded-full blur-3xl pointer-events-none"/>
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-purple-600/8 rounded-full blur-3xl pointer-events-none"/>

        <div className="max-w-4xl mx-auto text-center px-6 relative z-10">
          {/* Animated badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-sm text-blue-300 font-medium backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"/>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"/>
            </span>
            Trusted by 10,000+ families worldwide
          </div>

          {/* H1 (two lines) */}
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight bg-gradient-to-br from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-6">
            Your Digital Legacy,<br/>
            Protected Forever.
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mt-6 leading-relaxed">
            Store, protect, and transfer your most important digital assets to the people you love â 
            automatically and securely.
          </p>

          {/* CTA buttons row */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 1 }}
              onClick={handleGetStarted}
              className="px-8 py-4 rounded-xl text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 hover:scale-105 active:scale-100 transition-all duration-200 flex items-center justify-center gap-2"
            >
              Protect My Legacy <ArrowRight size={20} />
            </motion.button>
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="px-8 py-4 rounded-xl text-base font-medium border border-white/12 text-slate-300 hover:text-white hover:border-white/25 hover:bg-white/4 transition-all duration-200"
            >
              See How It Works
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-8 mt-16 pt-8 border-t border-white/5">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <span>ð</span> AES-256 Encrypted
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <span>ð</span> Zero Knowledge  
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <span>ð</span> GDPR Compliant
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <span>ð</span> 99.9% Uptime
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <span>ð</span> SOC2 Ready
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 - FEATURES (id="features") */}
      <section id="features" className="bg-[#070e1b] py-28">
        <div className="max-w-6xl mx-auto px-6">
          {/* Center header */}
          <div className="text-center mb-16">
            <div className="text-xs font-semibold tracking-[0.2em] text-blue-400 uppercase mb-4">FEATURES</div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything you need to protect your legacy</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Comprehensive tools for complete digital legacy management</p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group p-7 rounded-2xl border border-white/4 bg-gradient-to-b from-white/2 to-transparent hover:border-blue-500/20 hover:from-blue-500/4 hover:to-purple-500/2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/8">
              <div className="w-11 h-11 rounded-xl mb-5 bg-gradient-to-br from-blue-600/15 to-purple-600/15 border border-blue-500/12 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                <Lock className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">ð Encrypted Vault</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Military-grade AES-256 encryption. Your data is encrypted before it ever leaves your device. Only you hold the decryption keys.</p>
            </div>

            {/* Feature 2 */}
            <div className="group p-7 rounded-2xl border border-white/4 bg-gradient-to-b from-white/2 to-transparent hover:border-blue-500/20 hover:from-blue-500/4 hover:to-purple-500/2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/8">
              <div className="w-11 h-11 rounded-xl mb-5 bg-gradient-to-br from-blue-600/15 to-purple-600/15 border border-blue-500/12 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">ð Smart Beneficiaries</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Designate exactly who receives what. Assign specific vault items to specific people with granular access control.</p>
            </div>

            {/* Feature 3 */}
            <div className="group p-7 rounded-2xl border border-white/4 bg-gradient-to-b from-white/2 to-transparent hover:border-blue-500/20 hover:from-blue-500/4 hover:to-purple-500/2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/8">
              <div className="w-11 h-11 rounded-xl mb-5 bg-gradient-to-br from-blue-600/15 to-purple-600/15 border border-blue-500/12 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">â¡ Automated Triggers</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Set inactivity timers, manual triggers, or legal event conditions. Your legacy transfers exactly when and how you decide.</p>
            </div>

            {/* Feature 4 */}
            <div className="group p-7 rounded-2xl border border-white/4 bg-gradient-to-b from-white/2 to-transparent hover:border-blue-500/20 hover:from-blue-500/4 hover:to-purple-500/2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/8">
              <div className="w-11 h-11 rounded-xl mb-5 bg-gradient-to-br from-blue-600/15 to-purple-600/15 border border-blue-500/12 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">ð Legal Notarization</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Upload legal documents and verify them with AI-powered OCR scanning. Court-ready document management in one place.</p>
            </div>

            {/* Feature 5 */}
            <div className="group p-7 rounded-2xl border border-white/4 bg-gradient-to-b from-white/2 to-transparent hover:border-blue-500/20 hover:from-blue-500/4 hover:to-purple-500/2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/8">
              <div className="w-11 h-11 rounded-xl mb-5 bg-gradient-to-br from-blue-600/15 to-purple-600/15 border border-blue-500/12 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">ð AI Legacy Tools</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Write your memoir, record voice messages, and create a life timeline. Leave more than just passwords â leave your story.</p>
            </div>

            {/* Feature 6 */}
            <div className="group p-7 rounded-2xl border border-white/4 bg-gradient-to-b from-white/2 to-transparent hover:border-blue-500/20 hover:from-blue-500/4 hover:to-purple-500/2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/8">
              <div className="w-11 h-11 rounded-xl mb-5 bg-gradient-to-br from-blue-600/15 to-purple-600/15 border border-blue-500/12 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">ð Zero Knowledge</h3>
              <p className="text-sm text-slate-400 leading-relaxed">We mathematically cannot read your data. Encryption happens on your device. Your secrets are truly yours alone.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - HOW IT WORKS (id="how-it-works") */}
      <section id="how-it-works" className="bg-[#030508] py-28">
        <div className="max-w-5xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="text-xs font-semibold tracking-[0.2em] text-blue-400 uppercase mb-4">HOW IT WORKS</div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Set up in minutes. Protected for a lifetime.</h2>
          </div>

          {/* 3 steps in a row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="absolute top-7 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent hidden md:block"/>

            {/* Step 1 */}
            <div className="text-center relative">
              <div className="w-14 h-14 rounded-full mx-auto mb-6 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/10">
                1
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Create Your Vault</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Sign up in 60 seconds. Add your passwords, documents, and final messages to your encrypted vault.</p>
            </div>

            {/* Step 2 */}
            <div className="text-center relative">
              <div className="w-14 h-14 rounded-full mx-auto mb-6 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/10">
                2
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Designate Your Legacy</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Choose trusted beneficiaries. Assign each person exactly what they should receive. Set your transfer conditions.</p>
            </div>

            {/* Step 3 */}
            <div className="text-center relative">
              <div className="w-14 h-14 rounded-full mx-auto mb-6 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/10">
                3
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Peace of Mind Forever</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Your legacy is locked, protected, and ready. Your loved ones will receive everything exactly as you intended.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 - SOCIAL PROOF */}
      <section className="bg-[#070e1b] py-20">
        <div className="max-w-6xl mx-auto px-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-1">10,000+</div>
              <div className="text-sm text-slate-500">Families Protected</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-1">256-bit</div>
              <div className="text-sm text-slate-500">Encryption Standard</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-1">99.9%</div>
              <div className="text-sm text-slate-500">Platform Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-1">4.9â</div>
              <div className="text-sm text-slate-500">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 - PRICING (id="pricing") */}
      <section id="pricing" className="bg-[#030508] py-28">
        <div className="max-w-5xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="text-xs font-semibold tracking-[0.2em] text-blue-400 uppercase mb-4">PRICING</div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Choose Your Protection Plan</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Start free, upgrade as your needs grow</p>
          </div>

          {/* 3 pricing tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="bg-[#070e1b] border border-white/6 rounded-2xl p-8">
              <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Free</div>
              <div className="text-4xl font-bold text-white mb-2">$0</div>
              <div className="text-lg text-slate-500 font-normal mb-8">forever</div>
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">Up to 10 vault items</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">2 beneficiaries</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">Basic inactivity trigger</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">Email notifications</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">AES-256 encryption</span>
                </div>
              </div>
              <button className="w-full py-3 rounded-xl border border-white/15 text-white hover:bg-white/4 transition-colors">Get Started</button>
            </div>

            {/* Pro - Popular */}
            <div className="bg-gradient-to-b from-blue-600/10 to-purple-600/5 border-2 border-blue-500/40 rounded-2xl p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white text-xs font-semibold shadow-lg shadow-blue-500/30">
                Most Popular
              </div>
              <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Pro</div>
              <div className="text-4xl font-bold text-white mb-2">$9</div>
              <div className="text-lg text-slate-500 font-normal mb-8">/mo</div>
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">Unlimited vault items</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">Unlimited beneficiaries</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">Advanced trigger conditions</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">Legal document OCR (25/mo)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">Voice messages (10 min)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">AI memoir writing</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">Priority support</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">Activity logs</span>
                </div>
              </div>
              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all">Get Started</button>
            </div>

            {/* Enterprise */}
            <div className="bg-[#070e1b] border border-white/6 rounded-2xl p-8">
              <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Enterprise</div>
              <div className="text-4xl font-bold text-white mb-2">$29</div>
              <div className="text-lg text-slate-500 font-normal mb-8">/mo</div>
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">Everything in Pro</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">Unlimited OCR scans</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">Unlimited voice messages</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">Custom trigger logic</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">Dedicated account manager</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">SLA guarantee</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">Advanced audit logs</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">Custom branding</span>
                </div>
              </div>
              <button className="w-full py-3 rounded-xl border border-white/15 text-white hover:bg-white/4 transition-colors">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 - SECURITY (id="security") */}
      <section id="security" className="bg-[#070e1b] py-28">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Security you can trust. Privacy by design.</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">We built LastKey for people who need real security â not just a promise.</p>
          </div>

          {/* 2 column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Large security illustration */}
            <div className="flex justify-center">
              <div className="w-64 h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl border border-blue-500/15 flex items-center justify-center">
                <Shield className="w-32 h-32 text-blue-400" />
              </div>
            </div>

            {/* Right: Security features list */}
            <div>
              {/* Feature 1 */}
              <div className="flex items-start gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/15 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white mb-1">ð End-to-End Encryption</h4>
                  <p className="text-sm text-slate-400">Your data is encrypted with AES-256-GCM before upload. We store ciphertext only. Your key never leaves your device.</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/15 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white mb-1">ð Zero-Knowledge Architecture</h4>
                  <p className="text-sm text-slate-400">Mathematical proof that we cannot read your data. Even if we were subpoenaed, we have nothing to give.</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/15 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white mb-1">ð Client-Side Key Derivation</h4>
                  <p className="text-sm text-slate-400">Your master password derives your encryption key using PBKDF2. We never see your password or key.</p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-start gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/15 flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white mb-1">ð Regular Security Audits</h4>
                  <p className="text-sm text-slate-400">Third-party penetration testing and security audits conducted quarterly.</p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/15 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white mb-1">ð Complete Audit Logs</h4>
                  <p className="text-sm text-slate-400">Every access to your vault is logged with IP address, timestamp, and device info.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#030508] border-t border-white/4 py-16">
        <div className="max-w-6xl mx-auto px-6">
          {/* Logo + tagline */}
          <div className="text-center mb-12">
            <Logo size="lg" darkMode={true} className="mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Securing digital legacies since 2024</p>
          </div>

          {/* 4 column links */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/vault" className="text-slate-400 hover:text-white transition-colors text-sm">Vault</Link></li>
                <li><Link to="/beneficiaries" className="text-slate-400 hover:text-white transition-colors text-sm">Beneficiaries</Link></li>
                <li><Link to="/capsules" className="text-slate-400 hover:text-white transition-colors text-sm">Triggers</Link></li>
                <li><Link to="/legal-documents" className="text-slate-400 hover:text-white transition-colors text-sm">Notarization</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-slate-400 hover:text-white transition-colors text-sm">About</Link></li>
                <li><Link to="/blog" className="text-slate-400 hover:text-white transition-colors text-sm">Blog</Link></li>
                <li><Link to="/careers" className="text-slate-400 hover:text-white transition-colors text-sm">Careers</Link></li>
                <li><Link to="/press" className="text-slate-400 hover:text-white transition-colors text-sm">Press</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-slate-400 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-slate-400 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
                <li><Link to="/cookies" className="text-slate-400 hover:text-white transition-colors text-sm">Cookie Policy</Link></li>
                <li><Link to="/security" className="text-slate-400 hover:text-white transition-colors text-sm">Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link to="/help" className="text-slate-400 hover:text-white transition-colors text-sm">Help Center</Link></li>
                <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors text-sm">Contact</Link></li>
                <li><Link to="/status" className="text-slate-400 hover:text-white transition-colors text-sm">Status</Link></li>
                <li><Link to="/api" className="text-slate-400 hover:text-white transition-colors text-sm">API Docs</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="text-center text-slate-500 text-sm">
            <p>© 2024 LastKey Digital Legacy. All rights reserved.</p>
            <p className="mt-2">Built with â¤ï¸ for the ones you love.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
