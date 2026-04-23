import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Sparkles, Heart, Clock, ChevronRight, User, Download, Save, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const MemoirAI = () => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
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

  const handleCreateChapter = async () => {
    try {
      const newChapter = {
        title: `Chapter ${(memoirData?.length || 0) + 1}`,
        chapter: '',
        stage: selectedStage,
        wordCount: 0
      };
      
      const { data } = await axios.post(
        `${API_BASE}/memoir`,
        newChapter,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      queryClient.invalidateQueries(['memoirChapters']);
      
      if (data?.data?._id) {
        setCurrentChapter('');
        setSelectedStage('childhood');
      }
      
      toast.success('New chapter created');
    } catch (error) {
      toast.error('Failed to create chapter');
      console.error('Create chapter error:', error.message);
    }
  };

  const selectedStageData = stages.find(s => s.id === selectedStage) || stages[0];

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
              ✍️
            </div>
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.01em'
              }}>
                Memoir AI
              </h1>
              <p style={{
                fontSize: '14px',
                color: 'var(--text-muted)',
                margin: '4px 0 0 0'
              }}>
                Tell your life story with AI assistance
              </p>
            </div>
          </div>

          <button
            onClick={handleCreateChapter}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            ✍️ New Chapter
          </button>
        </div>

        {/* PAGE CONTENT - Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Left Column - Chapters List (35%) */}
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
                Your Story
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {stages.map((stage) => {
                  const isActive = selectedStage === stage.id;
                  const stageChapters = memoirData?.filter(c => c.stage === stage.id) || [];
                  return (
                    <div
                      key={stage.id}
                      onClick={() => setSelectedStage(stage.id)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '12px',
                        background: isActive 
                          ? 'rgba(79,158,255,0.08)'
                          : 'transparent',
                        border: isActive
                          ? '1px solid rgba(79,158,255,0.2)'
                          : '1px solid transparent',
                        cursor: 'pointer',
                        marginBottom: '4px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <p style={{
                        fontSize: '14px',
                        fontWeight: isActive ? '600' : '400',
                        color: isActive 
                          ? 'var(--blue)'
                          : 'var(--text-secondary)',
                        margin: 0
                      }}>
                        {stage.name}
                      </p>
                      <p style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        margin: '2px 0 0 0'
                      }}>
                        {stageChapters.length} chapter{stageChapters.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleGenerateChapter}
                disabled={isGenerating}
                style={{
                  width: '100%',
                  marginTop: '20px',
                  padding: '12px 20px',
                  background: isGenerating
                    ? 'var(--bg-elevated)'
                    : 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  opacity: isGenerating ? 0.5 : 1
                }}
              >
                {isGenerating ? 'Generating...' : '✍️ New Chapter'}
              </button>
            </div>
          </div>

          {/* Right Column - Editor (65%) */}
          <div style={{ minWidth: 0 }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '24px'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}>
                  Chapter Title
                </label>
                <input
                  type="text"
                  value={selectedStageData.name}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-hover)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    fontWeight: '600',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}>
                  Chapter Content
                </label>
                <textarea
                  value={currentChapter}
                  onChange={(e) => setCurrentChapter(e.target.value)}
                  placeholder="Write your story here..."
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-hover)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    lineHeight: '1.6',
                    minHeight: '400px'
                  }}
                />
                <p style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginTop: '8px',
                  textAlign: 'right'
                }}>
                  {currentChapter.split(' ').length} words
                </p>
              </div>

              {/* AI Prompt Section */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}>
                  Ask AI to help
                </label>
                <input
                  type="text"
                  placeholder="Ask for suggestions, improvements..."
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

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleSaveChapter}
                  disabled={saveChapterMutation.isPending || !currentChapter.trim()}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: saveChapterMutation.isPending || !currentChapter.trim()
                      ? 'not-allowed'
                      : 'pointer',
                    opacity: saveChapterMutation.isPending || !currentChapter.trim() ? 0.5 : 1,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {saveChapterMutation.isPending ? 'Saving...' : 'Save Chapter'}
                </button>
                <button
                  onClick={() => { setCurrentChapter(''); setSelectedStage('childhood'); }}
                  style={{
                    padding: '12px 20px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MemoirAI;
