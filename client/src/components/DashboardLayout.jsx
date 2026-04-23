import React, { useState } from 'react'
import Sidebar from './Sidebar'

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen
        lg:ml-[240px]">
        
        {/* Mobile top bar - only shows on small screens */}
        <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b"
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 30
          }}>
          
          {/* Hamburger - only on mobile authenticated pages */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-400 
              hover:text-white hover:bg-white/[0.04] 
              transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" 
              viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" 
                strokeLinejoin="round" strokeWidth={2} 
                d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>

          {/* Page title or logo on mobile */}
          <span className="text-sm font-semibold text-white">
            LastKey
          </span>

          {/* Placeholder for right side balance */}
          <div className="w-9" />
        </div>

        {/* Page content */}
        <main className="flex-1 lg:pt-0 pt-14">
          {children}
        </main>

      </div>
    </div>
  )
}
