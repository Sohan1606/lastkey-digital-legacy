import React from 'react';

const BrandMark = ({ size = 24, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none" 
      className={className}
      style={{ filter: 'drop-shadow(0 0 8px var(--glow-ion))' }}
    >
      {/* Key shape with heart integration */}
      <path d="M32 8C20.3 8 10 18.3 10 30c0 6.6 3.4 12.5 8.7 16L32 64l13.3-18c5.3-3.5 8.7-9.4 8.7-16 0-11.7-10.3-22-22-22z" fill="var(--ion)" stroke="var(--text-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Heart inside key head */}
      <path d="m25 20 4 4 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Glow ring */}
      <circle cx="32" cy="30" r="20" fill="none" stroke="var(--pulse)" strokeWidth="1" opacity="0.6"/>
    </svg>
  );
};

export default BrandMark;

