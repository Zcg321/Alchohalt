import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import TherapyResources from '../TherapyResources';

describe('TherapyResources.tsx', () => {
  it('mounts without crashing', () => {
    const { container } = render(
      <TherapyResources />
    );
    expect(container).toBeTruthy();
  });

  it('mounts with trigger without crashing', () => {
    const { container } = render(
      <TherapyResources trigger="stress" />
    );
    expect(container).toBeTruthy();
  });
});
