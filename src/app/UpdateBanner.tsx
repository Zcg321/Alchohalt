import React from 'react';
import { Button } from '../components/ui/Button';

interface UpdateBannerProps {
  updateAvailable: boolean;
  updateApp: () => void;
  onDismiss: () => void;
}

export default function UpdateBanner({ updateAvailable, updateApp, onDismiss }: UpdateBannerProps) {
  if (!updateAvailable) return null;
  return (
    <div role="status" className="sticky top-0 z-40 border-b border-border-soft bg-sage-700 text-white shadow-soft">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="text-caption">
          <p className="font-medium">Update available</p>
          <p className="text-cream-50/80">Get the latest improvements.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={updateApp} className="text-white hover:bg-white/15 text-caption px-3 py-1">
            Update
          </Button>
          <button type="button" onClick={onDismiss} aria-label="Dismiss update prompt" className="inline-flex h-11 w-11 items-center justify-center rounded-pill text-white/90 hover:bg-white/15 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors">
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
