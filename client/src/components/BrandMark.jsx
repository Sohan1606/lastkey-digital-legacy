import React from 'react';

const BrandMark = ({ size = 32, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4C12 2.89543 12.8954 2 14 2H18C19.1046 2 20 2.89543 20 4V12C20 13.1046 19.1046 14 18 14H14C12.8954 14 12 13.1046 12 12V4Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 14V24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 20L20 24L16 28L12 24L12 20Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="16" cy="8" r="1" fill={color}/>
  </svg>
);

export default BrandMark;

