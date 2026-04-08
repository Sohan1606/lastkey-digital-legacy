import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mic, Play, Pause, Download, Sparkles, User, Clock, Volume2, Save, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const VoiceMessages = () => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    text: '',
    voice: 'alloy',
    emotion: 'warm',
    recipient: '',
    title: ''
  });
  
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const getAudioSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${base}${url}`;
  };

  const { data: voiceMessages } = useQuery({
    queryKey: ['voiceMessages'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/voice-messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    },
    enabled: !!user && !!token
  });

  const generateVoiceMutation = useMutation({
    mutationFn: async (voiceData) => {
      const { data } = await axios.post(`${API_BASE}/ai/generate-voice`, voiceData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    },
    onSuccess: (data) => {
      setAudioUrl(data.audioUrl);
      toast.success('Voice message generated!');
      queryClient.invalidateQueries(['voiceMessages']);
    },
    onError: () => {
      toast.error('Failed to generate voice message');
    }
  });

  const saveMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const { data } = await axios.post(`${API_BASE}/voice-messages`, messageData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    },
    onSuccess: () => {
      setFormData({ text: '', voice: 'alloy', emotion: 'warm', recipient: '', title: '' });
      setAudioUrl('');
      toast.success('Voice message saved!');
      queryClient.invalidateQueries(['voiceMessages']);
    },
    onError: () => {
      toast.error('Failed to save voice message');
    }
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_BASE}/voice-messages/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      toast.success('Message deleted');
      queryClient.invalidateQueries(['voiceMessages']);
    },
    onError: () => {
      toast.error('Failed to delete message');
    }
  });

  const handleGenerateVoice = () => {
    if (!formData.text.trim()) {
      toast.error('Please enter text to convert');
      return;
    }
    generateVoiceMutation.mutate({ text: formData.text, voice: formData.voice, emotion: formData.emotion });
  };

  const handleSaveMessage = () => {
    if (!formData.title.trim() || !audioUrl) {
      toast.error('Generate a voice message and add a title first');
      return;
    }
    saveMessageMutation.mutate({
      title: formData.title,
      recipient: formData.recipient,
      text: formData.text,
      voice: formData.voice,
      emotion: formData.emotion,
      audioUrl: audioUrl
    });
  };

  const handlePlayPause = () => {
    const audio = document.getElementById('voiceAudio');
    if (audio) {
      if (isPlaying) { audio.pause(); setIsPlaying(false); }
      else { audio.play(); setIsPlaying(true); }
    }
  };

  const handleDownload = async (message) => {
    try {
      const link = document.createElement('a');
      link.href = getAudioSrc(message.audioUrl);
      link.download = `${message.title || 'voice-message'}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    } catch {
      toast.error('Failed to download');
    }
  };

  const handleDeleteMessage = (id) => {
    if (window.confirm('Delete this voice message?')) {
      deleteMessageMutation.mutate(id);
    }
  };

  const voices = [
    { id: 'alloy', name: 'Alloy', description: 'Natural, balanced' },
    { id: 'echo', name: 'Echo', description: 'Warm, friendly' },
    { id: 'fable', name: 'Fable', description: 'Expressive, storytelling' },
    { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative' },
    { id: 'nova', name: 'Nova', description: 'Bright, energetic' },
    { id: 'shimmer', name: 'Shimmer', description: 'Soft, gentle' }
  ];

  const emotions = [
    { id: 'warm', name: 'Warm', description: 'Loving and caring', color: '#ff4d6d' },
    { id: 'professional', name: 'Professional', description: 'Clear and respectful', color: '#4f9eff' },
    { id: 'playful', name: 'Playful', description: 'Light and cheerful', color: '#ffb830' },
    { id: 'nostalgic', name: 'Nostalgic', description: 'Sentimental', color: '#7c5cfc' },
    { id: 'inspirational', name: 'Inspirational', description: 'Uplifting', color: '#00e5a0' }
  ];

  const selectedEmotion = emotions.find(e => e.id === formData.emotion) || emotions[0];

  return (
    <div className="page spatial-bg">
      <div className="stars" />
      <div className="container">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, rgba(124,92,252,0.3), rgba(255,77,109,0.3))', border: '1px solid rgba(124,92,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mic style={{ width: 22, height: 22, color: 'var(--plasma)' }} />
            </div>
            <div>
              <h1 className="display" style={{ fontSize: 28 }}>Voice Messages</h1>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>AI-narrated farewell messages for your loved ones</p>
            </div>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginTop: 28 }}>
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
            style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Sparkles style={{ width: 18, height: 18, color: 'var(--plasma)' }} />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Create Message</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label>Your Message</label>
                <textarea value={formData.text} onChange={e => setFormData({ ...formData, text: e.target.value })} placeholder="Write something heartfelt..." style={{ height: 100, resize: 'none' }} maxLength={500} />
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, textAlign: 'right' }}>{formData.text.length}/500</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label>Voice Style</label>
                  <select value={formData.voice} onChange={e => setFormData({ ...formData, voice: e.target.value })}>
                    {voices.map(v => <option key={v.id} value={v.id}>{v.name} - {v.description}</option>)}
                  </select>
                </div>
                <div>
                  <label>Emotion</label>
                  <select value={formData.emotion} onChange={e => setFormData({ ...formData, emotion: e.target.value })}>
                    {emotions.map(e => <option key={e.id} value={e.id}>{e.name} - {e.description}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label>Recipient (Optional)</label>
                <input type="text" value={formData.recipient} onChange={e => setFormData({ ...formData, recipient: e.target.value })} placeholder="Who is this for?" />
              </div>

              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} onClick={handleGenerateVoice}
                disabled={generateVoiceMutation.isPending || !formData.text.trim()}
                style={{ padding: '14px 20px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${selectedEmotion.color}, var(--plasma))`, color: 'white', fontWeight: 700, fontSize: 14, cursor: generateVoiceMutation.isPending || !formData.text.trim() ? 'not-allowed' : 'pointer', opacity: generateVoiceMutation.isPending || !formData.text.trim() ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {generateVoiceMutation.isPending ? (
                  <><div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> Generating...</>
                ) : (
                  <><Sparkles style={{ width: 16, height: 16 }} /> Generate Voice</>
                )}
              </motion.button>

              {audioUrl && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 8, padding: 16, background: 'rgba(0,229,160,0.04)', border: '1px solid rgba(0,229,160,0.15)', borderRadius: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Volume2 style={{ width: 16, height: 16, color: 'var(--pulse)' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--pulse)' }}>Voice Preview</span>
                  </div>
                  <audio id="voiceAudio" style={{ width: '100%', height: 36 }} controls onEnded={() => setIsPlaying(false)}>
                    <source src={getAudioSrc(audioUrl)} type="audio/mpeg" />
                  </audio>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handlePlayPause}
                      style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(0,229,160,0.2)', background: 'rgba(0,229,160,0.08)', color: 'var(--pulse)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {isPlaying ? <Pause style={{ width: 14, height: 14 }} /> : <Play style={{ width: 14, height: 14 }} />}
                      {isPlaying ? 'Pause' : 'Play'}
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleDownload({ audioUrl, title: formData.text.substring(0, 30) })}
                      style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--glass-1)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Download style={{ width: 14, height: 14 }} /> Download
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <User style={{ width: 18, height: 18, color: 'var(--ion)' }} />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Save Message</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label>Message Title</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Give your message a title..." />
              </div>

              {!audioUrl && (
                <div style={{ padding: 24, textAlign: 'center', background: 'var(--glass-2)', borderRadius: 14, border: '1px dashed var(--glass-border)' }}>
                  <Sparkles style={{ width: 32, height: 32, color: 'var(--text-3)', margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Generate a voice message first</p>
                </div>
              )}

              {audioUrl && (
                <div style={{ padding: 16, background: 'rgba(79,158,255,0.04)', border: '1px solid rgba(79,158,255,0.15)', borderRadius: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--pulse)', boxShadow: '0 0 8px var(--pulse)' }} />
                    <span style={{ fontSize: 12, color: 'var(--pulse)', fontWeight: 600 }}>Ready to save</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-2)' }}>{formData.recipient ? `For: ${formData.recipient}` : 'No recipient specified'}</p>
                </div>
              )}

              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} onClick={handleSaveMessage}
                disabled={saveMessageMutation.isPending || !formData.title.trim() || !audioUrl}
                style={{ padding: '14px 20px', borderRadius: 12, border: 'none', background: saveMessageMutation.isPending || !formData.title.trim() || !audioUrl ? 'var(--glass-2)' : 'linear-gradient(135deg, #4f9eff, #00e5a0)', color: saveMessageMutation.isPending || !formData.title.trim() || !audioUrl ? 'var(--text-3)' : '#001a12', fontWeight: 700, fontSize: 14, cursor: saveMessageMutation.isPending || !formData.title.trim() || !audioUrl ? 'not-allowed' : 'pointer', opacity: saveMessageMutation.isPending || !formData.title.trim() || !audioUrl ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {saveMessageMutation.isPending ? (
                  <><div className="spinner spinner-sm" style={{ borderTopColor: 'currentColor' }} /> Saving...</>
                ) : (
                  <><Save style={{ width: 16, height: 16 }} /> Save Voice Message</>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {voiceMessages && voiceMessages.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Clock style={{ width: 18, height: 18, color: 'var(--text-2)' }} />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Your Messages ({voiceMessages.length})</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {voiceMessages.map((message, index) => {
                const emotion = emotions.find(e => e.id === message.emotion) || emotions[0];
                return (
                  <motion.div key={message._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                    style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{message.title}</h3>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-2)', background: 'var(--glass-2)', padding: '2px 8px', borderRadius: 6 }}>{message.voice}</span>
                          <span style={{ fontSize: 11, color: emotion.color, background: `${emotion.color}15`, border: `1px solid ${emotion.color}25`, padding: '2px 8px', borderRadius: 6 }}>{emotion.name}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {new Date(message.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <audio style={{ width: '100%', height: 36, marginBottom: 12 }} controls>
                      <source src={getAudioSrc(message.audioUrl)} type="audio/mpeg" />
                    </audio>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>To: {message.recipient || 'Unspecified'}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleDownload(message)}
                          style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(79,158,255,0.2)', background: 'rgba(79,158,255,0.08)', color: 'var(--ion)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Download style={{ width: 13, height: 13 }} /> Download
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleDeleteMessage(message._id)}
                          style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(255,77,109,0.2)', background: 'rgba(255,77,109,0.08)', color: 'var(--danger)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Trash2 style={{ width: 13, height: 13 }} /> Delete
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VoiceMessages;
