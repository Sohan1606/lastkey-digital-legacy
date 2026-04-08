import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Bot, Heart, Users, MessageCircle, MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const emotions = ['love', 'apology', 'gratitude', 'farewell', 'encouragement', 'memories'];
const recipients = ['family', 'friend', 'partner', 'child', 'parent', 'colleague'];
const tones = ['emotional', 'formal', 'casual', 'poetic', 'heartfelt'];

const AI = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    emotion: 'love',
    recipient: 'family',
    tone: 'emotional',
    context: ''
  });
  const [loading, setLoading] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [typing, setTyping] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedMessage('');

    try {
      const response = await axios.post(`${API_BASE}/ai/generate-message`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Typing effect
      setTyping(true);
      const message = response.data.data.message;
      let i = 0;
      const typer = setInterval(() => {
        setGeneratedMessage(message.slice(0, i));
        i++;
        if (i > message.length) {
          clearInterval(typer);
          setTyping(false);
          toast.success('AI Legacy Message Generated!');
        }
      }, 30);

    } catch (error) {
      toast.error('Failed to generate message. Check your OpenAI key.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedMessage);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="page spatial-bg">
      <div className="stars" />
      <div className="container" style={{ padding: '32px 24px' }}>
        <Toaster position="top-right" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-8 py-4 rounded-3xl mb-8 shadow-2xl">
            <Bot className="w-8 h-8" />
            <span className="text-2xl font-bold">AI Legacy Message Generator</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 bg-clip-text text-transparent mb-6">
            Craft Perfect Farewell Messages
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Let AI create heartfelt, personalized messages for your loved ones. Choose emotion, recipient, and tone.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Form */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 border border-white/50 shadow-2xl"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Generate Your Message</h2>
            
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Emotion</label>
                <select 
                  value={formData.emotion}
                  onChange={(e) => setFormData({...formData, emotion: e.target.value})}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white"
                >
                  {emotions.map((emotion) => (
                    <option key={emotion} value={emotion}>
                      {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient</label>
                <select 
                  value={formData.recipient}
                  onChange={(e) => setFormData({...formData, recipient: e.target.value})}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white"
                >
                  {recipients.map((recipient) => (
                    <option key={recipient} value={recipient}>
                      {recipient.charAt(0).toUpperCase() + recipient.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tone</label>
                <select 
                  value={formData.tone}
                  onChange={(e) => setFormData({...formData, tone: e.target.value})}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white"
                >
                  {tones.map((tone) => (
                    <option key={tone} value={tone}>
                      {tone.charAt(0).toUpperCase() + tone.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Context (Optional)</label>
                <textarea 
                  value={formData.context}
                  onChange={(e) => setFormData({...formData, context: e.target.value})}
                  rows={4}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-vertical bg-white"
                  placeholder="Any specific memories or details to include..."
                />
              </div>

              <motion.button 
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-6 px-8 rounded-3xl font-bold text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Bot className="w-6 h-6" />
                    Generate Legacy Message
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Output */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-white/70 to-white/90 backdrop-blur-xl p-8 rounded-3xl border border-white/50 shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-4 text-slate-800 flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-indigo-600" />
                AI Generated Message Preview
              </h3>
              {generatedMessage ? (
                <div className="relative">
                  <div className="h-96 p-8 bg-white/70 rounded-2xl border border-white/50 backdrop-blur-sm shadow-xl overflow-y-auto prose max-w-none">
                    <div className="whitespace-pre-wrap text-lg leading-relaxed text-slate-800">
                      {typing ? (
                        <span className="animate-pulse">|</span>
                      ) : null}
                      {generatedMessage}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={copyToClipboard}
                    className="absolute top-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-2xl shadow-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <Copy className="w-5 h-5" />
                    Copy
                  </motion.button>
                </div>
              ) : (
                <div className="h-96 flex flex-col items-center justify-center text-slate-400">
                  <MessageSquare className="w-24 h-24 mb-4 opacity-30" />
                  <p className="text-lg text-center max-w-md">
                    Generate your first AI-powered legacy message
                  </p>
                </div>
              )}
            </motion.div>

            <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-200/50 p-6 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-800">Powered by GPT-4o</h4>
                  <p className="text-sm text-slate-600">Your messages are generated using the latest AI technology. Private & secure.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
      </div>
    </div>
  );
};

export default AI;

