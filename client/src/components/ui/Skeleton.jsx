/**
 * Skeleton Component
 * 
 * @param {Object} props
 * @param {string} props.variant - 'text' | 'circle' | 'card' | 'rect'
 * @param {number} props.width - Width in pixels or percentage
 * @param {number} props.height - Height in pixels
 * @param {string} props.className - Additional CSS classes
 */
const Skeleton = ({
  variant = 'text',
  width,
  height,
  className = '',
  ...props
}) => {
  const baseStyles = 'bg-white/[0.08] animate-pulse';
  
  const variants = {
    text: 'h-4 rounded',
    circle: 'rounded-full',
    card: 'h-32 rounded-xl',
    rect: 'rounded-lg'
  };

  const style = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={style}
      {...props}
    />
  );
};

/**
 * Skeleton Text Lines Component
 */
export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === lines - 1 ? '75%' : '100%'}
      />
    ))}
  </div>
);

/**
 * Skeleton Card Component
 */
export const SkeletonCard = ({ className = '' }) => (
  <div className={`p-6 bg-white/[0.03] border border-white/[0.08] rounded-2xl ${className}`}>
    <div className="flex items-center gap-4 mb-4">
      <Skeleton variant="circle" width={48} height={48} />
      <div className="flex-1">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" className="mt-2" />
      </div>
    </div>
    <SkeletonText lines={2} />
  </div>
);

/**
 * Skeleton Avatar Component
 */
export const SkeletonAvatar = ({ size = 48, className = '' }) => (
  <Skeleton variant="circle" width={size} height={size} className={className} />
);

export default Skeleton;
