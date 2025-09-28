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
    <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-3 flex items-center justify-between sticky top-0 z-40 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg">
          🔄
        </div>
        <div className="text-sm">
          <p className="font-medium">Update Available</p>
          <p className="text-green-100 text-xs">Get the latest features</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={updateApp}
          className="text-white hover:bg-white/20 text-sm px-3 py-1"
        >
          Update
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