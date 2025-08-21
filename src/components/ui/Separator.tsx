import React from 'react';

export function Separator({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={`border-t my-4 ${className}`} {...props} />;
}
