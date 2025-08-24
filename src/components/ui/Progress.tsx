import React, { useId } from 'react';

interface ProgressProps {
  value: number;
  max: number;
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  valueText?: string;
}

const variants: Record<NonNullable<ProgressProps['variant']>, string> = {
  primary: 'accent-blue-600',
  success: 'accent-green-600',
  warning: 'accent-yellow-600',
  danger: 'accent-red-600',
};

export function Progress({ value, max, label, variant = 'primary', valueText }: ProgressProps) {
  const id = useId();
  return (
    <>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <progress
        id={id}
        value={value}
        max={max}
        aria-valuetext={valueText}
        className={`mt-1 w-full h-2 ${variants[variant]}`}
      />
    </>
  );
}
