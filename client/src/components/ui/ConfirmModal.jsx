import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Info, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';

/**
 * ConfirmModal Component - Reusable confirmation modal
 * 
 * A versatile modal component for confirming actions, displaying warnings,
 * and gathering user confirmation before critical operations.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when modal is closed
 * @param {Function} props.onConfirm - Function to call when user confirms
 * @param {string} props.title - Modal title
 * @param {string} props.message - Modal message/description
 * @param {string} props.confirmText - Text for confirm button (default: "Confirm")
 * @param {string} props.cancelText - Text for cancel button (default: "Cancel")
 * @param {string} props.variant - Modal variant: 'danger', 'warning', 'info', 'success' (default: 'info')
 * @param {boolean} props.isLoading - Whether confirm action is loading
 * @param {boolean} props.disableClose - Whether to disable closing the modal
 * @param {string} props.size - Modal size: 'sm', 'md', 'lg', 'xl' (default: 'md')
 * @param {React.ReactNode} props.children - Additional content to render in modal
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false,
  disableClose = false,
  size = 'md',
  children
}) => {
  // Variant configurations
  const variants = {
    danger: {
      icon: AlertTriangle,
      iconColor: '#ef4444',
      iconBg: '#ef444420',
      iconBorder: '#ef444430',
      confirmBg: 'linear-gradient(135deg, #ef4444, #dc2626)',
      confirmHover: '#dc2626',
      buttonBorder: '#ef444430'
    },
    warning: {
      icon: AlertCircle,
      iconColor: '#f59e0b',
      iconBg: '#f59e0b20',
      iconBorder: '#f59e0b30',
      confirmBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
      confirmHover: '#d97706',
      buttonBorder: '#f59e0b30'
    },
    info: {
      icon: Info,
      iconColor: '#4f9eff',
      iconBg: '#4f9eff20',
      iconBorder: '#4f9eff30',
      confirmBg: 'linear-gradient(135deg, #4f9eff, #2563eb)',
      confirmHover: '#2563eb',
      buttonBorder: '#4f9eff30'
    },
    success: {
      icon: CheckCircle,
      iconColor: '#00e5a0',
      iconBg: '#00e5a020',
      iconBorder: '#00e5a030',
      confirmBg: 'linear-gradient(135deg, #00e5a0, #00c896)',
      confirmHover: '#00c896',
      buttonBorder: '#00e5a030'
    }
  };

  const currentVariant = variants[variant] || variants.info;
  const Icon = currentVariant.icon;

  // Size configurations
  const sizes = {
    sm: { width: '400px', padding: '24px' },
    md: { width: '480px', padding: '32px' },
    lg: { width: '600px', padding: '32px' },
    xl: { width: '720px', padding: '40px' }
  };

  const currentSize = sizes[size] || sizes.md;

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !disableClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, disableClose]);

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !disableClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={handleBackdropClick}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                width: currentSize.width,
                maxWidth: '90vw',
                background: '#050d1a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                padding: currentSize.padding,
                position: 'relative',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              {!disableClose && (
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#64748b',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 150ms',
                    opacity: isLoading ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.color = '#ffffff';
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.target.style.color = '#64748b';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <X size={16} />
                </button>
              )}

              {/* Icon */}
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: currentVariant.iconBg,
                border: `1px solid ${currentVariant.iconBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <Icon size={28} style={{ color: currentVariant.iconColor }} />
              </div>

              {/* Title */}
              <h2 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: '12px',
                lineHeight: 1.2
              }}>
                {title}
              </h2>

              {/* Message */}
              <p style={{
                fontSize: '15px',
                color: '#64748b',
                lineHeight: 1.6,
                marginBottom: children ? '20px' : '32px'
              }}>
                {message}
              </p>

              {/* Additional content */}
              {children && (
                <div style={{
                  marginBottom: '32px',
                  padding: '16px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  {children}
                </div>
              )}

              {/* Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                {/* Cancel button */}
                {!disableClose && (
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 150ms',
                      opacity: isLoading ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    {cancelText}
                  </button>
                )}

                {/* Confirm button */}
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: `1px solid ${currentVariant.buttonBorder}`,
                    background: currentVariant.confirmBg,
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 150ms',
                    opacity: isLoading ? 0.8 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    minWidth: '100px',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.target.style.background = currentVariant.confirmHover;
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = `0 10px 25px -5px ${currentVariant.iconColor}40`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = currentVariant.confirmBg;
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {isLoading && (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid #ffffff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  )}
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </motion.div>

          {/* Loading spinner animation */}
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
