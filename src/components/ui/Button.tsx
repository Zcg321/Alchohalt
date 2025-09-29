import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary', 
  success: 'btn-success',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
  outline: 'btn-outline',
};

const sizes = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({ 
  variant = 'primary', 
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className = '', 
  children,
  disabled,
  ...props 
}: ButtonProps) {
  const isDisabled = disabled || loading;
  
  return (
    <button 
      className={cn(
        'btn',
        variants[variant],
        sizes[size],
        loading && 'relative text-transparent',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {leftIcon && !loading && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && !loading && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
}
