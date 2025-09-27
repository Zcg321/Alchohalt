import React from 'react';
import { cn } from '../../lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  'aria-label'?: string;
}

const sizes = {
  sm: 'w-8 h-5',
  md: 'w-10 h-6',
  lg: 'w-12 h-7',
};

const thumbSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const translateX = {
  sm: 'translate-x-3',
  md: 'translate-x-4',
  lg: 'translate-x-5',
};

export function Toggle({ 
  checked, 
  onChange, 
  disabled = false,
  size = 'md',
  children,
  'aria-label': ariaLabel,
}: ToggleProps) {
  return (
    <label className={cn(
      'inline-flex items-center',
      children ? 'gap-3' : '',
      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
    )}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          aria-label={ariaLabel}
          className="sr-only"
        />
        <div className={cn(
          'relative inline-flex items-center rounded-full border-2 transition-colors duration-200 ease-in-out',
          sizes[size],
          checked 
            ? 'bg-primary-600 border-primary-600' 
            : 'bg-neutral-200 border-neutral-200 dark:bg-neutral-700 dark:border-neutral-600',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2'
        )}>
          <div className={cn(
            'absolute left-1 inline-block rounded-full bg-white shadow-lg transform transition-transform duration-200 ease-in-out',
            thumbSizes[size],
            checked ? translateX[size] : 'translate-x-0'
          )} />
        </div>
      </div>
      {children && (
        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {children}
        </span>
      )}
    </label>
  );
}