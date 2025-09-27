import React from 'react';
import { cn } from '../../lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className = '', required, children, ...props }: LabelProps) {
  return (
    <label className={cn('label', className)} {...props}>
      {children}
      {required && <span className="text-danger-500 ml-1">*</span>}
    </label>
  );
}
