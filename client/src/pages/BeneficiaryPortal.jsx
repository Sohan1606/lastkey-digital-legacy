import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function BeneficiaryPortal() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [screen, setScreen] = useState('loading');
  const [portalInfo, setPortalInfo] = useState(null);
  const [portalData, setPortalData] = useState(null);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');

  // Verification form
  const [answer, setAnswer] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Manual verification state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({
    fullName: '',
    relationship: '',
    reason: ''
  });
  const [manualSubmitted, setManualSubmitted] = useState(false);
  const [submittingManual, setSubmittingManual] = useState(false);

  // Items
  const [revealedItems, setRevealedItems] = useState({});
  const [revealTimers, setRevealTimers] = useState({});

  // Claim account form
  const [showClaim, setShowClaim] = useState(false);
  const [claimForm, setClaimForm] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [claiming, setClaiming] = useState(false);

  // Security: blur on tab switch
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsBlurred(true);
        setRevealedItems({});
      } else {
        setIsBlurred(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Disable right click
  useEffect(() => {
    const handler = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, []);

  // Load portal info on mount
  useEffect(() => {
    loadPortalInfo();
  }, [token]);

  const loadPortalInfo = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/portal/${token}`);
      setPortalInfo(data.data);

      if (data.data.isVerified) {
        setScreen('portal');
      } else {
        setScreen('verify');
      }

      if (data.data.isClaimed) {
        setClaimForm(prev => ({ 
          ...prev, 
          name: data.data.beneficiaryName 
        }));
      }

    } catch (err) {
      setError(err.response?.data?.message || 'This link is invalid.');
      setErrorCode(err.response?.data?.code || '');
      setScreen('error');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!answer.trim()) return;

    setVerifying(true);
    setVerifyError('');

    try {
      const { data } = await axios.post(
        `${API_BASE}/portal/${token}/verify`,
        { answer: answer.trim() }
      );
      setPortalData(data.data);
      setClaimForm(prev => ({
        ...prev,
        name: data.data.beneficiaryName
      }));
      setScreen('portal');
      toast.success('Identity verified successfully');

    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Incorrect answer. Please try again.');
      if (err.response?.data?.code === 'LINK_REVOKED') {
        setError(err.response.data.message);
        setScreen('error');
      }
    } finally {
      setVerifying(false);
    }
  };

  const revealItem = async (item) => {
    // Clear existing timer
    if (revealTimers[item._id]) {
      clearTimeout(revealTimers[item._id]);
    }

    setRevealedItems(prev => ({ 
      ...prev, 
      [item._id]: true 
    }));

    // Log reveal to server
    try {
      await axios.post(
        `${API_BASE}/portal/${token}/log-reveal`,
        { itemId: item._id, itemTitle: item.title }
      );
    } catch (e) {}

    // Auto hide after 5 minutes
    const timer = setTimeout(() => {
      setRevealedItems(prev => ({ 
        ...prev, 
        [item._id]: false 
      }));
      toast('Item hidden for security', { icon: '🔒' });
    }, 5 * 60 * 1000);

    setRevealTimers(prev => ({ 
      ...prev, 
      [item._id]: timer 
    }));
  };

  const handleClaim = async (e) => {
    e.preventDefault();

    if (claimForm.password !== claimForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (claimForm.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setClaiming(true);
    try {
      const { data } = await axios.post(
        `${API_BASE}/portal/${token}/claim`,
        {
          name: claimForm.name,
          password: claimForm.password
        }
      );

      // Store auth token
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      toast.success(`Welcome to LastKey! ${data.data.itemsCopied} items are now in your vault.`);

      // Redirect to dashboard
      setTimeout(() => navigate('/dashboard'), 1500);

    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create account';
      const code = err.response?.data?.code;

      if (code === 'ACCOUNT_EXISTS') {
        toast.error('Account exists. Please sign in.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        toast.error(msg);
      }
    } finally {
      setClaiming(false);
    }
  };

  const handleManualVerification = async () => {
    if (!manualForm.fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    setSubmittingManual(true);
    try {
      await axios.post(
        `${API_BASE}/portal/${token}/manual-verification`,
        manualForm
      );
      setManualSubmitted(true);
      toast.success('Request submitted successfully');
    } catch (err) {
      toast.error(
        err.response?.data?.message 
        || 'Failed to submit'
      );
    } finally {
      setSubmittingManual(false);
    }
  };

  // ── SCREEN: LOADING ──
  if (screen === 'loading') {
    return (
      <div style={styles.fullPage}>
        <div style={{ textAlign: 'center' }}>
          <div style={styles.spinner} />
          <p style={styles.mutedText}>
            Verifying your secure access...
          </p>
        </div>
      </div>
    );
  }

  // ── SCREEN: ERROR ──
  if (screen === 'error') {
    return (
      <div style={styles.fullPage}>
        <div style={styles.errorCard}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>
            🔒
          </div>
          <h2 style={styles.errorTitle}>Access Unavailable</h2>
          <p style={styles.mutedText}>{error}</p>
          {errorCode === 'LINK_EXPIRED' && (
            <p style={{ 
              color: 'var(--amber)', fontSize: 13, marginTop: 12 
            }}>
              Please contact the estate administrator 
              for a new access link.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── SCREEN: VERIFICATION ──
  if (screen === 'verify') {
    return (
      <div style={styles.fullPage}>
        <div style={styles.card}>
          
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>
              💙
            </div>
            <h1 style={styles.heading}>
              {portalInfo?.ownerName} left something for you
            </h1>
            <p style={styles.mutedText}>
              Hello {portalInfo?.beneficiaryName}. 
              To protect your privacy, please answer 
              the security question below.
            </p>
            <div style={styles.infoBadge}>
              🔒 {portalInfo?.itemCount} secure items 
              are waiting for you
            </div>
          </div>

          <form onSubmit={handleVerify}>
            <div style={{ marginBottom: 20 }}>
              <label style={styles.label}>
                Security Question
              </label>
              <div style={styles.questionBox}>
                {portalInfo?.verificationQuestion 
                  || 'What was the name of our first pet?'}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={styles.label}>
                Your Answer
              </label>
              <input
                type="text"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer..."
                style={styles.input}
                autoComplete="off"
              />
              {verifyError && (
                <p style={styles.errorText}>
                  {verifyError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={verifying || !answer.trim()}
              style={{
                ...styles.primaryButton,
                opacity: verifying || !answer.trim() 
                  ? 0.6 : 1
              }}
            >
              {verifying 
                ? 'Verifying...' 
                : 'Verify My Identity →'}
            </button>
          </form>

          {/* Hint section */}
          {portalInfo?.verificationHint && (
            <div style={{
              marginTop: 16,
              padding: '12px 16px',
              background: 'var(--glass-2)',
              border: '1px solid var(--border)',
              borderRadius: 12
            }}>
              <p style={{ 
                color: 'var(--amber)', 
                fontSize: 13,
                margin: 0 
              }}>
                💡 Hint: {portalInfo.verificationHint}
              </p>
            </div>
          )}

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            margin: '24px 0'
          }}>
            <div style={{ 
              flex: 1, height: 1, 
              background: 'rgba(255,255,255,0.06)' 
            }} />
            <span style={{ color: '#3d5070', fontSize: 13 }}>
              Can't remember the answer?
            </span>
            <div style={{ 
              flex: 1, height: 1, 
              background: 'rgba(255,255,255,0.06)' 
            }} />
          </div>

          {/* Manual Verification Section */}
          {!manualSubmitted ? (
            !showManualForm ? (
              <button
                onClick={() => setShowManualForm(true)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'var(--glass-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  color: 'var(--amber)',
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                🆘 Request Manual Verification by LastKey Team
              </button>
            ) : (
              <div style={{
                padding: 20,
                background: 'var(--glass-2)',
                border: '1px solid var(--border)',
                borderRadius: 12
              }}>
                <p style={{ 
                  color: 'var(--amber)', 
                  fontSize: 13, 
                  fontWeight: 600,
                  marginBottom: 16
                }}>
                  🆘 Manual Verification Request
                </p>
                <p style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: 12, 
                  marginBottom: 16 
                }}>
                  Our team will verify your identity and 
                  contact you within 3-5 business days.
                  Please provide accurate information.
                </p>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ 
                    fontSize: 12, color: '#8899bb',
                    display: 'block', marginBottom: 6 
                  }}>
                    Your Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={manualForm.fullName}
                    onChange={e => setManualForm(
                      prev => ({ ...prev, fullName: e.target.value })
                    )}
                    placeholder="As it appears on your ID"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ 
                    fontSize: 12, color: '#8899bb',
                    display: 'block', marginBottom: 6 
                  }}>
                    Your Relationship to Owner
                  </label>
                  <input
                    type="text"
                    value={manualForm.relationship}
                    onChange={e => setManualForm(
                      prev => ({ 
                        ...prev, 
                        relationship: e.target.value 
                      })
                    )}
                    placeholder="e.g. Wife, Son, Lawyer"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ 
                    fontSize: 12, color: '#8899bb',
                    display: 'block', marginBottom: 6 
                  }}>
                    Why can you not answer the security question?
                  </label>
                  <textarea
                    value={manualForm.reason}
                    onChange={e => setManualForm(
                      prev => ({ ...prev, reason: e.target.value })
                    )}
                    placeholder="Brief explanation..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  onClick={handleManualVerification}
                  disabled={submittingManual || 
                    !manualForm.fullName.trim()}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: submittingManual 
                      ? 'rgba(255,184,48,0.2)'
                      : 'rgba(255,184,48,0.15)',
                    border: '1px solid rgba(255,184,48,0.3)',
                    borderRadius: 10,
                    color: 'var(--amber)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: submittingManual 
                      ? 'not-allowed' : 'pointer',
                    marginBottom: 8
                  }}
                >
                  {submittingManual 
                    ? 'Submitting...' 
                    : 'Submit Verification Request'}
                </button>

                <button
                  onClick={() => setShowManualForm(false)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-3)',
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            )
          ) : (
            <div style={{
              padding: 20,
              background: 'var(--glass-2)',
              border: '1px solid var(--pulse)',
              borderRadius: 12,
              textAlign: 'center'
            }}>
              <p style={{ fontSize: 24, marginBottom: 8 }}>✅</p>
              <p style={{ 
                color: 'var(--pulse)', 
                fontSize: 14, 
                fontWeight: 600,
                marginBottom: 4
              }}>
                Request Submitted
              </p>
              <p style={{ color: '#8899bb', fontSize: 13 }}>
                Our team will contact you at your registered 
                email within 3-5 business days.
              </p>
            </div>
          )}

          <p style={{ 
            ...styles.mutedText, 
            textAlign: 'center',
            marginTop: 20,
            fontSize: 12 
          }}>
            🔐 You have 3 attempts. 
            This link expires on{' '}
            {portalInfo?.expiresAt 
              ? new Date(portalInfo.expiresAt)
                  .toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
              : '30 days from activation'
            }
          </p>
        </div>
      </div>
    );
  }

  // ── SCREEN: PORTAL (main) ──
  if (screen === 'portal') {
    const data = portalData;
    if (!data) return null;

    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--bg-base)',
        fontFamily: 'Inter, sans-serif'
      }}>

        {/* Header */}
        <div style={styles.portalHeader}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f4ff' }}>
            LastKey
          </div>
          <div style={styles.secureTag}>
            🔐 Secure Legacy Portal
          </div>
        </div>

        <div style={styles.portalContent}>

          {/* Welcome card */}
          <div style={styles.welcomeCard}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>
              💙
            </div>
            <h1 style={styles.welcomeTitle}>
              {data.ownerName} left this for you
            </h1>
            <p style={{ color: '#8899bb', fontSize: 15 }}>
              Hello {data.beneficiaryName}, you have been 
              designated as a trusted beneficiary.
            </p>
            <div style={styles.expiryBadge}>
              ⏱ Access expires{' '}
              {new Date(data.expiresAt)
                .toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
            </div>
          </div>

          {/* Security notice */}
          {isBlurred && (
            <div style={styles.blurNotice}>
              🔒 Content hidden while away. 
              Scroll down to reveal items again.
            </div>
          )}

          {/* Items */}
          <h2 style={styles.sectionLabel}>
            {data.items.length} Items Left For You
          </h2>

          {data.items.map(item => (
            <div key={item._id} style={styles.itemCard}>
              
              <div style={styles.itemHeader}>
                <div>
                  <p style={styles.itemTitle}>
                    {item.title}
                  </p>
                  <p style={styles.itemType}>
                    {item.type} 
                    {item.category 
                      ? ` · ${item.category}` 
                      : ''}
                  </p>
                </div>

                {!revealedItems[item._id] ? (
                  <button
                    onClick={() => revealItem(item)}
                    style={styles.revealButton}
                  >
                    👁 Reveal
                  </button>
                ) : (
                  <span style={styles.revealedBadge}>
                    ✓ Revealed
                  </span>
                )}
              </div>

              {revealedItems[item._id] && (
                <div style={styles.contentBox}>
                  {/* Watermark */}
                  <div style={styles.watermark}>
                    {data.beneficiaryName} • LastKey
                  </div>
                  
                  <p style={{ 
                    ...styles.contentText,
                    userSelect: 'none',
                    WebkitUserSelect: 'none'
                  }}>
                    {item.content}
                  </p>
                  
                  {item.notes && (
                    <p style={styles.notesText}>
                      📝 {item.notes}
                    </p>
                  )}
                  
                  <p style={styles.autoHideText}>
                    🔒 Auto-hides in 5 minutes
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Claim account section */}
          {!data.isClaimed && !showClaim && (
            <div style={styles.claimBanner}>
              <h3 style={styles.claimTitle}>
                Want permanent access to these items?
              </h3>
              <p style={styles.claimDesc}>
                Create your own LastKey account and 
                these items will be permanently saved 
                to your personal vault. This link 
                expires in 30 days — your account 
                never does.
              </p>
              <button
                onClick={() => setShowClaim(true)}
                style={styles.claimButton}
              >
                Create My Account →
              </button>
            </div>
          )}

          {data.isClaimed && (
            <div style={styles.claimedBanner}>
              ✅ You have already claimed this legacy 
              into your LastKey account.
              <button
                onClick={() => navigate('/login')}
                style={{ 
                  ...styles.primaryButton, 
                  marginTop: 12 
                }}
              >
                Sign In to Your Account
              </button>
            </div>
          )}

          {/* Claim form */}
          {showClaim && !data.isClaimed && (
            <div style={styles.claimForm}>
              <h3 style={styles.claimTitle}>
                Create Your LastKey Account
              </h3>
              <p style={styles.mutedText}>
                Your email: {data.beneficiaryEmail}
                <br/>
                These {data.items.length} items will be 
                copied to your new vault automatically.
              </p>

              <form onSubmit={handleClaim}>
                <div style={{ marginBottom: 16 }}>
                  <label style={styles.label}>
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={claimForm.name}
                    onChange={e => setClaimForm(
                      prev => ({ ...prev, name: e.target.value })
                    )}
                    style={styles.input}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={styles.label}>
                    Create Password
                  </label>
                  <input
                    type="password"
                    value={claimForm.password}
                    onChange={e => setClaimForm(
                      prev => ({ 
                        ...prev, 
                        password: e.target.value 
                      })
                    )}
                    placeholder="Minimum 8 characters"
                    style={styles.input}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={styles.label}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={claimForm.confirmPassword}
                    onChange={e => setClaimForm(
                      prev => ({ 
                        ...prev, 
                        confirmPassword: e.target.value 
                      })
                    )}
                    style={styles.input}
                  />
                </div>

                <button
                  type="submit"
                  disabled={claiming}
                  style={{
                    ...styles.primaryButton,
                    opacity: claiming ? 0.6 : 1,
                    width: '100%'
                  }}
                >
                  {claiming 
                    ? 'Creating Your Account...' 
                    : '✅ Create Account & Save My Items'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowClaim(false)}
                  style={{ 
                    ...styles.ghostButton, 
                    width: '100%', 
                    marginTop: 10 
                  }}
                >
                  Cancel
                </button>
              </form>
            </div>
          )}

          {/* Footer */}
          <div style={styles.footer}>
            <p>LastKey Digital Legacy</p>
            <p>All access is encrypted, logged and secured.</p>
            <p>support@lastkey.com</p>
          </div>

        </div>
      </div>
    );
  }
}

// Styles object
const styles = {
  fullPage: {
    minHeight: '100vh',
    background: 'var(--bg-base)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Inter, sans-serif',
    padding: 20
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-hover)',
    borderRadius: 24,
    padding: 40,
    width: '100%',
    maxWidth: 480
  },
  errorCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--danger)',
    borderRadius: 24,
    padding: 40,
    maxWidth: 400,
    textAlign: 'center'
  },
  heading: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 10
  },
  mutedText: {
    color: 'var(--text-secondary)',
    fontSize: 14,
    lineHeight: 1.6
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--danger)',
    marginBottom: 12
  },
  errorText: {
    color: 'var(--danger)',
    fontSize: 13,
    marginTop: 8
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: 8
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    background: 'var(--bg-base)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box'
  },
  questionBox: {
    padding: '14px 16px',
    background: 'var(--glass-2)',
    border: '1px solid rgba(79,158,255,0.15)',
    borderRadius: 12,
    color: 'var(--text-primary)',
    fontSize: 14,
    fontStyle: 'italic'
  },
  primaryButton: {
    display: 'block',
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
    border: 'none',
    borderRadius: 12,
    color: 'white',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer'
  },
  ghostButton: {
    display: 'block',
    padding: '12px',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 12,
    color: 'var(--text-secondary)',
    fontSize: 14,
    cursor: 'pointer'
  },
  infoBadge: {
    marginTop: 16,
    display: 'inline-block',
    padding: '8px 16px',
    background: 'var(--glass-2)',
    border: '1px solid rgba(79,158,255,0.2)',
    borderRadius: 20,
    color: 'var(--ion)',
    fontSize: 13
  },
  portalHeader: {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  secureTag: {
    fontSize: 12,
    color: 'var(--pulse)',
    background: 'var(--glass-2)',
    border: '1px solid var(--pulse)',
    padding: '6px 12px',
    borderRadius: 20
  },
  portalContent: {
    maxWidth: 640,
    margin: '0 auto',
    padding: '40px 20px'
  },
  welcomeCard: {
    background: 'rgba(79,158,255,0.04)',
    border: '1px solid rgba(79,158,255,0.12)',
    borderRadius: 20,
    padding: 28,
    marginBottom: 32,
    textAlign: 'center'
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 10
  },
  expiryBadge: {
    display: 'inline-block',
    marginTop: 16,
    padding: '6px 14px',
    background: 'rgba(255,184,48,0.08)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    color: 'var(--amber)',
    fontSize: 12
  },
  blurNotice: {
    padding: '14px 20px',
    background: 'rgba(255,77,109,0.08)',
    border: '1px solid var(--danger)',
    borderRadius: 12,
    color: 'var(--danger)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-3)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginBottom: 16
  },
  itemCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-hover)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 4
  },
  itemType: {
    fontSize: 11,
    color: 'var(--text-3)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em'
  },
  revealButton: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
    border: 'none',
    borderRadius: 10,
    color: 'white',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0
  },
  revealedBadge: {
    fontSize: 12,
    color: 'var(--pulse)',
    background: 'var(--glass-2)',
    border: '1px solid rgba(0,229,160,0.2)',
    padding: '6px 12px',
    borderRadius: 10,
    flexShrink: 0
  },
  contentBox: {
    position: 'relative',
    overflow: 'hidden',
    marginTop: 16,
    padding: 16,
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid var(--border-hover)',
    borderRadius: 12
  },
  watermark: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    opacity: 0.05,
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
    transform: 'rotate(-25deg)',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    zIndex: 1
  },
  contentText: {
    color: 'var(--text-primary)',
    fontSize: 14,
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    position: 'relative',
    zIndex: 2
  },
  notesText: {
    color: 'var(--text-secondary)',
    fontSize: 13,
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid rgba(255,255,255,0.05)'
  },
  autoHideText: {
    color: 'var(--text-3)',
    fontSize: 11,
    marginTop: 10,
    textAlign: 'right'
  },
  claimBanner: {
    marginTop: 32,
    padding: 28,
    background: 'var(--glass-2)',
    border: '1px solid var(--pulse)',
    borderRadius: 20,
    textAlign: 'center'
  },
  claimedBanner: {
    marginTop: 32,
    padding: 28,
    background: 'var(--glass-2)',
    border: '1px solid rgba(0,229,160,0.2)',
    borderRadius: 20,
    textAlign: 'center',
    color: 'var(--pulse)',
    fontSize: 15,
    fontWeight: 600
  },
  claimTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 10
  },
  claimDesc: {
    color: 'var(--text-secondary)',
    fontSize: 14,
    lineHeight: 1.6,
    marginBottom: 20
  },
  claimButton: {
    display: 'inline-block',
    padding: '12px 28px',
    background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
    border: 'none',
    borderRadius: 12,
    color: 'white',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer'
  },
  claimForm: {
    marginTop: 32,
    padding: 28,
    background: 'var(--bg-card)',
    border: '1px solid var(--border-hover)',
    borderRadius: 20
  },
  footer: {
    textAlign: 'center',
    marginTop: 48,
    paddingTop: 24,
    borderTop: '1px solid rgba(255,255,255,0.04)',
    color: 'var(--text-3)',
    fontSize: 12,
    lineHeight: 2
  },
  spinner: {
    width: 36,
    height: 36,
    border: '3px solid rgba(79,158,255,0.15)',
    borderTop: '3px solid #4f9eff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px'
  }
};
