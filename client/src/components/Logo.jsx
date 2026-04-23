import React from 'react'

const SIZES = {
  sm: { 
    badge: 32, 
    nameSize: 16, 
    tagSize: 9,
    gap: 14,
    totalHeight: 36
  },
  md: { 
    badge: 40, 
    nameSize: 20, 
    tagSize: 10,
    gap: 14,
    totalHeight: 44
  },
  lg: { 
    badge: 50, 
    nameSize: 25, 
    tagSize: 11,
    gap: 14,
    totalHeight: 56
  },
  xl: { 
    badge: 64, 
    nameSize: 32, 
    tagSize: 13,
    gap: 16,
    totalHeight: 72
  }
}

export default function Logo({
  size = 'md',
  darkMode = false,
  showText = true,
  className = ''
}) {
  const s = SIZES[size]
  const id = `logo_${size}` 
  
  const nameColor = darkMode ? '#ffffff' : '#0f1729'
  
  // Badge geometry calculations
  const b = s.badge
  const r = b * 0.22  // border radius
  
  // Key geometry (centered in badge)
  const keyColor = '#f59e0b'
  const bowX = b * 0.28
  const bowY = b * 0.42
  const bowR = b * 0.14
  const shaftStartX = b * 0.40
  const shaftY = b * 0.39
  const shaftW = b * 0.38
  const shaftH = b * 0.08
  const tooth1X = b * 0.58
  const tooth2X = b * 0.68
  const toothY = b * 0.47
  const toothW = b * 0.07
  const tooth1H = b * 0.12
  const tooth2H = b * 0.09

  // Total SVG width
  const textWidth = showText ? s.nameSize * 4.2 : 0
  const totalW = showText 
    ? b + s.gap + textWidth 
    : b

  return (
    <svg
      width={totalW}
      height={s.totalHeight}
      viewBox={`0 0 ${totalW} ${s.totalHeight}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="LastKey Digital Legacy"
    >
      <defs>
        <linearGradient 
          id={`${id}_bg`} 
          x1="0" y1="0" 
          x2={b} y2={b} 
          gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f1729"/>
          <stop offset="100%" stopColor="#1a2540"/>
        </linearGradient>
        <linearGradient
          id={`${id}_key`}
          x1="0" y1="0"
          x2="1" y2="1">
          <stop offset="0%" stopColor="#f59e0b"/>
          <stop offset="100%" stopColor="#d97706"/>
        </linearGradient>
      </defs>

      {/* Badge background */}
      <rect
        x="0.5"
        y={(s.totalHeight - b) / 2 + 0.5}
        width={b - 1}
        height={b - 1}
        rx={r}
        fill={`url(#${id}_bg)`}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />

      {/* Key bow (circle) */}
      <circle
        cx={bowX}
        cy={(s.totalHeight - b) / 2 + bowY}
        r={bowR}
        stroke={keyColor}
        strokeWidth={b * 0.065}
        fill="none"
      />

      {/* Key shaft */}
      <rect
        x={shaftStartX}
        y={(s.totalHeight - b) / 2 + shaftY}
        width={shaftW}
        height={shaftH}
        rx={shaftH / 2}
        fill={keyColor}
      />

      {/* Tooth 1 */}
      <rect
        x={tooth1X}
        y={(s.totalHeight - b) / 2 + toothY}
        width={toothW}
        height={tooth1H}
        rx={toothW / 3}
        fill={keyColor}
      />

      {/* Tooth 2 */}
      <rect
        x={tooth2X}
        y={(s.totalHeight - b) / 2 + toothY}
        width={toothW}
        height={tooth2H}
        rx={toothW / 3}
        fill={keyColor}
      />

      {/* Text section */}
      {showText && (
        <>
          {/* LastKey */}
          <text
            x={b + s.gap}
            y={s.totalHeight / 2 - (s.tagSize > 0 ? 2 : 0)}
            fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
            fontSize={s.nameSize}
            fontWeight="700"
            fill={nameColor}
            letterSpacing="-0.02em"
            dominantBaseline="middle"
          >
            LastKey
          </text>

          {/* Digital Legacy */}
          <text
            x={b + s.gap + 1}
            y={s.totalHeight / 2 + s.nameSize * 0.72}
            fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
            fontSize={s.tagSize}
            fontWeight="500"
            fill="#6b7280"
            letterSpacing="0.06em"
          >
            DIGITAL LEGACY
          </text>
        </>
      )}
    </svg>
  )
}
