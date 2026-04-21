import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, ArrowLeft, Upload, Shield, Home, Car, FileCheck, Building, Trash2, Download, AlertCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getMasterDEK, hasDEK, encryptText, isCryptoSupported } from '../utils/crypto';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const documentTypes = [
  { value: 'deed', label: 'Property Deed', icon: Home },
  { value: 'title', label: 'Vehicle Title', icon: Car },
  { value: 'will', label: 'Last Will & Testament', icon: FileText },
  { value: 'trust', label: 'Trust Document', icon: Shield },
  { value: 'poa', label: 'Power of Attorney', icon: FileCheck },
  { value: 'insurance', label: 'Insurance Policy', icon: Shield },
  { value: 'tax', label: 'Tax Records', icon: FileText },
  { value: 'medical', label: 'Medical Directives', icon: FileCheck },
  { value: 'financial', label: 'Financial Records', icon: Building },
  { value: 'other', label: 'Other Legal Document', icon: FileText }
];

const originalLocations = [
  { value: 'home_safe', label: 'Home Safe' },
  { value: 'safe_deposit', label: 'Safe Deposit Box' },
  { value: 'lawyer', label: 'With Lawyer' },
  { value: 'accountant', label: 'With Accountant' },
  { value: 'family_member', label: 'With Family Member' },
  { value: 'other', label: 'Other Location' }
];

