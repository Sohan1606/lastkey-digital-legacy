import { Component, Fragment } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to service in production
    if (import.meta.env.DEV) console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          navigate={this.props.navigate}
        />
      );
    }

    return this.props.children;
  }
}

const ErrorFallback = ({ error, errorInfo, onReset, navigate }) => {
  const handleGoHome = () => {
    if (navigate) {
      navigate('/');
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="page spatial-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="stars" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ maxWidth: 520, width: '100%', background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: 28, textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', backdropFilter: 'blur(24px)' }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', background: 'linear-gradient(135deg, rgba(255,77,109,0.75), rgba(255,184,48,0.75))', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <AlertTriangle style={{ width: 28, height: 28, color: 'white' }} />
        </motion.div>

        <h1 className="display" style={{ fontSize: 22, marginBottom: 10 }}>
          Oops! Something went wrong
        </h1>

        <p style={{ color: 'var(--text-2)', marginBottom: 18, fontSize: 13, lineHeight: 1.6 }}>
          We're sorry, but something unexpected happened. Our team has been notified.
        </p>

        {import.meta.env.DEV && (
          <details style={{ marginBottom: 18, textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8 }}>
              Error Details (Development Mode)
            </summary>
            <div style={{ marginTop: 8, padding: 12, background: 'var(--glass-2)', border: '1px solid var(--glass-border)', borderRadius: 14, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-1)', overflow: 'auto', maxHeight: 160 }}>
              <div style={{ marginBottom: 10 }}>
                <strong>Error:</strong> {error?.toString()}
              </div>
              <div>
                <strong>Stack:</strong>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{errorInfo?.componentStack}</pre>
              </div>
            </div>
          </details>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReset}
            style={{ width: '100%', background: 'linear-gradient(135deg,#4f9eff,#7c5cfc)', border: 'none', borderRadius: 14, padding: '12px 16px', fontWeight: 800, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: 'var(--glow-ion)' }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} />
            Try Again
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoHome}
            style={{ width: '100%', background: 'var(--glass-2)', border: '1px solid var(--glass-border)', borderRadius: 14, padding: '12px 16px', fontWeight: 800, color: 'var(--text-1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          >
            <Home style={{ width: 14, height: 14 }} />
            Go Home
          </motion.button>
        </div>

        <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--glass-border)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Need help? Contact us at{' '}
            <a href="mailto:support@lastkey.com" style={{ color: 'var(--ion)', textDecoration: 'none', fontWeight: 700 }}>
              support@lastkey.com
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ErrorBoundary;
