import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  variant?: 'rectangular' | 'circular' | 'text';
}

export function Skeleton({ 
  width,
  height = '1rem',
  variant = 'rectangular',
  className = '',
  style,
  ...props 
}: SkeletonProps) {
  const variantClasses = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4',
  };

  const inlineStyles = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  };

  return (
    <div
      className={cn(
        'skeleton',
        variantClasses[variant],
        className
      )}
      style={inlineStyles}
      {...props}
    />
  );
}

// Pre-built skeleton components for common use cases
export function SkeletonText({ lines = 1, ...props }: { lines?: number } & Omit<SkeletonProps, 'variant'>) {
  if (lines === 1) {
    return <Skeleton variant="text" {...props} />;
  }
  
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i}
          variant="text" 
          width={i === lines - 1 ? '75%' : '100%'}
          {...props}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return (
    <Skeleton 
      variant="circular" 
      width={size} 
      height={size} 
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="card-header">
        <div className="flex items-center space-x-3">
          <SkeletonAvatar />
          <div className="flex-1">
            <SkeletonText />
            <div className="mt-1">
              <SkeletonText width="60%" />
            </div>
          </div>
        </div>
      </div>
      <div className="card-content">
        <SkeletonText lines={3} />
      </div>
    </div>
  );
}