import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mic, Play, Pause, Download, Sparkles, User, Clock, Volume2 } from 'lucide-react';
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
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const getAudioSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${base}${url}`;
  };

  // Fetch existing voice messages
  const { data: voiceMessages, isLoading } = useQuery({
    queryKey: ['voiceMessages'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/voice-messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    },
    enabled: !!user && !!token
  });

  // Generate voice message mutation
  const generateVoiceMutation = useMutation({
    mutationFn: async (voiceData) => {
      const { data } = await axios.post(`${API_BASE}/ai/generate-voice`, voiceData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    },
    onSuccess: (data) => {
      setAudioUrl(data.audioUrl);
      toast.success('Voice message generated successfully!');
      queryClient.invalidateQueries(['voiceMessages']);
    },
    onError: (error) => {
      console.error('Voice generation error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate voice message');
    }
  });

  // Save voice message mutation
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
      toast.success('Voice message saved successfully!');
      queryClient.invalidateQueries(['voiceMessages']);
    },
    onError: (error) => {
      console.error('Save voice message error:', error);
      toast.error('Failed to save voice message');
    }
  });

  const handleGenerateVoice = () => {
    if (!formData.text.trim()) {
      toast.error('Please enter text to convert to voice');
      return;
    }

    generateVoiceMutation.mutate({
      text: formData.text,
      voice: formData.voice,
      emotion: formData.emotion
    });
  };

  const handleSaveMessage = () => {
    if (!formData.title.trim() || !audioUrl) {
      toast.error('Please generate a voice message and add a title before saving');
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
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play();
        setIsPlaying(true);
      }
    }
  };

  const handleDownload = async (message) => {
    try {
      const link = document.createElement('a');
      link.href = message.audioUrl;
      link.download = `${message.title}-voice-message.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Voice message downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download voice message');
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    // Start browser recording logic here
    toast('Recording started (browser mic access required)');
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Stop browser recording logic here
    toast('Recording stopped');
  };

  // Simulate recording timer
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const voices = [
    { id: 'alloy', name: 'Alloy', description: 'Natural, balanced voice' },
    { id: 'echo', name: 'Echo', description: 'Warm, friendly voice' },
    { id: 'fable', name: 'Fable', description: 'Expressive, storytelling voice' },
    { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative voice' },
    { id: 'nova', name: 'Nova', description: 'Bright, energetic voice' },
    { id: 'shimmer', name: 'Shimmer', description: 'Soft, gentle voice' }
  ];

  const emotions = [
    { id: 'warm', name: 'Warm', description: 'Loving and caring' },
    { id: 'professional', name: 'Professional', description: 'Clear and respectful' },
    { id: 'playful', name: 'Playful', description: 'Light and cheerful' },
    { id: 'nostalgic', name: 'Nostalgic', description: 'Sentimental and reflective' },
    { id: 'inspirational', name: 'Inspirational', description: 'Uplifting and encouraging' }
  ];

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
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Voice Messages
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform your written words into warm, realistic voice messages that your loved ones can treasure forever.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Voice Generator */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              Create Voice Message
            </h2>

            <div className="space-y-6">
              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message
                </label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Type your message here... Make it personal and heartfelt."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-32 resize-none"
                  maxLength={500}
                />
                <div className="text-sm text-gray-500 mt-1">
                  {formData.text.length}/500 characters
                </div>
              </div>

              {/* Voice Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voice Style
                  </label>
                  <select
                    value={formData.voice}
                    onChange={(e) => setFormData({ ...formData, voice: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {voices.map(voice => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name} - {voice.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emotion
                  </label>
                  <select
                    value={formData.emotion}
                    onChange={(e) => setFormData({ ...formData, emotion: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {emotions.map(emotion => (
                      <option key={emotion.id} value={emotion.id}>
                        {emotion.name} - {emotion.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient (Optional)
                </label>
                <input
                  type="text"
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                  placeholder="Who is this message for?"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Generate Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerateVoice}
                disabled={generateVoiceMutation.isPending || !formData.text.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generateVoiceMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating Voice...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Voice Message</span>
                  </>
                )}
              </motion.button>

              {/* Audio Preview */}
              {audioUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200"
                >
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-purple-600" />
                    Voice Preview
                  </h3>
                  <audio id="voiceAudio" className="w-full mb-4" controls>
                    <source src={getAudioSrc(audioUrl)} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handlePlayPause}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      {isPlaying ? 'Pause' : 'Play'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDownload({ audioUrl, title: formData.text.substring(0, 30) + '...' })}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Save Message */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-6 h-6 text-purple-600" />
              Save Voice Message
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Give your voice message a title..."
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveMessage}
                disabled={saveMessageMutation.isPending || !formData.title.trim() || !audioUrl}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saveMessageMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Message...</span>
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5" />
                    <span>Save Voice Message</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Saved Messages */}
        {voiceMessages && voiceMessages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-purple-600" />
              Your Voice Messages ({voiceMessages.length})
            </h2>

            <div className="space-y-4">
              {voiceMessages.map((message, index) => (
                <motion.div
                  key={message._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl p-4 border border-purple-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-900">{message.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                        {message.voice}
                      </span>
                      <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded">
                        {message.emotion}
                      </span>
                    </div>
                  </div>

                  <audio className="w-full mb-3" controls>
                    <source src={getAudioSrc(message.audioUrl)} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div>
                      <span>To: {message.recipient || 'Unspecified'}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(message.createdAt).toLocaleDateString()}</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDownload(message)}
                      className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg font-medium transition-colors flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VoiceMessages;
