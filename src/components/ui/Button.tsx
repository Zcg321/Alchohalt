import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  type?: React.ButtonHTMLAttributes<HTMLButtonElement>['type'];
}

const base =
  'px-4 py-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
const variants: Record<string, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600',
  secondary:
    'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-600',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
};

export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  const classes = [base, variants[variant], className].filter(Boolean).join(' ');
  return <button type={type} className={classes} {...props} />;
}
