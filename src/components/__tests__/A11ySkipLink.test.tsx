import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import A11ySkipLink from '../A11ySkipLink';
import { LanguageContext } from '../../i18n';

const mockT = vi.fn((key: string) => {
  if (key === 'skipToContent') return 'Skip to content';
  return key;
});

const mockLanguageContext = {
  lang: 'en' as const,
  setLang: vi.fn(),
  t: mockT
};

describe('A11ySkipLink', () => {
  it('renders skip to content link', () => {
    render(
      <LanguageContext.Provider value={mockLanguageContext}>
        <A11ySkipLink />
      </LanguageContext.Provider>
    );

    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#main');
    expect(link).toHaveTextContent('Skip to content');
  });

  it('has screen reader only styling by default', () => {
    render(
      <LanguageContext.Provider value={mockLanguageContext}>
        <A11ySkipLink />
      </LanguageContext.Provider>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveClass('sr-only');
    expect(link).toHaveClass('focus:not-sr-only');
  });

  it('uses translation for link text', () => {
    render(
      <LanguageContext.Provider value={mockLanguageContext}>
        <A11ySkipLink />
      </LanguageContext.Provider>
    );

    expect(mockT).toHaveBeenCalledWith('skipToContent');
  });

  it('has focus styling classes', () => {
    render(
      <LanguageContext.Provider value={mockLanguageContext}>
        <A11ySkipLink />
      </LanguageContext.Provider>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveClass('focus:fixed', 'focus:top-2', 'focus:left-2');
    expect(link).toHaveClass('bg-black', 'text-white', 'px-3', 'py-1', 'rounded');
  });
});