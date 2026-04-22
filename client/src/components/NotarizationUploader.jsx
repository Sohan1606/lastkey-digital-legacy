import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Camera, Scan } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const NotarizationUploader = ({ onDocumentProcessed }) => {
  const [uploading, setUploading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, JPEG, PNG, or TIFF file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setOcrResult(null);

    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await axios.post(`${API_BASE}/legal-documents/ocr-scan`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 30000 // 30 second timeout
      });

      const result = response.data;
      setOcrResult(result);
      
      if (result.success) {
        toast.success('Document scanned successfully!');
        if (onDocumentProcessed) {
          onDocumentProcessed(result.data);
        }
      } else {
        toast.error(result.message || 'OCR scan failed');
      }
    } catch (error) {
      console.error('OCR scan error:', error);
      if (error.code === 'ECONNABORTED') {
        toast.error('Scan timed out. Please try again.');
      } else if (error.response?.status === 413) {
        toast.error('File too large. Please upload a smaller file.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to scan document');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ 
        border: `2px dashed ${dragActive ? '#4f9eff' : 'var(--glass-border)'}`, 
        borderRadius: 16, 
        padding: '32px', 
        textAlign: 'center',
        background: dragActive ? 'rgba(79,158,255,0.05)' : 'var(--glass-2)',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.tiff"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <Loader2 size={48} style={{ color: '#4f9eff', animation: 'spin 1s linear infinite' }} />
            <div>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
                Scanning Document...
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
                Using OCR to extract text and verify notarization
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 80, 
              height: 80, 
              borderRadius: 20, 
              background: 'linear-gradient(135deg, rgba(79,158,255,0.1), rgba(0,229,160,0.1))', 
              border: '1px solid rgba(79,158,255,0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Scan size={36} style={{ color: '#4f9eff' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>
                Document Scanner & OCR
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>
                Upload notarized documents for automatic text extraction and verification.<br />
                Supports PDF, JPEG, PNG, and TIFF formats.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #4f9eff, #00e5a0)',
                color: '#001a12',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Camera size={16} />
              Select Document to Scan
            </motion.button>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
              or drag and drop file here
            </p>
          </div>
        )}
      </div>

      {/* OCR Results */}
      {ocrResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            marginTop: 24, 
            padding: 20, 
            background: 'var(--glass-1)', 
            backdropFilter: 'blur(20px)', 
            border: '1px solid var(--glass-border)', 
            borderRadius: 16 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            {ocrResult.success ? (
              <CheckCircle size={24} style={{ color: '#00e5a0' }} />
            ) : (
              <AlertCircle size={24} style={{ color: '#ff4d6d' }} />
            )}
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>
              Scan Results
            </h4>
          </div>

          {ocrResult.success && ocrResult.data ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>EXTRACTED TEXT</p>
                <div style={{ 
                  padding: 12, 
                  background: 'var(--glass-2)', 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: 8, 
                  fontSize: 13, 
                  color: 'var(--text-1)', 
                  lineHeight: 1.5,
                  maxHeight: 200,
                  overflowY: 'auto'
                }}>
                  {ocrResult.data.extractedText || 'No text extracted'}
                </div>
              </div>

              {ocrResult.data.confidence && (
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>CONFIDENCE SCORE</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ 
                      flex: 1, 
                      height: 8, 
                      background: 'var(--glass-2)', 
                      borderRadius: 4, 
                      overflow: 'hidden' 
                    }}>
                      <div style={{ 
                        width: `${ocrResult.data.confidence}%`, 
                        height: '100%', 
                        background: ocrResult.data.confidence > 80 ? '#00e5a0' : 
                                  ocrResult.data.confidence > 60 ? '#ffb830' : '#ff4d6d',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>
                      {ocrResult.data.confidence}%
                    </span>
                  </div>
                </div>
              )}

              {ocrResult.data.notaryDetected && (
                <div style={{ 
                  padding: 12, 
                  background: 'rgba(0,229,160,0.1)', 
                  border: '1px solid rgba(0,229,160,0.3)', 
                  borderRadius: 8 
                }}>
                  <p style={{ fontSize: 13, color: '#00e5a0', fontWeight: 600 }}>
                    Notary seal/signature detected
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              padding: 12, 
              background: 'rgba(255,77,109,0.1)', 
              border: '1px solid rgba(255,77,109,0.3)', 
              borderRadius: 8 
            }}>
              <p style={{ fontSize: 13, color: '#ff4d6d' }}>
                {ocrResult.message || 'Failed to process document'}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default NotarizationUploader;
