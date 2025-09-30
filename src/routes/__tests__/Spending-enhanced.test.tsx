import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Spending from '../Spending';

describe('Spending route', () => {
  it('renders without crashing', () => {
    render(<Spending />);
    expect(document.body).toBeTruthy();
  });

  it('renders spending view', () => {
    const { container } = render(<Spending />);
    expect(container).toBeTruthy();
  });

  it('initializes with default state', () => {
    const { container } = render(<Spending />);
    expect(container.querySelector('*')).toBeTruthy();
  });
});
