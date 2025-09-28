import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const variants = {
  primary: 'bg-primary-100 text-primary-800 border-primary-200 dark:bg-primary-900/50 dark:text-primary-300 dark:border-primary-800',
  secondary: 'bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
  success: 'bg-success-100 text-success-800 border-success-200 dark:bg-success-900/50 dark:text-success-300 dark:border-success-800',
  warning: 'bg-warning-100 text-warning-800 border-warning-200 dark:bg-warning-900/50 dark:text-warning-300 dark:border-warning-800',
  danger: 'bg-danger-100 text-danger-800 border-danger-200 dark:bg-danger-900/50 dark:text-danger-300 dark:border-danger-800',
  neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function Badge({ 
  children, 
  variant = 'primary', 
  size = 'md',
  dot = false,
  className = '', 
  ...props 
}: BadgeProps) {
  if (dot) {
    return (
      <span className={cn('flex items-center', className)} {...props}>
        <span 
          className={cn(
            'inline-block w-2 h-2 rounded-full mr-2',
            variants[variant].split(' ')[0] // Get just the background color
          )} 
        />
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-md border transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
