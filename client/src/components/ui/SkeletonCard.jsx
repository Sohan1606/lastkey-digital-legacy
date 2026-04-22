import React from 'react';
import { motion } from 'framer-motion';

/**
 * SkeletonCard Component - Loading skeleton placeholder
 * 
 * A versatile skeleton loading component that provides visual placeholders
 * while content is loading. Supports various card layouts and animations.
 * 
 * @param {Object} props - Component props
 * @param {string} props.variant - Card variant: 'default', 'card', 'list', 'avatar', 'text' (default: 'default')
 * @param {boolean} props.animate - Whether to show shimmer animation (default: true)
 * @param {number} props.lines - Number of text lines to show (for text variants)
 * @param {boolean} props.showAvatar - Whether to show avatar placeholder
 * @param {boolean} props.showImage - Whether to show image placeholder
 * @param {boolean} props.showButton - Whether to show button placeholder
 * @param {string} props.width - Custom width for the skeleton
 * @param {string} props.height - Custom height for the skeleton
 * @param {string} props.className - Additional CSS classes
 */
const SkeletonCard = ({
  variant = 'default',
  animate = true,
  lines = 3,
  showAvatar = false,
  showImage = false,
  showButton = false,
  width,
  height,
  className = ''
}) => {
  // Base skeleton styles
  const baseSkeletonStyle = {
    background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)',
    backgroundSize: '200% 100%',
    borderRadius: '8px',
    position: 'relative',
    overflow: 'hidden'
  };

  // Animated shimmer effect
  const shimmerStyle = animate ? {
    animation: 'shimmer 1.5s ease-in-out infinite'
  } : {};

  // Render different variants
  const renderVariant = () => {
    switch (variant) {
      case 'card':
        return renderCardSkeleton();
      case 'list':
        return renderListSkeleton();
      case 'avatar':
        return renderAvatarSkeleton();
      case 'text':
        return renderTextSkeleton();
      default:
        return renderDefaultSkeleton();
    }
  };

  // Default card skeleton
  const renderDefaultSkeleton = () => (
    <div style={{
      width: width || '100%',
      height: height || '120px',
      padding: '20px',
      background: '#050d1a',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      ...baseSkeletonStyle,
      ...shimmerStyle
    }} />
  );

  // Card skeleton with header, content, and footer
  const renderCardSkeleton = () => (
    <div style={{
      width: width || '100%',
      background: '#050d1a',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {showAvatar && (
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            ...baseSkeletonStyle,
            ...shimmerStyle
          }} />
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            width: '60%',
            height: '16px',
            ...baseSkeletonStyle,
            ...shimmerStyle
          }} />
          <div style={{
            width: '40%',
            height: '12px',
            ...baseSkeletonStyle,
            ...shimmerStyle
          }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            style={{
              width: index === lines - 1 ? '70%' : '100%',
              height: '14px',
              ...baseSkeletonStyle,
              ...shimmerStyle
            }}
          />
        ))}
      </div>

      {/* Footer */}
      {(showButton || showImage) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '8px'
        }}>
          {showImage && (
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '8px',
              ...baseSkeletonStyle,
              ...shimmerStyle
            }} />
          )}
          {showButton && (
            <div style={{
              width: '100px',
              height: '36px',
              borderRadius: '8px',
              ...baseSkeletonStyle,
              ...shimmerStyle,
              marginLeft: showImage ? 'auto' : '0'
            }} />
          )}
        </div>
      )}
    </div>
  );

  // List item skeleton
  const renderListSkeleton = () => (
    <div style={{
      width: width || '100%',
      padding: '16px',
      background: '#050d1a',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      {showAvatar && (
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          flexShrink: 0,
          ...baseSkeletonStyle,
          ...shimmerStyle
        }} />
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{
          width: '80%',
          height: '14px',
          ...baseSkeletonStyle,
          ...shimmerStyle
        }} />
        <div style={{
          width: '60%',
          height: '12px',
          ...baseSkeletonStyle,
          ...shimmerStyle
        }} />
      </div>
      <div style={{
        width: '80px',
        height: '28px',
        borderRadius: '6px',
        flexShrink: 0,
        ...baseSkeletonStyle,
        ...shimmerStyle
      }} />
    </div>
  );

  // Avatar skeleton
  const renderAvatarSkeleton = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      width: width || '100%'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        flexShrink: 0,
        ...baseSkeletonStyle,
        ...shimmerStyle
      }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{
          width: '120px',
          height: '16px',
          ...baseSkeletonStyle,
          ...shimmerStyle
        }} />
        <div style={{
          width: '150px',
          height: '12px',
          ...baseSkeletonStyle,
          ...shimmerStyle
        }} />
      </div>
    </div>
  );

  // Text lines skeleton
  const renderTextSkeleton = () => (
    <div style={{
      width: width || '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          style={{
            width: index === lines - 1 ? '70%' : '100%',
            height: height || '14px',
            ...baseSkeletonStyle,
            ...shimmerStyle
          }}
        />
      ))}
    </div>
  );

  return (
    <div className={`skeleton-card ${className}`}>
      {renderVariant()}
      
      {/* Shimmer animation styles */}
      {animate && (
        <style jsx>{`
          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
        `}</style>
      )}
    </div>
  );
};

