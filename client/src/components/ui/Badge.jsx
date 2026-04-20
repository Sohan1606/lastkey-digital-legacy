/**
 * Badge Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} props.variant - 'ion' | 'plasma' | 'pulse' | 'amber' | 'danger' | 'muted'
 * @param {string} props.size - 'sm' | 'md'
 * @param {React.ReactNode} props.icon - Icon to display
 * @param {string} props.className - Additional CSS classes
 */
const Badge = ({
  children,
  variant = 'muted',
  size = 'md',
  icon: Icon,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-lg';
  
  const variants = {
    ion: 'bg-[#4f9eff]/10 text-[#4f9eff] border border-[#4f9eff]/25',
    plasma: 'bg-[#7c5cfc]/10 text-[#7c5cfc] border border-[#7c5cfc]/25',
    pulse: 'bg-[#00e5a0]/10 text-[#00e5a0] border border-[#00e5a0]/25',
    amber: 'bg-[#ffb830]/10 text-[#ffb830] border border-[#ffb830]/25',
    danger: 'bg-[#ff4d6d]/10 text-[#ff4d6d] border border-[#ff4d6d]/25',
    muted: 'bg-white/[0.03] text-[#8899bb] border border-white/[0.08]'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-[11px]'
  };

  return (
    <span
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 10 : 12} />}
      {children}
    </span>
  );
};

export default Badge;
