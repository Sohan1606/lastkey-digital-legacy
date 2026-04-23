import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_BASE_URL 
  || 'http://localhost:5000/api'

const SUGGESTED_QUESTIONS = [
  'How do I set up my digital legacy?',
  'How secure is my data?',
  'What happens when my trigger activates?',
  'How do I add a beneficiary?',
  'What is my legacy score?',
  'How does the check-in timer work?'
]

export default function AIAssistant() {
  const { token } = useAuth()
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: `Hello! I am your LastKey AI assistant. 👋

I can help you understand how to protect your digital legacy, explain features, and give you personalized suggestions based on your account.

What would you like to know?`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const messageText = text || input.trim()
    if (!messageText || loading) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const { data } = await axios.post(
        `${API_BASE}/ai/chat`,
        { message: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.data.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'I apologize, I am having trouble responding right now. Please try again.',
        timestamp: new Date(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
      toast.error('AI assistant unavailable')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <DashboardLayout>
      <div style={{
        height: 'calc(100vh - 0px)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-base)'
      }}>

        {/* Header */}
        <div style={{
          padding: '24px 32px 20px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12 
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #4f9eff20, #a78bfa20)',
              border: '1px solid rgba(79,158,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22
            }}>
              🤖
            </div>
            <div>
              <h1 style={{
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0
              }}>
                AI Assistant
              </h1>
              <p style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                margin: 0,
                marginTop: 2
              }}>
                Ask me anything about your digital legacy
              </p>
            </div>
            <div style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              background: 'rgba(0,229,160,0.08)',
              border: '1px solid rgba(0,229,160,0.2)',
              borderRadius: 20,
              fontSize: 12,
              color: '#00e5a0'
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#00e5a0',
                display: 'inline-block'
              }} />
              Online
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          
          {/* Suggested questions - show only at start */}
          {messages.length === 1 && (
            <div style={{ marginBottom: 8 }}>
              <p style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600
              }}>
                Suggested questions
              </p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8
              }}>
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    style={{
                      padding: '8px 14px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 20,
                      color: 'var(--text-secondary)',
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--blue-border)'
                      e.currentTarget.style.color = 'var(--blue)'
                      e.currentTarget.style.background = 'var(--blue-dim)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                      e.currentTarget.style.background = 'var(--bg-card)'
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' 
                  ? 'flex-end' 
                  : 'flex-start',
                gap: 10,
                alignItems: 'flex-start'
              }}
            >
              {/* AI Avatar */}
              {msg.role === 'assistant' && (
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #4f9eff, #a78bfa)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  flexShrink: 0,
                  marginTop: 2
                }}>
                  🤖
                </div>
              )}

              {/* Message bubble */}
              <div style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' 
                  ? '18px 18px 4px 18px'
                  : '18px 18px 18px 4px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #4f9eff, #7c5cfc)'
                  : msg.isError
                  ? 'rgba(248,113,113,0.08)'
                  : 'var(--bg-card)',
                border: msg.role === 'user'
                  ? 'none'
                  : msg.isError
                  ? '1px solid rgba(248,113,113,0.2)'
                  : '1px solid var(--border)',
              }}>
                <p style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: msg.role === 'user'
                    ? '#ffffff'
                    : 'var(--text-primary)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                </p>
                <p style={{
                  margin: '6px 0 0 0',
                  fontSize: 11,
                  color: msg.role === 'user'
                    ? 'rgba(255,255,255,0.6)'
                    : 'var(--text-muted)',
                  textAlign: 'right'
                }}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>

              {/* User Avatar */}
              {msg.role === 'user' && (
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'white',
                  flexShrink: 0,
                  marginTop: 2
                }}>
                  U
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #4f9eff, #a78bfa)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                flexShrink: 0
              }}>
                🤖
              </div>
              <div style={{
                padding: '14px 18px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '18px 18px 18px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--blue)',
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` 
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{
          padding: '16px 32px 24px',
          borderTop: '1px solid var(--border)',
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-end',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '12px 16px',
            transition: 'border-color 0.15s ease'
          }}
          onFocusCapture={e => {
            e.currentTarget.style.borderColor = 'var(--border-focus)'
          }}
          onBlurCapture={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
          }}
          >
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything about your digital legacy..."
              rows={1}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: 14,
                resize: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.6,
                maxHeight: 120,
                overflowY: 'auto'
              }}
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = 
                  Math.min(e.target.scrollHeight, 120) + 'px'
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: input.trim() && !loading
                  ? 'linear-gradient(135deg, #4f9eff, #7c5cfc)'
                  : 'var(--bg-elevated)',
                border: 'none',
                cursor: input.trim() && !loading 
                  ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s ease',
                fontSize: 16
              }}
            >
              {loading ? (
                <div style={{
                  width: 16,
                  height: 16,
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite'
                }} />
              ) : '➤'}
            </button>
          </div>
          <p style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: 10,
            margin: '10px 0 0 0'
          }}>
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>

      </div>
    </DashboardLayout>
  )
}
