import { motion } from 'framer-motion';

/**
 * Card Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.variant - 'default' | 'hover' | 'interactive'
 * @param {string} props.padding - 'sm' | 'md' | 'lg' | 'none'
 * @param {Function} props.onClick - Click handler (makes card interactive)
 * @param {string} props.className - Additional CSS classes
 */
const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  onClick,
  className = '',
  ...props
}) => {
  const baseStyles = 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl';
  
  const variants = {
    default: '',
    hover: 'transition-all duration-300 hover:scale-[1.02] hover:border-white/[0.16] hover:shadow-xl',
    interactive: 'transition-all duration-300 hover:scale-[1.02] hover:border-white/[0.16] hover:shadow-xl cursor-pointer'
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      whileHover={onClick ? { scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${paddings[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </Component>
  );
};

/**
 * Card Header Component
 */
export const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

/**
 * Card Title Component
 */
export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-bold text-white ${className}`}>
    {children}
  </h3>
);

/**
 * Card Description Component
 */
export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-[#8899bb] mt-1 ${className}`}>
    {children}
  </p>
);

/**
 * Card Content Component
 */
export const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

/**
 * Card Footer Component
 */
export const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t border-white/[0.08] flex items-center gap-3 ${className}`}>
    {children}
  </div>
);

export default Card;
