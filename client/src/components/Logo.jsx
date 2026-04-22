import React from 'react';

export default function Logo({ 
  size = 'md',    // 'sm'|'md'|'lg'|'xl'
  darkMode = false,  // true = text turns white
  showText = true,   // false = icon badge only
  className = ''
}) {
  // Size mapping according to specifications
  const sizeMap = {
    sm: { badgeSize: 28, fontSize: 16, totalWidth: 150 },
    md: { badgeSize: 36, fontSize: 20, totalWidth: 190 },
    lg: { badgeSize: 44, fontSize: 24, totalWidth: 230 },
    xl: { badgeSize: 56, fontSize: 30, totalWidth: 290 }
  };

  const config = sizeMap[size];
  const textColor = darkMode ? '#ffffff' : '#1a1f36';
  const subTextColor = '#6b7280';
  const gap = 10; // Exactly 10px gap between badge and text

  return (
    <div className={`flex items-center select-none ${className}`}>
      {/* Badge Section */}
      <div
        style={{
          width: config.badgeSize,
          height: config.badgeSize,
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #1a1f36, #2d3561)',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {/* Key Icon SVG */}
        <svg
          width={config.badgeSize * 0.6}
          height={config.badgeSize * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Key bow (circle) */}
          <circle
            cx="8"
            cy="12"
            r="6"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
          />
          
          {/* Key hole */}
          <circle
            cx="8"
            cy="12"
            r="1.5"
            fill="#f59e0b"
          />
          
          {/* Key shaft */}
          <rect
            x="13"
            y="11"
            width="8"
            height="2"
            fill="#f59e0b"
          />
          
          {/* Key teeth */}
          <rect
            x="19"
            y="9"
            width="2"
            height="3"
            fill="#f59e0b"
          />
          <rect
            x="21"
            y="13"
            width="2"
            height="3"
            fill="#f59e0b"
          />
        </svg>
      </div>

      {/* Text Section */}
      {showText && (
        <div style={{ marginLeft: gap }}>
          {/* LastKey text */}
          <div
            style={{
              fontSize: config.fontSize,
              fontWeight: 700,
              color: textColor,
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '-0.3px',
              lineHeight: 1
            }}
          >
            LastKey
          </div>
          
          {/* Digital Legacy text */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 400,
              color: subTextColor,
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginTop: 2
            }}
          >
            Digital Legacy
          </div>
        </div>
      )}
    </div>
  );
}
