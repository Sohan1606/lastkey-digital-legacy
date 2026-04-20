/**
 * ProgressBar Component
 * 
 * @param {Object} props
 * @param {number} props.value - Current progress value (0-100)
 * @param {number} props.max - Maximum value (default: 100)
 * @param {string} props.variant - 'default' | 'gradient' | 'success' | 'warning' | 'danger'
 * @param {string} props.size - 'sm' | 'md' | 'lg'
 * @param {boolean} props.showLabel - Show percentage label
 * @param {string} props.className - Additional CSS classes
 */
const ProgressBar = ({
  value,
  max = 100,
  variant = 'gradient',
  size = 'md',
  showLabel = false,
  className = '',
  ...props
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const sizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };

  const variants = {
    default: 'bg-[#4f9eff]',
    gradient: 'bg-gradient-to-r from-[#00e5a0] to-[#4f9eff]',
    success: 'bg-[#00e5a0]',
    warning: 'bg-[#ffb830]',
    danger: 'bg-[#ff4d6d]'
  };

  return (
    <div className={`w-full ${className}`} {...props}>
      <div className={`w-full bg-white/[0.08] rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${variants[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-[#8899bb]">{Math.round(percentage)}%</span>
          <span className="text-xs text-[#3d5070]">{value}/{max}</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
