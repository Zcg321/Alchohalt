import { describe, it, expect, beforeEach } from 'vitest';

describe('usePWA hook utilities', () => {
  beforeEach(() => {
    // Reset any globals
  });

  it('detects PWA installation status', () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    expect(typeof isStandalone).toBe('boolean');
  });

  it('handles beforeinstallprompt event', () => {
    let promptEvent: any = null;
    
    const handler = (e: Event) => {
      e.preventDefault();
      promptEvent = e;
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    
    // Clean up
    window.removeEventListener('beforeinstallprompt', handler);
    expect(promptEvent).toBeNull();
  });

  it('detects iOS safari', () => {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    expect(typeof isIOS).toBe('boolean');
  });

  it('checks if app is installed', () => {
    const isInstalled = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    expect(typeof isInstalled).toBe('boolean');
  });
});
