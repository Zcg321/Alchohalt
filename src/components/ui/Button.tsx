import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

const base = 'px-4 py-2 rounded focus:outline-none focus:ring';
const variants: Record<string, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const classes = [base, variants[variant], className].filter(Boolean).join(' ');
  return <button className={classes} {...props} />;
}
