import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, ArrowLeft, Upload, Cloud, Trash2, 
  CheckCircle, AlertCircle, Loader2, Eye, EyeOff, Search, Filter, 
  FileCheck, FileWarning, FileX, Shield, Zap, Clock, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const LegalDocuments = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedScanResults, setExpandedScanResults] = useState(new Set());

  // Fetch documents
  const { data: documents = [], isPending: isLoading } = useQuery({
    queryKey: ['legal-documents'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/legal-documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data || [];
    },
    enabled: !!token,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('document', file);
      
      const response = await axios.post(`${API_BASE}/legal-documents`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        timeout: 60000
      });
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['legal-documents']);
      toast.success('Document uploaded successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to upload document');
    }
  });

  // Scan mutation
  const scanMutation = useMutation({
    mutationFn: async (documentId) => {
      const response = await axios.post(`${API_BASE}/legal-documents/${documentId}/scan`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000
      });
      return response.data;
    },
    onSuccess: (data, documentId) => {
      queryClient.invalidateQueries(['legal-documents']);
      toast.success('OCR scan completed!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to scan document');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (documentId) => axios.delete(`${API_BASE}/legal-documents/${documentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['legal-documents']);
      toast.success('Document deleted');
      setDeleteConfirm(null);
    },
    onError: () => {
      toast.error('Failed to delete document');
    }
  });

  // Drag handlers
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

  // File upload handler
  const handleFileUpload = async (file) => {
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
    try {
      await uploadMutation.mutateAsync(file);
    } finally {
      setUploading(false);
    }
  };

  // File select handler
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Scan document
  const handleScan = (documentId) => {
    scanMutation.mutate(documentId);
  };

  // Delete document
  const handleDelete = (documentId) => {
    deleteMutation.mutate(documentId);
  };

  // Toggle scan results
  const toggleScanResults = (documentId) => {
    const newExpanded = new Set(expandedScanResults);
    if (newExpanded.has(documentId)) {
      newExpanded.delete(documentId);
    } else {
      newExpanded.add(documentId);
    }
    setExpandedScanResults(newExpanded);
  };

  // Get file icon
  const getFileIcon = (mimeType) => {
    if (mimeType === 'application/pdf') {
      return <FileText size={24} style={{ color: '#dc2626' }} />;
    }
    return <FileText size={24} style={{ color: '#3b5bdb' }} />;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', text: 'Pending Review' },
      PROCESSING: { color: '#3b5bdb', bg: 'rgba(59, 91, 219, 0.1)', text: 'Scanning...' },
      VERIFIED: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', text: 'Verified' },
      REJECTED: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', text: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
        status === 'PENDING' ? 'bg-slate-500/20 text-slate-400 border border-slate-500/20' :
        status === 'PROCESSING' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20 animate-pulse' :
        status === 'VERIFIED' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
        'bg-red-500/20 text-red-400 border border-red-500/20'
      }`}>
        {status === 'PROCESSING' && <Loader2 size={10} className="inline animate-spin mr-1" />}
        {status === 'VERIFIED' && <CheckCircle size={10} className="inline mr-1" />}
        {status === 'REJECTED' && <AlertCircle size={10} className="inline mr-1" />}
        {config.text}
      </span>
    );
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div style={{
          minHeight: '100vh',
          background: 'var(--bg-base)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid rgba(255,255,255,0.1)',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Loading documents...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        padding: '32px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Page Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Link 
              to="/dashboard" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-muted)',
                marginBottom: '32px',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 150ms'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#64748b';
              }}
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
            
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                borderRadius: '20px',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                background: 'rgba(59, 130, 246, 0.08)',
                color: '#60a5fa',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '24px'
              }}>
                <span style={{
                  position: 'relative',
                  display: 'flex',
                  height: '8px',
                  width: '8px'
                }}>
                  <span style={{
                    position: 'absolute',
                    display: 'inline-flex',
                    height: '100%',
                    width: '100%',
                    borderRadius: '50%',
                    background: '#60a5fa',
                    opacity: 0.75,
                    animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite'
                  }}/>
                  <span style={{
                    position: 'relative',
                    display: 'inline-flex',
                    borderRadius: '50%',
                    height: '8px',
                    width: '8px',
                    background: '#60a5fa'
                  }}/>
                </span>
                AI-Powered OCR Notarization
              </div>
              
              <h1 style={{
                fontSize: '48px',
                fontWeight: 700,
                background: 'linear-gradient(to bottom right, #ffffff, #e2e8f0, #94a3b8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '16px'
              }}>
                Legal Document Vault
              </h1>
              <p style={{
                color: 'var(--text-muted)',
                fontSize: '18px',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                Upload, scan, and notarize your legal documents with advanced AI-powered OCR technology
              </p>
            </div>
          </motion.div>

          {/* Search and Filter Bar */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#64748b'
              }} />
              <input 
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 150ms'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Search documents..." 
              />
            </div>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: '#050d1a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 150ms'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#ffffff';
              e.target.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#64748b';
              e.target.style.borderColor = 'rgba(255,255,255,0.1)';
            }}
            >
              <Filter size={16} />
              Filter
            </button>
          </div>

          {/* Upload Zone */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            style={{ marginBottom: '48px' }}
          >
            <div 
              style={{
                border: '2px dashed',
                borderColor: dragActive ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.3)',
                borderRadius: '16px',
                padding: '48px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 200ms',
                background: dragActive ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.02)'
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={(e) => {
                if (!dragActive) {
                  e.target.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                  e.target.style.background = 'rgba(59, 130, 246, 0.03)';
                }
              }}
              onMouseLeave={(e) => {
                if (!dragActive) {
                  e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  e.target.style.background = 'rgba(59, 130, 246, 0.02)';
                }
              }}
            >
              <input
                id="document-upload"
                name="document-upload"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.tiff"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              
              {uploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid rgba(255,255,255,0.1)',
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <div>
                    <p style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}>
                      Uploading document...
                    </p>
                    <p style={{ fontSize: '14px', color: '#64748b' }}>
                      Please wait while we process your file
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 24px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
                    border: '1px solid rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 200ms'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                  }}
                  >
                    <Upload style={{ width: '40px', height: '40px', color: '#3b82f6' }} />
                  </div>
                  
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '12px'
                  }}>
                    Upload Legal Document
                  </h3>
                  <p style={{
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                    marginBottom: '16px'
                  }}>
                    Drag & drop your document here or click to browse
                  </p>
                  
                  {/* OCR Feature Badge */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#60a5fa',
                    fontSize: '12px',
                    fontWeight: 500,
                    marginBottom: '16px'
                  }}>
                    <Eye style={{ width: '12px', height: '12px' }} />
                    AI OCR Scanning Enabled
                  </div>
                  
                  <p style={{ color: '#475569', fontSize: '12px' }}>
                    PDF, JPG, PNG, TIFF supported · Max 10MB
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Documents List */}
          {documents.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.2 }}
            >
              <h2 style={{
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '32px'
              }}>
                Your Documents ({documents.length})
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <AnimatePresence>
                  {documents.map((doc, index) => (
                    <motion.div
                      key={doc._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '12px',
                        padding: '24px',
                        transition: 'all 200ms'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 20px 40px -10px rgba(59, 130, 246, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = 'rgba(255,255,255,0.04)';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                        {/* File icon */}
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {getFileIcon(doc.mimeType)}
                        </div>
                        
                        {/* Document info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h3 style={{
                              fontSize: '18px',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {doc.title || doc.originalName || 'Untitled Document'}
                            </h3>
                            {getStatusBadge(doc.status || 'PENDING')}
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                            <span>{formatFileSize(doc.size || 0)}</span>
                            <span>Uploaded {formatDate(doc.createdAt)}</span>
                          </div>
                          
                          {/* Action buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleScan(doc._id)}
                              disabled={scanMutation.isPending}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                                fontWeight: 500,
                                cursor: scanMutation.isPending ? 'not-allowed' : 'pointer',
                                transition: 'all 150ms',
                                opacity: scanMutation.isPending ? 0.7 : 1
                              }}
                              onMouseEnter={(e) => {
                                if (!scanMutation.isPending) {
                                  e.target.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
                                  e.target.style.transform = 'translateY(-1px)';
                                  e.target.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.25)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!scanMutation.isPending) {
                                  e.target.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
                                  e.target.style.transform = 'translateY(0)';
                                  e.target.style.boxShadow = 'none';
                                }
                              }}
                            >
                              {scanMutation.isPending && scanMutation.variables === doc._id ? (
                                <div style={{
                                  width: '14px',
                                  height: '14px',
                                  border: '2px solid transparent',
                                  borderTop: '2px solid #ffffff',
                                  borderRadius: '50%',
                                  animation: 'spin 1s linear infinite'
                                }} />
                              ) : (
                                <Eye size={14} />
                              )}
                              {doc.attachments?.[0]?.mimeType === 'application/pdf' ? 'Process PDF' : 'Scan with OCR'}
                            </motion.button>

                            {deleteConfirm === doc._id ? (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleDelete(doc._id)}
                                  style={{
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    color: '#ef4444',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 150ms'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                                  }}
                                >
                                  Confirm
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setDeleteConfirm(null)}
                                  style={{
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'var(--text-muted)',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    transition: 'all 150ms'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.color = '#ffffff';
                                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.color = '#64748b';
                                    e.target.style.background = 'rgba(255, 255, 255, 0.04)';
                                  }}
                                >
                                  Cancel
                                </motion.button>
                              </div>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setDeleteConfirm(doc._id)}
                                style={{
                                  padding: '8px',
                                  borderRadius: '8px',
                                  background: 'rgba(255, 255, 255, 0.04)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  color: 'var(--text-muted)',
                                  cursor: 'pointer',
                                  transition: 'all 150ms'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.color = '#ef4444';
                                  e.target.style.background = 'rgba(239, 68, 68, 0.04)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.color = '#64748b';
                                  e.target.style.background = 'rgba(255, 255, 255, 0.04)';
                                }}
                              >
                                <Trash2 size={14} />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Scan results */}
                      {doc.scanResult && (
                        <div style={{ 
                          marginTop: '16px', 
                          paddingTop: '16px', 
                          borderTop: '1px solid rgba(255,255,255,0.04)' 
                        }}>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleScanResults(doc._id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              background: 'rgba(255,255,255,0.02)',
                              color: '#e2e8f0',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              marginBottom: expandedScanResults.has(doc._id) ? '12px' : '0',
                              transition: 'all 150ms'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(255,255,255,0.04)';
                              e.target.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'rgba(255,255,255,0.02)';
                              e.target.style.color = '#e2e8f0';
                            }}
                          >
                            {expandedScanResults.has(doc._id) ? <EyeOff size={14} /> : <Eye size={14} />}
                            {expandedScanResults.has(doc._id) ? 'Hide' : 'Show'} Scan Results
                          </motion.button>
                          
                          <AnimatePresence>
                            {expandedScanResults.has(doc._id) && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{
                                  marginTop: '16px',
                                  padding: '16px',
                                  background: 'rgba(255,255,255,0.02)',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(255,255,255,0.05)'
                                }}
                              >
                                <div style={{ marginBottom: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                                      {doc.scanResult.documentType === 'application/pdf' ? 'Document Information' : 'Extracted Text'}
                                    </p>
                                    <span style={{
                                      fontSize: '12px',
                                      padding: '2px 8px',
                                      background: 'rgba(34, 197, 94, 0.1)',
                                      color: '#22c55e',
                                      borderRadius: '12px'
                                    }}>
                                      {doc.scanResult.confidence}% confidence
                                    </span>
                                  </div>
                                  <p style={{
                                    fontSize: '14px',
                                    color: 'var(--text-muted)',
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: '1.6'
                                  }}>
                                    {doc.scanResult.extractedText || 'No text extracted'}
                                  </p>
                                </div>
                                
                                {doc.scanResult.notaryDetected && (
                                  <div style={{
                                    padding: '12px',
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                    borderRadius: '6px'
                                  }}>
                                    <p style={{ fontSize: '13px', color: '#22c55e', fontWeight: 600, margin: 0 }}>
                                      Notary seal/signature detected
                                    </p>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {documents.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.2 }}
              style={{ 
                textAlign: 'center', 
                padding: '80px 40px', 
                background: '#050d1a', 
                backdropFilter: 'blur(20px)', 
                border: '1px solid rgba(255,255,255,0.04)', 
                borderRadius: '16px' 
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>
                📄
              </div>
              <h3 style={{ 
                fontSize: 20, fontWeight: 700, 
                color: 'var(--text-primary)', marginBottom: 8 
              }}>
                No documents uploaded yet
              </h3>
              <p style={{ 
                fontSize: 14, color: '#64748b', 
                marginBottom: 24, maxWidth: 340, margin: '0 auto 24px' 
              }}>
                Upload your will, power of attorney, 
                insurance policies and other important legal documents.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '12px 28px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 150ms'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <Upload size={16} />
                Upload First Document
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LegalDocuments;
