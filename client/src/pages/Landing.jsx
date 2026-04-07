import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, Shield, Clock, Sparkles, Zap, Award, 
  Mic, Calendar, BookOpen, Trophy, Users,
  ArrowRight, CheckCircle, Star, MessageSquare, Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'

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

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-hidden">
      <Navbar />

      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -left-24 w-96 h-96 bg-purple-200/40 dark:bg-purple-900/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -45, 0],
            x: [0, -30, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 -right-24 w-80 h-80 bg-indigo-200/40 dark:bg-indigo-900/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, 40, 0],
            y: [0, -40, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-24 left-1/2 w-96 h-96 bg-emerald-100/40 dark:bg-emerald-900/10 rounded-full blur-3xl"
        />
      </div>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wide text-indigo-600 uppercase bg-indigo-50 rounded-full dark:bg-indigo-900/30 dark:text-indigo-400"
          >
            Trusted by 50,000+ users worldwide
          </motion.div>
          <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-900 dark:from-white dark:via-indigo-200 dark:to-purple-100 bg-clip-text text-transparent mb-8 leading-tight tracking-tight">
            Your love, outliving <br className="hidden md:block" />you.
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            LastKey is not a vault. It's a time machine of the heart. A place where your voice, your wisdom, and your love are preserved — to be discovered by the people you cherish most, at exactly the moment they need it.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <motion.button 
              onClick={handleGetStarted}
              whileHover={{ scale: 1.05, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300 flex items-center gap-2"
            >
              Get Started Now
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
            </motion.button>
            <motion.button 
              onClick={() => {
                const featuresSection = document.getElementById('features');
                featuresSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,1)" }}
              className="px-10 py-5 rounded-2xl font-bold text-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              How it works
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Trust Section */}
      <section className="py-20 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm font-bold uppercase tracking-[0.2em] text-slate-400 mb-12">
            Built with modern security standards
          </p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2 font-black text-2xl text-slate-400">
              <Shield className="w-8 h-8" />
              AES-256
            </div>
            <div className="flex items-center gap-2 font-black text-2xl text-slate-400">
              <Lock className="w-8 h-8" />
              TLS 1.3
            </div>
            <div className="flex items-center gap-2 font-black text-2xl text-slate-400">
              <Users className="w-8 h-8" />
              SOC 2
            </div>
            <div className="flex items-center gap-2 font-black text-2xl text-slate-400">
              <Zap className="w-8 h-8" />
              FAST-API
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-6 relative bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black mb-6 text-slate-900 dark:text-white"
            >
              Everything You Need to Preserve Your Love
            </motion.h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Powerful tools designed to give you peace of mind and your loved ones a connection that transcends time.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              {
                icon: Shield,
                title: "Guardian Protocol™",
                desc: "Advanced inactivity monitoring ensures your legacy is delivered exactly when needed, with multiple alert channels.",
                color: "indigo"
              },
              {
                icon: Clock,
                title: "Time Letters",
                desc: "Schedule heartfelt messages to be delivered at perfect moments—birthdays, weddings, or when they need your voice most.",
                color: "emerald"
              },
              {
                icon: MessageSquare,
                title: "AI Voice Messages",
                desc: "Transform your written words into warm, realistic voice messages that your loved ones can treasure forever.",
                color: "rose"
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                className="group p-10 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-500"
              >
                <div className={`w-16 h-16 bg-${feature.color}-100 dark:bg-${feature.color}-900/30 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                  <feature.icon className={`w-8 h-8 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[3rem] p-12 md:p-20 text-center text-white shadow-3xl relative overflow-hidden"
        >
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-8">Ready to make your love eternal?</h2>
            <p className="text-xl text-indigo-100 mb-12 max-w-2xl mx-auto">
              Join thousands who have chosen LastKey to ensure their voice and wisdom live on forever.
            </p>
            <motion.button 
              onClick={handleGetStarted}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-indigo-600 px-12 py-5 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all"
            >
              Begin Your Legacy
            </motion.button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-100 dark:border-slate-800 text-center text-slate-500 text-sm">
        <p>© 2026 LastKey Digital Legacy. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Landing
