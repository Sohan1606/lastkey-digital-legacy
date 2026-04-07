import { useNavigate } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

const ErrorBoundaryWrapper = ({ children }) => {
  const navigate = useNavigate();
  
  return (
    <ErrorBoundary navigate={navigate}>
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundaryWrapper;
