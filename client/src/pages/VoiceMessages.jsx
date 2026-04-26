import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mic, Play, Pause, Download, Sparkles, User, Clock, Volume2, Save, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const VoiceMessages = () => {
  const { user, token } = useAuth();
  
  const [title, setTitle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState([]);
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [audioBlob, setAudioBlob] = useState(null);

  const loadMessages = async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE}/voice-messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const list = data?.data || [];
      setMessages(Array.isArray(list) ? list : []);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  useEffect(() => {
    if (token) loadMessages();
  }, [token]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg';

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
        toast.success('Recording complete! Add a title and save.');
      };

      recorder.onerror = () => {
        toast.error('Recording failed');
        setIsRecording(false);
      };

      // Start the MediaRecorder
      recorder.start(100);
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioBlob(null);
      setAudioUrl(null);

      toast.success('Recording started');

    } catch (error) {
      if (error.name === 'NotAllowedError') {
        toast.error(
          'Microphone permission denied. ' +
          'Click the camera icon in address bar ' +
          'to allow microphone access.'
        );
      } else {
        toast.error('Could not start: ' + error.message);
      }
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorder || !isRecording) return;
    
    // Stop recorder
    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    
    // Note: onstop handler creates the blob and URL
    // Do NOT create blob here
  };

  const saveRecording = async () => {
    if (!audioBlob || !title.trim()) {
      toast.error('Please add a title before saving');
      return;
    }
    
    setSaving(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        try {
          const base64Audio = reader.result;
          
          const { data } = await axios.post(
            `${API_BASE}/voice-messages`,
            {
              title: title.trim(),
              recipientName: recipientName.trim(),
              audioData: base64Audio,
              mimeType: audioBlob.type || 'audio/webm',
              transcript: ''
            },
            { 
              headers: { 
                Authorization: `Bearer ${token}` 
              } 
            }
          );
          
          toast.success('Voice message saved!');
          
          setAudioBlob(null);
          setAudioUrl(null);
          setTitle('');
          setRecipientName('');
          
          await loadMessages();
          
        } catch (saveError) {
          toast.error('Failed to save voice message');
        } finally {
          setSaving(false);
        }
      };
      
      reader.onerror = () => {
        toast.error('Failed to process audio');
        setSaving(false);
      };
      
    } catch (error) {
      toast.error('Failed to save voice message');
      setSaving(false);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Delete this voice message?')) return;
    try {
      await axios.delete(
        `${API_BASE}/voice-messages/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Voice message deleted');
      await loadMessages();
    } catch (error) {
      toast.error('Failed to delete');
    }
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
      link.href = message.audioData || message.audioUrl;
      link.download = `${message.title || 'voice-message'}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    } catch {
      toast.error('Failed to download');
    }
  };

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
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Message title (e.g. For my daughter)"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-hover)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    marginBottom: '12px',
                    fontFamily: 'inherit'
                  }}
                />

                <input
                  type="text"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  placeholder="For who? (e.g. My Wife, My Son)"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-hover)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    marginBottom: '20px',
                    fontFamily: 'inherit'
                  }}
                />

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
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      marginTop: '16px',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#ff4d6d',
                        flexShrink: 0,
                        animation: 'pulse 1s ease-in-out infinite'
                      }} />
                      <span style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#ff4d6d'
                      }}>
                        Recording in progress...
                      </span>
                    </div>
                  )}
                  {!isRecording && !audioUrl && (
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                      marginTop: '12px'
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
                      <source src={audioUrl} type="audio/webm" />
                    </audio>
                  </div>
                )}

                {audioUrl && !isRecording && (
                  <button
                    onClick={saveRecording}
                    disabled={saving || !title.trim()}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: saving || !title.trim()
                        ? 'rgba(79,158,255,0.3)'
                        : 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: saving || !title.trim() 
                        ? 'not-allowed' 
                        : 'pointer',
                      marginTop: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {saving ? 'Saving...' : '💾 Save Voice Message'}
                  </button>
                )}
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
                Your Recordings ({messages?.length || 0})
              </h2>

              {!messages || messages.length === 0 ? (
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
                  {messages.map(msg => (
                    <div key={msg._id} style={{
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border)',
                      borderRadius: '14px',
                      padding: '16px',
                      marginBottom: '10px'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '10px'
                      }}>
                        <div>
                          <p style={{
                            fontSize: '15px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            margin: 0
                          }}>
                            {msg.title}
                          </p>
                          {msg.recipientName && (
                            <p style={{
                              fontSize: '12px',
                              color: 'var(--text-muted)',
                              margin: '4px 0 0 0'
                            }}>
                              For: {msg.recipientName}
                            </p>
                          )}
                          <p style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            margin: '4px 0 0 0'
                          }}>
                            {new Date(msg.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '4px'
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ff4d6d'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          🗑
                        </button>
                      </div>
                      
                      {msg.audioData && (
                        <audio
                          controls
                          src={msg.audioData}
                          style={{
                            width: '100%',
                            height: '36px',
                            borderRadius: '8px'
                          }}
                        />
                      )}
                    </div>
                  ))}
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
