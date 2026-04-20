import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * Button Component
 * 
 * @param {Object} props
 * @param {string} props.variant - 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
 * @param {string} props.size - 'sm' | 'md' | 'lg'
 * @param {boolean} props.loading - Show loading spinner
 * @param {boolean} props.disabled - Disable button
 * @param {React.ReactNode} props.children - Button content
 * @param {React.ReactNode} props.icon - Icon to display
 * @param {string} props.className - Additional CSS classes
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  icon: Icon,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#030508]';
  
  const variants = {
    primary: 'bg-gradient-to-r from-[#4f9eff] to-[#7c5cfc] text-white hover:shadow-[0_0_32px_rgba(79,158,255,0.55)] focus:ring-[#4f9eff]/30',
    secondary: 'bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] text-white hover:bg-white/[0.1] hover:border-white/[0.2] focus:ring-white/20',
    danger: 'bg-[#ff4d6d]/10 border border-[#ff4d6d]/25 text-[#ff4d6d] hover:bg-[#ff4d6d]/20 focus:ring-[#ff4d6d]/30',
    success: 'bg-gradient-to-r from-[#00b87a] to-[#00e5a0] text-[#001a12] hover:shadow-[0_0_32px_rgba(0,229,160,0.55)] focus:ring-[#00e5a0]/30',
    ghost: 'bg-transparent text-[#8899bb] hover:text-white hover:bg-white/[0.05] focus:ring-white/20'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      disabled={isDisabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      {loading && <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="animate-spin" />}
      {!loading && Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      {children}
    </motion.button>
  );
};

export default Button;
