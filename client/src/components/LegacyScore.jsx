import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Users, 
  FileText, 
  Lock, 
  Heart, 
  Briefcase, 
  UserCheck,
  Zap,
  TrendingUp,
  Award,
  Activity,
  Target,
  Star
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * LegacyScore Component - Displays a comprehensive legacy preparation score
 * 
 * This component calculates and displays a score based on various factors:
 * - Vault completeness (assets, passwords)
 * - Beneficiary enrollment status
 * - Legal documents uploaded
 * - Guardian Protocol configuration
 * - Time since last activity
 */
const LegacyScore = () => {
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(100);
  const [scoreBreakdown, setScoreBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  // Score categories with their weights
  const scoreCategories = {
    vault: { weight: 30, icon: Lock, label: 'Vault Security', color: '#00e5a0' },
    beneficiaries: { weight: 25, icon: Users, label: 'Beneficiary Circle', color: '#4f9eff' },
    documents: { weight: 20, icon: FileText, label: 'Legal Documents', color: '#ffb830' },
    guardian: { weight: 15, icon: Shield, label: 'Guardian Protocol', color: '#ff4d6d' },
    activity: { weight: 10, icon: Activity, label: 'Recent Activity', color: '#7c5cfc' }
  };

  useEffect(() => {
    calculateLegacyScore();
  }, []);

  const calculateLegacyScore = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all necessary data in parallel
      const [vaultRes, beneficiariesRes, documentsRes, userRes] = await Promise.all([
        axios.get(`${API_BASE}/vault/assets`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_BASE}/beneficiaries`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_BASE}/legal-documents`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_BASE}/auth/profile`, { headers }).catch(() => ({ data: { data: {} } }))
      ]);

      const assets = vaultRes.data?.data || [];
      const beneficiaries = beneficiariesRes.data?.data || [];
      const documents = documentsRes.data?.data || [];
      const user = userRes.data?.data || {};

      // Calculate individual category scores
      const breakdown = [];

      // Vault Score (30%)
      const vaultScore = calculateVaultScore(assets);
      breakdown.push({
        category: 'vault',
        score: vaultScore,
        maxScore: 30,
        details: getVaultDetails(assets)
      });

      // Beneficiaries Score (25%)
      const beneficiariesScore = calculateBeneficiariesScore(beneficiaries);
      breakdown.push({
        category: 'beneficiaries',
        score: beneficiariesScore,
        maxScore: 25,
        details: getBeneficiariesDetails(beneficiaries)
      });

      // Documents Score (20%)
      const documentsScore = calculateDocumentsScore(documents);
      breakdown.push({
        category: 'documents',
        score: documentsScore,
        maxScore: 20,
        details: getDocumentsDetails(documents)
      });

      // Guardian Protocol Score (15%)
      const guardianScore = calculateGuardianScore(user);
      breakdown.push({
        category: 'guardian',
        score: guardianScore,
        maxScore: 15,
        details: getGuardianDetails(user)
      });

      // Activity Score (10%)
      const activityScore = calculateActivityScore(user);
      breakdown.push({
        category: 'activity',
        score: activityScore,
        maxScore: 10,
        details: getActivityDetails(user)
      });

      const totalScore = breakdown.reduce((sum, item) => sum + item.score, 0);
      const totalMaxScore = breakdown.reduce((sum, item) => sum + item.maxScore, 0);

      setScore(totalScore);
      setMaxScore(totalMaxScore);
      setScoreBreakdown(breakdown);

    } catch (error) {
      console.error('Error calculating legacy score:', error);
      toast.error('Failed to calculate legacy score');
    } finally {
      setLoading(false);
    }
  };

  const calculateVaultScore = (assets) => {
    let score = 0;
    
    // Base score for having any assets (10 points)
    if (assets.length > 0) {
      score += 10;
    }

    // Points for asset diversity (up to 10 points)
    const platforms = new Set(assets.map(asset => asset.platform));
    score += Math.min(platforms.size * 2, 10);

    // Points for completeness (up to 10 points)
    const completeAssets = assets.filter(asset => 
      asset.username && 
      asset.password && 
      asset.notes
    );
    score += Math.min((completeAssets.length / assets.length) * 10, 10);

    return Math.min(score, 30);
  };

  const calculateBeneficiariesScore = (beneficiaries) => {
    let score = 0;
    
    // Base score for having beneficiaries (10 points)
    if (beneficiaries.length > 0) {
      score += 10;
    }

    // Points for enrollment status (up to 10 points)
    const enrolledBeneficiaries = beneficiaries.filter(b => b.enrolled);
    score += Math.min((enrolledBeneficiaries.length / beneficiaries.length) * 10, 10);

    // Points for relationship diversity (up to 5 points)
    const relationships = new Set(beneficiaries.map(b => b.relationship));
    score += Math.min(relationships.size, 5);

    return Math.min(score, 25);
  };

  const calculateDocumentsScore = (documents) => {
    let score = 0;
    
    // Points for document types (up to 15 points)
    const docTypes = new Set(documents.map(doc => doc.type));
    const typeScores = {
      'will': 5,
      'trust': 5,
      'power-of-attorney': 4,
      'insurance': 3,
      'property-deed': 3,
      'birth-certificate': 2,
      'marriage-certificate': 2,
      'passport': 2
    };
    
    docTypes.forEach(type => {
      score += typeScores[type] || 1;
    });

    // Points for attachments (up to 5 points)
    const docsWithAttachments = documents.filter(doc => 
      doc.attachments && doc.attachments.length > 0
    );
    score += Math.min(docsWithAttachments.length, 5);

    return Math.min(score, 20);
  };

  const calculateGuardianScore = (user) => {
    let score = 0;
    
    const guardian = user.guardianProtocol;
    
    if (!guardian) return 0;

    // Points for enabling Guardian Protocol (5 points)
    if (guardian.enabled) {
      score += 5;
    }

    // Points for inactivity duration (up to 5 points)
    if (guardian.inactivityDuration) {
      const duration = guardian.inactivityDuration;
      if (duration >= 30 && duration <= 365) {
        score += 5;
      } else if (duration > 0) {
        score += 3;
      }
    }

    // Points for alert channels (up to 5 points)
    if (guardian.alertChannels && guardian.alertChannels.length > 0) {
      score += Math.min(guardian.alertChannels.length, 5);
    }

    return Math.min(score, 15);
  };

  const calculateActivityScore = (user) => {
    let score = 0;
    
    // Points for recent activity (up to 10 points)
    if (user.lastActivity) {
      const daysSinceActivity = Math.floor(
        (Date.now() - new Date(user.lastActivity)) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceActivity <= 7) {
        score += 10;
      } else if (daysSinceActivity <= 30) {
        score += 7;
      } else if (daysSinceActivity <= 90) {
        score += 4;
      } else {
        score += 1;
      }
    }

    return Math.min(score, 10);
  };

  const getVaultDetails = (assets) => {
    return {
      total: assets.length,
      complete: assets.filter(a => a.username && a.password && a.notes).length,
      platforms: [...new Set(assets.map(a => a.platform))].length
    };
  };

  const getBeneficiariesDetails = (beneficiaries) => {
    return {
      total: beneficiaries.length,
      enrolled: beneficiaries.filter(b => b.enrolled).length,
      relationships: [...new Set(beneficiaries.map(b => b.relationship))].length
    };
  };

  const getDocumentsDetails = (documents) => {
    return {
      total: documents.length,
      withAttachments: documents.filter(d => d.attachments && d.attachments.length > 0).length,
      types: [...new Set(documents.map(d => d.type))]
    };
  };

  const getGuardianDetails = (user) => {
    const guardian = user.guardianProtocol || {};
    return {
      enabled: guardian.enabled || false,
      inactivityDuration: guardian.inactivityDuration || 0,
      alertChannels: guardian.alertChannels || []
    };
  };

  const getActivityDetails = (user) => {
    const lastActivity = user.lastActivity ? new Date(user.lastActivity) : null;
    return {
      lastActivity: lastActivity ? lastActivity.toLocaleDateString() : 'Never',
      daysSinceActivity: lastActivity ? Math.floor((Date.now() - lastActivity) / (1000 * 60 * 60 * 24)) : null
    };
  };

  const getScoreColor = (score) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return '#00e5a0';
    if (percentage >= 60) return '#4f9eff';
    if (percentage >= 40) return '#ffb830';
    return '#ff4d6d';
  };

  const getScoreLabel = (score) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const getScoreIcon = (score) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return Award;
    if (percentage >= 60) return CheckCircle;
    if (percentage >= 40) return AlertCircle;
    return AlertCircle;
  };

  if (loading) {
    return (
      <div style={{
        background: '#050d1a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '24px',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(255,255,255,0.1)',
            borderTop: '4px solid #4f9eff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#64748b', fontSize: '14px' }}>Calculating your legacy score...</p>
        </div>
      </div>
    );
  }

  const ScoreIcon = getScoreIcon(score);
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);
  const percentage = Math.round((score / maxScore) * 100);

  return (
    <div style={{
      background: '#050d1a',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '16px',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '200px',
        height: '200px',
        background: `radial-gradient(circle, ${scoreColor}20 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: `linear-gradient(135deg, ${scoreColor}20, ${scoreColor}10)`,
          border: `1px solid ${scoreColor}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Target style={{ width: '28px', height: '28px', color: scoreColor }} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
            Legacy Score
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Comprehensive assessment of your digital legacy preparation
          </p>
        </div>
      </div>

      {/* Main Score Display */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        marginBottom: '24px'
      }}>
        <div style={{
          position: 'relative',
          width: '120px',
          height: '120px'
        }}>
          {/* Circular progress */}
          <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke={scoreColor}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - percentage / 100)}`}
              style={{
                transition: 'stroke-dashoffset 1s ease-in-out'
              }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: scoreColor }}>
              {percentage}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>%</div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ScoreIcon size={20} style={{ color: scoreColor }} />
            <span style={{ fontSize: '18px', fontWeight: 700, color: scoreColor }}>
              {scoreLabel}
            </span>
          </div>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>
            {score}/{maxScore} points earned
          </p>
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
          background: expanded ? 'rgba(255,255,255,0.05)' : 'transparent',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 150ms'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255,255,255,0.08)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = expanded ? 'rgba(255,255,255,0.05)' : 'transparent';
        }}
      >
        <TrendingUp size={16} />
        {expanded ? 'Hide' : 'Show'} Detailed Breakdown
      </button>

      {/* Detailed Breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {scoreBreakdown.map((category) => {
              const CategoryIcon = scoreCategories[category.category].icon;
              const categoryColor = scoreCategories[category.category].color;
              const categoryLabel = scoreCategories[category.category].label;
              const categoryPercentage = Math.round((category.score / category.maxScore) * 100);

              return (
                <div key={category.category} style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <CategoryIcon size={18} style={{ color: categoryColor }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                          {categoryLabel}
                        </span>
                        <span style={{ fontSize: '12px', color: categoryColor, fontWeight: 700 }}>
                          {category.score}/{category.maxScore}
                        </span>
                      </div>
                      <div style={{
                        height: '6px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${categoryPercentage}%`,
                          background: categoryColor,
                          borderRadius: '3px',
                          transition: 'width 1s ease-in-out'
                        }} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Category Details */}
                  <div style={{
                    marginLeft: '30px',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#64748b',
                    lineHeight: 1.6
                  }}>
                    {renderCategoryDetails(category.category, category.details)}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Items */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: 'rgba(79,158,255,0.1)',
        border: '1px solid rgba(79,158,255,0.2)',
        borderRadius: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Zap size={16} style={{ color: '#4f9eff' }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#4f9eff' }}>
            Quick Actions
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {scoreBreakdown
            .filter(cat => cat.score < cat.maxScore)
            .map(category => (
              <button
                key={category.category}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#ffffff',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 150ms'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.05)';
                }}
              >
                Improve {scoreCategories[category.category].label}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

const renderCategoryDetails = (category, details) => {
  switch (category) {
    case 'vault':
      return (
        <>
          <div>Total assets: {details.total}</div>
          <div>Complete profiles: {details.complete}</div>
          <div>Unique platforms: {details.platforms}</div>
        </>
      );
    case 'beneficiaries':
      return (
        <>
          <div>Total beneficiaries: {details.total}</div>
          <div>Enrolled: {details.enrolled}</div>
          <div>Relationship types: {details.relationships}</div>
        </>
      );
    case 'documents':
      return (
        <>
          <div>Total documents: {details.total}</div>
          <div>With attachments: {details.withAttachments}</div>
          <div>Document types: {details.types.join(', ') || 'None'}</div>
        </>
      );
    case 'guardian':
      return (
        <>
          <div>Protocol enabled: {details.enabled ? 'Yes' : 'No'}</div>
          <div>Inactivity duration: {details.inactivityDuration} days</div>
          <div>Alert channels: {details.alertChannels.join(', ') || 'None'}</div>
        </>
      );
    case 'activity':
      return (
        <>
          <div>Last activity: {details.lastActivity}</div>
          {details.daysSinceActivity !== null && (
            <div>Days since last activity: {details.daysSinceActivity}</div>
          )}
        </>
      );
    default:
      return <div>No details available</div>;
  }
};

export default LegacyScore;
