import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

export function Tabs({ defaultValue, children }: { defaultValue: string; children: ReactNode }) {
  const [value, setValue] = useState(defaultValue);
  return <TabsContext.Provider value={{ value, setValue }}>{children}</TabsContext.Provider>;
}

export function TabsList({ children }: { children: ReactNode }) {
  return (
    <div role="tablist" className="flex space-x-2 border-b">
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsTrigger must be used within Tabs');
  const active = ctx.value === value;
  return (
    <button
      role="tab"
      aria-selected={active}
      className={`px-3 py-1 -mb-px border-b-2 focus:outline-none focus:ring ${active ? 'border-blue-500' : 'border-transparent'}`}
      onClick={() => ctx.setValue(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsContent must be used within Tabs');
  return ctx.value === value ? (
    <div role="tabpanel" className="mt-4">
      {children}
    </div>
  ) : null;
}

