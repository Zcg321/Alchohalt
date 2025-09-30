import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import PremiumDataExport from '../PremiumDataExport';

describe('PremiumDataExport', () => {
  it('renders without crashing', () => {
    render(<PremiumDataExport />);
    expect(document.body).toBeTruthy();
  });

  it('handles export with data', () => {
    const mockData = {
      drinks: [],
      goals: {},
      settings: {}
    };
    render(<PremiumDataExport data={mockData as any} />);
    expect(document.body).toBeTruthy();
  });

  it('handles export without data', () => {
    render(<PremiumDataExport data={undefined} />);
    expect(document.body).toBeTruthy();
  });
});
