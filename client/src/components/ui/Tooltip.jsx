import { useState } from 'react';

/**
 * Tooltip Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Trigger element
 * @param {string} props.content - Tooltip content
 * @param {string} props.position - 'top' | 'bottom' | 'left' | 'right'
 * @param {string} props.className - Additional CSS classes
 */
const Tooltip = ({
  children,
  content,
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrows = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[#0b1629]',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[#0b1629]',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[#0b1629]',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[#0b1629]'
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && content && (
        <div className={`absolute z-50 ${positions[position]}`}>
          <div className="px-3 py-1.5 text-xs bg-[#0b1629] text-white border border-white/[0.1] rounded-lg whitespace-nowrap shadow-xl">
            {content}
          </div>
          <div className={`absolute w-0 h-0 border-4 border-transparent ${arrows[position]}`} />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
