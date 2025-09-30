import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Goals from '../Goals';

describe('Goals route', () => {
  it('renders without crashing', () => {
    render(<Goals />);
    expect(document.body).toBeTruthy();
  });

  it('renders goals view', () => {
    const { container } = render(<Goals />);
    expect(container).toBeTruthy();
  });

  it('initializes with default state', () => {
    const { container } = render(<Goals />);
    expect(container.querySelector('*')).toBeTruthy();
  });
});
