import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Clock, FileText, CheckCircle, AlertCircle, Lock } from 'lucide-react';

const LegacyReadinessScore = ({
  assetCount = 0,
  beneficiaryCount = 0,
  capsuleCount = 0,
  documentCount = 0,
  vaultUnlocked = false
}) => {
  const [score, setScore] = useState(0);
  const [breakdown, setBreakdown] = useState({
    assets: 0,
    beneficiaries: 0,
    capsules: 0,
    documents: 0,
    vault: 0
  });

  useEffect(() => {
    // Calculate score based on readiness criteria
    // Max score: 100 points
    // - Assets: 25 points (5 points per asset, max 5 assets)
    // - Beneficiaries: 25 points (need at least 1 beneficiary added)
    // - Capsules: 20 points (10 points per capsule, max 2)
    // - Documents: 15 points (5 points per document, max 3)
    // - Vault: 15 points (must be set up with client-side encryption)

    const assetsScore = Math.min(assetCount * 5, 25);
    const beneficiariesScore = beneficiaryCount > 0 ? 25 : 0;
    const capsulesScore = Math.min(capsuleCount * 10, 20);
    const documentsScore = Math.min(documentCount * 5, 15);
    const vaultScore = vaultUnlocked ? 15 : 0;

    const totalScore = assetsScore + beneficiariesScore + capsulesScore + documentsScore + vaultScore;

    setScore(totalScore);
    setBreakdown({
      assets: assetsScore,
      beneficiaries: beneficiariesScore,
      capsules: capsulesScore,
      documents: documentsScore,
      vault: vaultScore
    });
  }, [assetCount, beneficiaryCount, capsuleCount, documentCount, vaultUnlocked]);

  const getScoreColor = (s) => {
    if (s >= 80) return '#00e5a0';
    if (s >= 50) return '#ffb830';
    return '#ff4d6d';
  };

  const getScoreMessage = (s) => {
    if (s >= 80) return 'Excellent! Your legacy is well protected.';
    if (s >= 50) return 'Good progress. Complete the checklist below.';
    if (s >= 25) return 'Getting started. Add more items to increase security.';
    return 'Critical: Your digital legacy needs attention.';
  };

  const getScoreIcon = (s) => {
    if (s >= 80) return <CheckCircle size={24} style={{ color: '#00e5a0' }} />;
    if (s >= 50) return <Shield size={24} style={{ color: '#ffb830' }} />;
    return <AlertCircle size={24} style={{ color: '#ff4d6d' }} />;
  };

  const checklist = [
    { 
      label: 'Secure Vault Setup', 
      complete: vaultUnlocked,
      score: breakdown.vault,
      maxScore: 15,
      icon: Lock
    },
    { 
      label: 'Beneficiaries Added', 
      complete: beneficiaryCount > 0,
      count: `${beneficiaryCount} beneficiaries`,
      score: breakdown.beneficiaries,
      maxScore: 25,
      icon: Users
    },
    { 
      label: 'Assets Secured', 
      complete: assetCount >= 3,
      count: `${assetCount} assets`,
      score: breakdown.assets,
      maxScore: 25,
      icon: Shield
    },
    { 
      label: 'Time Capsules', 
      complete: capsuleCount > 0,
      count: `${capsuleCount} capsules`,
      score: breakdown.capsules,
      maxScore: 20,
      icon: Clock
    },
    { 
      label: 'Legal Documents', 
      complete: documentCount > 0,
      count: `${documentCount} documents`,
      score: breakdown.documents,
      maxScore: 15,
      icon: FileText
    }
  ];

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--glass-1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)',
        borderRadius: 24,
        padding: 28,
        marginBottom: 24
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ position: 'relative', width: 100, height: 100 }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={getScoreColor(score)}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut" }}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <span style={{
              fontSize: 28,
              fontWeight: 800,
              color: getScoreColor(score)
            }}>
              {score}
            </span>
            <span style={{
              fontSize: 12,
              color: 'var(--text-3)',
              display: 'block'
            }}>
              /100
            </span>
          </div>
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            {getScoreIcon(score)}
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>
              Legacy Readiness Score
            </h3>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>
            {getScoreMessage(score)}
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div style={{ display: 'grid', gap: 12 }}>
        {checklist.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: item.complete ? 'rgba(0,229,160,0.08)' : 'var(--glass-2)',
                border: `1px solid ${item.complete ? 'rgba(0,229,160,0.2)' : 'var(--glass-border)'}`,
                borderRadius: 12
              }}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: item.complete ? 'rgba(0,229,160,0.15)' : 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={18} style={{ color: item.complete ? '#00e5a0' : 'var(--text-3)' }} />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: item.complete ? '#00e5a0' : 'var(--text-1)'
                  }}>
                    {item.label}
                  </span>
                  {item.complete && <CheckCircle size={14} style={{ color: '#00e5a0' }} />}
                </div>
                {item.count && (
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {item.count}
                  </span>
                )}
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: item.complete ? '#00e5a0' : 'var(--text-2)'
                }}>
                  {item.score}/{item.maxScore}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default LegacyReadinessScore;
