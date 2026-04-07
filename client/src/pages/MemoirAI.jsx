import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Sparkles, Heart, Clock, ChevronRight, User, Download, Save, Plus } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const MemoirAI = () => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedStage, setSelectedStage] = useState('childhood');
  const [currentChapter, setCurrentChapter] = useState('');
  const [savedChapters, setSavedChapters] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const stages = [
    {
      id: 'childhood',
      name: 'Childhood',
      description: 'Early memories, family moments, and formative experiences',
      icon: '🧸',
      color: 'blue'
    },
    {
      id: 'teenage',
      name: 'Teenage Years', 
      description: 'Adolescence, friendships, first loves, and self-discovery',
      icon: '🎭',
      color: 'purple'
    },
    {
      id: 'early_adulthood',
      name: 'Early Adulthood',
      description: 'Career beginnings, independence, major life decisions',
      icon: '🎓',
      color: 'green'
    },
    {
      id: 'midlife',
      name: 'Midlife Reflections',
      description: 'Wisdom gained, family life, career achievements',
      icon: '🏆',
      color: 'orange'
    },
    {
      id: 'wisdom',
      name: 'Life Wisdom',
      description: 'Core values, lessons learned, legacy messages',
      icon: '🦉',
      color: 'indigo'
    }
  ];

  // Fetch saved memoir chapters
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

  // Generate memoir chapter mutation
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
      toast.success('Memoir chapter generated successfully!');
    },
    onError: (error) => {
      console.error('Memoir generation error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate memoir chapter');
      setIsGenerating(false);
    }
  });

  // Save chapter mutation
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
      toast.success('Memoir chapter saved successfully!');
      queryClient.invalidateQueries(['memoirChapters']);
    },
    onError: (error) => {
      console.error('Save memoir error:', error);
      toast.error('Failed to save memoir chapter');
    }
  });

  const handleGenerateChapter = () => {
    if (!selectedStage) {
      toast.error('Please select a life stage to generate');
      return;
    }
    setIsGenerating(true);
    generateChapterMutation.mutate(selectedStage);
  };

  const handleSaveChapter = () => {
    if (!currentChapter.trim()) {
      toast.error('Please generate a chapter before saving');
      return;
    }

    saveChapterMutation.mutate({
      stage: selectedStage,
      chapter: currentChapter,
      title: `${stages.find(s => s.id === selectedStage)?.name} Chapter`
    });
  };

  const handleDownloadMemoir = async () => {
    try {
      const memoirContent = savedChapters.map(chapter => 
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
      
      toast.success('Memoir downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download memoir');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 pt-20 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Memoir AI
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Let AI guide you through creating your life story. Answer thoughtful questions and watch as your memories transform into beautiful memoir chapters.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Stage Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Heart className="w-6 h-6 text-indigo-600" />
              Life Stages
            </h2>
            
            <div className="space-y-4">
              {stages.map((stage, index) => (
                <motion.button
                  key={stage.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedStage(stage.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedStage === stage.id 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent' 
                      : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl mb-1">{stage.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-900">{stage.name}</div>
                      <div className="text-sm text-gray-500">{stage.description}</div>
                    </div>
                  </div>
                  {selectedStage === stage.id && (
                    <ChevronRight className="w-5 h-5 ml-auto" />
                  )}
                </motion.button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateChapter}
              disabled={!selectedStage || isGenerating}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating Chapter...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate {stages.find(s => s.id === selectedStage)?.name} Chapter</span>
                </>
              )}
            </motion.button>
          </motion.div>

          {/* Chapter Generation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              {currentChapter ? 'Your Generated Chapter' : 'AI Generation'}
            </h2>

            {currentChapter ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    {stages.find(s => s.id === selectedStage)?.name} Chapter
                  </h3>
                  
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {currentChapter}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
                    <Clock className="w-4 h-4" />
                    <span>{currentChapter.split(' ').length} words</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveChapter}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Chapter
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setCurrentChapter('');
                      setSelectedStage('childhood');
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold transition-colors"
                  >
                    Generate Another
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-4">
                  Select a life stage to begin your memoir journey
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Each chapter will be crafted with care, focusing on the unique memories and wisdom from that period of your life.
                </p>
              </div>
            )}
          </motion.div>

          {/* Saved Chapters */}
          {savedChapters && savedChapters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                  Your Memoir ({savedChapters.length} chapters)
                </h2>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownloadMemoir}
                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Complete Memoir
                </motion.button>
              </div>

              <div className="space-y-4">
                {savedChapters.map((chapter, index) => (
                  <motion.div
                    key={chapter._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-4 border border-indigo-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900">{chapter.title}</h3>
                      <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                        {chapter.stage}
                      </span>
                    </div>

                    <div className="text-gray-700 leading-relaxed line-clamp-3">
                      {chapter.chapter.substring(0, 200)}...
                    </div>
                    
                    <div className="text-sm text-gray-500 mt-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {new Date(chapter.createdAt).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {!isLoading && (!savedChapters || savedChapters.length === 0) && !currentChapter && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 max-w-2xl mx-auto"
            >
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Your Memoir Awaits</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Every life has a story worth telling. Let AI help you craft your memoir into beautiful chapters that will be treasured for generations.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedStage('childhood')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
              >
                <Plus className="w-5 h-5" />
                Begin Your Memoir
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoirAI;
