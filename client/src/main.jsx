import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { initAnalytics } from './utils/analytics'
import { Toaster } from 'react-hot-toast'
import ErrorBoundaryWrapper from './components/ErrorBoundaryWrapper'

// Initialize analytics
initAnalytics();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <ErrorBoundaryWrapper>
              <App />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#0b1629',
                    color: '#f0f4ff',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    fontSize: '14px',
                  },
                  success: {
                    iconTheme: {
                      primary: '#00e5a0',
                      secondary: '#0b1629',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ff4d6d',
                      secondary: '#0b1629',
                    },
                  },
                }}
              />
            </ErrorBoundaryWrapper>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