/**
 * SkeletonGrid - Grid of skeleton cards for loading states
 */
export const SkeletonGrid = ({
  count = 6,
  columns = 3,
  variant = 'card',
  gap = '16px',
  ...skeletonProps
}) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: gap,
    width: '100%'
  }}>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard
        key={index}
        variant={variant}
        {...skeletonProps}
      />
    ))}
  </div>
);

/**
 * SkeletonTable - Table skeleton for loading states
 */
export const SkeletonTable = ({
  rows = 5,
  columns = 4,
  showHeader = true
}) => (
  <div style={{
    width: '100%',
    background: '#050d1a',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    overflow: 'hidden'
  }}>
    {/* Header */}
    {showHeader && (
      <div style={{
        display: 'flex',
        padding: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.02)'
      }}>
        {Array.from({ length: columns }).map((_, index) => (
          <div
            key={index}
            style={{
              flex: 1,
              height: '16px',
              marginRight: index < columns - 1 ? '16px' : '0',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.1) 100%)',
              backgroundSize: '200% 100%',
              borderRadius: '4px',
              animation: 'shimmer 1.5s ease-in-out infinite'
            }}
          />
        ))}
      </div>
    )}

    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        style={{
          display: 'flex',
          padding: '16px',
          borderBottom: rowIndex < rows - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
        }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div
            key={colIndex}
            style={{
              flex: 1,
              height: '14px',
              marginRight: colIndex < columns - 1 ? '16px' : '0',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)',
              backgroundSize: '200% 100%',
              borderRadius: '4px',
              animation: 'shimmer 1.5s ease-in-out infinite',
              animationDelay: `${rowIndex * 0.1}s`
            }}
          />
        ))}
      </div>
    ))}
  </div>
);

/**
 * SkeletonStats - Stats cards skeleton for dashboard loading
 */
export const SkeletonStats = ({ count = 4 }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: `repeat(${count}, 1fr)`,
    gap: '20px',
    marginBottom: '32px'
  }}>
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        style={{
          background: '#050d1a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s ease-in-out infinite'
        }} />
        <div style={{
          width: '60%',
          height: '24px',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)',
          backgroundSize: '200% 100%',
          borderRadius: '4px',
          animation: 'shimmer 1.5s ease-in-out infinite'
        }} />
        <div style={{
          width: '80%',
          height: '14px',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)',
          backgroundSize: '200% 100%',
          borderRadius: '4px',
          animation: 'shimmer 1.5s ease-in-out infinite'
        }} />
      </div>
    ))}
  </div>
);

export default SkeletonCard;
