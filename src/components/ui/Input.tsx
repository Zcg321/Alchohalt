import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  success?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, success, leftIcon, rightIcon, ...props }, ref) => {
    const hasError = !!error;
    const hasSuccess = !!success;
    
    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-neutral-500 dark:text-neutral-400">
              {leftIcon}
            </span>
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'input',
            hasError && 'border-danger-300 focus:border-danger-500 focus:ring-danger-500',
            hasSuccess && 'border-success-300 focus:border-success-500 focus:ring-success-500',
            leftIcon ? 'pl-10' : '',
            rightIcon ? 'pr-10' : '',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <span className="text-neutral-500 dark:text-neutral-400">
              {rightIcon}
            </span>
          </div>
        )}
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
