import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mic, Play, Pause, Download, Sparkles, User, Clock, Volume2, Save, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';

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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [audioBlob, setAudioBlob] = useState(null);
  const timerRef = React.useRef(null);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatRecordingTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setAudioChunks([]);
        stream.getTracks().forEach(t => t.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.success('Recording started');
    } catch (error) {
      toast.error('Microphone access denied. Please allow microphone in browser settings.');
      console.error('Recording error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      toast.success('Recording stopped');
    }
  };

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
    deleteMessageMutation.mutate(id);
    setDeleteConfirm(null);
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
    <DashboardLayout>
      <div style={{
        padding: '32px',
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: '100vh',
        background: 'var(--bg-base)'
      }}>
        {/* PAGE HEADER */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(79,158,255,0.15), rgba(167,139,250,0.15))',
              border: '1px solid rgba(79,158,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0
            }}>
              🎙️
            </div>
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.01em'
              }}>
                Voice Messages
              </h1>
              <p style={{
                fontSize: '14px',
                color: 'var(--text-muted)',
                margin: '4px 0 0 0'
              }}>
                Record personal messages for your loved ones
              </p>
            </div>
          </div>
        </div>

        {/* PAGE CONTENT - Recording Interface */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Left Column - Recording Section (40%) */}
          <div style={{ minWidth: 0 }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '24px',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '20px'
              }}>
                Record New Message
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}>
                    Recipient
                  </label>
                  <input
                    type="text"
                    value={formData.recipient}
                    onChange={e => setFormData({ ...formData, recipient: e.target.value })}
                    placeholder="Who is this for?"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-hover)',
                      borderRadius: '10px',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Message subject"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-hover)',
                      borderRadius: '10px',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Recording Area */}
                <div style={{
                  padding: '40px 20px',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  textAlign: 'center'
                }}>
                  <div
                    onClick={isRecording ? stopRecording : startRecording}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: isRecording 
                        ? 'rgba(255,77,109,0.15)' 
                        : 'linear-gradient(135deg, #ff4d6d, #ff6b8a)',
                      border: isRecording 
                        ? '3px solid #ff4d6d'
                        : '3px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      margin: '0 auto 16px',
                      fontSize: '32px',
                      transition: 'all 0.2s ease',
                      boxShadow: isRecording
                        ? '0 0 0 12px rgba(255,77,109,0.1), 0 0 32px rgba(255,77,109,0.3)'
                        : '0 8px 24px rgba(255,77,109,0.4)',
                      animation: isRecording 
                        ? 'pulse 1.5s ease-in-out infinite' 
                        : 'none'
                    }}
                  >
                    {isRecording ? '⏹' : '🎙️'}
                  </div>
                  {isRecording && (
                    <p style={{
                      textAlign: 'center',
                      color: '#ff4d6d',
                      fontSize: '16px',
                      fontWeight: '600',
                      marginBottom: '8px'
                    }}>
                      ● Recording {formatRecordingTime(recordingTime)}
                    </p>
                  )}
                  {!isRecording && (
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--text-muted)',
                      marginTop: '16px'
                    }}>
                      Click to start recording
                    </p>
                  )}
                </div>

                {/* Preview Player */}
                {audioUrl && (
                  <div style={{
                    padding: '16px',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px'
                  }}>
                    <p style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      marginBottom: '12px'
                    }}>
                  Preview
                  </p>
                    <audio
                      id="voiceAudio"
                      controls
                      onEnded={() => setIsPlaying(false)}
                      style={{
                        width: '100%',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'var(--bg-base)'
                      }}
                    >
                      <source src={getAudioSrc(audioUrl)} type="audio/mpeg" />
                    </audio>
                  </div>
                )}

                <button
                  onClick={handleSaveMessage}
                  disabled={saveMessageMutation.isPending || !formData.title.trim() || !audioUrl}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: saveMessageMutation.isPending || !formData.title.trim() || !audioUrl
                      ? 'not-allowed'
                      : 'pointer',
                    opacity: saveMessageMutation.isPending || !formData.title.trim() || !audioUrl ? 0.5 : 1,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {saveMessageMutation.isPending ? 'Saving...' : 'Save Message'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Recordings List (60%) */}
          <div style={{ minWidth: 0 }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '24px'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '20px'
              }}>
                Your Recordings ({voiceMessages?.length || 0})
              </h2>

              {!voiceMessages || voiceMessages.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px'
                }}>
                  <div style={{ fontSize: '48px', opacity: 0.3, marginBottom: '16px' }}>🎙️</div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '8px'
                  }}>
                    No recordings yet
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--text-muted)',
                    marginBottom: '24px',
                    maxWidth: '320px',
                    margin: '0 auto 24px'
                  }}>
                    Record your first voice message to leave a personal touch for your loved ones
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {voiceMessages.map((message, index) => {
                    const emotion = emotions.find(e => e.id === message.emotion) || emotions[0];
                    return (
                      <div
                        key={message._id}
                        style={{
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border)',
                          borderRadius: '16px',
                          padding: '20px',
                          marginBottom: '12px',
                          transition: 'border-color 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <span style={{ fontSize: '24px' }}>🎙️</span>
                          <div style={{ flex: 1 }}>
                            <h3 style={{
                              fontSize: '15px',
                              fontWeight: '600',
                              color: 'var(--text-primary)',
                              marginBottom: '4px'
                            }}>
                              {message.title}
                            </h3>
                            <p style={{
                              fontSize: '13px',
                              color: 'var(--text-muted)'
                            }}>
                              {message.recipient || 'No recipient'}
                            </p>
                          </div>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: emotion.color,
                            background: `${emotion.color}15`,
                            padding: '4px 10px',
                            borderRadius: '8px'
                          }}>
                            {emotion.name}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <Clock style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }} />
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {new Date(message.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <audio
                          controls
                          style={{
                            width: '100%',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'var(--bg-base)',
                            marginBottom: '12px'
                          }}
                        >
                          <source src={getAudioSrc(message.audioUrl)} type="audio/mpeg" />
                        </audio>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => handleDownload(message)}
                            style={{
                              padding: '8px 16px',
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              color: 'var(--text-secondary)',
                              fontSize: '13px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Download style={{ width: '14px', height: '14px' }} /> Download
                          </button>
                          {deleteConfirm === message._id ? (
                            <>
                              <button
                                onClick={() => handleDeleteMessage(message._id)}
                                style={{
                                  padding: '8px 16px',
                                  background: 'rgba(255,77,109,0.1)',
                                  border: '1px solid rgba(255,77,109,0.3)',
                                  borderRadius: '8px',
                                  color: '#ff4d6d',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                style={{
                                  padding: '8px 16px',
                                  background: 'var(--bg-elevated)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '8px',
                                  color: 'var(--text-secondary)',
                                  fontSize: '13px',
                                  cursor: 'pointer'
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(message._id)}
                              style={{
                                padding: '8px 16px',
                                background: 'rgba(255,77,109,0.08)',
                                border: '1px solid rgba(255,77,109,0.2)',
                                borderRadius: '8px',
                                color: '#ff4d6d',
                                fontSize: '13px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <Trash2 style={{ width: '14px', height: '14px' }} /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VoiceMessages;
