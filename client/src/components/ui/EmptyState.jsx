import React from 'react';
import { motion } from 'framer-motion';
import Button from './Button';

/**
 * EmptyState Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon component
 * @param {string} props.title - Empty state title
 * @param {string} props.description - Empty state description
 * @param {string} props.actionLabel - Action button label
 * @param {Function} props.onAction - Action button click handler
 * @param {React.ReactNode} props.children - Additional content
 * @param {string} props.className - Additional CSS classes
 */
const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  children,
  className = '',
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex flex-col items-center justify-center text-center p-12
        ${className}
      `}
      {...props}
    >
      {Icon && (
        <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-6">
          <Icon size={36} className="text-[#8899bb]" />
        </div>
      )}
      
      {title && (
        <h3 className="text-lg font-semibold text-white mb-2">
          {title}
        </h3>
      )}
      
      {description && (
        <p className="text-sm text-[#8899bb] max-w-sm mb-6">
          {description}
        </p>
      )}
      
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="secondary">
          {actionLabel}
        </Button>
      )}
      
      {children}
    </motion.div>
  );
};

export default EmptyState;
