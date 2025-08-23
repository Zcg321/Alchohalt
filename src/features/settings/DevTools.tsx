import React from 'react';
export default function DevTools(){
  if (!import.meta.env.DEV) return null;
  async function clearCaches() {
    const regs = await navigator.serviceWorker?.getRegistrations?.() || [];
    await Promise.all(regs.map(r=>r.unregister()));
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
    }
    location.reload();
  }
  return (
    <div className="p-4 mt-4 border rounded-2xl">
      <h2 className="font-semibold mb-2">Developer Tools</h2>
      <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={clearCaches}>Clear PWA Cache & Unregister SW</button>
    </div>
  );
}
