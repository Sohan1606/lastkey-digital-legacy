import React, { forwardRef } from 'react';

/**
 * Input Component
 * 
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text
 * @param {React.ReactNode} props.icon - Icon to display
 * @param {string} props.className - Additional CSS classes
 */
const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-[#8899bb] uppercase tracking-wider mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3d5070]">
            <Icon size={18} />
          </div>
        )}
        
        <input
          ref={ref}
          className={`
            w-full bg-[#070e1b]/70 border rounded-xl py-3 px-4
            text-white text-sm placeholder-[#3d5070]
            transition-all duration-200
            focus:outline-none focus:border-[#4f9eff] focus:ring-2 focus:ring-[#4f9eff]/15
            hover:border-white/[0.16]
            ${Icon ? 'pl-11' : ''}
            ${error ? 'border-[#ff4d6d]' : 'border-white/[0.08]'}
            ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-2 text-xs text-[#ff4d6d]">
          {error}
        </p>
      )}
      
      {!error && helperText && (
        <p className="mt-2 text-xs text-[#8899bb]">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
