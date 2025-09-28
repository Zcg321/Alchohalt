import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className, ...rest }: CardProps) {
  const classes = className ? 'card ' + className : 'card';
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}