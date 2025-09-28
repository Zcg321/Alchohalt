import React from 'react';
import { Button } from '../components/ui/Button';

interface PWAInstallBannerProps {
  isInstallable: boolean;
  promptInstall: () => void;
  onDismiss: () => void;
}

export default function PWAInstallBanner({ isInstallable, promptInstall, onDismiss }: PWAInstallBannerProps) {
  if (!isInstallable) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 flex items-center justify-between sticky top-0 z-40 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg">
          📱
        </div>
        <div className="text-sm">
          <p className="font-medium">Install Alchohalt</p>
          <p className="text-blue-100 text-xs">Get the app for quick access</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={promptInstall}
          className="text-white hover:bg-white/20 text-sm px-3 py-1"
        >
          Install
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-white hover:bg-white/20 p-1 text-xl leading-none"
        >
          ×
        </Button>
      </div>
    </div>
  );
}