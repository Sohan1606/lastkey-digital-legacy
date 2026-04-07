import { motion } from 'framer-motion';
import { FileText, Shield, Heart, AlertTriangle, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
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
            <FileText className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            The legal foundation for protecting your digital legacy and ensuring your wishes are honored.
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
          {/* Agreement */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                By accessing and using LastKey ("the Service"), you agree to be bound by these Terms of Service ("Terms"). 
                If you disagree with any part of these terms, then you may not access the Service.
              </p>
              <p>
                LastKey is a digital legacy platform designed to help you preserve memories, protect digital assets, 
                and communicate with loved ones after you're gone. This is a sacred responsibility we take seriously.
              </p>
            </div>
          </section>

          {/* Service Description */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="w-6 h-6 text-indigo-600" />
              2. Service Description
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                LastKey provides a comprehensive digital afterlife platform including:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="list-disc">Time-locked message delivery ("Time Letters")</li>
                <li className="list-disc">Guardian Protocol (inactivity monitoring)</li>
                <li className="list-disc">Memory Vault for digital asset instructions</li>
                <li className="list-disc">Life Timeline and memory preservation</li>
                <li className="list-disc">AI-powered message generation</li>
                <li className="list-disc">Voice message creation and storage</li>
              </ul>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
                <p className="text-amber-800 text-sm">
                  <strong>Important:</strong> LastKey is a planning tool, not a legal service. 
                  For estate planning, please consult with qualified legal professionals.
                </p>
              </div>
            </div>
          </section>

          {/* User Responsibilities */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Responsibilities</h2>
            <div className="space-y-4 text-gray-700">
              <h3 className="font-semibold text-gray-900">You agree to:</h3>
              <ul className="space-y-2 ml-6">
                <li className="list-disc">Provide accurate, current, and complete information</li>
                <li className="list-disc">Maintain the security of your account credentials</li>
                <li className="list-disc">Update beneficiary information regularly</li>
                <li className="list-disc">Test your Guardian Protocol settings periodically</li>
                <li className="list-disc">Ensure consent from beneficiaries before adding them</li>
                <li className="list-disc">Not use the service for illegal or harmful purposes</li>
              </ul>
              
              <h3 className="font-semibold text-gray-900 mt-6">You acknowledge that:</h3>
              <ul className="space-y-2 ml-6">
                <li className="list-disc">You are solely responsible for the content you store</li>
                <li className="list-disc">Beneficiary contact information must be accurate</li>
                <li className="list-disc">Regular account activity is essential for Guardian Protocol</li>
                <li className="list-disc">Digital asset instructions should be kept current</li>
              </ul>
            </div>
          </section>

          {/* Guardian Protocol */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-600" />
              4. Guardian Protocol (Digital Legacy Activation)
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                The Guardian Protocol is our core feature that monitors your account activity and activates your legacy 
                distribution when triggered by prolonged inactivity.
              </p>
              
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                <h4 className="font-semibold text-gray-900 mb-3">Protocol Activation</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Warning phase after your configured inactivity period</li>
                  <li>• Final activation after double the inactivity period</li>
                  <li>• Email and optional WhatsApp alerts to beneficiaries</li>
                  <li>• Release of Time Letters and asset instructions</li>
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-800 text-sm">
                  <strong>Critical:</strong> Once the Guardian Protocol is activated, certain actions cannot be undone. 
                  Please maintain regular account activity and keep your information current.
                </p>
              </div>
            </div>
          </section>

          {/* Payment Terms */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Subscription & Payment Terms</h2>
            <div className="space-y-4 text-gray-700">
              <h3 className="font-semibold text-gray-900">Subscription Tiers</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold">Free</h4>
                  <ul className="text-sm space-y-1 mt-2">
                    <li>• 2 Loved Ones</li>
                    <li>• 3 Time Letters</li>
                    <li>• 5 Memory Items</li>
                  </ul>
                </div>
                <div className="bg-indigo-50 rounded-xl p-4">
                  <h4 className="font-semibold">Guardian ($4.99/mo)</h4>
                  <ul className="text-sm space-y-1 mt-2">
                    <li>• 5 Loved Ones</li>
                    <li>• 20 Time Letters</li>
                    <li>• 50 Memory Items</li>
                    <li>• WhatsApp Alerts</li>
                  </ul>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <h4 className="font-semibold">Legacy Pro ($12.99/mo)</h4>
                  <ul className="text-sm space-y-1 mt-2">
                    <li>• Unlimited Everything</li>
                    <li>• AI Voice Messages</li>
                    <li>• Memoir AI</li>
                    <li>• Life Timeline</li>
                  </ul>
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 mt-6">Billing Terms</h3>
              <ul className="space-y-2 ml-6">
                <li className="list-disc">Subscriptions renew automatically unless canceled</li>
                <li className="list-disc">Cancel anytime—access continues until period end</li>
                <li className="list-disc">30-day money-back guarantee for new subscribers</li>
                <li className="list-disc">Prices may change with 30-day notice</li>
                <li className="list-disc">All payments processed securely through Stripe</li>
              </ul>
            </div>
          </section>

          {/* Content & Intellectual Property */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Content & Intellectual Property</h2>
            <div className="space-y-4 text-gray-700">
              <h3 className="font-semibold text-gray-900">Your Content</h3>
              <p>
                You retain full ownership and rights to all content you create and store on LastKey, including:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="list-disc">Time Letters and messages</li>
                <li className="list-disc">Voice recordings</li>
                <li className="list-disc">Life timeline events</li>
                <li className="list-disc">Digital asset instructions</li>
                <li className="list-disc">AI-generated memoirs</li>
              </ul>
              
              <h3 className="font-semibold text-gray-900 mt-6">Our License</h3>
              <p>
                You grant LastKey a limited, worldwide license to store, process, and deliver your content 
                solely for the purpose of providing the Service. We never sell or license your content to third parties.
              </p>
            </div>
          </section>

          {/* Limitations & Disclaimers */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-indigo-600" />
              7. Limitations & Disclaimers
            </h2>
            <div className="space-y-4 text-gray-700">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h4 className="font-semibold text-red-900 mb-2">Service Limitations</h4>
                <p className="text-red-800 text-sm">
                  LastKey cannot guarantee delivery of your legacy in all circumstances, including but not limited to:
                </p>
                <ul className="space-y-1 mt-2 ml-4 text-sm text-red-800">
                  <li>• Extended internet outages</li>
                  <li>• Company closure or bankruptcy</li>
                  <li>• Force majeure events</li>
                  <li>• Illegal or harmful content requests</li>
                  <li>• Inaccurate beneficiary information</li>
                </ul>
              </div>
              
              <h3 className="font-semibold text-gray-900 mt-6">No Legal Advice</h3>
              <p>
                LastKey is not a legal service and does not provide legal, financial, or estate planning advice. 
                Consult qualified professionals for legal and financial planning.
              </p>
              
              <h3 className="font-semibold text-gray-900 mt-6">Service Availability</h3>
              <p>
                We strive for 99.9% uptime but cannot guarantee uninterrupted service. 
                Regular maintenance may cause temporary disruptions.
              </p>
            </div>
          </section>

          {/* Termination */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Account Termination</h2>
            <div className="space-y-4 text-gray-700">
              <h3 className="font-semibold text-gray-900">By You</h3>
              <p>
                You may terminate your account at any time. Upon termination:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="list-disc">You can export all your data before deletion</li>
                <li className="list-disc">Account will be deleted within 30 days</li>
                <li className="list-disc">Subscription benefits end immediately</li>
                <li className="list-disc">No refunds for partial subscription periods</li>
              </ul>
              
              <h3 className="font-semibold text-gray-900 mt-6">By LastKey</h3>
              <p>
                We may terminate accounts for violations of these Terms, including:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="list-disc">Illegal or harmful use of the service</li>
                <li className="list-disc">Fraudulent activity</li>
                <li className="list-disc">Violation of privacy or rights of others</li>
                <li className="list-disc">Extended non-payment</li>
              </ul>
            </div>
          </section>

          {/* Privacy */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Privacy</h2>
            <p className="text-gray-700">
              Your privacy is fundamental to our service. Our use of your data is governed by our 
              <Link to="/privacy" className="text-indigo-600 hover:text-indigo-700 font-medium ml-1">
                Privacy Policy
              </Link>, 
              which explains how we collect, use, and protect your information.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Questions About These Terms?
            </h2>
            <p className="mb-6 text-indigo-100">
              We believe in transparency and are happy to explain any aspect of these terms.
            </p>
            <div className="space-y-2">
              <p><strong>Email:</strong> legal@lastkey.com</p>
              <p><strong>Response Time:</strong> Within 48 hours</p>
              <p><strong>Disputes:</strong> We'll work in good faith to resolve any issues</p>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center py-8 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              These Terms of Service create a legal agreement between you and LastKey Digital Legacy, Inc. 
              By using our service, you acknowledge that you have read, understood, and agree to be bound by these terms.
            </p>
            <div className="mt-4 space-x-4">
              <Link to="/privacy" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                Privacy Policy
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

export default TermsOfService;
