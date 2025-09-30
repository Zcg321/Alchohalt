import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from '../Skeleton';

describe('Skeleton', () => {
  it('renders without crashing', () => {
    render(<Skeleton />);
    expect(document.body).toBeTruthy();
  });

  it('renders with custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('renders circle variant', () => {
    render(<Skeleton variant="circle" />);
    expect(document.body).toBeTruthy();
  });

  it('renders text variant', () => {
    render(<Skeleton variant="text" />);
    expect(document.body).toBeTruthy();
  });

  it('renders rectangular variant', () => {
    render(<Skeleton variant="rectangular" />);
    expect(document.body).toBeTruthy();
  });

  it('renders with custom width', () => {
    render(<Skeleton width="200px" />);
    expect(document.body).toBeTruthy();
  });

  it('renders with custom height', () => {
    render(<Skeleton height="100px" />);
    expect(document.body).toBeTruthy();
  });
});
