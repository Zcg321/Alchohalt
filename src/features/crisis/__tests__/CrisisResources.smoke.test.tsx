import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CrisisResources from '../CrisisResources';

describe('CrisisResources — never gated', () => {
  it('renders without crashing', () => {
    render(<CrisisResources />);
    expect(screen.getByRole('heading', { name: /Crisis & Support Resources/i })).toBeTruthy();
  });

  it('renders the 911 banner above everything else (must not be missed)', () => {
    render(<CrisisResources />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toMatch(/immediate danger/i);
    expect(alert.textContent).toMatch(/911/);
  });

  it('renders 988 Suicide & Crisis Lifeline', () => {
    render(<CrisisResources />);
    expect(screen.getByText(/988 Suicide & Crisis Lifeline/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Call 988/i })).toBeTruthy();
  });

  it('renders SAMHSA helpline', () => {
    render(<CrisisResources />);
    expect(screen.getByText(/SAMHSA National Helpline/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /1-800-662-4357/ })).toBeTruthy();
  });

  it('renders Crisis Text Line', () => {
    render(<CrisisResources />);
    expect(screen.getByText(/Crisis Text Line/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Text HOME to 741741/i })).toBeTruthy();
  });

  it('renders AA + SMART Recovery + SAMHSA Treatment Locator (ongoing support)', () => {
    render(<CrisisResources />);
    expect(screen.getByText(/Alcoholics Anonymous/i)).toBeTruthy();
    expect(screen.getByText(/SMART Recovery/i)).toBeTruthy();
    expect(screen.getByText(/SAMHSA Treatment Locator/i)).toBeTruthy();
  });

  it('does NOT make any network calls (privacy claim)', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<CrisisResources />);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('does NOT import from FEATURE_FLAGS, subscriptionStore, or plans', async () => {
    // Source-level invariant: this file must never gate the page.
    // Inspect import statements only (the file's own docstring mentions
    // these names to explain WHY they're banned; we only check imports).
    const fs = await import('node:fs');
    const path = await import('node:path');
    const source = fs.readFileSync(
      path.resolve(__dirname, '../CrisisResources.tsx'),
      'utf-8',
    );
    const importLines = source
      .split('\n')
      .filter((line) => /^\s*import\b/.test(line));
    const joinedImports = importLines.join('\n');
    expect(joinedImports).not.toMatch(/FEATURE_FLAGS/);
    expect(joinedImports).not.toMatch(/subscriptionStore/);
    expect(joinedImports).not.toMatch(/usePremiumFeatures/);
    expect(joinedImports).not.toMatch(/['"]\.\.\/\.\.\/config\/(features|plans)['"]/);
  });
});
