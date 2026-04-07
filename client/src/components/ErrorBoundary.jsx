import { Component } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to service in production
    console.error('Error Boundary caught an error:', error, errorInfo);
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <AlertTriangle className="w-8 h-8 text-white" />
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Oops! Something went wrong
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We're sorry, but something unexpected happened. Our team has been notified.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Error Details (Development Mode)
            </summary>
            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-32">
              <div className="mb-2">
                <strong>Error:</strong> {error?.toString()}
              </div>
              <div>
                <strong>Stack:</strong>
                <pre className="whitespace-pre-wrap">{errorInfo?.componentStack}</pre>
              </div>
            </div>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReset}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoHome}
            className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </motion.button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Need help? Contact us at{' '}
            <a href="mailto:support@lastkey.com" className="text-purple-600 hover:text-purple-700">
              support@lastkey.com
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ErrorBoundary;
