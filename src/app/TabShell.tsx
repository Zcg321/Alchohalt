/**
 * TabShell — 5-tab navigation chrome.
 * ===================================
 *
 * Sprint 2A `[IA-2]`. Bottom-tab on mobile (Capacitor target),
 * top-nav on desktop. State-only routing — no router lib introduced.
 * Tab is also reflected to ?tab= so a refresh keeps the user where
 * they were; deep links to /crisis or other routes still pre-empt
 * (handled in AlcoholCoachApp).
 *
 * Active styling per spec:
 *   - Mobile: subtle weight bump + sage underline (bottom border).
 *   - Desktop: sage left-border accent + weight bump.
 * No screaming colors. No badges. Gamification deprecate ([IA-5])
 * pulled the badge framework anyway.
 */

import React, { useEffect, useState } from 'react';

export type TabId = 'today' | 'track' | 'goals' | 'insights' | 'settings';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'today',    label: 'Today',    icon: <IconHome /> },
  { id: 'track',    label: 'Track',    icon: <IconList /> },
  { id: 'goals',    label: 'Goals',    icon: <IconTarget /> },
  { id: 'insights', label: 'Insights', icon: <IconChart /> },
  { id: 'settings', label: 'Settings', icon: <IconGear /> },
];

interface Props {
  panels: Record<TabId, React.ReactNode>;
  /** Optional: control the active tab from the parent (e.g. when a CTA
   * elsewhere asks the shell to jump to Insights). */
  activeTab?: TabId;
  onChange?: (tab: TabId) => void;
}

function readInitialTab(): TabId {
  if (typeof window === 'undefined') return 'today';
  const params = new URLSearchParams(window.location.search);
  const t = params.get('tab') as TabId | null;
  if (t && (TABS.find((x) => x.id === t))) return t;
  return 'today';
}

export default function TabShell({ panels, activeTab, onChange }: Props) {
  const [internal, setInternal] = useState<TabId>(readInitialTab);
  const tab = activeTab ?? internal;

  function go(next: TabId) {
    if (onChange) onChange(next);
    else setInternal(next);
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', next);
      window.history.replaceState({}, '', url.toString());
    }
  }

  // Re-sync if the URL changes externally (deep link).
  useEffect(() => {
    function onPop() {
      const t = readInitialTab();
      if (!activeTab) setInternal(t);
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [activeTab]);

  return (
    <>
      {/* Desktop top-nav. Hidden on mobile. */}
      <nav
        aria-label="Primary"
        className="hidden lg:block sticky top-0 z-30 border-b border-border-soft bg-surface/85 backdrop-blur"
      >
        <div className="mx-auto max-w-3xl px-4 py-2 flex items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => go(t.id)}
              className={`px-4 py-2 rounded-md text-caption transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 ${
                tab === t.id
                  ? 'text-ink font-medium border-l-2 border-sage-700 bg-sage-50/40'
                  : 'text-ink-soft hover:text-ink hover:bg-cream-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Active panel. Mobile gets bottom padding so the fixed bottom-tab
          doesn't overlap content. */}
      <div className="pb-24 lg:pb-0">
        {panels[tab]}
      </div>

      {/* Mobile bottom-tab. Fixed, only on mobile. */}
      <nav
        aria-label="Primary (mobile)"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border-soft bg-surface/95 backdrop-blur safe-bottom"
      >
        <ul role="tablist" className="grid grid-cols-5">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => go(t.id)}
                  className={`w-full flex flex-col items-center gap-1 py-2 text-micro transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 ${
                    active ? 'text-sage-700 font-medium' : 'text-ink-subtle hover:text-ink'
                  }`}
                >
                  <span aria-hidden className="h-5 w-5">{t.icon}</span>
                  <span>{t.label}</span>
                  <span
                    aria-hidden
                    className={`mt-0.5 h-0.5 w-6 rounded-pill ${active ? 'bg-sage-700' : 'bg-transparent'}`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

// ---------- Icons (inline, no external dep) ----------
function IconHome() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
function IconList() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="3.5" cy="6" r="1" />
      <circle cx="3.5" cy="12" r="1" />
      <circle cx="3.5" cy="18" r="1" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <line x1="4" y1="20" x2="20" y2="20" />
      <rect x="6" y="12" width="3" height="6" />
      <rect x="11" y="8" width="3" height="10" />
      <rect x="16" y="14" width="3" height="4" />
    </svg>
  );
}
function IconGear() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.7 1 1.1 1.5 1.1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}
