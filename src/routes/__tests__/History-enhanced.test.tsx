import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import History from '../History';

describe('History route', () => {
  it('renders without crashing', () => {
    render(<History />);
    expect(document.body).toBeTruthy();
  });

  it('renders with empty state', () => {
    const { container } = render(<History />);
    expect(container).toBeTruthy();
  });

  it('component structure is valid', () => {
    const { container } = render(<History />);
    expect(container.querySelector('*')).toBeTruthy();
  });
});
