import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Helper function to set up event listeners for PWA functionality
function setupEventListeners(
  setInstallPrompt: (prompt: BeforeInstallPromptEvent | null) => void,
  setIsInstallable: (installable: boolean) => void,
  setIsInstalled: (installed: boolean) => void,
  setIsOnline: (online: boolean) => void,
  setUpdateAvailable: (available: boolean) => void
) {
  const handleBeforeInstallPrompt = (e: Event) => {
    e.preventDefault();
    const promptEvent = e as BeforeInstallPromptEvent;
    setInstallPrompt(promptEvent);
    setIsInstallable(true);
  };

  const handleAppInstalled = () => {
    setInstallPrompt(null);
    setIsInstallable(false);
    setIsInstalled(true);
  };

  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Service Worker update detection
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
        setUpdateAvailable(true);
      }
    });
  }

  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', handleAppInstalled);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = (window.navigator as any).standalone;
    setIsInstalled(isStandalone || (isIOS && isInStandaloneMode));

    // Set up event listeners and return cleanup function
    return setupEventListeners(
      setInstallPrompt,
      setIsInstallable,
      setIsInstalled,
      setIsOnline,
      setUpdateAvailable
    );
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setInstallPrompt(null);
        setIsInstallable(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  };

  const updateApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  };

  return {
    isInstallable: isInstallable && !isInstalled,
    isInstalled,
    isOnline,
    updateAvailable,
    promptInstall,
    updateApp,
  };
}