const LegalDocuments = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [cryptoSupported, setCryptoSupported] = useState(true);
  const [showEncryptInfo, setShowEncryptInfo] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'deed',
    title: '',
    propertyAddress: '',
    parcelId: '',
    originalLocationType: 'home_safe',
    originalLocationDetails: '',
    instructionsForBeneficiary: '',
    notarized: false
  });
  const [files, setFiles] = useState([]);

  useEffect(() => {
    setCryptoSupported(isCryptoSupported());
  }, []);

  const { data: documents, isPending: isLoading } = useQuery({
    queryKey: ['legal-documents'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/legal-documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    },
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: async (formDataWithFiles) => {
      return axios.post(`${API_BASE}/legal-documents`, formDataWithFiles, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['legal-documents']);
      setShowForm(false);
      setFormData({
        type: 'deed',
        title: '',
        propertyAddress: '',
        parcelId: '',
        originalLocationType: 'home_safe',
        originalLocationDetails: '',
        instructionsForBeneficiary: '',
        notarized: false
      });
      setFiles([]);
      toast.success('Document added to your legal binder!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add document');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`${API_BASE}/legal-documents/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
    onSuccess: () => {
      toast.success('Document removed');
      queryClient.invalidateQueries(['legal-documents']);
    },
    onError: () => {
      toast.error('Failed to remove document');
    }
  });

  // Encrypt file using DEK
  const encryptFile = async (file) => {
    if (!hasDEK()) {
      throw new Error('Vault not unlocked. Please unlock your vault first.');
    }
    
    const dek = getMasterDEK();
    const arrayBuffer = await file.arrayBuffer();
    
    // Generate IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt file content
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      dek,
      arrayBuffer
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Return as Blob
    return {
      blob: new Blob([combined]),
      iv: btoa(String.fromCharCode(...iv))
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    // Check if vault is unlocked for encryption
    if (!hasDEK()) {
      toast.error('Please unlock your vault first to enable encryption');
      setUploading(false);
      setShowEncryptInfo(true);
      return;
    }
    
    try {
      const data = new FormData();
      data.append('type', formData.type);
      data.append('title', formData.title);
      data.append('propertyAddress', formData.propertyAddress);
      data.append('parcelId', formData.parcelId);
      data.append('originalLocation', JSON.stringify({
        type: formData.originalLocationType,
        details: formData.originalLocationDetails
      }));
      
      // Encrypt instructions if provided
      if (formData.instructionsForBeneficiary) {
        const dek = getMasterDEK();
        const encryptedInstructions = await encryptText(formData.instructionsForBeneficiary, dek);
        data.append('instructionsForBeneficiary', encryptedInstructions);
        data.append('instructionsEncrypted', 'true');
      } else {
        data.append('instructionsForBeneficiary', '');
      }
      
      data.append('notarized', formData.notarized);
      data.append('clientEncrypted', 'true');
      
      // Encrypt and append files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { blob, iv } = await encryptFile(file);
        data.append('attachments', blob, file.name);
        data.append(`attachmentIv_${i}`, iv);
      }
      data.append('attachmentCount', files.length.toString());

      await createMutation.mutateAsync(data);
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }
    setFiles(selectedFiles);
  };

  const getDocumentIcon = (type) => {
    const docType = documentTypes.find(t => t.value === type);
    const Icon = docType?.icon || FileText;
    return Icon;
  };

  if (isLoading) return (
    <div className="page spatial-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="stars" />
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-2)', marginTop: 16, fontSize: 14 }}>Loading legal binder...</p>
      </div>
    </div>
  );

  return (
    <div className="page spatial-bg">
      <div className="stars" />
      <div className="container">
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-2)', marginBottom: 20, textDecoration: 'none', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, rgba(79,158,255,0.3), rgba(0,229,160,0.3))', border: '1px solid rgba(79,158,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText style={{ width: 22, height: 22, color: '#4f9eff' }} />
              </div>
              <div>
                <h1 className="display" style={{ fontSize: 28 }}>Legal Binder</h1>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>Property deeds, titles, and important documents</p>
              </div>
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowForm(!showForm)}
              style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #4f9eff, #00e5a0)', color: '#001a12', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Plus style={{ width: 16, height: 16 }} /> {showForm ? 'Cancel' : 'Add Document'}
            </motion.button>
          </div>
        </motion.div>

        {/* Encryption Status */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          style={{ 
            marginTop: 16, 
            padding: '12px 16px', 
            background: hasDEK() ? 'rgba(0,229,160,0.1)' : 'rgba(255,184,48,0.1)', 
            border: `1px solid ${hasDEK() ? 'rgba(0,229,160,0.3)' : 'rgba(255,184,48,0.3)'}`,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <Lock size={18} style={{ color: hasDEK() ? '#00e5a0' : '#ffb830', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
              {hasDEK() ? (
                <><strong style={{ color: '#00e5a0' }}>DEK Encryption Active:</strong> Documents will be encrypted with your Data Encryption Key before upload.</>
              ) : (
                <><strong style={{ color: '#ffb830' }}>Vault Locked:</strong> Please unlock your vault in the Vault page first to enable DEK encryption for documents.</>
              )}
            </p>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          style={{ 
            marginTop: 12, 
            padding: '12px 16px', 
            background: 'rgba(255,184,48,0.1)', 
            border: '1px solid rgba(255,184,48,0.3)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12
          }}
        >
          <AlertCircle size={18} style={{ color: '#ffb830', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
              <strong style={{ color: '#ffb830' }}>Important:</strong> Scans are reference copies only. 
              Legal proof may require certified copies or official records depending on your jurisdiction. 
              Always note where the original documents are stored.
            </p>
          </div>
        </motion.div>

        {/* Add Document Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginTop: 24 }}
            >
              <div style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: 28 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Add Legal Document</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                    <div>
                      <label>Document Type</label>
                      <select 
                        value={formData.type} 
                        onChange={e => setFormData({...formData, type: e.target.value})}
                        style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--glass-2)', color: 'var(--text-1)' }}
                      >
                        {documentTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>Document Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Primary Residence Deed"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        required
                        style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--glass-2)', color: 'var(--text-1)' }}
                      />
                    </div>
                  </div>

                  {(formData.type === 'deed' || formData.type === 'title') && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                      <div>
                        <label>Property Address</label>
                        <input 
                          type="text" 
                          placeholder="Full property address"
                          value={formData.propertyAddress}
                          onChange={e => setFormData({...formData, propertyAddress: e.target.value})}
                          style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--glass-2)', color: 'var(--text-1)' }}
                        />
                      </div>
                      <div>
                        <label>Parcel ID / APN</label>
                        <input 
                          type="text" 
                          placeholder="Assessor's Parcel Number"
                          value={formData.parcelId}
                          onChange={e => setFormData({...formData, parcelId: e.target.value})}
                          style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--glass-2)', color: 'var(--text-1)' }}
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                    <div>
                      <label>Original Document Location</label>
                      <select 
                        value={formData.originalLocationType} 
                        onChange={e => setFormData({...formData, originalLocationType: e.target.value})}
                        style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--glass-2)', color: 'var(--text-1)' }}
                      >
                        {originalLocations.map(loc => (
                          <option key={loc.value} value={loc.value}>{loc.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>Location Details</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Safe combination: 12-34-56"
                        value={formData.originalLocationDetails}
                        onChange={e => setFormData({...formData, originalLocationDetails: e.target.value})}
                        style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--glass-2)', color: 'var(--text-1)' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label>Instructions for Beneficiary</label>
                    <textarea 
                      placeholder="Step-by-step instructions for your beneficiary to obtain certified copies or access the original..."
                      value={formData.instructionsForBeneficiary}
                      onChange={e => setFormData({...formData, instructionsForBeneficiary: e.target.value})}
                      rows={4}
                      style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--glass-2)', color: 'var(--text-1)', resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.notarized}
                        onChange={e => setFormData({...formData, notarized: e.target.checked})}
                      />
                      <span>This document is notarized</span>
                    </label>
                  </div>

                  <div>
                    <label>Upload Scans (PDF, JPG, PNG - Max 5 files, 10MB each)</label>
                    <div style={{ 
                      border: '2px dashed var(--glass-border)', 
                      borderRadius: 12, 
                      padding: '24px', 
                      textAlign: 'center',
                      background: 'var(--glass-2)'
                    }}>
                      <input 
                        type="file" 
                        multiple 
                        accept=".pdf,.jpg,.jpeg,.png,.tiff"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                        <Upload style={{ width: 32, height: 32, color: 'var(--text-2)', margin: '0 auto 12px' }} />
                        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
                          {files.length > 0 
                            ? `${files.length} file(s) selected` 
                            : 'Click to upload files'}
                        </p>
                      </label>
                    </div>
                  </div>

                  <motion.button 
                    type="submit" 
                    whileHover={{ scale: hasDEK() ? 1.01 : 1 }} 
                    whileTap={{ scale: hasDEK() ? 0.98 : 1 }} 
                    disabled={uploading || createMutation.isPending || !hasDEK()}
                    style={{ 
                      padding: '14px 24px', 
                      borderRadius: 12, 
                      border: 'none', 
                      background: !hasDEK() ? 'var(--glass-2)' : uploading ? 'var(--glass-2)' : 'linear-gradient(135deg, #4f9eff, #00e5a0)', 
                      color: '#001a12', 
                      fontWeight: 700, 
                      fontSize: 14, 
                      cursor: (uploading || !hasDEK()) ? 'not-allowed' : 'pointer', 
                      opacity: (uploading || !hasDEK()) ? 0.6 : 1 
                    }}
                  >
                    {!hasDEK() ? 'Unlock Vault First' : uploading ? 'Encrypting & Uploading...' : 'Add to Legal Binder'}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Documents List */}
        <div style={{ marginTop: 32 }}>
          {!documents || documents.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 24 }}
            >
              <FileText style={{ width: 48, height: 48, color: 'var(--text-3)', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>No Documents Added</h3>
              <p style={{ fontSize: 14, color: 'var(--text-2)', maxWidth: 400, margin: '0 auto' }}>
                Add property deeds, vehicle titles, wills, and other important legal documents. 
                Include where originals are stored.
              </p>
            </motion.div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              <AnimatePresence>
                {documents.map((doc, idx) => {
                  const Icon = getDocumentIcon(doc.type);
                  return (
                    <motion.div 
                      key={doc._id} 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: idx * 0.05 }}
                      style={{ 
                        background: 'var(--glass-1)', 
                        backdropFilter: 'blur(20px)', 
                        border: '1px solid var(--glass-border)', 
                        borderRadius: 20, 
                        padding: 24 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div style={{ 
                          width: 44, 
                          height: 44, 
                          borderRadius: 12, 
                          background: 'rgba(79,158,255,0.15)', 
                          border: '1px solid rgba(79,158,255,0.25)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}>
                          <Icon style={{ width: 20, height: 20, color: '#4f9eff' }} />
                        </div>
                        {deleteConfirm === doc._id ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button 
                              onClick={() => { deleteMutation.mutate(doc._id); setDeleteConfirm(null); }}
                              style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(255,77,109,0.15)', border: '1px solid rgba(255,77,109,0.3)', color: '#ff4d6d', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                            >
                              Delete
                            </button>
                            <button 
                              onClick={() => setDeleteConfirm(null)}
                              style={{ padding: '5px 10px', borderRadius: 7, background: 'var(--glass-1)', border: '1px solid var(--glass-border)', color: 'var(--text-2)', fontSize: 11, cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <motion.button 
                            whileHover={{ scale: 1.1 }} 
                            whileTap={{ scale: 0.9 }} 
                            onClick={() => setDeleteConfirm(doc._id)}
                            style={{ padding: 8, borderRadius: 10, border: '1px solid rgba(255,77,109,0.2)', background: 'rgba(255,77,109,0.08)', cursor: 'pointer' }}
                          >
                            <Trash2 style={{ width: 14, height: 14, color: 'var(--danger)' }} />
                          </motion.button>
                        )}
                      </div>

                      <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>{doc.title}</h4>
                      <p style={{ fontSize: 12, color: 'var(--text-2)', textTransform: 'capitalize', marginBottom: 12 }}>
                        {documentTypes.find(t => t.value === doc.type)?.label || doc.type}
                      </p>

                      {doc.propertyAddress && (
                        <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>
                          <strong>Address:</strong> {doc.propertyAddress}
                        </p>
                      )}

                      {doc.originalLocation && (
                        <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>
                          <strong>Original:</strong> {originalLocations.find(l => l.value === doc.originalLocation.type)?.label} - {doc.originalLocation.details}
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                        {doc.attachments?.some(a => a.encrypted) && (
                          <span style={{ 
                            fontSize: 11, 
                            color: '#4f9eff', 
                            background: 'rgba(79,158,255,0.1)', 
                            border: '1px solid rgba(79,158,255,0.2)', 
                            padding: '3px 8px', 
                            borderRadius: 6,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <Lock size={12} /> Encrypted before upload
                          </span>
                        )}
                        {doc.notarized && (
                          <span style={{ 
                            fontSize: 11, 
                            color: '#00e5a0', 
                            background: 'rgba(0,229,160,0.1)', 
                            border: '1px solid rgba(0,229,160,0.2)', 
                            padding: '3px 8px', 
                            borderRadius: 6,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <FileCheck size={12} /> Notarized
                          </span>
                        )}
                      </div>

                      {doc.attachments && doc.attachments.length > 0 && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--glass-border)' }}>
                          <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>Attachments:</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {doc.attachments.map((att, i) => (
                              <a 
                                key={i}
                                href={`${API_BASE}/legal-documents/${doc._id}/attachments/${att._id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ 
                                  fontSize: 12, 
                                  fontWeight: 600,
                                  color: '#4f9eff', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 6,
                                  padding: '8px 12px',
                                  background: 'rgba(79,158,255,0.15)',
                                  border: '1px solid rgba(79,158,255,0.3)',
                                  borderRadius: 8,
                                  textDecoration: 'none',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(79,158,255,0.25)';
                                  e.currentTarget.style.borderColor = 'rgba(79,158,255,0.5)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(79,158,255,0.15)';
                                  e.currentTarget.style.borderColor = 'rgba(79,158,255,0.3)';
                                }}
                              >
                                <Download size={14} />
                                {att.originalName}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalDocuments;
