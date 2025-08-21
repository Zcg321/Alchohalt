import React, { ReactNode } from 'react';

export function Table({ children }: { children: ReactNode }) {
  return <table className="w-full text-left border-collapse">{children}</table>;
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="border-b bg-gray-50">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y">{children}</tbody>;
}

export function TR({ children }: { children: ReactNode }) {
  return <tr>{children}</tr>;
}

export function TH({ children }: { children: ReactNode }) {
  return <th className="px-2 py-1 font-medium">{children}</th>;
}

export function TD({ children }: { children: ReactNode }) {
  return <td className="px-2 py-1">{children}</td>;
}

