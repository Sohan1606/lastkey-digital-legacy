import React, { useState } from 'react';
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
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

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
      setCurrentChapter(data.content || data.chapter || '');
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
      if (editingChapterId) {
        const { data } = await axios.put(`${API_BASE}/memoir/${editingChapterId}`, chapterData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return data.data;
      } else {
        const { data } = await axios.post(`${API_BASE}/memoir`, chapterData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return data.data;
      }
    },
    onSuccess: () => {
      setCurrentChapter('');
      setSelectedStage('childhood');
      setEditingChapterId(null);
      toast.success('Chapter saved!');
      queryClient.invalidateQueries(['memoirChapters']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save chapter');
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
      toast.error('Write something before saving');
      return;
    }
    
    const wordCount = currentChapter
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 0).length;
    
    const stageName = stages.find(s => s.id === selectedStage)?.name || 'Chapter';
    
    saveChapterMutation.mutate({
      title: `${stageName} Story`,
      content: currentChapter,
      wordCount
    });
  };

  const handleDownloadMemoir = async () => {
    if (!memoirData || memoirData.length === 0) {
      toast.error('No chapters to download');
      return;
    }
    try {
      const memoirContent = memoirData.map(chapter => 
        `=== ${chapter.title} ===\n\n${chapter.content}\n\n`
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
      const stageName = stages.find(s => s.id === selectedStage)?.name || 'New';
      const chapterNumber = (memoirData?.length || 0) + 1;
      
      const newChapter = {
        title: `${stageName} - Chapter ${chapterNumber}`,
        content: '',
        wordCount: 0
      };
      
      const { data } = await axios.post(
        `${API_BASE}/memoir`,
        newChapter,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await queryClient.invalidateQueries(['memoirChapters']);
      
      const created = data?.data;
      if (created) {
        setCurrentChapter(created.content || '');
        setEditingChapterId(created._id);
      }
      
      toast.success('New chapter created — start writing!');
    } catch (error) {
      console.error('Create chapter error:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to create chapter');
    }
  };

  const handleAiHelp = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsAiProcessing(true);
    
    try {
      const prompt = aiPrompt.toLowerCase();
      let result = currentChapter;
      
      if (prompt.includes('grammar') || prompt.includes('improve') || prompt.includes('fix')) {
        const { data } = await axios.post(
          `${API_BASE}/ai/improve-grammar`,
          { text: currentChapter },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (data?.data?.improved) {
          result = data.data.improved;
          toast.success('Grammar improved!');
        }
      } else if (prompt.includes('longer') || prompt.includes('expand') || prompt.includes('more detail')) {
        result = currentChapter + '\n\n[Continue writing here with more details...]';
        toast('Tip: Add more specific memories and feelings', { icon: '💡' });
      } else if (prompt.includes('shorter') || prompt.includes('summarize') || prompt.includes('brief')) {
        const sentences = currentChapter.split('.').filter(s => s.trim().length > 10);
        result = sentences.slice(0, Math.ceil(sentences.length / 2)).join('.') + '.';
        toast.success('Content shortened');
      } else if (prompt.includes('emotional') || prompt.includes('feeling') || prompt.includes('heart')) {
        result = currentChapter + '\n\nLooking back now, I realize how much these moments shaped who I became. The love and warmth I felt during these times remains with me always.';
        toast.success('Added emotional reflection');
      } else {
        toast('Try: "improve grammar", "make it longer", "make it emotional"', { icon: '💡', duration: 4000 });
        setIsAiProcessing(false);
        return;
      }
      
      setCurrentChapter(result);
      setAiPrompt('');
    } catch (error) {
      toast.error('AI assistance failed. Try again.');
    } finally {
      setIsAiProcessing(false);
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

          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            alignItems: 'center' 
          }}>
            {memoirData && memoirData.length > 0 && (
              <button
                onClick={handleDownloadMemoir}
                style={{
                  padding: '10px 16px',
                  background: 'rgba(0,229,160,0.08)',
                  border: '1px solid rgba(0,229,160,0.2)',
                  borderRadius: '10px',
                  color: '#00e5a0',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ⬇ Download
              </button>
            )}
            
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

              {/* Saved Chapters List */}
              {memoirData && memoirData.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <p style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '10px'
                  }}>
                    Saved Chapters ({memoirData.length})
                  </p>
                  
                  {memoirData.map((chapter, index) => (
                    <div
                      key={chapter._id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'rgba(79,158,255,0.04)',
                        border: '1px solid rgba(79,158,255,0.1)',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onClick={() => {
                        setCurrentChapter(chapter.content || '');
                        setEditingChapterId(chapter._id);
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(79,158,255,0.08)';
                        e.currentTarget.style.borderColor = 'rgba(79,158,255,0.25)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(79,158,255,0.04)';
                        e.currentTarget.style.borderColor = 'rgba(79,158,255,0.1)';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {chapter.title || `Chapter ${index + 1}`}
                          </p>
                          <p style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            margin: '3px 0 0 0'
                          }}>
                            {chapter.content
                              ? chapter.content.trim().split(/\s+/).filter(w => w.length > 0).length
                              : 0
                            } words
                            {chapter.updatedAt && ` · ${new Date(chapter.updatedAt).toLocaleDateString()}`}
                          </p>
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            if (window.confirm('Delete this chapter? Cannot be undone.')) {
                              deleteChapterMutation.mutate(chapter._id);
                            }
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '2px 4px',
                            flexShrink: 0,
                            opacity: 0.5,
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = '#ff4d6d';
                            e.currentTarget.style.opacity = '1';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = 'var(--text-muted)';
                            e.currentTarget.style.opacity = '0.5';
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state if no chapters */}
              {(!memoirData || memoirData.length === 0) && !isLoading && (
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  marginTop: '16px'
                }}>
                  <p style={{
                    fontSize: '28px',
                    opacity: 0.3,
                    marginBottom: '8px'
                  }}>📖</p>
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)'
                  }}>
                    No chapters saved yet.
                    Select a stage and write your story.
                  </p>
                </div>
              )}

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
                {isGenerating ? 'Generating...' : '✨ Generate with AI'}
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
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && aiPrompt.trim()) {
                        handleAiHelp();
                      }
                    }}
                    placeholder="e.g. Improve grammar, Make it more emotional..."
                    style={{
                      flex: 1,
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
                  <button
                    onClick={handleAiHelp}
                    disabled={!aiPrompt.trim() || isAiProcessing}
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(167,139,250,0.1)',
                      border: '1px solid rgba(167,139,250,0.3)',
                      borderRadius: '10px',
                      color: '#a78bfa',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: !aiPrompt.trim() || isAiProcessing
                        ? 'not-allowed' : 'pointer',
                      opacity: !aiPrompt.trim() || isAiProcessing
                        ? 0.6 : 1,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isAiProcessing ? '...' : '✨ Ask AI'}
                  </button>
                </div>
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
                  onClick={() => { 
                    setCurrentChapter(''); 
                    setSelectedStage('childhood');
                    setEditingChapterId(null);
                  }}
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
