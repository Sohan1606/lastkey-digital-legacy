import React from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'

export default function NotFound() {
  const navigate = useNavigate()
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      padding: 20,
      textAlign: 'center'
    }}>
      <Logo size="lg" darkMode={true} 
        style={{ marginBottom: 48 }} />
      
      <div style={{
        fontSize: 120,
        fontWeight: 800,
        color: 'rgba(255,255,255,0.04)',
        lineHeight: 1,
        marginBottom: 8,
        letterSpacing: -4
      }}>
        404
      </div>
      
      <h1 style={{
        fontSize: 24,
        fontWeight: 700,
        color: '#f0f4ff',
        marginBottom: 12
      }}>
        Page not found
      </h1>
      
      <p style={{
        fontSize: 15,
        color: '#8899bb',
        marginBottom: 40,
        maxWidth: 360
      }}>
        The page you are looking for does not exist 
        or has been moved. Your vault is still safe.
      </p>
      
      <div style={{ 
        display: 'flex', gap: 12 
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
            border: 'none',
            borderRadius: 12,
            color: 'white',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Go to Dashboard
        </button>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            color: '#8899bb',
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          Go Home
        </button>
      </div>
    </div>
  )
}
