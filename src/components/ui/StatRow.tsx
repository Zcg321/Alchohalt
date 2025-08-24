import React from 'react';

interface StatRowProps {
  label: string;
  children: React.ReactNode;
}

export function StatRow({ label, children }: StatRowProps) {
  return (
    <div className="flex flex-col">
      <dt className="text-sm text-gray-600">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
