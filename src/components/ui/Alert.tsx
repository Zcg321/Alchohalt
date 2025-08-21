import React from 'react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
}

const variants: Record<string, string> = {
  default: 'bg-blue-50 text-blue-800 border-blue-200',
  destructive: 'bg-red-50 text-red-800 border-red-200',
};

export function Alert({ variant = 'default', className = '', ...props }: AlertProps) {
  const cls = `border rounded p-4 ${variants[variant]} ${className}`;
  return <div role="alert" className={cls} {...props} />;
}

export function AlertTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={`font-bold mb-2 ${className}`} {...props} />;
}

export function AlertDescription({ className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={className} {...props} />;
}
