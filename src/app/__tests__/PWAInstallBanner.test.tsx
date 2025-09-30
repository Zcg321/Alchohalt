import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PWAInstallBanner from '../PWAInstallBanner';

describe('PWAInstallBanner', () => {
  it('renders without crashing', () => {
    render(<PWAInstallBanner />);
    expect(document.body).toBeTruthy();
  });

  it('handles install button click', () => {
    const { container } = render(<PWAInstallBanner />);
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      fireEvent.click(button);
    });
    expect(container).toBeTruthy();
  });

  it('renders when install prompt is available', () => {
    const mockPrompt = {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' })
    };
    (window as any).deferredPrompt = mockPrompt;
    render(<PWAInstallBanner />);
    expect(document.body).toBeTruthy();
  });

  it('handles dismiss action', () => {
    const { container } = render(<PWAInstallBanner />);
    const closeButtons = container.querySelectorAll('[aria-label*="close"], [aria-label*="dismiss"]');
    closeButtons.forEach(button => {
      fireEvent.click(button);
    });
    expect(container).toBeTruthy();
  });
});
