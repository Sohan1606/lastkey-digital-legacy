import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Professional Button Component
 * 
 * Variants: primary, secondary, danger, success, ghost
 * Sizes: sm, md, lg
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const baseClasses = `
    inline-flex items-center justify-center gap-2 font-semibold rounded-xl
    transition-all duration-200 outline-none focus:ring-2 focus:ring-[#4f9eff]/30
    disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]
  `;

  const variantClasses = {
    primary: 'bg-gradient-to-r from-[#4f9eff] to-[#7c5cfc] text-white shadow-lg shadow-[#4f9eff]/20 hover:shadow-xl hover:shadow-[#4f9eff]/30 hover:-translate-y-0.5',
    secondary: 'bg-white/[0.06] border border-white/[0.12] text-[#f0f4ff] hover:bg-white/[0.10] hover:border-[#4f9eff]/40',
    danger: 'bg-[#ff4d6d]/10 border border-[#ff4d6d]/25 text-[#ff4d6d] hover:bg-[#ff4d6d]/20 hover:shadow-lg hover:shadow-[#ff4d6d]/20',
    success: 'bg-gradient-to-r from-[#00b87a] to-[#00e5a0] text-[#001a12] font-bold shadow-lg shadow-[#00e5a0]/20 hover:shadow-xl hover:shadow-[#00e5a0]/30',
    ghost: 'bg-transparent text-[#8899bb] hover:text-[#f0f4ff] hover:bg-white/[0.05]'
  };

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-5 py-2.5',
    lg: 'text-base px-6 py-3.5'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
