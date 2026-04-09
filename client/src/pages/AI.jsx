import { useState } from 'react';
import { Copy, Bot, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const emotions = ['love', 'apology', 'gratitude', 'farewell', 'encouragement', 'memories'];
const recipients = ['family', 'friend', 'partner', 'child', 'parent', 'colleague'];
const tones = ['emotional', 'formal', 'casual', 'poetic', 'heartfelt'];

const emotionColors = {
  love: '#ff4d6d', apology: '#ffb830', gratitude: '#00e5a0', farewell: '#7c5cfc', encouragement: '#4f9eff', memories: '#ffb830'
};

const AI = () => {
  const { token } = useAuth();
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

    } catch {
      toast.error('Failed to generate message. Check your OpenAI key.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedMessage);
    toast.success('Copied to clipboard!');
  };

  const selectedEmotionColor = emotionColors[formData.emotion] || '#7c5cfc';

  return (
    <div className="page spatial-bg">
      <div className="stars" />
      <div className="container" style={{ padding: '32px 24px' }}>
              
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: `linear-gradient(135deg, ${selectedEmotionColor}30, var(--plasma))`, border: `1px solid ${selectedEmotionColor}40`, padding: '12px 24px', borderRadius: 20, marginBottom: 20 }}>
              <Bot style={{ width: 24, height: 24, color: selectedEmotionColor }} />
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>AI Legacy Message Generator</span>
            </div>
            <h1 className="display" style={{ fontSize: 32, marginBottom: 12 }}>Craft Perfect Farewell Messages</h1>
            <p style={{ fontSize: 15, color: 'var(--text-2)', maxWidth: 500, margin: '0 auto' }}>Let AI create heartfelt, personalized messages for your loved ones.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 24 }}>Generate Your Message</h2>
              
              <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label>Emotion</label>
                  <select value={formData.emotion} onChange={(e) => setFormData({...formData, emotion: e.target.value})}>
                    {emotions.map((emotion) => (
                      <option key={emotion} value={emotion}>{emotion.charAt(0).toUpperCase() + emotion.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Recipient</label>
                  <select value={formData.recipient} onChange={(e) => setFormData({...formData, recipient: e.target.value})}>
                    {recipients.map((recipient) => (
                      <option key={recipient} value={recipient}>{recipient.charAt(0).toUpperCase() + recipient.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Tone</label>
                  <select value={formData.tone} onChange={(e) => setFormData({...formData, tone: e.target.value})}>
                    {tones.map((tone) => (
                      <option key={tone} value={tone}>{tone.charAt(0).toUpperCase() + tone.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Additional Context (Optional)</label>
                  <textarea value={formData.context} onChange={(e) => setFormData({...formData, context: e.target.value})} rows={4} placeholder="Any specific memories or details to include..." style={{ resize: 'none' }} />
                </div>

                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  style={{ padding: '16px 24px', borderRadius: 14, border: 'none', background: loading ? 'var(--glass-2)' : `linear-gradient(135deg, ${selectedEmotionColor}, var(--plasma))`, color: 'white', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 }}>
                  {loading ? (
                    <><div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> Generating with AI...</>
                  ) : (
                    <><Bot style={{ width: 18, height: 18 }} /> Generate Legacy Message</>
                  )}
                </motion.button>
              </form>
            </motion.div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: 28, flex: 1 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <MessageSquare style={{ width: 20, height: 20, color: 'var(--ion)' }} />
                  AI Generated Message Preview
                </h3>
                {generatedMessage ? (
                  <div style={{ position: 'relative' }}>
                    <div style={{ background: 'var(--glass-2)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 20, maxHeight: 320, overflowY: 'auto' }}>
                      <div style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                        {typing && <span style={{ animation: 'blink 1s infinite' }}>|</span>}
                        {generatedMessage}
                      </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={copyToClipboard}
                      style={{ position: 'absolute', top: 12, right: 12, padding: '10px 16px', borderRadius: 12, border: 'none', background: 'var(--ion)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Copy style={{ width: 14, height: 14 }} /> Copy
                    </motion.button>
                  </div>
                ) : (
                  <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--glass-2)', borderRadius: 16 }}>
                    <MessageSquare style={{ width: 48, height: 48, color: 'var(--text-3)', margin: '0 auto 12px', opacity: 0.5 }} />
                    <p style={{ fontSize: 14, color: 'var(--text-2)' }}>Generate your first AI-powered legacy message</p>
                  </div>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                style={{ background: 'rgba(0,229,160,0.05)', border: '1px solid rgba(0,229,160,0.15)', borderRadius: 16, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles style={{ width: 20, height: 20, color: 'var(--pulse)' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>Powered by GPT-4o</h4>
                    <p style={{ fontSize: 12, color: 'var(--text-2)' }}>Private & secure message generation</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AI;
