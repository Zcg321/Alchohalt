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
 *
 * [A11Y-TABSHELL] Conforms to the WAI-ARIA 1.2 tabs pattern:
 *   - Exactly one <div role="tablist"> per nav (no <ul>/<li> wrapping —
 *     ARIA requires role="tab" children to be direct children of
 *     role="tablist", which the previous <ul role="tablist"><li><button
 *     role="tab"></li></ul> structure violated, generating
 *     aria-required-children + aria-required-parent + listitem axe
 *     violations on every screen).
 *   - role="tab" buttons carry id, aria-selected, aria-controls.
 *   - Roving tabindex: only the active tab is in tab order; arrow keys
 *     move focus + activate sibling tabs.
 *   - Home/End jump to first/last; Enter/Space activate (default).
 *   - Panel wrapper has role="tabpanel" + aria-labelledby + tabindex=0
 *     so the keyboard user can land on the panel after activating a tab.
 */

import React, { useEffect, useRef, useState } from 'react';

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

const TAB_ID = (variant: 'desktop' | 'mobile', id: TabId) => `tab-${variant}-${id}`;
const PANEL_ID = (id: TabId) => `panel-${id}`;

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
      <DesktopTablist tab={tab} onSelect={go} />

      {/* The active panel. Promoted to role="tabpanel" so the WAI-ARIA
          tabs contract is honored. Mobile gets bottom padding so the
          fixed bottom-tab doesn't overlap content. */}
      <div
        id={PANEL_ID(tab)}
        role="tabpanel"
        aria-labelledby={TAB_ID('desktop', tab)}
        tabIndex={0}
        className="pb-24 lg:pb-0 focus:outline-none"
      >
        {panels[tab]}
      </div>

      <MobileTablist tab={tab} onSelect={go} />
    </>
  );
}

interface TablistProps {
  tab: TabId;
  onSelect: (id: TabId) => void;
}

/** Shared keydown handler implementing WAI-ARIA tabs keyboard contract. */
function makeKeydownHandler(
  tab: TabId,
  onSelect: (id: TabId) => void,
  refs: React.MutableRefObject<Record<TabId, HTMLButtonElement | null>>,
) {
  return (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = TABS.findIndex((t) => t.id === tab);
    if (idx < 0) return;
    let next = idx;
    switch (e.key) {
      case 'ArrowLeft':
        next = (idx - 1 + TABS.length) % TABS.length;
        break;
      case 'ArrowRight':
        next = (idx + 1) % TABS.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = TABS.length - 1;
        break;
      default:
        return; // Enter/Space: default <button> behavior fires onClick
    }
    e.preventDefault();
    const nextTab = TABS[next];
    if (!nextTab) return;
    const nextId = nextTab.id;
    onSelect(nextId);
    // After re-render the new tab will be tabIndex=0; focus it.
    requestAnimationFrame(() => {
      refs.current[nextId]?.focus();
    });
  };
}

function DesktopTablist({ tab, onSelect }: TablistProps) {
  const refs = useRef<Record<TabId, HTMLButtonElement | null>>({} as Record<TabId, HTMLButtonElement | null>);
  return (
    <nav
      aria-label="Primary navigation"
      className="hidden lg:block sticky top-0 z-30 border-b border-border-soft bg-surface/85 backdrop-blur"
    >
      <div
        role="tablist"
        aria-label="Primary"
        aria-orientation="horizontal"
        onKeyDown={makeKeydownHandler(tab, onSelect, refs)}
        className="mx-auto max-w-3xl px-4 py-2 flex items-center gap-1"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              ref={(el) => { refs.current[t.id] = el; }}
              type="button"
              role="tab"
              id={TAB_ID('desktop', t.id)}
              aria-selected={active}
              aria-controls={PANEL_ID(t.id)}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(t.id)}
              className={`px-4 py-2 rounded-md text-caption transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 ${
                active
                  ? 'text-ink font-medium border-l-2 border-sage-700 bg-sage-50/40'
                  : 'text-ink-soft hover:text-ink hover:bg-cream-50'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function MobileTablist({ tab, onSelect }: TablistProps) {
  const refs = useRef<Record<TabId, HTMLButtonElement | null>>({} as Record<TabId, HTMLButtonElement | null>);
  return (
    <nav
      aria-label="Primary (mobile)"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border-soft bg-surface/95 backdrop-blur safe-bottom"
    >
      <div
        role="tablist"
        aria-label="Primary"
        aria-orientation="horizontal"
        onKeyDown={makeKeydownHandler(tab, onSelect, refs)}
        className="grid grid-cols-5"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              ref={(el) => { refs.current[t.id] = el; }}
              type="button"
              role="tab"
              id={TAB_ID('mobile', t.id)}
              aria-selected={active}
              aria-controls={PANEL_ID(t.id)}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(t.id)}
              className={`w-full flex flex-col items-center gap-1 py-2 text-micro transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 ${
                /* [A11Y-DARK-CONTRAST] sage-700 on dark surface = 2.54:1.
                 * In dark mode shift to sage-300 (#a6c3b5) for ~7:1. */
                active ? 'text-sage-700 dark:text-sage-300 font-medium' : 'text-ink-subtle hover:text-ink'
              }`}
            >
              <span aria-hidden className="h-5 w-5">{t.icon}</span>
              <span>{t.label}</span>
              <span
                aria-hidden
                className={`mt-0.5 h-0.5 w-6 rounded-pill ${active ? 'bg-sage-700' : 'bg-transparent'}`}
              />
            </button>
          );
        })}
      </div>
    </nav>
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
