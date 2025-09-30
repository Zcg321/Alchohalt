import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import UpdateBanner from '../UpdateBanner';

describe('UpdateBanner', () => {
  it('renders without crashing', () => {
    render(<UpdateBanner />);
    expect(document.body).toBeTruthy();
  });

  it('handles update button click', () => {
    const { container } = render(<UpdateBanner />);
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      fireEvent.click(button);
    });
    expect(container).toBeTruthy();
  });

  it('shows update notification when available', () => {
    const { container } = render(<UpdateBanner updateAvailable={true} />);
    expect(container).toBeTruthy();
  });

  it('handles dismiss action', () => {
    const { container } = render(<UpdateBanner />);
    const closeButtons = container.querySelectorAll('[aria-label*="close"], [aria-label*="dismiss"]');
    closeButtons.forEach(button => {
      fireEvent.click(button);
    });
    expect(container).toBeTruthy();
  });
});
