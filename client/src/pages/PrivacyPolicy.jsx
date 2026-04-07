import { motion } from 'framer-motion';
import { Shield, Eye, Lock, Trash2, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your trust is our foundation. We're committed to protecting your digital legacy with transparency and security.
          </p>
          <p className="text-sm text-gray-500 mt-2">Last updated: April 6, 2026</p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-8"
        >
          {/* Introduction */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6 text-indigo-600" />
              Our Commitment to Your Privacy
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                LastKey is more than a service—it's a sacred trust. We understand that you're entrusting us with your most precious memories, final wishes, and digital legacy. This privacy policy outlines how we protect, use, and respect your data.
              </p>
              <p>
                We believe privacy is a fundamental right, especially when it comes to your digital afterlife. This policy is written in plain language because you deserve to know exactly how your data is handled.
              </p>
            </div>
          </section>

          {/* Data We Collect */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Account Information</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span>Name and email address</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span>Phone number (for alerts, optional)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span>Password (encrypted and salted)</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Legacy Content</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span>Time letters and messages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span>Digital asset instructions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span>Beneficiary information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span>Life timeline events</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Protect Your Data */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6 text-indigo-600" />
              How We Protect Your Data
            </h2>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                <h3 className="font-semibold text-gray-900 mb-3">🔐 Zero-Knowledge Vault Encryption</h3>
                <p className="text-gray-700">
                  Your Memory Vault passwords are encrypted <strong>client-side</strong> using AES-256 encryption before they ever leave your device. We cannot access, read, or reset your vault passwords. This is true zero-knowledge security.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Transport Security</h4>
                  <p className="text-sm text-gray-700">All data transmitted uses TLS 1.3 encryption</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Storage Security</h4>
                  <p className="text-sm text-gray-700">Database encryption at rest with regular security audits</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Access Controls</h4>
                  <p className="text-sm text-gray-700">Strict role-based access and authentication</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Regular Backups</h4>
                  <p className="text-sm text-gray-700">Encrypted backups with disaster recovery</p>
                </div>
              </div>
            </div>
          </section>

          {/* How We Use Your Data */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start gap-3">
                <span className="bg-indigo-100 text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">1</span>
                <div>
                  <h4 className="font-semibold">Service Operation</h4>
                  <p>To provide the LastKey service, store your legacy content, and execute your Guardian Protocol</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-indigo-100 text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">2</span>
                <div>
                  <h4 className="font-semibold">Communication</h4>
                  <p>To send account notifications, security alerts, and deliver your legacy to beneficiaries</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-indigo-100 text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">3</span>
                <div>
                  <h4 className="font-semibold">Service Improvement</h4>
                  <p>To analyze usage patterns and improve our service (anonymized data only)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-indigo-100 text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">4</span>
                <div>
                  <h4 className="font-semibold">Legal Compliance</h4>
                  <p>To comply with legal obligations and protect our users' rights</p>
                </div>
              </div>
            </div>
          </section>

          {/* Third-Party Services */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Services</h2>
            <p className="text-gray-700 mb-6">We use trusted third-party services to enhance your experience:</p>
            <div className="space-y-4">
              <div className="border-l-4 border-indigo-500 pl-4">
                <h4 className="font-semibold text-gray-900">OpenAI</h4>
                <p className="text-gray-700">For AI-powered message generation and memoir creation. Your content is processed securely and not used for training.</p>
              </div>
              <div className="border-l-4 border-indigo-500 pl-4">
                <h4 className="font-semibold text-gray-900">Stripe</h4>
                <p className="text-gray-700">For secure payment processing. We never store your credit card information.</p>
              </div>
              <div className="border-l-4 border-indigo-500 pl-4">
                <h4 className="font-semibold text-gray-900">Twilio</h4>
                <p className="text-gray-700">For WhatsApp alerts (optional). Your phone number is encrypted and only used for alerts you authorize.</p>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Trash2 className="w-6 h-6 text-indigo-600" />
              Your Data Rights
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Access & Portability</h4>
                <p className="text-gray-700">You can export all your data at any time from your dashboard.</p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Correction</h4>
                <p className="text-gray-700">Update your information anytime through your account settings.</p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Deletion</h4>
                <p className="text-gray-700">Request permanent deletion of your account and all associated data.</p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Consent Withdrawal</h4>
                <p className="text-gray-700">Change your mind about data collection at any time.</p>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Your legacy content is stored indefinitely unless you choose to delete it. Even after account deletion, we may retain certain information:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="list-disc">Legal compliance requirements</li>
                <li className="list-disc">Fraud prevention</li>
                <li className="list-disc">Security analysis</li>
                <li className="list-disc">Anonymized service improvement data</li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Mail className="w-6 h-6" />
              Questions About Your Privacy?
            </h2>
            <p className="mb-6 text-indigo-100">
              We're here to answer any questions about how we protect your data. Your privacy is not just policy—it's our promise.
            </p>
            <div className="space-y-2">
              <p><strong>Email:</strong> privacy@lastkey.com</p>
              <p><strong>Response Time:</strong> Within 48 hours</p>
              <p><strong>Data Requests:</strong> We'll respond within 30 days as required by GDPR</p>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center py-8 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              This privacy policy is part of our commitment to transparency and trust. 
              By using LastKey, you agree to the practices described here.
            </p>
            <div className="mt-4 space-x-4">
              <Link to="/terms" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                Terms of Service
              </Link>
              <span className="text-gray-400">•</span>
              <Link to="/" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                Back to Home
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
