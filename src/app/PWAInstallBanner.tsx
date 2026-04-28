import React, { useEffect, useState } from 'react';

interface PWAInstallBannerProps {
  isInstallable: boolean;
  promptInstall: () => void;
  /**
   * Notifier the parent uses to record dismissal in its own state. The
   * persistent (7-day) flag is owned by this component now via
   * localStorage, but we keep the parent contract so the parent can
   * stop rendering once dismissed during the session.
   */
  onDismiss: () => void;
}

const DISMISS_KEY = 'alchohalt:pwa-install-dismissed-at';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isDismissedRecently(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = window.localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < DISMISS_TTL_MS;
}

function isLikelyMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(max-width: 768px)').matches
  );
}

export default function PWAInstallBanner({ isInstallable, promptInstall, onDismiss }: PWAInstallBannerProps) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    setShouldShow(isInstallable && !isDismissedRecently() && isLikelyMobile());
  }, [isInstallable]);

  if (!shouldShow) return null;

  function handleDismiss() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setShouldShow(false);
    onDismiss();
  }

  function handleInstall() {
    promptInstall();
    handleDismiss();
  }

  return (
    <div className="sticky top-0 z-40 border-b border-border-soft bg-surface-elevated/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="min-w-0 flex-1 text-caption">
          <p className="font-medium text-ink">Install Alchohalt</p>
          <p className="text-ink-soft">Add to your home screen for quick access. Same privacy posture.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={handleInstall}
            className="inline-flex items-center justify-center rounded-pill bg-sage-700 px-3.5 py-1.5 text-caption font-semibold text-white hover:bg-sage-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 transition-colors min-h-[36px]"
          >
            Install
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="inline-flex h-8 w-8 items-center justify-center rounded-pill text-ink-soft hover:bg-cream-50 hover:text-ink transition-colors"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
