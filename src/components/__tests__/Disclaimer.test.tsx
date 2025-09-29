import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Disclaimer } from '../Disclaimer';
import { LanguageContext } from '../../i18n';

const mockT = vi.fn((key: string) => {
  if (key === 'disclaimer') return 'This is for informational purposes only. Consult a healthcare professional.';
  return key;
});

const mockLanguageContext = {
  lang: 'en' as const,
  setLang: vi.fn(),
  t: mockT
};

describe('Disclaimer', () => {
  it('renders disclaimer text', () => {
    render(
      <LanguageContext.Provider value={mockLanguageContext}>
        <Disclaimer />
      </LanguageContext.Provider>
    );

    expect(screen.getByText('This is for informational purposes only. Consult a healthcare professional.')).toBeInTheDocument();
  });

  it('uses translation for disclaimer text', () => {
    render(
      <LanguageContext.Provider value={mockLanguageContext}>
        <Disclaimer />
      </LanguageContext.Provider>
    );

    expect(mockT).toHaveBeenCalledWith('disclaimer');
  });

  it('has proper semantic structure', () => {
    render(
      <LanguageContext.Provider value={mockLanguageContext}>
        <Disclaimer />
      </LanguageContext.Provider>
    );

    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  it('has warning icon', () => {
    render(
      <LanguageContext.Provider value={mockLanguageContext}>
        <Disclaimer />
      </LanguageContext.Provider>
    );

    const svg = screen.getByTestId('warning-icon') || document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('has proper styling classes', () => {
    const { container } = render(
      <LanguageContext.Provider value={mockLanguageContext}>
        <Disclaimer />
      </LanguageContext.Provider>
    );

    const card = container.querySelector('.card');
    expect(card).toHaveClass('bg-neutral-50', 'dark:bg-neutral-800/50');
  });
});