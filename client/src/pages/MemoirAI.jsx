import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Sparkles, Heart, Clock, ChevronRight, User, Download, Save, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const MemoirAI = () => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedStage, setSelectedStage] = useState('childhood');
  const [currentChapter, setCurrentChapter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const stages = [
    { id: 'childhood', name: 'Childhood', description: 'Early memories and formative experiences', icon: '🧸', color: '#4f9eff' },
    { id: 'teenage', name: 'Teenage Years', description: 'Adolescence and self-discovery', icon: '🎭', color: '#7c5cfc' },
    { id: 'early_adulthood', name: 'Early Adulthood', description: 'Career beginnings and independence', icon: '🎓', color: '#00e5a0' },
    { id: 'midlife', name: 'Midlife Reflections', description: 'Wisdom gained and achievements', icon: '🏆', color: '#ffb830' },
    { id: 'wisdom', name: 'Life Wisdom', description: 'Core values and legacy messages', icon: '🦉', color: '#ff4d6d' }
  ];

  const { data: memoirData, isLoading } = useQuery({
    queryKey: ['memoirChapters'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/memoir`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    },
    enabled: !!user && !!token
  });

  const deleteChapterMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_BASE}/memoir/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      toast.success('Chapter deleted');
      queryClient.invalidateQueries(['memoirChapters']);
    },
    onError: () => {
      toast.error('Failed to delete chapter');
    }
  });

  const generateChapterMutation = useMutation({
    mutationFn: async (stage) => {
      const { data } = await axios.post(`${API_BASE}/ai/generate-memoir`, {
        stage,
        prompts: [
          `Tell me about your ${stage} experiences`,
          `What are your most important memories from this time?`,
          `What lessons did you learn?`
        ],
        existingChapters: memoirData || []
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    },
    onSuccess: (data) => {
      setCurrentChapter(data.chapter);
      setIsGenerating(false);
      toast.success('Chapter generated!');
    },
    onError: () => {
      toast.error('Failed to generate chapter');
      setIsGenerating(false);
    }
  });

  const saveChapterMutation = useMutation({
    mutationFn: async (chapterData) => {
      const { data } = await axios.post(`${API_BASE}/memoir`, chapterData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    },
    onSuccess: () => {
      setCurrentChapter('');
      setSelectedStage('childhood');
      toast.success('Chapter saved!');
      queryClient.invalidateQueries(['memoirChapters']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to save chapter');
    }
  });

  const handleGenerateChapter = () => {
    if (!selectedStage) {
      toast.error('Please select a life stage');
      return;
    }
    setIsGenerating(true);
    generateChapterMutation.mutate(selectedStage);
  };

  const handleSaveChapter = () => {
    if (!currentChapter.trim()) {
      toast.error('Generate a chapter first');
      return;
    }
    saveChapterMutation.mutate({
      stage: selectedStage,
      chapter: currentChapter,
      title: `${stages.find(s => s.id === selectedStage)?.name} Chapter`
    });
  };

  const handleDownloadMemoir = async () => {
    if (!memoirData || memoirData.length === 0) {
      toast.error('No chapters to download');
      return;
    }
    try {
      const memoirContent = memoirData.map(chapter => 
        `=== ${chapter.title} ===\n\n${chapter.chapter}\n\n`
      ).join('\n');

      const blob = new Blob([memoirContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'my-memoir.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Memoir downloaded!');
    } catch {
      toast.error('Failed to download memoir');
    }
  };

  const selectedStageData = stages.find(s => s.id === selectedStage) || stages[0];

  return (
    <div className="page spatial-bg">
      <div className="stars" />
      <div className="container">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, rgba(79,92,252,0.3), rgba(124,92,252,0.3))', border: '1px solid rgba(124,92,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen style={{ width: 22, height: 22, color: 'var(--plasma)' }} />
            </div>
            <div>
              <h1 className="display" style={{ fontSize: 28 }}>Memoir AI</h1>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>Craft your life story into beautiful chapters</p>
            </div>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginTop: 28 }}>
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
            style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Heart style={{ width: 18, height: 18, color: 'var(--plasma)' }} />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Life Stages</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stages.map((stage) => (
                <motion.button key={stage.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedStage(stage.id)}
                  style={{ padding: '14px 16px', borderRadius: 12, border: selectedStage === stage.id ? `1px solid ${stage.color}` : '1px solid var(--glass-border)', background: selectedStage === stage.id ? `${stage.color}10` : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{stage.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>{stage.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{stage.description}</div>
                  </div>
                  {selectedStage === stage.id && <ChevronRight style={{ width: 16, height: 16, color: stage.color }} />}
                </motion.button>
              ))}
            </div>

            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} onClick={handleGenerateChapter}
              disabled={isGenerating}
              style={{ width: '100%', marginTop: 20, padding: '14px 20px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${selectedStageData.color}, var(--plasma))`, color: 'white', fontWeight: 700, fontSize: 14, cursor: isGenerating ? 'not-allowed' : 'pointer', opacity: isGenerating ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {isGenerating ? (
                <><div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> Generating...</>
              ) : (
                <><Sparkles style={{ width: 16, height: 16 }} /> Generate Chapter</>
              )}
            </motion.button>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <BookOpen style={{ width: 18, height: 18, color: 'var(--ion)' }} />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>AI Generation</h2>
            </div>

            {currentChapter ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ padding: 16, background: `${selectedStageData.color}08`, border: `1px solid ${selectedStageData.color}20`, borderRadius: 14 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: selectedStageData.color, marginBottom: 12 }}>{selectedStageData.name} Chapter</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, maxHeight: 280, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{currentChapter}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-3)', marginTop: 12 }}>
                    <Clock style={{ width: 12, height: 12 }} />
                    {currentChapter.split(' ').length} words
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSaveChapter}
                    style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: 'none', background: 'var(--pulse)', color: '#001a12', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Save style={{ width: 14, height: 14 }} /> Save
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => { setCurrentChapter(''); setSelectedStage('childhood'); }}
                    style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--glass-1)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Regenerate
                  </motion.button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <User style={{ width: 48, height: 48, color: 'var(--text-3)', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>Select a life stage</h3>
                <p style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 280, margin: '0 auto' }}>Choose a chapter above to begin crafting your memoir</p>
              </div>
            )}
          </motion.div>
        </div>

        {memoirData && memoirData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BookOpen style={{ width: 18, height: 18, color: 'var(--text-2)' }} />
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Your Memoir ({memoirData.length} chapters)</h2>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleDownloadMemoir}
                style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(79,158,255,0.2)', background: 'rgba(79,158,255,0.08)', color: 'var(--ion)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Download style={{ width: 14, height: 14 }} /> Download All
              </motion.button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {memoirData.map((chapter, index) => {
                const stageInfo = stages.find(s => s.id === chapter.stage) || stages[0];
                return (
                  <motion.div key={chapter._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                    style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{chapter.title}</h3>
                        <span style={{ fontSize: 11, color: stageInfo.color, background: `${stageInfo.color}15`, border: `1px solid ${stageInfo.color}25`, padding: '2px 8px', borderRadius: 6 }}>{stageInfo.icon} {stageInfo.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{new Date(chapter.createdAt).toLocaleDateString()}</span>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { if (window.confirm('Delete this chapter?')) deleteChapterMutation.mutate(chapter._id); }}
                          style={{ padding: 6, borderRadius: 8, border: '1px solid rgba(255,77,109,0.2)', background: 'rgba(255,77,109,0.08)', color: 'var(--danger)', cursor: 'pointer' }}>
                          <Trash2 style={{ width: 13, height: 13 }} />
                        </motion.button>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{chapter.chapter.substring(0, 200)}...</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {!isLoading && (!memoirData || memoirData.length === 0) && !currentChapter && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '60px 20px', marginTop: 40, background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 24 }}>
            <BookOpen style={{ width: 48, height: 48, color: 'var(--text-3)', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>Your Memoir Awaits</h3>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>Every life has a story worth telling. Let AI help you craft your memoir.</p>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setSelectedStage('childhood')}
              style={{ padding: '14px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Plus style={{ width: 16, height: 16 }} /> Begin Your Journey
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MemoirAI;
