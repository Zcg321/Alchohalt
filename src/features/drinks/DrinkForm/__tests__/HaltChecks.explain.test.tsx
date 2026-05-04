/**
 * [R25-3] Disability-rights audit fix: HALT acronym needs an
 * inline expansion for cognitive accessibility / ESL users / first-
 * time users with no recovery-community vocabulary.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HaltChecks from '../HaltChecks';
import { LanguageProvider } from '../../../../i18n';

describe('[R25-3] HaltChecks plain-language explanation', () => {
  it('renders the explanation under the legend', () => {
    render(
      <LanguageProvider>
        <HaltChecks selected={[]} onChange={() => undefined} />
      </LanguageProvider>,
    );
    const explanation = screen.getByTestId('halt-explanation');
    expect(explanation).toBeInTheDocument();
    expect(explanation.textContent).toMatch(/hungry/i);
    expect(explanation.textContent).toMatch(/angry/i);
    expect(explanation.textContent).toMatch(/lonely/i);
    expect(explanation.textContent).toMatch(/tired/i);
  });

  it('checkboxes are linked via aria-describedby', () => {
    render(
      <LanguageProvider>
        <HaltChecks selected={[]} onChange={() => undefined} />
      </LanguageProvider>,
    );
    const boxes = screen.getAllByRole('checkbox');
    expect(boxes.length).toBe(4);
    for (const b of boxes) {
      expect(b.getAttribute('aria-describedby')).toBe('halt-explanation');
    }
  });

  it('explanation has matching id for aria-describedby resolution', () => {
    render(
      <LanguageProvider>
        <HaltChecks selected={[]} onChange={() => undefined} />
      </LanguageProvider>,
    );
    const explanation = screen.getByTestId('halt-explanation');
    expect(explanation.id).toBe('halt-explanation');
  });
});
