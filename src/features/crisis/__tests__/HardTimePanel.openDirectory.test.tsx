/**
 * [R25-C] HardTimePanel — tertiary "More crisis resources" link that
 * opens the broader CrisisResources directory. Hidden when no callback
 * is wired (legacy callers + tests that don't exercise this path).
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HardTimePanel from '../HardTimePanel';

describe('[R25-C] HardTimePanel directory link', () => {
  it('hides the directory link when onOpenDirectory is not provided', () => {
    render(<HardTimePanel onClose={() => undefined} />);
    expect(screen.queryByTestId('hard-time-open-directory')).toBeNull();
  });

  it('renders the directory link when onOpenDirectory is provided', () => {
    render(<HardTimePanel onClose={() => undefined} onOpenDirectory={() => undefined} />);
    expect(screen.getByTestId('hard-time-open-directory')).toBeInTheDocument();
  });

  it('clicking the link fires the callback', () => {
    const open = vi.fn();
    render(<HardTimePanel onClose={() => undefined} onOpenDirectory={open} />);
    fireEvent.click(screen.getByTestId('hard-time-open-directory'));
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('directory link is text-only — does not steal visual weight from urgent doors', () => {
    render(<HardTimePanel onClose={() => undefined} onOpenDirectory={() => undefined} />);
    const link = screen.getByTestId('hard-time-open-directory');
    expect(link.tagName).toBe('BUTTON');
    expect(link.className).toMatch(/text-sm|underline/);
  });
});
