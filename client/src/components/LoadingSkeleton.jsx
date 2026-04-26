import React from 'react';
import { motion } from 'framer-motion';

const sizeMap = (token, fallback) => {
  const m = typeof token === 'string' ? token.match(/^(w|h)-(\d+)$/) : null;
  if (!m) return fallback;
  const n = Number(m[2]);
  if (!Number.isFinite(n)) return fallback;
  // Tailwind spacing scale approximation (4 => 16px)
  return n * 4;
};

const LoadingSkeleton = ({ 
  className = "", 
  variant = "default", 
  lines = 3,
  height = "h-4",
  width = "w-full"
}) => {
  const radius =
    variant === 'circular' ? 999 :
    variant === 'rectangular' ? 12 :
    10;

  const hPx = sizeMap(height, 16);
  const wStyle = width === 'w-full'
    ? { width: '100%' }
    : width === 'w-3/4'
      ? { width: '75%' }
      : width === 'w-1/2'
        ? { width: '50%' }
        : { width: typeof width === 'string' ? width : '100%' };

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          animate={{
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.1,
          }}
          className="skeleton"
          style={{ height: hPx, borderRadius: radius, ...wStyle }}
        />
      ))}
    </div>
  );
};

export const CardSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass"
    style={{ padding: 24, borderRadius: 20 }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <div style={{ width: 48, height: 48, flexShrink: 0 }}>
        <LoadingSkeleton variant="circular" lines={1} height="h-12" width="w-full" />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <LoadingSkeleton width="w-3/4" height="h-6" />
        <LoadingSkeleton lines={2} height="h-4" />
        <LoadingSkeleton width="w-1/2" height="h-4" />
      </div>
    </div>
  </motion.div>
);

export const DashboardSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          style={{ background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 18, padding: 18 }}
        >
          <div style={{ width: 32, height: 32, marginBottom: 14 }}>
            <LoadingSkeleton variant="circular" lines={1} height="h-8" width="w-full" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <LoadingSkeleton lines={1} height="h-6" width="w-3/4" />
          </div>
          <LoadingSkeleton height="h-4" width="w-3/4" />
        </motion.div>
      ))}
    </div>
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    {/* Header */}
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 16, padding: '12px 0', borderBottom: '1px solid var(--glass-border)' }}>
      {Array.from({ length: columns }).map((_, i) => (
        <LoadingSkeleton key={`header-${i}`} width="w-3/4" height="h-5" lines={1} />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 16, padding: '16px 0', borderBottom: '1px solid var(--glass-border-subtle)' }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <LoadingSkeleton key={`cell-${rowIndex}-${colIndex}`} width={colIndex === 0 ? "w-full" : "w-3/4"} height="h-4" lines={1} />
        ))}
      </div>
    ))}
  </div>
);

export const FormSkeleton = ({ fields = 4 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <LoadingSkeleton width="w-1/4" height="h-4" lines={1} />
        <LoadingSkeleton height="h-10" lines={1} />
      </div>
    ))}
    <LoadingSkeleton width="w-1/3" height="h-12" lines={1} style={{ marginTop: 12 }} />
  </div>
);

export const VaultSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    {/* Header area */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <LoadingSkeleton width="w-48" height="h-8" lines={1} />
      <LoadingSkeleton width="w-32" height="h-10" lines={1} />
    </div>
    {/* Asset cards */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          style={{ background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 20 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <LoadingSkeleton variant="circular" width="w-10" height="h-10" lines={1} />
            <div style={{ flex: 1 }}>
              <LoadingSkeleton width="w-3/4" height="h-5" lines={1} />
            </div>
          </div>
          <LoadingSkeleton lines={2} height="h-4" />
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <LoadingSkeleton width="w-20" height="h-8" lines={1} />
            <LoadingSkeleton width="w-20" height="h-8" lines={1} />
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export const BeneficiarySkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <LoadingSkeleton width="w-56" height="h-8" lines={1} />
      <LoadingSkeleton width="w-40" height="h-10" lines={1} />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08 }}
          style={{ background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 20 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <LoadingSkeleton variant="circular" width="w-14" height="h-14" lines={1} />
            <div style={{ flex: 1 }}>
              <LoadingSkeleton width="w-3/4" height="h-5" lines={1} />
              <div style={{ marginTop: 8 }}>
                <LoadingSkeleton width="w-1/2" height="h-4" lines={1} />
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--glass-border-subtle)' }}>
            <LoadingSkeleton width="w-full" height="h-10" lines={1} />
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default LoadingSkeleton;
