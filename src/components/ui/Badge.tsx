import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'neutral' | 'danger';
}

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  primary: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  neutral: 'bg-gray-200 text-gray-800',
  danger: 'bg-red-100 text-red-800',
};

export function Badge({ children, variant = 'primary', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
