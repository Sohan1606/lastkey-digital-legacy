import { motion } from 'framer-motion';

const LoadingSkeleton = ({ 
  className = "", 
  variant = "default", 
  lines = 3,
  height = "h-4",
  width = "w-full"
}) => {
  const skeletonVariants = {
    default: "rounded",
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg"
  };

  return (
    <div className={`space-y-2 ${className}`}>
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
          className={`${height} ${width} bg-gray-200 dark:bg-gray-700 ${skeletonVariants[variant]}`}
        />
      ))}
    </div>
  );
};

export const CardSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
  >
    <div className="flex items-start space-x-4">
      <LoadingSkeleton variant="circular" className="w-12 h-12 flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <LoadingSkeleton width="w-3/4" height="h-6" />
        <LoadingSkeleton lines={2} height="h-4" />
        <LoadingSkeleton width="w-1/2" height="h-4" />
      </div>
    </div>
  </motion.div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
        >
          <LoadingSkeleton variant="circular" className="w-8 h-8 mb-4" />
          <LoadingSkeleton height="h-6" className="mb-2" />
          <LoadingSkeleton height="h-4" width="w-3/4" />
        </motion.div>
      ))}
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export default LoadingSkeleton;
